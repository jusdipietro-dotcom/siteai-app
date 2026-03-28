"""
WSFEv1 - Web Service de Facturación Electrónica de ARCA (ex-AFIP)
Maneja la emisión de facturas A y B, consulta de comprobantes y último autorizado.
"""

import ssl
import logging
import threading
import requests
from zeep import Client
from zeep.transports import Transport
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("facturacion.wsfe")

# Timezone Argentina
AR_TZ = timezone(timedelta(hours=-3))


def _get_ssl_session():
    """Crea una sesión requests con ciphers relajados pero SSL verificado."""
    ctx = ssl.create_default_context()
    ctx.set_ciphers("DEFAULT:@SECLEVEL=1")
    # Mantener verificación de certificado activa

    session = requests.Session()

    from requests.adapters import HTTPAdapter

    class ARCAAdapter(HTTPAdapter):
        def init_poolmanager(self, *args, **kwargs):
            kwargs["ssl_context"] = ctx
            super().init_poolmanager(*args, **kwargs)

    session.mount("https://", ARCAAdapter())
    return session


# Cache de cliente WSDL (evita re-descargar el WSDL en cada request)
_wsdl_cache = {}
_wsdl_lock = threading.Lock()

# URLs WSFEv1
WSFE_URL_HOMO = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL"
WSFE_URL_PROD = "https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL"

# Tipos de comprobante
TIPO_FACTURA_A = 1
TIPO_NOTA_DEBITO_A = 2
TIPO_NOTA_CREDITO_A = 3
TIPO_FACTURA_B = 6
TIPO_NOTA_DEBITO_B = 7
TIPO_NOTA_CREDITO_B = 8
TIPO_FACTURA_C = 11

# Tipos de documento
DOC_CUIT = 80
DOC_CUIL = 86
DOC_DNI = 96
DOC_SIN_IDENTIFICAR = 99

# Conceptos
CONCEPTO_PRODUCTOS = 1
CONCEPTO_SERVICIOS = 2
CONCEPTO_PRODUCTOS_Y_SERVICIOS = 3

# IVA
IVA_0 = 3
IVA_10_5 = 4
IVA_21 = 5
IVA_27 = 6
IVA_5 = 8
IVA_2_5 = 9

IVA_PORCENTAJES = {
    IVA_0: 0.0,
    IVA_2_5: 2.5,
    IVA_5: 5.0,
    IVA_10_5: 10.5,
    IVA_21: 21.0,
    IVA_27: 27.0,
}

# Condición frente al IVA del receptor (RG 5616, obligatorio desde 01/06/2026)
COND_IVA_RESPONSABLE_INSCRIPTO = 1
COND_IVA_EXENTO = 4
COND_IVA_CONSUMIDOR_FINAL = 5
COND_IVA_MONOTRIBUTO = 6
COND_IVA_PROVEEDOR_EXTERIOR = 8

COND_IVA_MAP = {
    "responsable inscripto": COND_IVA_RESPONSABLE_INSCRIPTO,
    "iva responsable inscripto": COND_IVA_RESPONSABLE_INSCRIPTO,
    "exento": COND_IVA_EXENTO,
    "iva sujeto exento": COND_IVA_EXENTO,
    "consumidor final": COND_IVA_CONSUMIDOR_FINAL,
    "monotributo": COND_IVA_MONOTRIBUTO,
    "responsable monotributo": COND_IVA_MONOTRIBUTO,
}

# Lock para serializar emisión de facturas (evitar race condition en número de comprobante)
_cae_lock = threading.Lock()


class WSFEClient:
    def __init__(self, token, sign, cuit, production=False):
        self.token = token
        self.sign = sign
        self.cuit = cuit
        wsdl = WSFE_URL_PROD if production else WSFE_URL_HOMO

        with _wsdl_lock:
            if wsdl not in _wsdl_cache:
                session = _get_ssl_session()
                transport = Transport(session=session)
                _wsdl_cache[wsdl] = Client(wsdl, transport=transport)

        self.client = _wsdl_cache[wsdl]
        self.auth = {
            "Token": token,
            "Sign": sign,
            "Cuit": cuit,
        }

    def _check_errors(self, response):
        """Verifica errores y eventos en la respuesta de ARCA."""
        # Loggear eventos informativos
        if hasattr(response, "Events") and response.Events:
            for evt in response.Events.Evt:
                logger.warning("ARCA Event [%s]: %s", evt.Code, evt.Msg)

        if hasattr(response, "Errors") and response.Errors:
            errors = []
            for err in response.Errors.Err:
                errors.append(f"[{err.Code}] {err.Msg}")
            raise RuntimeError("Error ARCA: " + "; ".join(errors))

    def ultimo_comprobante(self, punto_venta, tipo_cbte):
        """Consulta el último número de comprobante autorizado."""
        response = self.client.service.FECompUltimoAutorizado(
            Auth=self.auth,
            PtoVta=punto_venta,
            CbteTipo=tipo_cbte,
        )
        self._check_errors(response)
        return response.CbteNro

    def solicitar_cae(self, factura_data):
        """
        Solicita CAE para una factura. Thread-safe via lock.
        """
        with _cae_lock:
            return self._solicitar_cae_internal(factura_data)

    def _solicitar_cae_internal(self, factura_data):
        pv = factura_data["punto_venta"]
        tipo = factura_data["tipo_cbte"]
        concepto = factura_data.get("concepto", CONCEPTO_SERVICIOS)
        doc_tipo = factura_data.get("doc_tipo", DOC_CUIT)
        doc_nro = factura_data["doc_nro"]
        items = factura_data["items"]
        cond_iva_receptor = factura_data.get("cond_iva_receptor")

        # Calcular importes (sin redondear intermedios)
        neto_gravado = 0.0
        iva_array = {}

        for item in items:
            cantidad = item.get("cantidad", 1)
            precio = item["precio_unitario"]
            iva_id = item.get("iva_id", IVA_21)
            iva_pct = IVA_PORCENTAJES.get(iva_id, 21.0)

            subtotal = cantidad * precio
            iva_monto = subtotal * iva_pct / 100

            neto_gravado += subtotal

            if iva_id not in iva_array:
                iva_array[iva_id] = {"BaseImp": 0.0, "Importe": 0.0}
            iva_array[iva_id]["BaseImp"] += subtotal
            iva_array[iva_id]["Importe"] += iva_monto

        # Redondear solo los totales finales
        neto_gravado = round(neto_gravado, 2)
        iva_total = 0.0
        iva_list = []
        for iva_id, montos in iva_array.items():
            base = round(montos["BaseImp"], 2)
            importe = round(montos["Importe"], 2)
            iva_list.append({"Id": iva_id, "BaseImp": base, "Importe": importe})
            iva_total += importe
        iva_total = round(iva_total, 2)
        total = round(neto_gravado + iva_total, 2)

        # Obtener último comprobante
        ultimo = self.ultimo_comprobante(pv, tipo)
        cbte_nro = ultimo + 1

        # Usar timezone Argentina para la fecha
        fecha_cbte = datetime.now(AR_TZ).strftime("%Y%m%d")

        # Construir request
        fe_det = {
            "Concepto": concepto,
            "DocTipo": doc_tipo,
            "DocNro": doc_nro,
            "CbteDesde": cbte_nro,
            "CbteHasta": cbte_nro,
            "CbteFch": fecha_cbte,
            "ImpTotal": total,
            "ImpTotConc": 0,
            "ImpNeto": neto_gravado,
            "ImpOpEx": 0,
            "ImpIVA": iva_total,
            "ImpTrib": 0,
            "MonId": "PES",
            "MonCotiz": 1,
        }

        # Agregar fechas de servicio si corresponde
        if concepto in (CONCEPTO_SERVICIOS, CONCEPTO_PRODUCTOS_Y_SERVICIOS):
            fe_det["FchServDesde"] = factura_data.get(
                "fecha_servicio_desde", fecha_cbte
            )
            fe_det["FchServHasta"] = factura_data.get(
                "fecha_servicio_hasta", fecha_cbte
            )
            fe_det["FchVtoPago"] = factura_data.get(
                "fecha_vencimiento_pago", fecha_cbte
            )

        # Condición IVA del receptor (RG 5616, obligatorio desde 01/06/2026)
        if cond_iva_receptor:
            fe_det["CondicionIVAReceptorId"] = cond_iva_receptor

        # Agregar IVA
        fe_det["Iva"] = {"AlicIva": iva_list}

        # Llamar al WS
        logger.info("Solicitando CAE PV:%s Tipo:%s Nro:%s Total:$%.2f",
                     pv, tipo, cbte_nro, total)

        response = self.client.service.FECAESolicitar(
            Auth=self.auth,
            FeCAEReq={
                "FeCabReq": {
                    "CantReg": 1,
                    "PtoVta": pv,
                    "CbteTipo": tipo,
                },
                "FeDetReq": {
                    "FECAEDetRequest": [fe_det],
                },
            },
        )

        self._check_errors(response)

        # Extraer resultado
        det = response.FeDetResp.FECAEDetResponse[0]

        # Capturar observaciones (tanto para aprobadas como rechazadas)
        observaciones = []
        if hasattr(det, "Observaciones") and det.Observaciones:
            observaciones = [
                {"code": o.Code, "msg": o.Msg} for o in det.Observaciones.Obs
            ]

        if det.Resultado != "A":
            obs_str = "; ".join(f"[{o['code']}] {o['msg']}" for o in observaciones)
            raise RuntimeError(f"Factura rechazada: {obs_str}")

        logger.info("CAE obtenido: %s (vto: %s)", det.CAE, det.CAEFchVto)

        return {
            "resultado": det.Resultado,
            "cae": det.CAE,
            "cae_vencimiento": det.CAEFchVto,
            "cbte_nro": cbte_nro,
            "punto_venta": pv,
            "tipo_cbte": tipo,
            "fecha": fecha_cbte,
            "importe_total": total,
            "importe_neto": neto_gravado,
            "importe_iva": iva_total,
            "doc_tipo": doc_tipo,
            "doc_nro": doc_nro,
            "cuit_emisor": self.cuit,
            "observaciones": observaciones,
        }

    def consultar_comprobante(self, punto_venta, tipo_cbte, nro_cbte):
        """Consulta un comprobante ya emitido."""
        response = self.client.service.FECompConsultar(
            Auth=self.auth,
            FeCompConsReq={
                "CbteTipo": tipo_cbte,
                "CbteNro": nro_cbte,
                "PtoVta": punto_venta,
            },
        )
        self._check_errors(response)

        r = response.ResultGet
        return {
            "cbte_nro": r.CbteDesde,
            "punto_venta": punto_venta,
            "tipo_cbte": tipo_cbte,
            "fecha": r.CbteFch,
            "cae": r.CodAutorizacion,
            "cae_vencimiento": r.FchVto,
            "doc_tipo": r.DocTipo,
            "doc_nro": r.DocNro,
            "importe_total": r.ImpTotal,
            "importe_neto": r.ImpNeto,
            "importe_iva": r.ImpIVA,
            "moneda": r.MonId,
            "concepto": r.Concepto,
        }

    def tipos_comprobante(self):
        """Lista tipos de comprobante disponibles."""
        response = self.client.service.FEParamGetTiposCbte(Auth=self.auth)
        return [
            {"id": t.Id, "desc": t.Desc}
            for t in response.ResultGet.CbteTipo
        ]
