# Validación de Tickets Únicos

## Objetivo
Evitar que se facturen múltiples veces el mismo ticket mediante la validación de unicidad basada en:
- **Fecha del ticket** extraída por OCR
- **Importe total del ticket** extraído por OCR

## Implementación

### 1. Campos en la base de datos (Invoice)
```prisma
ticketDate    DateTime?  // Fecha del ticket escaneado
ticketAmount  Float?     // Importe del ticket
ticketHash    String?    @unique // Hash de fecha+importe para evitar duplicados
ticketImageUrl String?   // URL de la imagen del ticket

@@unique([companyId, ticketHash]) // Un ticket único por empresa
```

### 2. Flujo de validación

#### Al crear una factura desde un ticket:

1. **OCR extrae datos del ticket**:
   - Fecha del ticket
   - Importe total

2. **Generar hash único**:
   ```javascript
   import crypto from 'crypto';
   
   const generateTicketHash = (date, amount, companyId) => {
     const data = `${date.toISOString()}_${amount}_${companyId}`;
     return crypto.createHash('sha256').update(data).digest('hex');
   };
   ```

3. **Validar antes de crear**:
   ```javascript
   const existingInvoice = await prisma.invoice.findFirst({
     where: {
       companyId,
       ticketHash: generatedHash
     }
   });
   
   if (existingInvoice) {
     throw new Error('Este ticket ya ha sido facturado');
   }
   ```

4. **Crear factura con datos del ticket**:
   ```javascript
   const invoice = await prisma.invoice.create({
     data: {
       // ... otros campos
       ticketDate: extractedDate,
       ticketAmount: extractedAmount,
       ticketHash: generatedHash,
       ticketImageUrl: uploadedImageUrl
     }
   });
   ```

### 3. Consideraciones

- **Tolerancia de errores OCR**: Si el OCR puede tener pequeñas variaciones en el importe (ej. 12.50 vs 12.49), considerar redondear o usar un umbral de tolerancia.

- **Tickets sin fecha**: Si un ticket no tiene fecha legible, usar solo el importe + timestamp actual como alternativa.

- **Múltiples empresas**: El hash incluye `companyId`, por lo que diferentes empresas pueden facturar el mismo ticket (caso de proveedores compartidos).

## API Endpoint

```javascript
POST /api/invoices/from-ticket
Content-Type: multipart/form-data

{
  ticketImage: File,
  clientId: String,
  // otros campos opcionales
}

Response:
{
  invoice: { ... },
  ocrData: {
    date: "2025-10-30",
    amount: 125.50,
    items: [...]
  }
}

Error (409 Conflict):
{
  error: "Este ticket ya ha sido facturado",
  existingInvoice: { id, number, date }
}
```

## Testing

### Casos de prueba:
1. ✅ Crear factura desde ticket nuevo
2. ❌ Intentar crear factura desde mismo ticket
3. ✅ Crear factura desde ticket con mismo importe pero diferente fecha
4. ✅ Crear factura desde ticket con misma fecha pero diferente importe
5. ✅ Dos empresas diferentes pueden facturar el mismo ticket

### Prueba manual:
```bash
# Primera vez (debe funcionar)
curl -X POST http://localhost:3000/api/invoices/from-ticket \
  -F "ticketImage=@ticket.jpg" \
  -F "clientId=abc123" \
  -H "Authorization: Bearer TOKEN"

# Segunda vez con mismo ticket (debe fallar)
curl -X POST http://localhost:3000/api/invoices/from-ticket \
  -F "ticketImage=@ticket.jpg" \
  -F "clientId=abc123" \
  -H "Authorization: Bearer TOKEN"
```
