# Librerías JavaScript

Este directorio debe contener las siguientes librerías JavaScript:

## 📦 Archivos necesarios

### 1. **tesseract.min.js** (Tesseract.js - OCR)
- **URL de descarga**: https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js
- **Cómo obtenerlo**: 
  - Visita el enlace anterior
  - Guarda el archivo como `tesseract.min.js` en esta carpeta
- **Tamaño aproximado**: ~2MB

### 2. **jspdf.umd.min.js** (jsPDF - Generación de PDF)
- **URL de descarga**: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
- **Cómo obtenerlo**:
  - Visita el enlace anterior
  - Guarda el archivo como `jspdf.umd.min.js` en esta carpeta
- **Tamaño aproximado**: ~800KB

### 3. **email.min.js** (EmailJS - Envío de correos)
- **URL de descarga**: https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js
- **Cómo obtenerlo**:
  - Visita el enlace anterior
  - Guarda el archivo como `email.min.js` en esta carpeta
- **Tamaño aproximado**: ~20KB

## 🚀 Descarga rápida con PowerShell

Ejecuta estos comandos en PowerShell desde el directorio raíz del proyecto:

```powershell
# Descargar Tesseract.js
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js" -OutFile "libs/tesseract.min.js"

# Descargar jsPDF
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" -OutFile "libs/jspdf.umd.min.js"

# Descargar EmailJS
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js" -OutFile "libs/email.min.js"
```

## ✅ Verificación

Después de descargar, deberías tener estos archivos:
```
libs/
├── README.md (este archivo)
├── tesseract.min.js
├── jspdf.umd.min.js
└── email.min.js
```

## 📝 Notas

- Estas librerías permiten que la aplicación funcione completamente offline (después de la primera carga)
- Si prefieres usar CDNs, puedes modificar el `index.html` para cargar las librerías directamente desde internet
- Las versiones especificadas son las recomendadas y probadas con esta aplicación
