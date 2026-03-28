"""
Causas Scraper — Multi-tenant MEV scraping service for AutomaticIAlab portal.

Endpoints:
  GET  /health                       — Health check
  POST /api/tenant                   — Register a new tenant
  POST /api/tenant/:tenantId/scrape  — Trigger on-demand scrape
  GET  /api/tenants                  — List all registered tenants

The service also runs a background scheduler that periodically scrapes
tenants based on their configured scrapeFrequency.
"""

import os
import logging
import threading
import httpx
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Request
from pydantic import BaseModel

from mev_scraper import scrape_tenant

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Causas Scraper", version="1.0.0")

# Config
API_KEY = os.environ.get("API_KEY", "")
PORTAL_URL = os.environ.get("PORTAL_URL", "https://automaticialab.com")

# In-memory tenant store (populated from portal on startup + via API)
tenants: dict = {}  # tenantId -> tenant config dict
scrape_locks: dict = {}  # tenantId -> threading.Lock (prevent concurrent scrapes)

# Plan limits
PLAN_LIMITS = {
    "basico": {"maxCases": 30, "frequencyHours": 24},
    "profesional": {"maxCases": 100, "frequencyHours": 6},
    "estudio": {"maxCases": 0, "frequencyHours": 2},  # 0 = unlimited
}


# --- Auth ---

def verify_api_key(request: Request):
    auth = request.headers.get("authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
    if not API_KEY or token != API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


# --- Models ---

class TenantCreate(BaseModel):
    subscriptionId: str
    mevUser: str
    mevPass: str
    dptoTipo: str = "CC"
    dptoId: str = "23"
    plan: str = "basico"
    scrapeFrequency: str = "24h"
    notificationEmail: Optional[str] = None
    userEmail: Optional[str] = None
    userName: Optional[str] = None


# --- Endpoints ---

@app.get("/health")
def health():
    return {"status": "ok", "tenants": len(tenants), "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/api/tenant", dependencies=[Depends(verify_api_key)])
def create_tenant(data: TenantCreate):
    tenant_id = data.subscriptionId
    tenants[tenant_id] = {
        "tenantId": tenant_id,
        "subscriptionId": data.subscriptionId,
        "mevUser": data.mevUser,
        "mevPass": data.mevPass,
        "dptoTipo": data.dptoTipo,
        "dptoId": data.dptoId,
        "plan": data.plan,
        "scrapeFrequency": data.scrapeFrequency,
        "notificationEmail": data.notificationEmail,
        "userEmail": data.userEmail,
        "userName": data.userName,
        "lastScrapeAt": None,
        "status": "active",
    }
    scrape_locks[tenant_id] = threading.Lock()

    # Trigger first scrape in background
    threading.Thread(target=_do_scrape, args=(tenant_id,), daemon=True).start()

    logger.info(f"[Tenant] Created: {tenant_id} (plan={data.plan})")
    return {"tenantId": tenant_id, "status": "created"}


@app.post("/api/tenant/{tenant_id}/scrape", dependencies=[Depends(verify_api_key)])
def trigger_scrape(tenant_id: str):
    if tenant_id not in tenants:
        raise HTTPException(status_code=404, detail="Tenant not found")

    lock = scrape_locks.get(tenant_id)
    if lock and lock.locked():
        return {"status": "already_running", "message": "Scrape already in progress"}

    threading.Thread(target=_do_scrape, args=(tenant_id,), daemon=True).start()
    return {"status": "started", "message": "Scrape initiated"}


@app.get("/api/tenants", dependencies=[Depends(verify_api_key)])
def list_tenants():
    return {
        "tenants": [
            {
                "tenantId": t["tenantId"],
                "plan": t["plan"],
                "status": t["status"],
                "lastScrapeAt": t["lastScrapeAt"],
            }
            for t in tenants.values()
        ]
    }


# --- Scrape logic ---

def _do_scrape(tenant_id: str):
    tenant = tenants.get(tenant_id)
    if not tenant:
        logger.error(f"[Scrape] Tenant {tenant_id} not found")
        return

    lock = scrape_locks.get(tenant_id) or threading.Lock()
    if not lock.acquire(blocking=False):
        logger.warning(f"[Scrape] {tenant_id} already running, skipping")
        return

    try:
        logger.info(f"[Scrape] Starting for {tenant_id} (plan={tenant['plan']})")
        limits = PLAN_LIMITS.get(tenant["plan"], PLAN_LIMITS["basico"])

        cases = scrape_tenant(
            mev_user=tenant["mevUser"],
            mev_pass=tenant["mevPass"],
            dpto_tipo=tenant["dptoTipo"],
            dpto_id=tenant["dptoId"],
            max_cases=limits["maxCases"],
        )

        logger.info(f"[Scrape] {tenant_id}: scraped {len(cases)} cases")

        # Send results to portal
        _ingest_cases(tenant["subscriptionId"], cases)

        tenant["lastScrapeAt"] = datetime.now(timezone.utc).isoformat()
    except Exception as e:
        logger.error(f"[Scrape] {tenant_id} error: {e}")
    finally:
        lock.release()


def _ingest_cases(subscription_id: str, cases: list):
    if not cases:
        logger.info(f"[Ingest] No cases to send for {subscription_id}")
        return

    try:
        resp = httpx.post(
            f"{PORTAL_URL}/api/causas/ingest",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "subscriptionId": subscription_id,
                "cases": cases,
            },
            timeout=60,
        )
        if resp.status_code == 200:
            data = resp.json()
            logger.info(f"[Ingest] OK: upserted={data.get('upserted')}, total={data.get('totalCases')}")
        else:
            logger.error(f"[Ingest] Error {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        logger.error(f"[Ingest] Request failed: {e}")


# --- Scheduled scraping ---

def _load_tenants_from_portal():
    """Load active tenants from portal on startup."""
    if not API_KEY:
        logger.warning("[Startup] No API_KEY configured, skipping tenant load")
        return

    try:
        resp = httpx.get(
            f"{PORTAL_URL}/api/causas/active-tenants",
            headers={"Authorization": f"Bearer {API_KEY}"},
            timeout=30,
        )
        if resp.status_code == 200:
            data = resp.json()
            for t in data.get("tenants", []):
                tid = t.get("tenantId") or t.get("subscriptionId")
                if tid:
                    tenants[tid] = {
                        "tenantId": tid,
                        "subscriptionId": t.get("subscriptionId", tid),
                        "mevUser": t.get("mevUser", ""),
                        "mevPass": t.get("mevPass", ""),
                        "dptoTipo": t.get("dptoTipo", "CC"),
                        "dptoId": t.get("dptoId", "23"),
                        "plan": t.get("plan", "basico"),
                        "scrapeFrequency": t.get("scrapeFrequency", "24h"),
                        "notificationEmail": t.get("notificationEmail"),
                        "userEmail": t.get("userEmail"),
                        "userName": t.get("userName"),
                        "lastScrapeAt": t.get("lastScrapeAt"),
                        "status": "active",
                    }
                    scrape_locks[tid] = threading.Lock()
            logger.info(f"[Startup] Loaded {len(tenants)} tenants from portal")
        else:
            logger.error(f"[Startup] Failed to load tenants: {resp.status_code}")
    except Exception as e:
        logger.error(f"[Startup] Error loading tenants: {e}")


def _scheduler_loop():
    """Simple scheduler that checks tenants and scrapes when due."""
    import time as _time

    while True:
        _time.sleep(300)  # Check every 5 minutes
        now = datetime.now(timezone.utc)

        for tid, tenant in list(tenants.items()):
            if tenant.get("status") != "active":
                continue

            limits = PLAN_LIMITS.get(tenant["plan"], PLAN_LIMITS["basico"])
            freq_hours = limits["frequencyHours"]

            last = tenant.get("lastScrapeAt")
            if last:
                try:
                    last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
                    hours_since = (now - last_dt).total_seconds() / 3600
                    if hours_since < freq_hours:
                        continue
                except (ValueError, TypeError):
                    pass

            # Due for scraping
            lock = scrape_locks.get(tid)
            if lock and lock.locked():
                continue

            logger.info(f"[Scheduler] Triggering scrape for {tid}")
            threading.Thread(target=_do_scrape, args=(tid,), daemon=True).start()


@app.on_event("startup")
def on_startup():
    _load_tenants_from_portal()
    threading.Thread(target=_scheduler_loop, daemon=True).start()
    logger.info("[Startup] Causas scraper ready")
