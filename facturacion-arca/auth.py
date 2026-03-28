"""
Blueprint de autenticación: registro, login, upload de certificados.
JWT en cookie HttpOnly para seguridad del SPA.
"""

import os
import re
import jwt
import logging
import secrets
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import Blueprint, request, jsonify, g, current_app, make_response
from models import db, User, Tenant
from crypto import encrypt_blob
from utils import validar_cuit

logger = logging.getLogger("facturacion.auth")

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

# Regex validación email
EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def _create_jwt(user):
    """Crea un JWT con user_id y tenant_id."""
    payload = {
        "user_id": user.id,
        "tenant_id": user.tenant_id,
        "exp": datetime.now(timezone.utc) + timedelta(
            hours=current_app.config["JWT_EXPIRATION_HOURS"]
        ),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def _set_jwt_cookie(response, token):
    """Setea el JWT en una cookie HttpOnly."""
    response.set_cookie(
        "token",
        token,
        httponly=True,
        samesite="Lax",
        secure=request.is_secure,
        max_age=current_app.config["JWT_EXPIRATION_HOURS"] * 3600,
        path="/",
    )
    return response


def login_required(f):
    """Decorator que verifica JWT y carga g.user y g.tenant."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get("token")
        if not token:
            return jsonify({"error": "No autenticado"}), 401

        try:
            payload = jwt.decode(
                token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Sesion expirada, iniciar sesion nuevamente"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token invalido"}), 401

        user = db.session.get(User, payload["user_id"])
        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 401

        tenant = db.session.get(Tenant, payload["tenant_id"])
        if not tenant or not tenant.active:
            return jsonify({"error": "Cuenta desactivada"}), 403

        g.user = user
        g.tenant = tenant
        return f(*args, **kwargs)

    return decorated


@auth_bp.route("/register", methods=["POST"])
def register():
    """Registra un nuevo usuario + tenant."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Body JSON requerido"}), 400

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    cuit = str(data.get("cuit") or "").replace("-", "")
    razon_social = (data.get("razon_social") or "").strip()
    punto_venta = data.get("punto_venta")

    # Validaciones
    if not EMAIL_RE.match(email):
        return jsonify({"error": "Email invalido"}), 400
    if len(password) < 8:
        return jsonify({"error": "La contrasena debe tener al menos 8 caracteres"}), 400
    if not validar_cuit(cuit):
        return jsonify({"error": "CUIT invalido"}), 400
    if not razon_social:
        return jsonify({"error": "Razon social requerida"}), 400
    if not punto_venta or not isinstance(punto_venta, int) or punto_venta < 1:
        return jsonify({"error": "Punto de venta invalido"}), 400

    # Verificar duplicados
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email ya registrado"}), 409

    cuit_int = int(cuit)
    existing_tenant = Tenant.query.filter_by(cuit=cuit_int).first()
    if existing_tenant:
        return jsonify({"error": "CUIT ya registrado"}), 409

    # Crear tenant + user
    tenant = Tenant(
        cuit=cuit_int,
        razon_social=razon_social,
        punto_venta=punto_venta,
    )
    db.session.add(tenant)
    db.session.flush()  # Obtener tenant.id

    user = User(email=email, tenant_id=tenant.id)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    logger.info("Nuevo registro: %s (CUIT: %s)", email, cuit)

    token = _create_jwt(user)
    resp = make_response(jsonify({
        "status": "ok",
        "user": {"email": user.email, "nombre": user.nombre},
        "tenant": {
            "cuit": tenant.cuit,
            "razon_social": tenant.razon_social,
            "punto_venta": tenant.punto_venta,
            "has_certificates": tenant.has_certificates,
        },
    }))
    return _set_jwt_cookie(resp, token), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Inicia sesion."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Body JSON requerido"}), 400

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Email o contrasena incorrectos"}), 401

    tenant = db.session.get(Tenant, user.tenant_id)
    if not tenant or not tenant.active:
        return jsonify({"error": "Cuenta desactivada"}), 403

    logger.info("Login: %s", email)

    token = _create_jwt(user)
    resp = make_response(jsonify({
        "status": "ok",
        "user": {"email": user.email, "nombre": user.nombre},
        "tenant": {
            "cuit": tenant.cuit,
            "razon_social": tenant.razon_social,
            "punto_venta": tenant.punto_venta,
            "has_certificates": tenant.has_certificates,
        },
    }))
    return _set_jwt_cookie(resp, token)


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Cierra sesion."""
    resp = make_response(jsonify({"status": "ok"}))
    resp.delete_cookie("token", path="/")
    return resp


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    """Retorna datos del usuario y tenant actual."""
    return jsonify({
        "user": {"email": g.user.email, "nombre": g.user.nombre},
        "tenant": {
            "cuit": g.tenant.cuit,
            "razon_social": g.tenant.razon_social,
            "domicilio": g.tenant.domicilio,
            "condicion_iva": g.tenant.condicion_iva,
            "iibb": g.tenant.iibb,
            "inicio_actividades": g.tenant.inicio_actividades,
            "punto_venta": g.tenant.punto_venta,
            "has_certificates": g.tenant.has_certificates,
            "production": g.tenant.production,
        },
    })


@auth_bp.route("/upload-cert", methods=["POST"])
@login_required
def upload_cert():
    """Sube y encripta certificado (.crt) y clave privada (.key)."""
    enc_key = current_app.config["ENCRYPTION_KEY"]
    if not enc_key:
        return jsonify({"error": "Servidor no configurado para encriptar certificados"}), 500

    cert_file = request.files.get("cert")
    key_file = request.files.get("key")

    if not cert_file or not key_file:
        return jsonify({"error": "Se requieren archivos 'cert' (.crt) y 'key' (.key)"}), 400

    cert_data = cert_file.read()
    key_data = key_file.read()

    # Validaciones basicas
    if not cert_data or len(cert_data) > 10000:
        return jsonify({"error": "Archivo .crt invalido o muy grande"}), 400
    if not key_data or len(key_data) > 10000:
        return jsonify({"error": "Archivo .key invalido o muy grande"}), 400

    # Verificar que parecen ser PEM
    cert_text = cert_data.decode("utf-8", errors="ignore")
    key_text = key_data.decode("utf-8", errors="ignore")

    if "CERTIFICATE" not in cert_text:
        return jsonify({"error": "El archivo .crt no parece ser un certificado valido"}), 400
    if "PRIVATE KEY" not in key_text:
        return jsonify({"error": "El archivo .key no parece ser una clave privada valida"}), 400

    # Encriptar y guardar
    g.tenant.cert_encrypted = encrypt_blob(cert_data, enc_key)
    g.tenant.key_encrypted = encrypt_blob(key_data, enc_key)
    db.session.commit()

    logger.info("Certificados actualizados para CUIT %s", g.tenant.cuit)
    return jsonify({"status": "ok", "message": "Certificados guardados correctamente"})


# ─── Portal integration endpoints ────────────────────────────────────────────

def _verify_portal_secret():
    """Verify the shared secret from the portal."""
    secret = request.headers.get("X-Portal-Secret", "")
    expected = os.environ.get("PORTAL_PROVISION_SECRET", "")
    if not expected or not secret:
        return False
    return secrets.compare_digest(secret, expected)


@auth_bp.route("/portal-provision", methods=["POST"])
def portal_provision():
    """Create a tenant + user from the portal after payment confirmation.
    Called by the automaticialab.com portal, authenticated with shared secret.
    """
    if not _verify_portal_secret():
        return jsonify({"error": "No autorizado"}), 401

    data = request.get_json()
    if not data:
        return jsonify({"error": "Body JSON requerido"}), 400

    cuit = str(data.get("cuit") or "").replace("-", "")
    razon_social = (data.get("razonSocial") or "").strip()
    punto_venta = data.get("puntoVenta")
    condicion_iva = data.get("condicionIva", "Responsable Inscripto")
    plan = (data.get("plan") or "basico").strip().lower()
    email = (data.get("email") or "").strip().lower()
    nombre = (data.get("nombre") or "").strip()

    if not cuit or not razon_social or not email:
        return jsonify({"error": "cuit, razonSocial y email son requeridos"}), 400

    # Check if tenant with this CUIT already exists
    existing_tenant = Tenant.query.filter_by(cuit=int(cuit)).first()
    if existing_tenant:
        # Reactivate if deactivated, update plan
        if not existing_tenant.active:
            existing_tenant.active = True
        existing_tenant.plan = plan
        db.session.commit()
        logger.info("Portal: reactivated tenant CUIT %s (plan: %s)", cuit, plan)

        # Find or create user for this tenant
        user = User.query.filter_by(email=email, tenant_id=existing_tenant.id).first()
        if not user:
            user = User(
                email=email,
                nombre=nombre or razon_social,
                tenant_id=existing_tenant.id,
            )
            user.set_password(secrets.token_urlsafe(16))
            db.session.add(user)
            db.session.commit()

        return jsonify({
            "tenantId": existing_tenant.id,
            "userEmail": user.email,
            "status": "existing",
        })

    # Create new tenant
    try:
        pv = int(punto_venta) if punto_venta else 1
    except (ValueError, TypeError):
        pv = 1

    tenant = Tenant(
        cuit=int(cuit),
        razon_social=razon_social,
        condicion_iva=condicion_iva,
        punto_venta=pv,
        plan=plan,
        active=True,
    )
    db.session.add(tenant)
    db.session.flush()  # Get tenant.id

    # Create user with random password (portal manages auth via SSO)
    user = User(
        email=email,
        nombre=nombre or razon_social,
        tenant_id=tenant.id,
    )
    user.set_password(secrets.token_urlsafe(16))
    db.session.add(user)
    db.session.commit()

    logger.info("Portal: created tenant %s (CUIT %s) with user %s", tenant.id, cuit, email)

    return jsonify({
        "tenantId": tenant.id,
        "userEmail": user.email,
        "status": "created",
    })


@auth_bp.route("/portal-login", methods=["GET"])
def portal_login():
    """SSO login from the portal. Validates a short-lived JWT and creates a Flask session.
    Query param: ?token=<jwt>
    """
    token = request.args.get("token")
    if not token:
        return jsonify({"error": "Token requerido"}), 400

    portal_secret = os.environ.get("PORTAL_PROVISION_SECRET", "")
    if not portal_secret:
        return jsonify({"error": "SSO no configurado"}), 503

    try:
        payload = jwt.decode(
            token,
            portal_secret,
            algorithms=["HS256"],
            issuer="automaticialab-portal",
        )
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expirado. Volve al portal y reintenta."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token invalido"}), 401

    tenant_id = payload.get("tenantId")
    email = payload.get("email")

    if not tenant_id:
        return jsonify({"error": "Token sin tenant"}), 400

    # Find user by email and tenant
    user = User.query.filter_by(tenant_id=tenant_id, email=email).first() if email else User.query.filter_by(tenant_id=tenant_id).first()
    if not user:
        return jsonify({"error": "Usuario no encontrado en facturacion"}), 404

    tenant = db.session.get(Tenant, tenant_id)
    if not tenant or not tenant.active:
        return jsonify({"error": "Cuenta desactivada"}), 403

    # Create Flask session (JWT cookie)
    flask_token = _create_jwt(user)
    response = make_response(
        '<html><head><meta http-equiv="refresh" content="0;url=/"></head>'
        '<body>Redirigiendo...</body></html>'
    )
    _set_jwt_cookie(response, flask_token)
    response.headers["Content-Type"] = "text/html"

    logger.info("Portal SSO: user %s logged into tenant %s", user.email, tenant_id)
    return response


@auth_bp.route("/portal-deprovision", methods=["POST"])
def portal_deprovision():
    """Deactivate a tenant from the portal (subscription cancelled/suspended)."""
    if not _verify_portal_secret():
        return jsonify({"error": "No autorizado"}), 401

    data = request.get_json()
    tenant_id = data.get("tenantId") if data else None
    if not tenant_id:
        return jsonify({"error": "tenantId requerido"}), 400

    tenant = db.session.get(Tenant, tenant_id)
    if not tenant:
        return jsonify({"error": "Tenant no encontrado"}), 404

    tenant.active = False
    db.session.commit()

    logger.info("Portal: deactivated tenant %s (CUIT %s)", tenant_id, tenant.cuit)
    return jsonify({"status": "deactivated"})
