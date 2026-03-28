"""
Blueprint de API: endpoints de facturación, clientes, historial, configuración.
Todos los endpoints requieren autenticación y son tenant-scoped.
"""

import os
import re
import json
import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, send_from_directory, g, current_app
from auth import login_required
from models import db, Client, Invoice, Tenant
from sqlalchemy import func, extract
from tenant import get_wsfe_client
from utils import validar_cuit
from wsfe import (
    TIPO_FACTURA_A, TIPO_FACTURA_B,
    TIPO_NOTA_CREDITO_A, TIPO_NOTA_CREDITO_B,
    TIPO_NOTA_DEBITO_A, TIPO_NOTA_DEBITO_B,
    DOC_CUIT, DOC_DNI, DOC_SIN_IDENTIFICAR,
    CONCEPTO_PRODUCTOS, CONCEPTO_SERVICIOS, CONCEPTO_PRODUCTOS_Y_SERVICIOS,
    IVA_21, IVA_10_5, IVA_27, IVA_0, IVA_PORCENTAJES,
    COND_IVA_MAP, COND_IVA_CONSUMIDOR_FINAL,
)
from wsaa import invalidate_cache
from pdf_generator import generar_pdf

logger = logging.getLogger("facturacion.api")

api_bp = Blueprint("api", __name__)

# Plan limits for facturacion
PLAN_LIMITS = {
    "basico": {"max_facturas_mes": 50, "tipos_permitidos": ["B"], "max_puntos_venta": 1},
    "profesional": {"max_facturas_mes": 200, "tipos_permitidos": ["A", "B"], "max_puntos_venta": 1},
    "estudio": {"max_facturas_mes": 999999, "tipos_permitidos": ["A", "B", "C"], "max_puntos_venta": 3},
}


def _get_tenant_pdf_dir():
    """Retorna el directorio de PDFs del tenant actual, creandolo si no existe."""
    pdf_dir = os.path.join(current_app.config["PDF_DIR"], str(g.tenant.id))
    os.makedirs(pdf_dir, exist_ok=True)
    return pdf_dir


# --- Facturación ---

@api_bp.route("/factura", methods=["POST"])
@login_required
def emitir_factura():
    """Emite una factura electronica."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Body JSON requerido"}), 400

    tenant = g.tenant

    # ── Plan limits enforcement ──
    limits = PLAN_LIMITS.get(tenant.plan or "basico", PLAN_LIMITS["basico"])

    # Tipo de comprobante
    tipo_str = data.get("tipo", "B").upper()
    if tipo_str not in limits["tipos_permitidos"]:
        return jsonify({"error": f"Tu plan '{tenant.plan}' no permite Factura {tipo_str}. Tipos habilitados: {', '.join(limits['tipos_permitidos'])}"}), 403

    # Monthly invoice limit
    now = datetime.now(timezone.utc)
    month_count = Invoice.query.filter(
        Invoice.tenant_id == tenant.id,
        extract('year', Invoice.created_at) == now.year,
        extract('month', Invoice.created_at) == now.month,
    ).count()
    if month_count >= limits["max_facturas_mes"]:
        return jsonify({"error": f"Limite mensual alcanzado ({limits['max_facturas_mes']} facturas). Actualiza tu plan para emitir mas."}), 403

    tipo_map = {"A": TIPO_FACTURA_A, "B": TIPO_FACTURA_B}
    tipo_cbte = tipo_map.get(tipo_str)
    if not tipo_cbte:
        return jsonify({"error": f"Tipo '{tipo_str}' no valido. Usar 'A' o 'B'"}), 400

    # Receptor
    receptor = data.get("receptor", {})

    # Validar condición IVA vs tipo comprobante
    cond_iva = receptor.get("condicion_iva", "").lower()
    if tipo_str == "A":
        if not receptor.get("cuit"):
            return jsonify({"error": "Factura A requiere CUIT del receptor"}), 400
        if cond_iva and "responsable inscripto" not in cond_iva:
            return jsonify({"error": "Factura A solo puede emitirse a Responsable Inscripto"}), 400
    elif tipo_str == "B":
        if cond_iva and "responsable inscripto" in cond_iva:
            return jsonify({"error": "A un Responsable Inscripto se le debe emitir Factura A, no B"}), 400

    # Doc tipo/nro
    if receptor.get("cuit"):
        doc_tipo = DOC_CUIT
        try:
            doc_nro = int(str(receptor["cuit"]).replace("-", ""))
        except (ValueError, TypeError):
            return jsonify({"error": "CUIT invalido, usar formato numerico"}), 400
        if not validar_cuit(doc_nro):
            return jsonify({"error": f"CUIT invalido (digito verificador): {doc_nro}"}), 400
    elif receptor.get("dni"):
        doc_tipo = DOC_DNI
        try:
            doc_nro = int(str(receptor["dni"]).replace("-", ""))
        except (ValueError, TypeError):
            return jsonify({"error": "DNI invalido"}), 400
    else:
        doc_tipo = DOC_SIN_IDENTIFICAR
        doc_nro = 0

    # Concepto
    concepto_str = data.get("concepto", "servicios").lower()
    concepto_map = {
        "productos": CONCEPTO_PRODUCTOS,
        "servicios": CONCEPTO_SERVICIOS,
        "ambos": CONCEPTO_PRODUCTOS_Y_SERVICIOS,
    }
    concepto = concepto_map.get(concepto_str, CONCEPTO_SERVICIOS)

    # IVA mapping
    iva_pct_to_id = {v: k for k, v in IVA_PORCENTAJES.items()}

    # Items
    items_raw = data.get("items", [])
    if not items_raw:
        return jsonify({"error": "Se requiere al menos un item"}), 400

    items = []
    items_pdf = []
    for item in items_raw:
        if "precio_unitario" not in item:
            return jsonify({"error": "Item sin precio_unitario"}), 400

        try:
            cantidad = float(item.get("cantidad", 1))
            precio = float(item["precio_unitario"])
        except (ValueError, TypeError):
            return jsonify({"error": f"Cantidad o precio invalido en item: {item.get('descripcion', '')}"}), 400

        if cantidad <= 0:
            return jsonify({"error": f"Cantidad debe ser mayor a 0: {item.get('descripcion', '')}"}), 400
        if precio <= 0:
            return jsonify({"error": f"Precio debe ser mayor a 0: {item.get('descripcion', '')}"}), 400

        iva_pct = float(item.get("iva", 21))
        iva_id = iva_pct_to_id.get(iva_pct, IVA_21)

        items.append({
            "descripcion": item.get("descripcion", "Servicio"),
            "cantidad": cantidad,
            "precio_unitario": precio,
            "iva_id": iva_id,
        })
        items_pdf.append({
            "descripcion": item.get("descripcion", "Servicio"),
            "cantidad": cantidad,
            "precio_unitario": precio,
            "iva_pct": iva_pct,
        })

    # Validar fechas de servicio
    if concepto in (CONCEPTO_SERVICIOS, CONCEPTO_PRODUCTOS_Y_SERVICIOS):
        if not data.get("fecha_servicio_desde") or not data.get("fecha_servicio_hasta"):
            return jsonify({"error": "Concepto servicios requiere fecha_servicio_desde y fecha_servicio_hasta"}), 400

    # Condición IVA del receptor (RG 5616)
    cond_iva_codigo = None
    if cond_iva:
        cond_iva_codigo = COND_IVA_MAP.get(cond_iva)
    elif doc_tipo == DOC_SIN_IDENTIFICAR:
        cond_iva_codigo = COND_IVA_CONSUMIDOR_FINAL

    # Allow selecting a specific punto_venta (estudio plan can have up to 3)
    requested_pv = data.get("punto_venta")
    if requested_pv is not None:
        try:
            requested_pv = int(requested_pv)
        except (ValueError, TypeError):
            return jsonify({"error": "punto_venta invalido"}), 400
        if requested_pv not in tenant.all_puntos_venta:
            return jsonify({"error": f"Punto de venta {requested_pv} no esta habilitado para tu cuenta. PVs disponibles: {tenant.all_puntos_venta}"}), 403
        selected_pv = requested_pv
    else:
        selected_pv = tenant.punto_venta

    factura_data = {
        "punto_venta": selected_pv,
        "tipo_cbte": tipo_cbte,
        "concepto": concepto,
        "doc_tipo": doc_tipo,
        "doc_nro": doc_nro,
        "items": items,
        "cond_iva_receptor": cond_iva_codigo,
    }

    for campo in ["fecha_servicio_desde", "fecha_servicio_hasta", "fecha_vencimiento_pago"]:
        if campo in data and data[campo]:
            valor = str(data[campo]).replace("-", "")
            if not valor.isdigit() or len(valor) != 8:
                return jsonify({"error": f"Formato de fecha invalido en {campo}"}), 400
            factura_data[campo] = valor

    try:
        client = get_wsfe_client()
        resultado = client.solicitar_cae(factura_data)

        # Generar PDF en directorio del tenant
        pdf_dir = _get_tenant_pdf_dir()
        pdf_filename = f"factura_{resultado['punto_venta']:04d}_{resultado['cbte_nro']:08d}.pdf"
        pdf_path = os.path.join(pdf_dir, pdf_filename)

        generar_pdf(
            factura_data=resultado,
            emisor_data=tenant.emisor_data,
            receptor_data=receptor,
            items=items_pdf,
            output_path=pdf_path,
        )

        resultado["pdf"] = pdf_filename

        # Guardar en historial DB
        invoice = Invoice(
            tenant_id=tenant.id,
            tipo_cbte=resultado["tipo_cbte"],
            punto_venta=resultado["punto_venta"],
            cbte_nro=resultado["cbte_nro"],
            fecha=resultado["fecha"],
            cae=resultado["cae"],
            cae_vencimiento=resultado["cae_vencimiento"],
            importe_total=resultado["importe_total"],
            importe_neto=resultado["importe_neto"],
            importe_iva=resultado["importe_iva"],
            doc_tipo=doc_tipo,
            doc_nro=doc_nro,
            receptor_nombre=receptor.get("razon_social", ""),
            items_json=json.dumps(items_pdf, ensure_ascii=False),
            pdf_filename=pdf_filename,
        )
        db.session.add(invoice)
        db.session.commit()

        logger.info("Factura emitida: %04d-%08d CAE:%s $%.2f (tenant:%s)",
                     resultado["punto_venta"], resultado["cbte_nro"],
                     resultado["cae"], resultado["importe_total"], tenant.cuit)

        return jsonify(resultado), 201

    except RuntimeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        logger.exception("Error emitiendo factura")
        return jsonify({"error": "Error interno al emitir factura. Reintentar."}), 500


@api_bp.route("/ultimo-comprobante", methods=["GET"])
@login_required
def ultimo_comprobante():
    """Consulta ultimo comprobante autorizado."""
    tipo_str = request.args.get("tipo", "B").upper()
    tipo_map = {"A": TIPO_FACTURA_A, "B": TIPO_FACTURA_B}
    tipo_cbte = tipo_map.get(tipo_str, TIPO_FACTURA_B)
    # Allow querying a specific PV
    pv_param = request.args.get("punto_venta")
    if pv_param:
        try:
            pv = int(pv_param)
        except (ValueError, TypeError):
            return jsonify({"error": "punto_venta invalido"}), 400
        if pv not in g.tenant.all_puntos_venta:
            return jsonify({"error": f"Punto de venta {pv} no habilitado"}), 403
    else:
        pv = g.tenant.punto_venta

    try:
        client = get_wsfe_client()
        nro = client.ultimo_comprobante(pv, tipo_cbte)
        return jsonify({"punto_venta": pv, "tipo": tipo_str, "ultimo_nro": nro})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        logger.exception("Error consultando ultimo comprobante")
        return jsonify({"error": "Error al consultar ARCA"}), 500


@api_bp.route("/consultar/<int:nro>", methods=["GET"])
@login_required
def consultar_factura(nro):
    """Consulta una factura emitida."""
    tipo_str = request.args.get("tipo", "B").upper()
    tipo_map = {"A": TIPO_FACTURA_A, "B": TIPO_FACTURA_B}
    tipo_cbte = tipo_map.get(tipo_str, TIPO_FACTURA_B)

    try:
        client = get_wsfe_client()
        resultado = client.consultar_comprobante(g.tenant.punto_venta, tipo_cbte, nro)
        return jsonify(resultado)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        logger.exception("Error consultando comprobante")
        return jsonify({"error": "Error al consultar ARCA"}), 500


@api_bp.route("/pdf/<filename>", methods=["GET"])
@login_required
def descargar_pdf(filename):
    """Descarga un PDF de factura (protegido por tenant)."""
    if not re.match(r'^factura_\d{4}_\d{8}\.pdf$', filename):
        return jsonify({"error": "Nombre de archivo invalido"}), 400
    pdf_dir = _get_tenant_pdf_dir()
    return send_from_directory(pdf_dir, filename, mimetype="application/pdf", as_attachment=True)


@api_bp.route("/invalidar-ticket", methods=["POST"])
@login_required
def invalidar_ticket():
    """Invalida el cache del ticket WSAA del tenant."""
    invalidate_cache(cuit=g.tenant.cuit)
    return jsonify({"status": "ticket invalidado"})


# --- Clientes ---

@api_bp.route("/api/clientes", methods=["GET"])
@login_required
def api_get_clientes():
    """Lista clientes del tenant."""
    clientes = Client.query.filter_by(tenant_id=g.tenant.id).all()
    return jsonify([{
        "id": c.id,
        "nombre": c.nombre,
        "doc_tipo": c.doc_tipo,
        "doc_nro": c.doc_nro,
        "condicion_iva": c.condicion_iva,
        "domicilio": c.domicilio,
        "email": c.email,
    } for c in clientes])


@api_bp.route("/api/clientes", methods=["POST"])
@login_required
def api_save_clientes():
    """Guarda/actualiza lista de clientes del tenant."""
    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "Se esperaba una lista"}), 400

    # Reemplazar todos los clientes del tenant
    Client.query.filter_by(tenant_id=g.tenant.id).delete()
    for item in data:
        client = Client(
            tenant_id=g.tenant.id,
            nombre=item.get("nombre", ""),
            doc_tipo=item.get("doc_tipo", ""),
            doc_nro=item.get("doc_nro", ""),
            condicion_iva=item.get("condicion_iva", "Consumidor Final"),
            domicilio=item.get("domicilio", ""),
            email=item.get("email", ""),
        )
        db.session.add(client)
    db.session.commit()
    return jsonify({"status": "ok"})


# --- Historial ---

@api_bp.route("/api/historial", methods=["GET"])
@login_required
def api_get_historial():
    """Lista historial de facturas del tenant."""
    invoices = Invoice.query.filter_by(tenant_id=g.tenant.id).order_by(Invoice.created_at.desc()).all()
    return jsonify([{
        "tipo_cbte": inv.tipo_cbte,
        "punto_venta": inv.punto_venta,
        "cbte_nro": inv.cbte_nro,
        "fecha": inv.fecha,
        "cae": inv.cae,
        "cae_vencimiento": inv.cae_vencimiento,
        "importe_total": inv.importe_total,
        "importe_neto": inv.importe_neto,
        "importe_iva": inv.importe_iva,
        "doc_tipo": inv.doc_tipo,
        "doc_nro": inv.doc_nro,
        "receptor_nombre": inv.receptor_nombre,
        "items": json.loads(inv.items_json) if inv.items_json else [],
        "pdf": inv.pdf_filename,
    } for inv in invoices])


# --- Configuración del tenant ---

@api_bp.route("/api/config", methods=["GET"])
@login_required
def api_get_config():
    """Retorna configuración del tenant."""
    t = g.tenant
    plan_limits = PLAN_LIMITS.get(t.plan or "basico", PLAN_LIMITS["basico"])
    now = datetime.now(timezone.utc)
    month_count = Invoice.query.filter(
        Invoice.tenant_id == t.id,
        extract('year', Invoice.created_at) == now.year,
        extract('month', Invoice.created_at) == now.month,
    ).count()
    return jsonify({
        "razon_social": t.razon_social,
        "domicilio": t.domicilio,
        "condicion_iva": t.condicion_iva,
        "iibb": t.iibb,
        "inicio_actividades": t.inicio_actividades,
        "punto_venta": t.punto_venta,
        "puntos_venta": t.all_puntos_venta,
        "max_puntos_venta": plan_limits["max_puntos_venta"],
        "cuit": t.cuit,
        "has_certificates": t.has_certificates,
        "plan": t.plan or "basico",
        "facturas_este_mes": month_count,
        "max_facturas_mes": plan_limits["max_facturas_mes"],
        "tipos_permitidos": plan_limits["tipos_permitidos"],
    })


@api_bp.route("/api/config", methods=["POST"])
@login_required
def api_save_config():
    """Actualiza configuración del tenant."""
    data = request.get_json()
    if not isinstance(data, dict):
        return jsonify({"error": "Se esperaba un objeto"}), 400

    t = g.tenant
    for field in ["razon_social", "domicilio", "condicion_iva", "iibb", "inicio_actividades"]:
        if field in data:
            setattr(t, field, data[field])
    if "punto_venta" in data and isinstance(data["punto_venta"], int) and data["punto_venta"] > 0:
        t.punto_venta = data["punto_venta"]

    # Manage extra puntos de venta (estudio plan only)
    if "puntos_venta_extra" in data:
        plan_limits = PLAN_LIMITS.get(t.plan or "basico", PLAN_LIMITS["basico"])
        max_pvs = plan_limits["max_puntos_venta"]
        extras = data["puntos_venta_extra"]
        if not isinstance(extras, list):
            return jsonify({"error": "puntos_venta_extra debe ser un array"}), 400
        # Total PVs = 1 (principal) + extras
        if 1 + len(extras) > max_pvs:
            return jsonify({"error": f"Tu plan permite hasta {max_pvs} puntos de venta en total"}), 403
        # Validate each extra PV
        validated = []
        for pv in extras:
            try:
                pv_int = int(pv)
                if pv_int < 1 or pv_int > 99999:
                    return jsonify({"error": f"Punto de venta invalido: {pv}"}), 400
                validated.append(pv_int)
            except (ValueError, TypeError):
                return jsonify({"error": f"Punto de venta invalido: {pv}"}), 400
        t.puntos_venta_extra = json.dumps(validated)

    db.session.commit()
    return jsonify({"status": "ok"})
