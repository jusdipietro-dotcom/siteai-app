# Facturacion ARCA SaaS - Documentacion Tecnica

## 1. Vision General

Sistema SaaS multi-tenant de facturacion electronica integrado con ARCA (ex-AFIP). Permite a multiples empresas emitir Facturas A, B y C con autorizacion CAE automatica, generar PDFs con QR reglamentario y gestionar clientes e historial.

**Stack:** Python 3.11 + Flask + SQLAlchemy + Zeep (SOAP) + ReportLab + Bootstrap 5

---

## 2. Arquitectura

```
                    +-------------------+
                    |   Reverse Proxy   |
                    |  (EasyPanel/nginx)|
                    +--------+----------+
                             |
                    +--------v----------+
                    |   Gunicorn WSGI   |
                    |   (2 threads)     |
                    +--------+----------+
                             |
              +--------------+--------------+
              |         Flask App           |
              |  +--------+ +----------+   |
              |  | auth_bp| |  api_bp  |   |
              |  +--------+ +----------+   |
              |       |           |         |
              |  +----v-----------v----+   |
              |  |   SQLAlchemy ORM    |   |
              |  |   (SQLite WAL)      |   |
              |  +---------------------+   |
              |       |           |         |
              |  +----v----+ +---v------+  |
              |  |  WSAA   | |  WSFEv1  |  |
              |  | (Auth)  | | (Factura)|  |
              |  +----+----+ +---+------+  |
              +-------|----------|----------+
                      |          |
              +-------v----------v---------+
              |     ARCA (ex-AFIP)         |
              |  wsaa.afip.gov.ar          |
              |  servicios1.afip.gov.ar    |
              +----------------------------+
```

### Flujo de emision de factura

```
1. Cliente (browser) -> POST /factura (JSON)
2. Flask valida datos, tipo cbte, receptor, items
3. tenant.py desencripta certificados del tenant
4. wsaa.py firma TRA con CMS/PKCS#7 (OpenSSL)
5. wsaa.py obtiene ticket WSAA (token + sign) [cacheado 12hs]
6. wsfe.py construye request FECAESolicitar (SOAP)
7. ARCA responde con CAE + vencimiento
8. pdf_generator.py genera PDF con QR (RG 4291)
9. Se guarda Invoice en DB + PDF en disco
10. Respuesta JSON al cliente con CAE y link al PDF
```

---

## 3. Estructura de Archivos

```
facturacion-arca/
├── app.py                 # App factory, middleware, security headers, CSRF
├── config.py              # Configuracion centralizada con validacion
├── models.py              # Modelos: Tenant, User, Client, Invoice
├── auth.py                # Blueprint auth: register, login, logout, upload-cert
├── api.py                 # Blueprint API: factura, clientes, historial, config
├── wsaa.py                # Autenticacion WSAA (firma CMS, cache de tickets)
├── wsfe.py                # Cliente WSFEv1 (solicitar CAE, consultar cbtes)
├── crypto.py              # Encriptacion Fernet para certificados
├── tenant.py              # Helper: obtener WSFEClient autenticado por tenant
├── utils.py               # Validacion CUIT compartida
├── pdf_generator.py       # Generador de PDFs con ReportLab + QR
├── requirements.txt       # Dependencias Python
├── Dockerfile             # Build: non-root user, healthcheck
├── docker-compose.yml     # Orquestacion con volumen persistente
├── .dockerignore          # Excluye secretos y venv del build
├── .gitignore             # Excluye .env, data/, venv/, *.key, *.crt
├── .env                   # Variables de entorno (NO commitear)
├── .env.example           # Plantilla de variables
├── iniciar.bat            # Script de inicio local (Windows)
├── templates/
│   ├── login.html         # UI de login/registro (SPA dark theme)
│   └── index.html         # Dashboard principal (sidebar, formularios)
└── data/
    ├── facturacion.db     # Base de datos SQLite
    └── pdfs/{tenant_id}/  # PDFs organizados por tenant
```

---

## 4. Modelo de Datos

### Tenant (empresa/organizacion)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | Integer PK | ID interno |
| cuit | BigInteger UNIQUE | CUIT de la empresa |
| razon_social | String(200) | Nombre legal |
| domicilio | String(300) | Domicilio comercial |
| condicion_iva | String(50) | Default: "Responsable Inscripto" |
| iibb | String(50) | Numero de IIBB |
| inicio_actividades | String(20) | Fecha inicio actividades |
| punto_venta | Integer | Punto de venta ARCA |
| cert_encrypted | LargeBinary | Certificado X.509 encriptado (Fernet) |
| key_encrypted | LargeBinary | Clave privada encriptada (Fernet) |
| production | Boolean | true=produccion, false=homologacion |
| active | Boolean | Cuenta activa/desactivada |
| created_at | DateTime | Fecha de alta |

### User (usuario del sistema)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | Integer PK | ID interno |
| email | String(120) UNIQUE | Credencial de login |
| password_hash | String(256) | Hash bcrypt (werkzeug) |
| nombre | String(100) | Nombre para mostrar |
| tenant_id | Integer FK indexed | Empresa asociada |
| created_at | DateTime | Fecha de alta |

### Client (receptor/cliente del tenant)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | Integer PK | ID interno |
| tenant_id | Integer FK indexed | Empresa propietaria |
| nombre | String(200) | Razon social / nombre |
| doc_tipo | String(20) | CUIT, DNI, etc. |
| doc_nro | String(20) | Numero de documento |
| condicion_iva | String(50) | Condicion IVA del receptor |
| domicilio | String(300) | Domicilio |
| email | String(120) | Email del cliente |

### Invoice (historial de facturas emitidas)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | Integer PK | ID interno |
| tenant_id | Integer FK indexed | Empresa emisora |
| tipo_cbte | Integer | 1=Fact A, 6=Fact B, 11=Fact C |
| punto_venta | Integer | Punto de venta |
| cbte_nro | Integer | Numero de comprobante |
| fecha | String(8) | Fecha YYYYMMDD |
| cae | String(20) | Codigo de autorizacion ARCA |
| cae_vencimiento | String(8) | Vencimiento CAE YYYYMMDD |
| importe_total | Numeric(12,2) | Monto total |
| importe_neto | Numeric(12,2) | Neto gravado |
| importe_iva | Numeric(12,2) | IVA total |
| doc_tipo | Integer | Tipo doc receptor |
| doc_nro | BigInteger | Nro doc receptor |
| receptor_nombre | String(200) | Nombre receptor |
| items_json | Text | Items en JSON |
| pdf_filename | String(100) | Nombre del PDF generado |
| created_at | DateTime | Timestamp |

---

## 5. API Endpoints

### Autenticacion (auth_bp, prefix: /auth)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /auth/register | No | Registro de tenant + usuario |
| POST | /auth/login | No | Inicio de sesion (devuelve JWT cookie) |
| POST | /auth/logout | No | Cierra sesion (borra cookie) |
| GET | /auth/me | Si | Datos del usuario y tenant actual |
| POST | /auth/upload-cert | Si | Sube certificado .crt y clave .key |

### Facturacion (api_bp)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /factura | Si | Emitir factura electronica |
| GET | /ultimo-comprobante?tipo=A\|B | Si | Ultimo nro autorizado |
| GET | /consultar/{nro}?tipo=A\|B | Si | Consultar factura en ARCA |
| GET | /pdf/{filename} | Si | Descargar PDF (tenant-scoped) |
| POST | /invalidar-ticket | Si | Forzar refresh de ticket WSAA |

### Clientes y Config

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /api/clientes | Si | Listar clientes del tenant |
| POST | /api/clientes | Si | Guardar lista de clientes |
| GET | /api/historial | Si | Historial de facturas emitidas |
| GET | /api/config | Si | Configuracion del tenant |
| POST | /api/config | Si | Actualizar configuracion |
| GET | /health | No | Health check (para Docker/EasyPanel) |

### Ejemplo: Emitir Factura B

```json
POST /factura
Content-Type: application/json

{
  "tipo": "B",
  "concepto": "servicios",
  "receptor": {
    "razon_social": "Juan Perez",
    "condicion_iva": "Consumidor Final",
    "domicilio": "Av. Rivadavia 1234, CABA"
  },
  "items": [
    {
      "descripcion": "Desarrollo web",
      "cantidad": 1,
      "precio_unitario": 50000,
      "iva": 21
    }
  ],
  "fecha_servicio_desde": "2026-03-01",
  "fecha_servicio_hasta": "2026-03-31"
}
```

Respuesta exitosa (201):
```json
{
  "tipo_cbte": 6,
  "punto_venta": 21,
  "cbte_nro": 15,
  "fecha": "20260327",
  "cae": "73261934857621",
  "cae_vencimiento": "20260406",
  "importe_total": 60500.00,
  "importe_neto": 50000.00,
  "importe_iva": 10500.00,
  "pdf": "factura_0021_00000015.pdf"
}
```

---

## 6. Seguridad

### Headers HTTP
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (solo HTTPS)
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; ...`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Autenticacion
- JWT en cookie `HttpOnly`, `SameSite=Lax`, `Secure` (HTTPS)
- Expiracion configurable (default 8 horas)
- Passwords hasheados con werkzeug/bcrypt

### CSRF
- POST/PUT/DELETE requieren `Content-Type: application/json` o `X-Requested-With`
- Uploads multipart validan `Referer`
- Endpoints de login/register/logout excluidos

### Rate Limiting
- Blueprint auth: 5 requests/minuto por IP (flask-limiter)

### Encriptacion
- Certificados almacenados con Fernet (AES-128-CBC + HMAC-SHA256)
- Desencriptados solo en memoria, escritos a temp files con permisos 0o600
- Temp files eliminados inmediatamente despues de firmar

### Validacion
- CUIT: checksum mod-11 oficial
- Email: regex
- Montos: Numeric(12,2), validacion positivos
- Fechas: formato YYYYMMDD estricto
- Filenames PDF: regex `^factura_\d{4}_\d{8}\.pdf$`
- Contenido HTML: `escapeHtml()` en todo el frontend

### Multi-tenancy
- Aislamiento por `tenant_id` en todas las queries
- PDFs en directorios separados por tenant
- Cache WSAA separado por CUIT

---

## 7. Variables de Entorno

| Variable | Requerida | Default | Descripcion |
|----------|-----------|---------|-------------|
| SECRET_KEY | Si (prod) | dev-key | Clave para firmar JWT. Min 32 bytes |
| ENCRYPTION_KEY | Si (prod) | - | Clave Fernet para encriptar certificados |
| DATABASE_URL | No | sqlite:///data/facturacion.db | URI SQLAlchemy |
| PDF_DIR | No | ./pdfs | Directorio para PDFs generados |
| JWT_EXPIRATION_HOURS | No | 8 | Horas de vida del token JWT |
| PRODUCTION_ARCA | No | true | true=produccion, false=homologacion |

### Generar claves

```bash
# SECRET_KEY (64 bytes aleatorios)
python -c "import secrets; print(secrets.token_hex(32))"

# ENCRYPTION_KEY (Fernet)
python -c "from crypto import generate_key; print(generate_key().decode())"
```

---

## 8. Deployment

### Docker (recomendado)

```bash
# Build
docker compose build

# Run
docker compose up -d

# Logs
docker compose logs -f app
```

El `Dockerfile` incluye:
- Base `python:3.11-slim` con OpenSSL y curl
- Usuario non-root (`appuser`)
- Health check: `curl -f http://localhost:5000/health`
- Gunicorn con 2 threads y timeout 120s

El `docker-compose.yml` incluye:
- Bind a `127.0.0.1:5000` (requiere reverse proxy para HTTPS)
- Volumen persistente `app_data` para DB y PDFs
- Logging con rotacion (10MB, 3 archivos)
- Variables desde `.env`

### EasyPanel (VPS Hostinger)

1. Crear servicio tipo "App" en proyecto
2. Source: Git repo con Dockerfile
3. Variables de entorno: SECRET_KEY, ENCRYPTION_KEY, PRODUCTION_ARCA=true
4. Dominio: configurar en EasyPanel (ej: `factura.tudominio.com`)
5. Puerto: 5000

### Desarrollo local (Windows)

```bash
# Crear venv
python -m venv venv
venv\Scripts\pip install -r requirements.txt

# Configurar .env
copy .env.example .env
# Editar .env con valores reales

# Iniciar
iniciar.bat
# O directamente:
set PRODUCTION_ARCA=false
venv\Scripts\python app.py
```

**Requisito:** OpenSSL en PATH. Se incluye con Git for Windows:
```
C:\Program Files\Git\mingw64\bin\openssl.exe
```

---

## 9. Servicios ARCA Integrados

### WSAA (Web Service de Autenticacion y Autorizacion)
- **Homologacion:** `https://wsaahomo.afip.gov.ar/ws/services/LoginCms?WSDL`
- **Produccion:** `https://wsaa.afip.gov.ar/ws/services/LoginCms?WSDL`
- Operacion: `LoginCms(in0: base64_cms_signed_tra)`
- Ticket valido 12 horas, cache con margen de 10 minutos

### WSFEv1 (Web Service de Facturacion Electronica v1)
- **Homologacion:** `https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL`
- **Produccion:** `https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL`
- Operaciones:
  - `FECAESolicitar` - Solicitar CAE
  - `FECompUltimoAutorizado` - Ultimo comprobante
  - `FECompConsultar` - Consultar comprobante
  - `FEParamGetTiposCbte` - Tipos de comprobante

### RG 5616 (Condicion IVA Receptor)
Campo `CondicionIVAReceptorId` obligatorio desde 01/06/2026:
- 1 = Responsable Inscripto
- 4 = Exento
- 5 = Consumidor Final
- 6 = Monotributista

---

## 10. Concurrencia y Thread Safety

- **_cae_lock** (wsfe.py): Previene colisiones en numeracion de comprobantes
- **_ticket_lock** (wsaa.py): Previene race conditions en autenticacion WSAA
- **_styles_lock** (pdf_generator.py): Inicializacion thread-safe de estilos PDF
- **SQLite WAL mode**: Permite lecturas concurrentes con busy_timeout=5000ms
- **Gunicorn threads**: 2 threads por worker (compatible con locks)

---

## 11. Dependencias

| Paquete | Version | Uso |
|---------|---------|-----|
| flask | >=3.1 | Framework web |
| flask-sqlalchemy | >=3.1 | ORM |
| flask-limiter | >=3.5 | Rate limiting |
| zeep | >=4.3 | Cliente SOAP para ARCA |
| requests | >=2.31 | HTTP client |
| reportlab | >=4.1 | Generacion de PDFs |
| qrcode[pil] | >=8.0 | Codigos QR (RG 4291) |
| cryptography | >=42.0 | Encriptacion Fernet |
| PyJWT | >=2.8 | Tokens JWT |
| gunicorn | >=22.0 | Servidor WSGI produccion |
