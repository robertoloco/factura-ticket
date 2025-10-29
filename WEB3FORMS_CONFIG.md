# Configuración de Web3Forms

## ¿Qué es Web3Forms?

Web3Forms es un servicio **100% GRATUITO** para enviar emails desde formularios web. Es mucho más sencillo que EmailJS y **SÍ soporta adjuntos (PDFs)**.

## ✅ Ventajas sobre EmailJS

- ✅ **Completamente gratis** (sin límites de emails)
- ✅ **Soporta adjuntos** de archivos (PDFs incluidos)
- ✅ **Super sencillo de configurar** (solo necesitas un Access Key)
- ✅ **No requiere verificación de dominio**
- ✅ **Sin límites de templates**

## 📧 Pasos para Configurar

### 1. Obtener tu Access Key

1. Ve a https://web3forms.com/
2. En la página principal, verás un campo **"Your Email"**
3. Escribe tu email (ej: `almelaroberto26@gmail.com`)
4. Haz clic en **"Get Access Key"**
5. **Recibirás un email** con tu Access Key

### 2. Copiar el Access Key

El Access Key se verá algo así:
```
abcd1234-5678-90ef-ghij-klmnopqrstuv
```

### 3. Actualizar script.js

Edita el archivo `script.js` y reemplaza en la línea 10:

```javascript
web3formsKey: 'TU_WEB3FORMS_ACCESS_KEY',
```

Por:

```javascript
web3formsKey: 'abcd1234-5678-90ef-ghij-klmnopqrstuv',  // Tu Access Key real
```

### 4. ¡Listo!

No necesitas hacer nada más. Los emails se enviarán automáticamente con:
- ✅ Asunto: `Factura XXXX-001 - Tu Empresa`
- ✅ Destinatario: El email del cliente que escribiste en el formulario
- ✅ Adjunto: El PDF de la factura
- ✅ Contenido: Datos de la factura formateados profesionalmente

## 📝 Cómo Funcionan los Emails

### Los emails se enviarán a:
1. **Email del cliente** (el que escribiste en el formulario)
2. **Tu email** (una copia también se envía a ti automáticamente)

### El email incluirá:
```
Asunto: Factura 2025-001 - Copisteria CADAFAL S.L.

Estimado/a [Nombre del Cliente],

Adjuntamos la factura número 2025-001 con fecha 29/10/2025.

Detalles:
- Número de Factura: 2025-001
- Importe: 50.00€
- Concepto: Servicios de impresión

Saludos cordiales,
Copisteria CADAFAL S.L.
almelaroberto26@gmail.com
+34 912 345 678

[PDF Adjunto: Factura_2025-001.pdf]
```

## 🔒 Características de Seguridad

### Spam Protection
Web3Forms incluye protección anti-spam integrada:
- ✅ reCAPTCHA invisible (opcional)
- ✅ Honeypot protection
- ✅ Rate limiting automático

### Sin exponer tu email
Tu email personal está protegido. Los clientes reciben el email de `no-reply@web3forms.com` pero el remitente muestra tu empresa.

## 🆚 Comparación: Web3Forms vs EmailJS

| Característica | Web3Forms | EmailJS |
|---------------|-----------|---------|
| **Precio** | ✅ Gratis ilimitado | ⚠️ 200 emails/mes gratis |
| **Adjuntos** | ✅ Sí (hasta 5MB) | ❌ No en plan gratis |
| **Configuración** | ✅ 1 minuto | ⚠️ 10+ minutos |
| **Templates** | ✅ En código | ⚠️ Crear en dashboard |
| **Facilidad** | ✅ Super fácil | ⚠️ Complejo |

## 🐛 Troubleshooting

### Error: "Invalid Access Key"
✅ **Solución**: Verifica que copiaste correctamente el Access Key desde tu email

### Emails no llegan
✅ **Solución**: 
1. Revisa la carpeta de spam
2. Verifica que el email del cliente esté bien escrito
3. Espera 1-2 minutos (a veces hay delay)

### El PDF no se adjunta
✅ **Solución**: 
- Asegúrate de que el PDF sea menor a 5MB
- Web3Forms soporta adjuntos automáticamente, no requiere configuración extra

### No recibo copia del email
✅ **Solución**: 
- Por defecto, Web3Forms envía al email del cliente
- Si quieres recibir copia, puedes añadir tu email en CC configurando un webhook

## 📚 Documentación Oficial

Para más información: https://docs.web3forms.com/

## 💡 Tips

1. **Guarda tu Access Key**: Anótalo en un lugar seguro
2. **Un Access Key por proyecto**: Puedes crear múltiples Access Keys si tienes varios proyectos
3. **Revisa el dashboard**: En https://web3forms.com/dashboard puedes ver estadísticas de tus emails
4. **Sin límites**: No hay límite de emails, envía todos los que necesites

## 🎯 Resumen

Con Web3Forms, enviar emails con PDFs adjuntos es **ridículamente fácil**:
1. Obtén Access Key (1 minuto)
2. Pégalo en `script.js`
3. ¡Listo! Ya funciona

No más configuraciones complejas, no más límites, no más problemas con adjuntos.
