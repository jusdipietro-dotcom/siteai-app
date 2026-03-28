# Facturacion ARCA - Documentacion Comercial

## El Producto

**Facturacion ARCA** es una plataforma web de facturacion electronica que se conecta directamente con ARCA (ex-AFIP) para emitir facturas legales con CAE en segundos. Pensada para contadores, estudios contables y empresas que necesitan facturar de forma simple, segura y escalable.

---

## Problema que Resuelve

Facturar en Argentina es un proceso complejo:
- Los contribuyentes dependen del portal de ARCA que es lento, se cae y tiene una interfaz confusa
- Los sistemas de facturacion tradicionales son caros (licencias mensuales), pesados de instalar y no escalan
- Los contadores que manejan varios CUITs necesitan entrar y salir de distintas sesiones constantemente
- No hay una solucion simple, moderna y multi-CUIT que funcione desde el navegador

**Facturacion ARCA** resuelve todo esto con una app web moderna, rapida y multi-tenant.

---

## Propuesta de Valor

| Caracteristica | Beneficio |
|----------------|-----------|
| Facturacion en segundos | Carga datos, click, CAE listo. Sin esperar carga del portal ARCA |
| Multi-tenant (multi-CUIT) | Un solo sistema para todos tus clientes/empresas |
| PDF profesional con QR | Factura lista para enviar, cumple RG 4291 |
| Historial completo | Busca, filtra y descarga cualquier factura emitida |
| Gestion de clientes | Base de datos de receptores con autocompletado |
| 100% web | Funciona desde cualquier navegador, sin instalar nada |
| Seguridad bancaria | Certificados encriptados, conexion HTTPS, datos aislados |
| Actualizaciones automaticas | Siempre al dia con regulaciones (RG 5616, etc.) |

---

## Publico Objetivo

### 1. Contadores y Estudios Contables
- Manejan facturacion de multiples clientes (CUITs)
- Necesitan una herramienta centralizada
- Valoran la velocidad y confiabilidad
- **Pain point principal:** alternar entre sesiones de ARCA para distintos clientes

### 2. PyMEs y Autonomos
- Emiten entre 10 y 500 facturas por mes
- No quieren pagar sistemas complejos tipo ERP
- Necesitan algo simple que funcione
- **Pain point principal:** el portal de ARCA es lento y se cae en fechas pico

### 3. Empresas de Servicios
- Facturan servicios recurrentes a los mismos clientes
- Necesitan historial, busqueda y re-emision rapida
- **Pain point principal:** proceso repetitivo y propenso a errores manuales

---

## Funcionalidades

### Emision de Facturas
- Factura A (Responsable Inscripto a Responsable Inscripto)
- Factura B (Responsable Inscripto a Consumidor Final, Monotributo, Exento)
- Notas de Credito y Debito A/B
- Conceptos: Productos, Servicios o ambos
- Multiples items por factura con distintas alicuotas de IVA (0%, 2.5%, 5%, 10.5%, 21%, 27%)
- Calculo automatico de neto, IVA y total
- Periodos de servicio y fecha de vencimiento de pago
- Validacion automatica de reglas (tipo de factura vs condicion IVA del receptor)
- Cumplimiento RG 5616 (condicion IVA del receptor)

### Generacion de PDF
- Formato profesional A4
- Datos del emisor y receptor
- Detalle de items con cantidades, precios e IVA
- Totales: Neto Gravado, IVA, Total
- Codigo QR reglamentario (RG 4291 de AFIP/ARCA)
- CAE y fecha de vencimiento
- Listo para enviar por email o imprimir

### Gestion de Clientes
- Alta de clientes con todos sus datos (nombre, CUIT/DNI, condicion IVA, domicilio, email)
- Autocompletado al facturar (busca por nombre o documento)
- Guardado automatico de clientes nuevos al facturar
- Edicion y eliminacion

### Historial de Facturas
- Listado completo de todas las facturas emitidas
- Filtro por tipo (A/B) y busqueda por texto
- Estadisticas: total emitidas, monto facturado, facturas A vs B
- Descarga de PDF de cualquier factura anterior
- Consulta en tiempo real contra ARCA

### Panel de Configuracion
- Datos del emisor (razon social, domicilio, condicion IVA, IIBB, inicio actividades)
- Punto de venta configurable
- Upload seguro de certificados ARCA (.crt y .key)
- Verificacion de estado de conexion con ARCA
- Invalidacion manual de ticket WSAA (troubleshooting)

### Seguridad
- Certificados ARCA almacenados con encriptacion AES (nunca en texto plano)
- Autenticacion con JWT en cookies seguras
- Aislamiento total entre cuentas (cada CUIT ve solo sus datos)
- Rate limiting contra ataques de fuerza bruta
- Headers de seguridad (HSTS, CSP, X-Frame-Options)
- Proteccion CSRF en todas las operaciones

---

## Modelo de Negocio

### Opcion 1: SaaS con Suscripcion Mensual

| Plan | Facturas/mes | CUITs | Precio sugerido |
|------|-------------|-------|-----------------|
| Starter | Hasta 50 | 1 | $5.000/mes |
| Profesional | Hasta 200 | 5 | $12.000/mes |
| Estudio | Ilimitadas | 20 | $25.000/mes |
| Enterprise | Ilimitadas | Ilimitados | A convenir |

**Costos operativos:** Un VPS de 8GB RAM soporta ~100 tenants activos con margen.

### Opcion 2: Licencia por Instalacion

- Venta unica + soporte mensual
- Ideal para estudios contables grandes que prefieren tener su propia instancia
- Precio sugerido: $80.000 setup + $10.000/mes soporte

### Opcion 3: White Label

- Personalizar marca, logo, dominio
- Ideal para software houses que quieren ofrecer facturacion a sus clientes
- Se entrega el codigo + documentacion de deploy

---

## Diferenciadores vs Competencia

| Aspecto | Facturacion ARCA | Portal ARCA (AFIP) | Sistemas tradicionales |
|---------|-----------------|--------------------|-----------------------|
| Velocidad | Segundos | Minutos (si carga) | Variable |
| Multi-CUIT | Si, nativo | No (re-login) | Limitado |
| Instalacion | Ninguna (web) | N/A | Compleja |
| Costo | Desde $5.000/mes | Gratis pero lento | $15-50.000/mes |
| PDF con QR | Automatico | Solo constancia | Variable |
| API programatica | Si (REST) | No | Algunos |
| Disponibilidad | 24/7 (tu servidor) | Se cae en picos | Depende |
| Actualizaciones | Automaticas | N/A | Manuales |
| Soporte | Incluido | Inexistente | Variable |

---

## Proceso de Onboarding (para el cliente final)

### Paso 1 - Registro (2 minutos)
1. Ingresar a la URL del sistema
2. Completar: email, contrasena, CUIT, razon social, punto de venta
3. Click en "Registrarse"

### Paso 2 - Subir Certificados ARCA (5 minutos)
1. Ir a Configuracion > Certificados ARCA
2. Subir archivo `.crt` (certificado) y `.key` (clave privada)
3. El sistema los encripta y guarda de forma segura

**Nota:** El cliente debe tener su certificado digital de ARCA vigente. Si no lo tiene, debe tramitarlo en [www.afip.gob.ar](https://www.afip.gob.ar) > Administracion de Certificados Digitales.

### Paso 3 - Configurar Datos del Emisor (2 minutos)
1. Ir a Configuracion
2. Completar: domicilio comercial, condicion IVA, IIBB, inicio de actividades
3. Guardar

### Paso 4 - Facturar
1. Ir a "Nueva Factura"
2. Seleccionar tipo (A o B), concepto
3. Cargar datos del receptor
4. Agregar items con descripcion, cantidad, precio e IVA
5. Click en "Emitir Factura"
6. Descargar PDF con CAE

**Tiempo total de setup: ~10 minutos.**

---

## Requisitos del Cliente

- Ser contribuyente inscripto en ARCA con CUIT activo
- Tener al menos un punto de venta habilitado para factura electronica
- Tener certificado digital ARCA vigente (.crt y .key)
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

---

## Soporte y Mantenimiento

### Incluido en la suscripcion
- Actualizaciones de software (nuevas regulaciones, mejoras de UI)
- Soporte por email/WhatsApp en horario laboral
- Monitoreo de disponibilidad del servidor
- Backups diarios de la base de datos

### Adicional
- Onboarding personalizado (videollamada guiada)
- Tramite de certificado ARCA para el cliente
- Integraciones custom (API, webhooks, ERP)
- Capacitacion para equipos

---

## Roadmap de Producto

### Version actual (v1.0)
- Facturas A y B con CAE
- PDF con QR reglamentario
- Multi-tenant (multi-CUIT)
- Gestion de clientes
- Historial con busqueda y filtros
- Deploy Docker listo

### Proximas versiones
- **v1.1:** Factura C, Notas de Credito/Debito desde UI
- **v1.2:** Envio automatico de factura por email al receptor
- **v1.3:** Reportes: facturacion mensual, IVA ventas, libro IVA digital
- **v1.4:** Integracion con MercadoPago/Stripe para cobro online
- **v1.5:** App movil (PWA)
- **v2.0:** API publica documentada para integraciones de terceros
- **v2.1:** Facturacion recurrente automatica (suscripciones)
- **v2.2:** Multi-usuario por tenant con roles (admin, operador, lectura)

---

## Datos Tecnicos Resumidos (para el area comercial)

- **Infraestructura:** VPS Linux con Docker, escalable horizontalmente
- **Base de datos:** SQLite (pequena escala) o PostgreSQL (enterprise)
- **Seguridad:** Encriptacion AES, JWT, HTTPS obligatorio, rate limiting
- **Disponibilidad:** 99.5%+ con monitoreo y restart automatico
- **Compliance:** RG 4291 (QR), RG 5616 (condicion IVA receptor), WSFEv1
- **Backup:** Volumen persistente con backup programable

---

## Contacto y Demo

Para agendar una demo o consultar precios:
- **Web:** [automaticialab.com](https://automaticialab.com)
- **Email:** [a definir]
- **WhatsApp:** [a definir]

---

*Documento generado el 27/03/2026. Producto desarrollado por AutomaticIA Lab.*
