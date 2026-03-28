"""
MEV SCBA Scraper - Multi-tenant version for causas-scraper service.
Based on the original mev_scraper.py, adapted for API-driven multi-tenant use.
"""

import requests
import re
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)

MEV_BASE = "https://mev.scba.gov.ar"
ENCODING = "cp1252"
DELAY_BETWEEN_REQUESTS = 1.0


class MEVSession:
    def __init__(self, mev_user: str, mev_pass: str):
        self.mev_user = mev_user
        self.mev_pass = mev_pass
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        self.logged_in = False

    def login(self) -> bool:
        try:
            r = self.session.post(
                f"{MEV_BASE}/loguin.asp?familiadepto=",
                data={
                    "usuario": self.mev_user,
                    "clave": self.mev_pass,
                    "DeptoRegistrado": "aa"
                },
                allow_redirects=True,
                timeout=30
            )
            # Check if login succeeded (page should NOT contain login form)
            if "loguin.asp" not in r.url and "error" not in r.text.lower()[:500]:
                self.logged_in = True
                logger.info(f"[MEV] Login OK for {self.mev_user}")
                return True
            logger.error(f"[MEV] Login FAILED for {self.mev_user}")
            return False
        except Exception as e:
            logger.error(f"[MEV] Login error: {e}")
            return False

    def select_department(self, dept_id: str = "23", tipo: str = "CC") -> bool:
        try:
            r = self.session.post(
                f"{MEV_BASE}/POSLoguin.asp",
                data={
                    "TipoDto": tipo,
                    "DtoJudElegido": dept_id,
                    "Aceptar": "Aceptar"
                },
                allow_redirects=True,
                timeout=30
            )
            if "busqueda" in r.url.lower():
                logger.info(f"[MEV] Department {dept_id}/{tipo} selected")
                return True
            return False
        except Exception as e:
            logger.error(f"[MEV] Department selection error: {e}")
            return False

    def get_page(self, url: str, retries: int = 3) -> Optional[str]:
        for attempt in range(retries):
            try:
                full_url = f"{MEV_BASE}/{url}" if not url.startswith("http") else url
                r = self.session.get(full_url, timeout=30)
                r.encoding = ENCODING
                return r.text
            except Exception as e:
                logger.warning(f"[MEV] GET attempt {attempt+1}/{retries} failed: {e}")
                time.sleep(2)
        return None


def parse_sets(html: str) -> list:
    sets = []
    pattern = r'href="resultados\.asp\?nidset=(\d+)[^"]*">\s*(.*?)\s*</a>'
    totals = re.findall(r'Total Expedientes:\s*(\d+)', html)
    matches = re.findall(pattern, html)
    for i, (set_id, name) in enumerate(matches):
        name = name.strip()
        count = int(totals[i]) if i < len(totals) else 0
        sets.append({"id": set_id, "name": name, "count": count})
    return sets


def parse_resultados(html: str) -> tuple:
    cases = []
    case_pattern = (
        r'<INPUT\s+type="checkbox"\s+value=(\d+)\s+name="Marcados">\s*'
        r'<INPUT\s+type="hidden"\s+value=(\w+\s*)\s*>'
        r'<a\s+href="procesales\.asp\?nidCausa=\d+&pidJuzgado=[^"]*">(.*?)</[Aa]>'
    )
    matches = re.findall(case_pattern, html, re.DOTALL | re.IGNORECASE)

    for nid_causa, pid_juzgado, caratula in matches:
        caratula = re.sub(r'\s+', ' ', caratula).strip()
        caratula = caratula.replace('&nbsp;', ' ').replace('&amp;', '&')
        pid_juzgado = pid_juzgado.strip()
        cases.append({
            "nidCausa": nid_causa,
            "pidJuzgado": pid_juzgado,
            "caratula": caratula
        })

    # Nro expediente
    nro_pattern = r'<P class=smallleft>(\w+)\s*&nbsp;-&nbsp;\s*(\d+)\s*&nbsp;-&nbsp;\s*(\d+)</P>'
    nros = re.findall(nro_pattern, html)

    # Fecha inicio
    fecha_pattern = r'onmouseover="MM_showHideLayers\(\'Layer3\'.*?<P class=smallleft>(\d{2}/\d{2}/\d{4})</P>'
    fechas = re.findall(fecha_pattern, html, re.DOTALL)

    for i, case in enumerate(cases):
        nro_idx = i * 2
        if nro_idx + 1 < len(nros):
            dept, num, year = nros[nro_idx + 1]
            case["nroExpediente"] = f"{dept}-{num}-{year}"
        elif nro_idx < len(nros):
            dept, num, year = nros[nro_idx]
            case["nroExpediente"] = f"{dept}-{num}-{year}"
        if i < len(fechas):
            case["fechaInicio"] = fechas[i]

    has_next = 'pagina=' in html and '>Siguiente<' in html
    return cases, has_next


def parse_procesales(html: str) -> dict:
    case_info = {}

    caratula_match = re.search(r'Car.*?tula:.*?</b>\s*&nbsp;&nbsp;(.*?)\s*</p>', html, re.DOTALL)
    if caratula_match:
        case_info["caratula"] = re.sub(r'\s+', ' ', caratula_match.group(1)).strip()

    fecha_match = re.search(r'Fecha inicio:.*?&nbsp;&nbsp;(\d{2}/\d{2}/\d{4})', html)
    if fecha_match:
        case_info["fechaInicio"] = fecha_match.group(1)

    nro_match = re.search(r'de Expediente:.*?&nbsp;&nbsp;(\w+\s*&nbsp;-&nbsp;\s*\d+\s*&nbsp;-&nbsp;\s*\d+)', html)
    if nro_match:
        nro = nro_match.group(1).replace('&nbsp;', '').replace(' ', '')
        case_info["nroExpediente"] = nro

    estado_match = re.search(r'Estado:.*?&nbsp;&nbsp;(.*?)</p>', html)
    if estado_match:
        case_info["estado"] = estado_match.group(1).strip()

    # Juzgado (court name)
    court_match = re.search(r'Juzgado:.*?&nbsp;&nbsp;(.*?)</p>', html)
    if court_match:
        case_info["courtName"] = re.sub(r'\s+', ' ', court_match.group(1)).strip()

    # Movements
    movements = []
    mov_pattern = (
        r'<td><p class="smallleft">([\d/\s:]+?)</p></td>\s*'
        r'<td><p class="smallleft">(.*?)</p></td>\s*'
        r'<td[^>]*>.*?</td>\s*'
        r'<td><p class="smallleft"><a\s+href="proveido\.asp\?([^"]*)">(.*?)\s*</a>'
    )
    mov_matches = re.findall(mov_pattern, html, re.DOTALL)
    for fecha, fojas, proveido_params, texto in mov_matches:
        movements.append({
            "fecha": fecha.strip(),
            "fojas": fojas.strip(),
            "texto": re.sub(r'\s+', ' ', texto).strip(),
        })

    case_info["movimientos"] = movements
    case_info["totalMovimientos"] = len(movements)
    return case_info


def scrape_tenant(mev_user: str, mev_pass: str, dpto_tipo: str = "CC",
                  dpto_id: str = "23", max_cases: int = 0) -> list:
    """
    Scrape all cases for a tenant. Returns list of case dicts ready for ingest.
    max_cases=0 means unlimited.
    """
    session = MEVSession(mev_user, mev_pass)
    if not session.login():
        raise Exception(f"Login failed for {mev_user}")

    if not session.select_department(dpto_id, dpto_tipo):
        raise Exception(f"Department selection failed: {dpto_id}/{dpto_tipo}")

    # Get sets
    sets_html = session.get_page("Sets.asp")
    if not sets_html:
        raise Exception("Failed to load Sets.asp")

    sets = parse_sets(sets_html)
    if not sets:
        logger.warning(f"[MEV] No sets found for {mev_user}")
        return []

    all_cases = []
    case_count = 0

    for s in sets:
        logger.info(f"[MEV] Processing set '{s['name']}' ({s['count']} expedientes)")
        page = 1
        while True:
            url = f"resultados.asp?nidset={s['id']}&pagina={page}"
            html = session.get_page(url)
            if not html:
                break

            cases, has_next = parse_resultados(html)
            if not cases:
                break

            for case in cases:
                case["setName"] = s["name"]

                # Get detailed info (movements)
                proc_html = session.get_page(
                    f"procesales.asp?nidCausa={case['nidCausa']}&pidJuzgado={case['pidJuzgado']}"
                )
                if proc_html:
                    details = parse_procesales(proc_html)
                    case.update(details)

                all_cases.append(case)
                case_count += 1

                if max_cases > 0 and case_count >= max_cases:
                    logger.info(f"[MEV] Reached max_cases limit ({max_cases})")
                    return all_cases

                time.sleep(DELAY_BETWEEN_REQUESTS)

            if not has_next:
                break
            page += 1
            time.sleep(DELAY_BETWEEN_REQUESTS)

    logger.info(f"[MEV] Scrape complete: {len(all_cases)} cases for {mev_user}")
    return all_cases
