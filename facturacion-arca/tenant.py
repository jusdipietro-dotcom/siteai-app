"""
Helpers de tenant: obtiene WSFEClient autenticado para el tenant actual.
Desencripta certificados a archivos temporales solo durante la firma.
"""

import os
import stat
import tempfile
import logging
from flask import g, current_app
from crypto import decrypt_blob
from wsaa import get_ticket
from wsfe import WSFEClient

logger = logging.getLogger("facturacion.tenant")


def get_wsfe_client():
    """
    Obtiene un WSFEClient autenticado para g.tenant.
    Desencripta cert/key a temp files, obtiene ticket, limpia.
    """
    tenant = g.tenant
    if not tenant.has_certificates:
        raise RuntimeError("Certificados ARCA no configurados. Subir .crt y .key en Configuracion.")

    enc_key = current_app.config["ENCRYPTION_KEY"]
    if not enc_key:
        raise RuntimeError("ENCRYPTION_KEY no configurada en el servidor.")

    # Desencriptar certificados
    cert_data = decrypt_blob(tenant.cert_encrypted, enc_key)
    key_data = decrypt_blob(tenant.key_encrypted, enc_key)

    # Escribir a archivos temporales con permisos restrictivos
    tmp_dir = tempfile.mkdtemp()
    cert_path = os.path.join(tmp_dir, "cert.crt")
    key_path = os.path.join(tmp_dir, "key.key")

    try:
        # Escribir con permisos solo para el usuario actual
        for path, data in [(cert_path, cert_data), (key_path, key_data)]:
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
            try:
                os.write(fd, data)
            finally:
                os.close(fd)

        # Obtener ticket WSAA (cacheado por CUIT)
        production = tenant.production
        token, sign = get_ticket(
            cert_path, key_path, cuit=tenant.cuit,
            service="wsfe", production=production,
        )

        # Crear cliente WSFEv1
        return WSFEClient(token, sign, tenant.cuit, production=production)

    finally:
        # Limpiar archivos temporales
        for path in [cert_path, key_path]:
            try:
                os.unlink(path)
            except OSError:
                pass
        try:
            os.rmdir(tmp_dir)
        except OSError:
            pass
