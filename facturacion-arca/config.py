"""
Configuración de la aplicación Facturación ARCA SaaS.
Variables sensibles se leen de variables de entorno.
"""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

_DEFAULT_SECRET = "dev-secret-change-in-production"


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", _DEFAULT_SECRET)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'data', 'facturacion.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY")
    PDF_DIR = os.environ.get("PDF_DIR", os.path.join(BASE_DIR, "pdfs"))
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB (certs + requests)
    JWT_EXPIRATION_HOURS = int(os.environ.get("JWT_EXPIRATION_HOURS", "8"))
    PRODUCTION_ARCA = os.environ.get("PRODUCTION_ARCA", "true").lower() == "true"

    @staticmethod
    def validate():
        """Valida config critica al arrancar. Falla rapido si falta algo."""
        if Config.PRODUCTION_ARCA:
            if Config.SECRET_KEY == _DEFAULT_SECRET:
                raise RuntimeError("SECRET_KEY no configurada. Setear variable de entorno SECRET_KEY.")
            if not Config.ENCRYPTION_KEY:
                raise RuntimeError("ENCRYPTION_KEY no configurada. Setear variable de entorno ENCRYPTION_KEY.")
