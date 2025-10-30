# 📝 Próximos Pasos - Sistema de Facturación

## ✅ Completado (Backend)

- ✅ Base de datos PostgreSQL (Prisma schema)
- ✅ Autenticación JWT (register, login, me)
- ✅ CRUD completo de clientes
- ✅ Sistema de facturas (crear, listar, numeración automática, enviar por email)
- ✅ Generación de PDF con jsPDF
- ✅ Envío de emails con Nodemailer + Gmail
- ✅ OCR para extracción de datos de tickets
- ✅ API REST completa y funcional

## ⏳ Pendiente (Frontend)

### 1. Instalar dependencias adicionales del frontend

```bash
cd frontend
npm install axios react-router-dom @heroicons/react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Configurar TailwindCSS

Editar `frontend/tailwind.config.js`:
```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 3. Crear estructura de carpetas

```
frontend/src/
├── components/      # Componentes reutilizables
│   ├── Layout.jsx
│   ├── Navbar.jsx
│   └── PrivateRoute.jsx
├── pages/          # Páginas principales
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Clients.jsx
│   └── Invoices.jsx
├── services/       # API calls
│   └── api.js
├── context/        # Context API
│   └── AuthContext.jsx
├── App.jsx
└── main.jsx
```

### 4. Crear componentes principales

- **AuthContext**: Manejo de autenticación global
- **Layout**: Estructura común con navbar
- **Login/Register**: Formularios de autenticación
- **Dashboard**: Vista principal con estadísticas
- **Clients**: Lista y formulario de clientes
- **Invoices**: Crear factura con OCR, lista de facturas

### 5. Despliegue en Railway

#### Backend:
1. Crear cuenta en https://railway.app/
2. New Project → Deploy from GitHub repo
3. Seleccionar el repositorio
4. Railway detectará automáticamente Node.js
5. Añadir PostgreSQL database:
   - Add Service → Database → PostgreSQL
   - Railway generará `DATABASE_URL` automáticamente
6. Configurar variables de entorno en Railway:
   ```
   DATABASE_URL (auto-generado por Railway)
   JWT_SECRET=tu-secret-key-muy-seguro
   GMAIL_USER=tu-email@gmail.com
   GMAIL_APP_PASSWORD=tu-app-password-de-gmail
   OCR_API_KEY=K88796806988957
   NODE_ENV=production
   FRONTEND_URL=https://tu-dominio-railway.app
   ```
7. Añadir build command en Railway settings:
   ```
   cd backend && npm install && npx prisma generate && npx prisma db push
   ```
8. Start command:
   ```
   cd backend && npm start
   ```

#### Frontend:
1. En el mismo proyecto Railway, Add Service → GitHub Repo
2. Build command:
   ```
   cd frontend && npm install && npm run build
   ```
3. Start command:
   ```
   cd frontend && npm run preview
   ```
4. Variables de entorno:
   ```
   VITE_API_URL=https://tu-backend-railway.app/api
   ```

## 🔐 Configuración de Gmail para Emails

1. Ir a https://myaccount.google.com/
2. Security → 2-Step Verification (activar)
3. Security → App passwords
4. Crear nueva App password para "Mail"
5. Copiar el password generado (16 caracteres)
6. Usar ese password en `GMAIL_APP_PASSWORD`

## 📊 Estado del Proyecto

**Backend**: 100% funcional ✅
**Frontend**: 0% (por crear)
**Despliegue**: Pendiente

## 🚀 Siguientes Pasos Inmediatos

1. Completar frontend React
2. Testear integración frontend-backend localmente
3. Desplegar en Railway
4. Pruebas end-to-end

## 💰 Costos (Plan Gratuito Railway)

- 500 horas/mes de ejecución
- PostgreSQL incluido
- $0/mes si no excedes el uso
- Suficiente para desarrollo y uso personal

## 📞 Soporte

Para dudas sobre el despliegue, consultar:
- Railway Docs: https://docs.railway.app/
- Prisma Docs: https://www.prisma.io/docs
