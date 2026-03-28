"""
API REST de Facturación Electrónica ARCA - SaaS Multi-Tenant
App factory pattern con blueprints de auth y API.
"""

import os
import logging
from flask import Flask, request, render_template, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config
from models import db
from auth import auth_bp
from api import api_bp

# --- Logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("facturacion")


def create_app(config_class=Config):
    """Crea y configura la app Flask."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Validar config critica en produccion
    if config_class.PRODUCTION_ARCA:
        config_class.validate()

    # ProxyFix para detectar HTTPS detras de reverse proxy (EasyPanel/nginx)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1, x_for=1)

    # Rate limiter
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=[],
        storage_uri="memory://",
    )
    limiter.limit("5/minute")(auth_bp)

    # Inicializar DB
    db.init_app(app)

    # Registrar blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)

    # Crear tablas y directorios
    with app.app_context():
        os.makedirs(app.config["PDF_DIR"], exist_ok=True)
        db_uri = app.config["SQLALCHEMY_DATABASE_URI"]
        if db_uri.startswith("sqlite:///"):
            db_path = db_uri.replace("sqlite:///", "")
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
        db.create_all()

        # SQLite WAL mode para mejor concurrencia
        if db_uri.startswith("sqlite"):
            with db.engine.connect() as conn:
                conn.execute(db.text("PRAGMA journal_mode=WAL"))
                conn.execute(db.text("PRAGMA busy_timeout=5000"))
                conn.commit()

    # --- Security headers ---
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if request.is_secure:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net fonts.googleapis.com; "
            "font-src fonts.gstatic.com cdn.jsdelivr.net; "
            "img-src 'self' data:; "
            "connect-src 'self'"
        )
        return response

    # --- CSRF: verificar header en POST/PUT/DELETE ---
    @app.before_request
    def check_csrf():
        if request.method in ("POST", "PUT", "DELETE"):
            # Excluir endpoints que no usan cookies (o que necesitan ser accesibles sin JS)
            if request.path.startswith("/auth/login") or request.path.startswith("/auth/register") or request.path.startswith("/auth/logout"):
                return
            # Para uploads multipart, verificar Referer
            if request.content_type and "multipart" in request.content_type:
                referer = request.headers.get("Referer", "")
                if referer and request.host not in referer:
                    return jsonify({"error": "CSRF: Referer invalido"}), 403
                return
            # Para JSON APIs, verificar X-Requested-With header
            if request.cookies.get("token"):
                if not request.headers.get("X-Requested-With"):
                    # Permitir Content-Type: application/json como CSRF mitigation
                    ct = request.content_type or ""
                    if "application/json" not in ct:
                        return jsonify({"error": "CSRF: header faltante"}), 403

    # --- Rutas principales ---
    @app.route("/")
    def index():
        token = request.cookies.get("token")
        if not token:
            return render_template("login.html")
        return render_template("index.html")

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"})

    return app


if __name__ == "__main__":
    os.environ.setdefault("PRODUCTION_ARCA", "false")
    app = create_app()
    print("=== Facturacion ARCA SaaS ===")
    print(f"DB: {Config.SQLALCHEMY_DATABASE_URI}")
    print()
    print("Abriendo http://localhost:5000 ...")
    try:
        import webbrowser
        webbrowser.open("http://localhost:5000")
    except Exception:
        pass
    app.run(host="127.0.0.1", port=5000, debug=False)
