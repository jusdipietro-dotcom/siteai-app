"""
WSAA - Web Service de Autenticación y Autorización de ARCA (ex-AFIP)
Maneja la obtención del ticket de acceso (token + sign) para consumir WSFEv1.
"""

import os
import shutil
import subprocess
import tempfile
import datetime
import threading
import logging
import xml.etree.ElementTree as ET
from zeep import Client

logger = logging.getLogger("facturacion.wsaa")

# URLs WSAA
WSAA_URL_HOMO = "https://wsaahomo.afip.gov.ar/ws/services/LoginCms?WSDL"
WSAA_URL_PROD = "https://wsaa.afip.gov.ar/ws/services/LoginCms?WSDL"

# Cache de tickets por CUIT (dura 12hs) + lock thread-safe
_ticket_lock = threading.Lock()
_ticket_cache = {}  # {cuit: {"token": ..., "sign": ..., "expiration": ...}}

# Timezone Argentina
AR_TZ = datetime.timezone(datetime.timedelta(hours=-3))

# Margen de seguridad para el cache (10 minutos antes de expirar)
CACHE_MARGIN = datetime.timedelta(minutes=10)


_openssl_verified = False


def _verify_openssl():
    """Verifica que openssl esté disponible (una sola vez)."""
    global _openssl_verified
    if _openssl_verified:
        return
    if not shutil.which("openssl"):
        raise RuntimeError("OpenSSL no encontrado en PATH. Instalar OpenSSL.")
    _openssl_verified = True


def _create_tra(service="wsfe"):
    """Crea el Ticket de Requerimiento de Acceso (TRA) XML."""
    now = datetime.datetime.now(AR_TZ)
    expiration = now + datetime.timedelta(hours=12)

    tra = ET.Element("loginTicketRequest", version="1.0")
    header = ET.SubElement(tra, "header")

    unique_id = ET.SubElement(header, "uniqueId")
    unique_id.text = str(int(now.timestamp()))

    gen_time = ET.SubElement(header, "generationTime")
    gen_time.text = (now - datetime.timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M:%S-03:00")

    exp_time = ET.SubElement(header, "expirationTime")
    exp_time.text = expiration.strftime("%Y-%m-%dT%H:%M:%S-03:00")

    service_elem = ET.SubElement(tra, "service")
    service_elem.text = service

    return ET.tostring(tra, encoding="unicode"), expiration


def _sign_tra(tra_xml, cert_path, key_path):
    """Firma el TRA con CMS/PKCS#7 usando openssl."""
    tra_file = tempfile.NamedTemporaryFile(mode="w", suffix=".xml", delete=False)
    tra_file.write(tra_xml)
    tra_file.close()

    cms_file = tempfile.NamedTemporaryFile(suffix=".cms", delete=False)
    cms_file.close()

    try:
        result = subprocess.run(
            [
                "openssl", "smime", "-sign",
                "-signer", cert_path,
                "-inkey", key_path,
                "-outform", "PEM",
                "-nodetach",
                "-in", tra_file.name,
                "-out", cms_file.name,
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise RuntimeError("Error al firmar el TRA con OpenSSL")

        with open(cms_file.name, "r") as f:
            cms_content = f.read()

        lines = cms_content.strip().split("\n")
        cms_b64 = "".join(
            line for line in lines
            if not line.startswith("-----")
        )
        return cms_b64

    finally:
        for tmp_path in [tra_file.name, cms_file.name]:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


def get_ticket(cert_path, key_path, cuit=None, service="wsfe", production=False):
    """
    Obtiene token y sign del WSAA.
    Thread-safe con double-check locking y margen de seguridad.
    Cache por CUIT+entorno para multi-tenant.
    """
    _verify_openssl()
    env = "prod" if production else "homo"
    cache_key = f"{cuit}:{env}" if cuit else f"_default:{env}"

    # Fast path sin lock
    cached = _ticket_cache.get(cache_key)
    if cached and cached["token"] and cached["expiration"]:
        now = datetime.datetime.now(AR_TZ)
        if now < (cached["expiration"] - CACHE_MARGIN):
            return cached["token"], cached["sign"]

    with _ticket_lock:
        # Double-check dentro del lock
        cached = _ticket_cache.get(cache_key)
        if cached and cached["token"] and cached["expiration"]:
            now = datetime.datetime.now(AR_TZ)
            if now < (cached["expiration"] - CACHE_MARGIN):
                return cached["token"], cached["sign"]

        logger.info("Obteniendo nuevo ticket WSAA para %s...", cache_key)
        tra_xml, expiration = _create_tra(service)
        cms_b64 = _sign_tra(tra_xml, cert_path, key_path)

        wsdl_url = WSAA_URL_PROD if production else WSAA_URL_HOMO
        client = Client(wsdl_url)
        response = client.service.loginCms(cms_b64)

        root = ET.fromstring(response)
        token_el = root.find(".//token")
        sign_el = root.find(".//sign")
        if token_el is None or sign_el is None:
            raise RuntimeError("Respuesta WSAA invalida: no contiene token/sign")
        token = token_el.text
        sign = sign_el.text

        _ticket_cache[cache_key] = {
            "token": token,
            "sign": sign,
            "expiration": expiration,
        }

        logger.info("Ticket WSAA obtenido para %s, expira: %s", cache_key, expiration.isoformat())
        return token, sign


def invalidate_cache(cuit=None):
    """Invalida el cache del ticket. Si se pasa cuit, solo ese tenant."""
    with _ticket_lock:
        if cuit:
            # Cache keys are "{cuit}:prod" or "{cuit}:homo"
            cuit_str = str(cuit)
            keys_to_remove = [k for k in _ticket_cache if k.startswith(f"{cuit_str}:")]
            for k in keys_to_remove:
                _ticket_cache.pop(k, None)
        else:
            _ticket_cache.clear()
