"""
Generador de PDF para facturas electrónicas ARCA.
Genera un PDF con los datos de la factura, CAE y código QR.
"""

import io
import json
import base64
import threading
import qrcode
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Spacer, Paragraph, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT


TIPO_CBTE_NOMBRE = {
    1: "FACTURA A",
    2: "NOTA DE DEBITO A",
    3: "NOTA DE CREDITO A",
    6: "FACTURA B",
    7: "NOTA DE DEBITO B",
    8: "NOTA DE CREDITO B",
    11: "FACTURA C",
}

TIPO_CBTE_LETRA = {
    1: "A", 2: "A", 3: "A",
    6: "B", 7: "B", 8: "B",
    11: "C",
}

# Estilos definidos una sola vez (thread-safe)
_styles = None
_styles_lock = threading.Lock()


def _get_styles():
    global _styles
    if _styles is not None:
        return _styles
    with _styles_lock:
        if _styles is not None:
            return _styles
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name="Center", alignment=TA_CENTER, fontSize=10))
        styles.add(ParagraphStyle(name="CenterBold", alignment=TA_CENTER, fontSize=14, fontName="Helvetica-Bold"))
        styles.add(ParagraphStyle(name="Right", alignment=TA_RIGHT, fontSize=9))
        styles.add(ParagraphStyle(name="SmallCenter", alignment=TA_CENTER, fontSize=8))
        styles.add(ParagraphStyle(name="Small", fontSize=8))
        _styles = styles
    return _styles


def _generar_qr(factura_data):
    """Genera codigo QR segun especificacion ARCA (RG 4291)."""
    # Formato de fecha para QR: YYYY-MM-DD
    fecha_raw = factura_data["fecha"]
    fecha_qr = f"{fecha_raw[:4]}-{fecha_raw[4:6]}-{fecha_raw[6:8]}"

    qr_data = {
        "ver": 1,
        "fecha": fecha_qr,
        "cuit": int(factura_data["cuit_emisor"]),
        "ptoVta": factura_data["punto_venta"],
        "tipoCmp": factura_data["tipo_cbte"],
        "nroCmp": factura_data["cbte_nro"],
        "importe": float(factura_data["importe_total"]),
        "moneda": "PES",
        "ctz": 1,
        "tipoDocRec": factura_data["doc_tipo"],
        "nroDocRec": int(factura_data["doc_nro"]),
        "tipoCodAut": "E",
        "codAut": int(factura_data["cae"]),
    }

    qr_json = json.dumps(qr_data)
    qr_b64 = base64.b64encode(qr_json.encode()).decode()
    qr_url = f"https://www.afip.gob.ar/fe/qr/?p={qr_b64}"

    qr_img = qrcode.make(qr_url, box_size=3, border=2)
    buf = io.BytesIO()
    qr_img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def generar_pdf(factura_data, emisor_data, receptor_data, items, output_path=None):
    """Genera el PDF de la factura con CAE y QR."""
    if output_path is None:
        output_path = f"factura_{factura_data['punto_venta']:04d}_{factura_data['cbte_nro']:08d}.pdf"

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm,
                            leftMargin=1.5*cm, rightMargin=1.5*cm)

    styles = _get_styles()
    elements = []

    tipo_nombre = TIPO_CBTE_NOMBRE.get(factura_data["tipo_cbte"], "FACTURA")
    letra = TIPO_CBTE_LETRA.get(factura_data["tipo_cbte"], "")

    # --- ENCABEZADO ---
    fecha_fmt = datetime.strptime(factura_data["fecha"], "%Y%m%d").strftime("%d/%m/%Y")
    pv = factura_data["punto_venta"]
    nro = factura_data["cbte_nro"]
    comp_nro = f"{pv:04d}-{nro:08d}"

    header_data = [
        [
            Paragraph(f"<b>{emisor_data['razon_social']}</b>", styles["Normal"]),
            Paragraph(f"<b>{letra}</b>", styles["CenterBold"]),
            Paragraph(f"<b>{tipo_nombre}</b>", styles["Normal"]),
        ],
        [
            Paragraph(f"{emisor_data.get('domicilio', '')}", styles["Small"]),
            "",
            Paragraph(f"<b>Nro: {comp_nro}</b>", styles["Normal"]),
        ],
        [
            Paragraph(f"Condicion IVA: {emisor_data.get('condicion_iva', '')}", styles["Small"]),
            "",
            Paragraph(f"Fecha: {fecha_fmt}", styles["Normal"]),
        ],
        [
            Paragraph(f"CUIT: {factura_data['cuit_emisor']}", styles["Small"]),
            "",
            Paragraph(f"IIBB: {emisor_data.get('iibb', 'N/A')}", styles["Small"]),
        ],
        [
            Paragraph(f"Inicio Act.: {emisor_data.get('inicio_actividades', '')}", styles["Small"]),
            "",
            "",
        ],
    ]

    header_table = Table(header_data, colWidths=[7*cm, 3*cm, 7*cm])
    header_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("BOX", (1, 0), (1, 0), 1, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("VALIGN", (1, 0), (1, 0), "MIDDLE"),
        ("SPAN", (1, 0), (1, -1)),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 5*mm))

    # --- DATOS RECEPTOR ---
    doc_tipo_nombre = {80: "CUIT", 86: "CUIL", 96: "DNI", 99: "Consumidor Final"}.get(
        factura_data["doc_tipo"], str(factura_data["doc_tipo"])
    )

    receptor_info = [
        [
            Paragraph(f"<b>Senor(es):</b> {receptor_data.get('razon_social', '')}", styles["Normal"]),
            Paragraph(f"<b>{doc_tipo_nombre}:</b> {factura_data['doc_nro']}", styles["Normal"]),
        ],
        [
            Paragraph(f"<b>Domicilio:</b> {receptor_data.get('domicilio', '')}", styles["Normal"]),
            Paragraph(f"<b>Cond. IVA:</b> {receptor_data.get('condicion_iva', '')}", styles["Normal"]),
        ],
    ]
    receptor_table = Table(receptor_info, colWidths=[10*cm, 7*cm])
    receptor_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(receptor_table)

    # Condición de venta
    if factura_data.get("fecha_vencimiento_pago"):
        vto = factura_data["fecha_vencimiento_pago"]
        vto_fmt = f"{vto[6:8]}/{vto[4:6]}/{vto[:4]}" if len(vto) == 8 else vto
        elements.append(Paragraph(f"<b>Condicion de venta:</b> Cuenta Corriente - Vto: {vto_fmt}", styles["Normal"]))
    else:
        elements.append(Paragraph(f"<b>Condicion de venta:</b> Contado", styles["Normal"]))

    elements.append(Spacer(1, 5*mm))

    # --- DETALLE ---
    detalle_header = ["Descripcion", "Cant.", "P. Unitario", "IVA %", "Subtotal"]
    detalle_data = [detalle_header]

    for item in items:
        subtotal = round(item.get("cantidad", 1) * item["precio_unitario"], 2)
        detalle_data.append([
            item["descripcion"],
            str(item.get("cantidad", 1)),
            f"$ {item['precio_unitario']:,.2f}",
            f"{item.get('iva_pct', 21.0)}%",
            f"$ {subtotal:,.2f}",
        ])

    detalle_table = Table(detalle_data, colWidths=[7*cm, 2*cm, 3*cm, 2*cm, 3*cm])
    detalle_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#333333")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F5")]),
    ]))
    elements.append(detalle_table)
    elements.append(Spacer(1, 5*mm))

    # --- TOTALES ---
    totales_data = [
        ["Subtotal (Neto Gravado):", f"$ {factura_data['importe_neto']:,.2f}"],
        ["IVA:", f"$ {factura_data['importe_iva']:,.2f}"],
        ["TOTAL:", f"$ {factura_data['importe_total']:,.2f}"],
    ]
    totales_table = Table(totales_data, colWidths=[13*cm, 4*cm])
    totales_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
        ("TOPPADDING", (0, -1), (-1, -1), 5),
    ]))
    elements.append(totales_table)
    elements.append(Spacer(1, 10*mm))

    # --- CAE y QR ---
    cae_vto = datetime.strptime(factura_data["cae_vencimiento"], "%Y%m%d").strftime("%d/%m/%Y")

    qr_buf = _generar_qr(factura_data)
    qr_image = Image(qr_buf, width=3*cm, height=3*cm)

    cae_data = [
        [
            qr_image,
            Paragraph(
                f"<b>CAE:</b> {factura_data['cae']}<br/>"
                f"<b>Vto. CAE:</b> {cae_vto}<br/><br/>"
                f"<font size=7>Comprobante autorizado por ARCA (ex-AFIP)</font>",
                styles["Normal"]
            ),
        ],
    ]
    cae_table = Table(cae_data, colWidths=[4*cm, 13*cm])
    cae_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(cae_table)

    # Generar PDF
    doc.build(elements)

    pdf_bytes = buf.getvalue()
    with open(output_path, "wb") as f:
        f.write(pdf_bytes)

    return output_path, pdf_bytes
