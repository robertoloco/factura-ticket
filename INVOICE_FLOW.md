# Flujo de Solicitudes de Factura

## Modelo de Negocio

La plataforma actúa como intermediaria entre **clientes** y **empresas proveedoras**:

- **Clientes**: Suben tickets y solicitan facturas
- **Empresas**: Reciben solicitudes, aprueban/rechazan y generan facturas
- **Plataforma**: Valida unicidad de tickets, identifica proveedores, gestiona el flujo

## Flujo Completo

### 1. Cliente solicita factura

```
Cliente sube ticket → OCR extrae datos → Sistema identifica empresa → Cliente confirma → Solicitud creada
```

**Endpoint**: `POST /api/invoices/request`

**Request**:
```json
{
  "ticketImage": "base64...",
  "clientData": {
    "nif": "12345678Z",
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "address": "Calle Principal 123",
    "postalCode": "28001",
    "phone": "612345678"
  }
}
```

**Proceso**:
1. OCR extrae:
   - NIF/CIF de la empresa proveedora
   - Fecha del ticket
   - Importe total
   - Lista de productos/servicios
   
2. Sistema busca empresa por NIF
   - ✅ Si existe → Crea solicitud
   - ❌ Si no existe → Error "Empresa no registrada"

3. Valida ticket único (hash de fecha+importe+companyId)
   - ✅ Si es nuevo → Continúa
   - ❌ Si ya existe → Error "Ticket ya facturado"

4. Crea o actualiza registro de Cliente
   - Si el usuario ya solicitó factura a esa empresa, usa el registro existente
   - Si es nuevo, crea registro de Client

5. Crea Invoice con `status: PENDING`

**Response**:
```json
{
  "invoice": {
    "id": "uuid",
    "status": "PENDING",
    "company": {
      "name": "Mi Empresa SL",
      "nif": "B12345678"
    },
    "totalAmount": 125.50,
    "items": [...]
  },
  "message": "Solicitud enviada a Mi Empresa SL"
}
```

### 2. Empresa revisa solicitudes

**Endpoint**: `GET /api/invoices/pending`

La empresa ve todas las solicitudes pendientes:

```json
{
  "invoices": [
    {
      "id": "uuid",
      "date": "2025-10-30T10:00:00Z",
      "client": {
        "name": "Juan Pérez",
        "nif": "12345678Z",
        "email": "juan@email.com"
      },
      "ticketImageUrl": "https://...",
      "totalAmount": 125.50,
      "items": [
        {
          "description": "Impresión A4 color",
          "quantity": 50,
          "unitPrice": 0.25,
          "totalPrice": 12.50
        }
      ]
    }
  ]
}
```

### 3. Empresa aprueba solicitud

**Endpoint**: `POST /api/invoices/:id/approve`

**Request**:
```json
{
  "items": [
    {
      "description": "Impresión A4 color",
      "quantity": 50,
      "unitPrice": 0.25,
      "totalPrice": 12.50
    }
  ],
  "notes": "Gracias por su compra"
}
```

**Proceso**:
1. Genera número de factura (ej. 2025-001)
2. Actualiza estado a `APPROVED`
3. Genera PDF de la factura
4. Envía email al cliente con PDF adjunto
5. Actualiza estado a `GENERATED`

**Response**:
```json
{
  "invoice": {
    "id": "uuid",
    "number": "2025-001",
    "status": "GENERATED",
    "pdfUrl": "https://..."
  },
  "message": "Factura generada y enviada al cliente"
}
```

### 4. Empresa rechaza solicitud (opcional)

**Endpoint**: `POST /api/invoices/:id/reject`

**Request**:
```json
{
  "reason": "Ticket no pertenece a nuestra empresa"
}
```

**Proceso**:
1. Actualiza estado a `REJECTED`
2. Guarda razón de rechazo
3. Notifica al cliente por email

## Estados de Invoice

```
PENDING   → Solicitud creada, esperando revisión
APPROVED  → Empresa la aprobó, generando PDF
REJECTED  → Empresa la rechazó
GENERATED → PDF generado y enviado al cliente
CANCELLED → Cancelada por el cliente o administrador
```

## Validaciones

### Ticket único
- Hash: `SHA256(ticketDate + ticketAmount + companyId)`
- Índice único en BD: `@@unique([companyId, ticketHash])`

### Empresa identificada por OCR
- El OCR debe extraer el NIF/CIF de la empresa del ticket
- Se busca en BD: `Company.findUnique({ where: { nif } })`
- Si no existe, se rechaza la solicitud

### Cliente auto-gestionado
- El cliente proporciona sus datos (NIF, nombre, dirección)
- Se crea/actualiza automáticamente en la tabla `Client`
- Relación: un Client por cada (Company + NIF)

## Endpoints API

```
# Cliente
POST   /api/invoices/request          # Solicitar factura desde ticket
GET    /api/invoices/my-requests      # Ver mis solicitudes

# Empresa
GET    /api/invoices/pending          # Solicitudes pendientes
GET    /api/invoices/approved         # Facturas aprobadas
POST   /api/invoices/:id/approve      # Aprobar solicitud
POST   /api/invoices/:id/reject       # Rechazar solicitud
GET    /api/invoices/:id/pdf          # Descargar PDF

# Ambos
GET    /api/invoices/:id              # Ver detalle de factura
```

## Notificaciones por Email

### Al cliente:
- ✅ Solicitud recibida
- ✅ Factura aprobada (con PDF adjunto)
- ❌ Solicitud rechazada (con razón)

### A la empresa:
- 📬 Nueva solicitud de factura
- 🔔 Recordatorio de solicitudes pendientes (diario)

## Dashboard

### Vista Cliente
- Mis solicitudes (pendientes, aprobadas, rechazadas)
- Subir nuevo ticket
- Descargar PDFs de facturas generadas

### Vista Empresa
- Solicitudes pendientes (botones: Aprobar/Rechazar)
- Historial de facturas generadas
- Estadísticas (facturas del mes, total facturado)
