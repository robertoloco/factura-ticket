# Configuración de EmailJS

## ⚠️ IMPORTANTE: El error "recipients address is empty"

Este error ocurre porque el template de EmailJS **NO está configurado correctamente**. Necesitas configurar el campo **"To Email"** en tu template.

## 📧 Pasos para Configurar EmailJS

### 1. Crear el Email Service

1. Ve a https://www.emailjs.com/
2. Login con tu cuenta
3. Ve a **Email Services**
4. Haz clic en **Add New Service**
5. Selecciona tu proveedor (Gmail, Outlook, etc.)
6. Conecta tu cuenta y guarda el **Service ID**

### 2. Crear el Email Template (CRÍTICO)

1. Ve a **Email Templates**
2. Haz clic en **Create New Template**
3. **IMPORTANTE**: Configura estos campos:

#### Configuración del Template:

**From Name:**
```
{{from_name}}
```

**From Email:**
```
tu-email@gmail.com
```

**To Email:** ⚠️ **ESTE ES EL MÁS IMPORTANTE**
```
{{to_email}}
```

**To Name:**
```
{{to_name}}
```

**Subject:**
```
Factura {{invoice_number}} - {{from_name}}
```

**Content (Cuerpo del email):**
```
Estimado/a {{to_name}},

Adjuntamos la factura número {{invoice_number}} con fecha {{date}}.

Importe: {{amount}}€

{{message}}

Saludos cordiales,
{{from_name}}
```

### 3. Variables Disponibles

El código envía estas variables al template:

- `{{to_name}}` - Nombre del cliente
- `{{to_email}}` - Email del cliente (CRÍTICO para que funcione)
- `{{from_name}}` - Nombre de tu empresa
- `{{invoice_number}}` - Número de factura
- `{{amount}}` - Importe
- `{{date}}` - Fecha
- `{{message}}` - Mensaje adicional

### 4. Verificación

Después de crear el template:

1. Haz clic en **"Test it"** en el template
2. Rellena los valores de ejemplo
3. Envía un email de prueba
4. Si recibes el email, ¡está configurado correctamente!

### 5. Obtener las Credenciales

Después de configurar todo:

1. **Service ID**: En la lista de Email Services (ej: `service_ghupet9`)
2. **Template ID**: En la lista de Email Templates (ej: `template_qwfj1lw`)
3. **Public Key**: En Account → General → Public Key (ej: `_Boe_Y0g_Eh7f5UzK`)

### 6. Actualizar script.js

Edita el archivo `script.js` y reemplaza estos valores:

```javascript
emailjs: {
    serviceID: 'TU_SERVICE_ID',      // Reemplaza con tu Service ID
    templateID: 'TU_TEMPLATE_ID',    // Reemplaza con tu Template ID
    userID: 'TU_PUBLIC_KEY'          // Reemplaza con tu Public Key
}
```

## 🔒 Limitaciones de EmailJS (Plan Gratuito)

- **200 emails/mes** en el plan gratuito
- Si necesitas más, considera actualizar a un plan de pago

## 🐛 Troubleshooting

### Error: "recipients address is empty"
✅ **Solución**: Asegúrate de que el campo **"To Email"** en el template contenga `{{to_email}}`

### Error: "template not found"
✅ **Solución**: Verifica que el Template ID sea correcto

### Error: "service not found"
✅ **Solución**: Verifica que el Service ID sea correcto

### Emails no llegan
✅ **Solución**: 
1. Revisa la carpeta de spam
2. Verifica que el Email Service esté conectado correctamente
3. Comprueba que tu dominio esté verificado en EmailJS

## 📝 Nota sobre Adjuntos (PDF)

⚠️ **IMPORTANTE**: EmailJS en su plan gratuito **NO soporta adjuntos de archivos grandes**.

La aplicación genera y descarga el PDF localmente, pero el envío por email puede fallar si intentas adjuntar el PDF.

### Alternativa:

Si necesitas enviar PDFs por email, considera:

1. **Usar el plan Pro de EmailJS** (soporta adjuntos)
2. **Usar otro servicio** como SendGrid, Mailgun, etc.
3. **Subir el PDF a un storage** (Google Drive, Dropbox) y enviar solo el link

Por ahora, el email se enviará **sin el PDF adjunto**, solo con los datos de la factura. El PDF se descarga localmente en el navegador del usuario.
