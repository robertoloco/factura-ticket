# 📄 Generador de Facturas con OCR

Aplicación web para generar facturas automáticamente a partir de tickets usando OCR (reconocimiento óptico de caracteres), con envío por email y almacenamiento en base de datos.

## 🚀 Características

- ✅ **OCR de Tickets**: Extrae texto de imágenes con OCR.space API (25,000 requests/mes gratis)
- ✅ **Generación de PDF**: Crea facturas profesionales en PDF con jsPDF
- ✅ **Envío por Email**: Envía facturas con PDF adjunto usando Web3Forms (GRATIS, ilimitado)
- ✅ **Base de Datos**: Guarda registros en Baserow (alternativa open-source a Airtable)
- ✅ **Numeración Automática**: Números de factura correlativos generados automáticamente
- ✅ **Autocompletado**: El OCR rellena automáticamente importe y concepto
- ✅ **Sin Backend**: 100% cliente, funciona en navegador
- ✅ **GitHub Pages**: Listo para desplegar en GitHub Pages

## 📁 Estructura del Proyecto

```
factura-ticket/
├── index.html           # Interfaz principal
├── style.css           # Estilos de la aplicación
├── script.js           # Lógica de la aplicación
├── libs/               # Librerías JavaScript
│   ├── tesseract.min.js
│   ├── jspdf.umd.min.js
│   └── email.min.js
└── README.md
```

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/factura-ticket.git
cd factura-ticket
```

### 2. Configurar servicios externos

Necesitas configurar tres servicios (todos gratuitos):

## ⛙️ Configuración

### 1️⃣ OCR.space API (OCR gratuito)

✅ **Ya está configurado** - La aplicación usa una API key gratuita que ya viene incluida.

- **Límite**: 25,000 requests/mes
- **Velocidad**: 3-5 segundos por imagen
- **Idioma**: Español configurado automáticamente

Si quieres tu propia API key (opcional):
1. Ve a https://ocr.space/ocrapi
2. Registra tu email
3. Recibirás tu API key gratuita
4. Reemplázala en `script.js` línea 7

### 2️⃣ Web3Forms (Envío de emails con PDF)

1. Ve a https://web3forms.com/
2. Escribe tu email en "Your Email"
3. Haz clic en "Get Access Key"
4. Recibirás un email con tu Access Key
5. Copia el Access Key (formato: `abcd1234-5678-90ef-ghij-klmnopqrstuv`)

📄 **Lee el archivo `WEB3FORMS_CONFIG.md` para instrucciones detalladas**

**Características:**
- ✅ Completamente GRATIS e ilimitado
- ✅ Soporta adjuntos de PDF (hasta 5MB)
- ✅ Super fácil de configurar (solo 1 minuto)
- ✅ No requiere templates complejos

### 🗄️ Baserow (Base de datos)

1. Crea una cuenta en [Baserow](https://baserow.io/) (gratuita)
2. Crea una nueva tabla con estas columnas:
   - `Numero Factura` (Texto)
   - `Fecha` (Texto)
   - `Cliente` (Texto)
   - `NIF` (Texto)
   - `Email` (Email)
   - `Importe` (Número)
   - `Total con IVA` (Número)
   - `Concepto` (Texto largo)
3. Obtén tus credenciales:
   - **API Token**: Settings → API tokens → Generate token
   - **Table ID**: En la URL de tu tabla: `https://baserow.io/database/XXXX/table/12345`
     - El `12345` es tu Table ID

### 🔐 Configurar `script.js`

Edita `script.js` y reemplaza estos valores en la sección `CONFIG`:

```javascript
const CONFIG = {
    emailjs: {
        serviceID: 'service_abc123',      // Tu Service ID de EmailJS
        templateID: 'template_xyz789',    // Tu Template ID de EmailJS
        userID: 'user_xyz123abc456'       // Tu Public Key de EmailJS
    },
    
    baserow: {
        apiToken: 'wJalrXUtnFEMI/K7MD...',  // Tu API Token de Baserow
        tableID: '12345',                    // Tu Table ID de Baserow
        apiURL: 'https://api.baserow.io'
    },

    company: {
        name: 'TU EMPRESA S.L.',
        nif: 'B12345678',
        address: 'Calle Principal 123, 28001 Madrid',
        email: 'facturacion@tuempresa.com',
        phone: '+34 912 345 678'
    }
};
```

## 🌐 Desplegar en GitHub Pages

1. Sube el código a GitHub:
```bash
git add .
git commit -m "Configurar aplicación de facturas"
git push origin main
```

2. Activa GitHub Pages:
   - Ve a Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` → `/root`
   - Guarda

3. Tu aplicación estará disponible en:
   `https://TU_USUARIO.github.io/factura-ticket/`

## 📖 Uso

1. **Subir ticket**: Selecciona una imagen de un ticket
2. **Extraer texto**: Haz clic en "Extraer Texto con OCR"
3. **Rellenar datos**: Completa el formulario con los datos del cliente
4. **Generar factura**: Haz clic en "Generar y Enviar Factura"

La aplicación:
- ✅ Generará un PDF de la factura
- ✅ Enviará el PDF por email al cliente
- ✅ Guardará los datos en Baserow
- ✅ Descargará el PDF localmente

## 🛠️ Tecnologías

- **HTML5, CSS3, JavaScript** (Vanilla)
- **OCR.space API** - OCR gratuito y rápido
- **jsPDF** v2.5.1 - Generación de PDF
- **Web3Forms** - Envío de emails con adjuntos (GRATIS)
- **Baserow API** - Base de datos

## 🔒 Seguridad

⚠️ **IMPORTANTE**: Dado que esta aplicación corre en el navegador, las credenciales API son visibles en el código fuente. Considera:

1. **EmailJS**: Limita tu dominio en la configuración de EmailJS
2. **Baserow**: Usa tokens con permisos limitados (solo escritura en la tabla de facturas)
3. **Producción**: Para uso profesional, considera implementar un backend

## 🐛 Solución de Problemas

### Error de CORS en Baserow
- Verifica que tu API token sea correcto
- Asegúrate de que el Table ID coincida

### Emails no se envían
- Verifica las credenciales de EmailJS
- Comprueba que el template tenga los parámetros correctos
- Revisa la consola del navegador para errores

### OCR no funciona
- Usa imágenes claras y de buena calidad
- El OCR funciona mejor con texto horizontal
- Tesseract puede tardar varios segundos en procesar

## 📝 Licencia

MIT License - Libre para uso personal y comercial

## 👤 Autor

Roberto Almela López

---

**¿Preguntas?** Abre un [issue](https://github.com/TU_USUARIO/factura-ticket/issues) en GitHub
