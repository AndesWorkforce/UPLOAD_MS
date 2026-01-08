# Reports Module - Estructura Base

## 📁 Estructura Creada

```
upload_ms/src/
├── reports/
│   ├── dto/
│   │   └── generate-report.dto.ts          ✅ DTO con validaciones
│   ├── interfaces/
│   │   └── realtime-metrics.interface.ts   ✅ Tipos de métricas
│   ├── services/
│   │   ├── adt-client.service.ts           ✅ Cliente HTTP para ADT_MS
│   │   ├── pdf-generator.service.ts        ✅ Generador de PDFs
│   │   └── email.service.ts                ✅ Servicio de emails
│   ├── templates/
│   │   └── report.hbs                      ✅ Template HTML/Handlebars
│   ├── reports.controller.ts               ✅ Endpoints
│   ├── reports.service.ts                  ✅ Orquestador principal
│   └── reports.module.ts                   ✅ Módulo NestJS
└── config/
    └── envs.ts                             ✅ Variables de entorno actualizadas
```

## ✅ Completado

### 1. Dependencias Instaladas
- ✅ `puppeteer`: Generación de PDFs
- ✅ `handlebars`: Templates HTML
- ✅ `nodemailer`: Envío de emails
- ✅ `axios`: Cliente HTTP
- ✅ `class-validator`: Validación de DTOs
- ✅ `class-transformer`: Transformación de datos

### 2. Variables de Entorno
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
SMTP_FROM=reports@andesworkforce.com

# ADT Microservice
ADT_MS_URL=http://localhost:3002
```

### 3. Módulos y Servicios
- ✅ **ReportsModule**: Registrado en AppModule
- ✅ **ReportsController**: 2 endpoints
  - `POST /reports/generate` - Genera y envía reporte (requiere auth)
  - `GET /reports/health` - Health check (público)
- ✅ **ReportsService**: Orquestador principal
- ✅ **AdtClientService**: Consulta métricas de ADT_MS
- ✅ **PdfGeneratorService**: Genera PDFs con Puppeteer
- ✅ **EmailService**: Envía emails con nodemailer

### 4. DTOs y Validaciones
```typescript
GenerateReportDto {
  email: string;           // Required, email válido
  from?: string;          // YYYY-MM-DD
  to?: string;            // YYYY-MM-DD
  name?: string;
  country?: string;
  client_id?: string;
  team_id?: string;
  job_position?: string;
  useCache?: boolean;
}
```

## 🔄 Flujo Implementado

```
1. Cliente → POST /reports/generate
   ↓
2. ReportsService.generateAndSendReport()
   ↓
3. AdtClientService → GET ADT_MS/adt/realtime-metrics
   ↓
4. PdfGeneratorService → Genera PDF con métricas
   ↓
5. S3Service → Sube PDF a AWS S3
   ↓
6. EmailService → Envía email con enlace al PDF
   ↓
7. Retorna { success: true, pdfUrl, metricsCount }
```

## 📋 Próximos Pasos

### 1. Instalar Dependencias
```bash
cd upload_ms
pnpm install
```

### 2. Configurar Variables de Entorno
Editar `.env` y completar:
- `SMTP_USER`: Tu email de Gmail
- `SMTP_PASSWORD`: App Password de Gmail (no tu contraseña normal)
- `ADT_MS_URL`: URL del microservicio ADT (default: http://localhost:3002)

**⚠️ Importante**: Para Gmail, necesitas generar una "App Password":
1. Ve a https://myaccount.google.com/security
2. Activa "2-Step Verification"
3. Ve a "App passwords"
4. Genera una nueva contraseña para "Mail"
5. Usa esa contraseña en `SMTP_PASSWORD`

### 3. Verificar Compilación
```bash
pnpm run build
```

### 4. Ejecutar en Desarrollo
```bash
pnpm run start:dev
```

### 5. Probar Health Check
```bash
curl http://localhost:3006/reports/health
```

## 🧪 Testing

### Test Manual del Endpoint
```bash
# Generar reporte (requiere autenticación)
curl -X POST http://localhost:3006/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "tu-email@gmail.com",
    "from": "2024-12-01",
    "to": "2024-12-17"
  }'
```

## 🎨 Template HTML

El template `report.hbs` incluye:
- ✅ Header con logo y fecha
- ✅ Resumen con métricas agregadas
- ✅ Tabla con métricas por usuario
- ✅ Estilos profesionales
- ✅ Colores según % de actividad
- ✅ Footer con información

## 🚀 Características

### Seguridad
- ✅ Autenticación JWT requerida
- ✅ Roles: Superadmin, TeamAdmin
- ✅ Validación de datos de entrada

### Logging
- ✅ Logs detallados en cada paso
- ✅ Errores capturados y registrados
- ✅ Métricas de ejecución

### Escalabilidad
- ✅ Arquitectura modular
- ✅ Servicios desacoplados
- ✅ Preparado para agregar colas (Bull/Redis)

## 📝 Notas

1. **Puppeteer**: Primera ejecución descarga Chromium (~200MB)
2. **SMTP**: Gmail requiere "App Password", no la contraseña normal
3. **S3**: Los PDFs se guardan en la carpeta `reports/`
4. **ADT_MS**: Debe estar corriendo en el puerto configurado
5. **NATS**: Actualmente no se usa para reportes (solo para auth)

## 🐛 Troubleshooting

### Error: "ADT_MS_URL not configured"
- Verifica que `.env` tenga `ADT_MS_URL=http://localhost:3002`

### Error: "Invalid credentials" (SMTP)
- Usa "App Password" de Gmail, no tu contraseña normal
- Verifica que 2FA esté activado en tu cuenta de Google

### Error: "Cannot find module 'puppeteer'"
- Ejecuta: `pnpm install`

### Error: "AWS S3 credentials missing"
- Verifica que todas las variables `AWS_*` estén en `.env`

## 📚 Referencias

- [Puppeteer Docs](https://pptr.dev/)
- [Nodemailer Docs](https://nodemailer.com/)
- [Handlebars Docs](https://handlebarsjs.com/)
- [NestJS Docs](https://docs.nestjs.com/)
