"""
Modelos SQLAlchemy para Facturación ARCA SaaS.
"""

from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class Tenant(db.Model):
    """Empresa/CUIT registrado en el sistema."""
    __tablename__ = "tenant"

    id = db.Column(db.Integer, primary_key=True)
    cuit = db.Column(db.BigInteger, unique=True, nullable=False)
    razon_social = db.Column(db.String(200), nullable=False)
    domicilio = db.Column(db.String(300), default="")
    condicion_iva = db.Column(db.String(50), default="Responsable Inscripto")
    iibb = db.Column(db.String(50), default="")
    inicio_actividades = db.Column(db.String(20), default="")
    punto_venta = db.Column(db.Integer, nullable=False)
    puntos_venta_extra = db.Column(db.Text, default="[]")  # JSON array of extra PVs (estudio plan)
    plan = db.Column(db.String(30), default="basico")  # basico, profesional, estudio
    cert_encrypted = db.Column(db.LargeBinary, nullable=True)
    key_encrypted = db.Column(db.LargeBinary, nullable=True)
    production = db.Column(db.Boolean, default=True)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    users = db.relationship("User", backref="tenant", lazy=True)
    clients = db.relationship("Client", backref="tenant", lazy=True)
    invoices = db.relationship("Invoice", backref="tenant", lazy=True)

    @property
    def has_certificates(self):
        return self.cert_encrypted is not None and self.key_encrypted is not None

    @property
    def all_puntos_venta(self):
        """Returns list of all allowed puntos de venta."""
        import json
        pvs = [self.punto_venta]
        try:
            extras = json.loads(self.puntos_venta_extra or "[]")
            if isinstance(extras, list):
                pvs.extend(int(pv) for pv in extras if pv)
        except (json.JSONDecodeError, ValueError):
            pass
        return pvs

    @property
    def emisor_data(self):
        return {
            "razon_social": self.razon_social,
            "domicilio": self.domicilio,
            "condicion_iva": self.condicion_iva,
            "iibb": self.iibb,
            "inicio_actividades": self.inicio_actividades,
        }


class User(db.Model):
    """Usuario del sistema, vinculado a un tenant."""
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    nombre = db.Column(db.String(200), default="")
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Client(db.Model):
    """Cliente/receptor de facturas, por tenant."""
    __tablename__ = "client"

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant.id"), nullable=False, index=True)
    nombre = db.Column(db.String(200), nullable=False)
    doc_tipo = db.Column(db.String(10), default="")
    doc_nro = db.Column(db.String(20), default="")
    condicion_iva = db.Column(db.String(50), default="Consumidor Final")
    domicilio = db.Column(db.String(300), default="")
    email = db.Column(db.String(200), default="")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class Invoice(db.Model):
    """Factura emitida, por tenant."""
    __tablename__ = "invoice"

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant.id"), nullable=False, index=True)
    tipo_cbte = db.Column(db.Integer, nullable=False)
    punto_venta = db.Column(db.Integer, nullable=False)
    cbte_nro = db.Column(db.Integer, nullable=False)
    fecha = db.Column(db.String(8), nullable=False)
    cae = db.Column(db.String(20), nullable=False)
    cae_vencimiento = db.Column(db.String(8), nullable=False)
    importe_total = db.Column(db.Numeric(12, 2), nullable=False)
    importe_neto = db.Column(db.Numeric(12, 2), nullable=False)
    importe_iva = db.Column(db.Numeric(12, 2), nullable=False)
    doc_tipo = db.Column(db.Integer, default=99)
    doc_nro = db.Column(db.BigInteger, default=0)
    receptor_nombre = db.Column(db.String(200), default="")
    items_json = db.Column(db.Text, default="[]")
    pdf_filename = db.Column(db.String(100), default="")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
