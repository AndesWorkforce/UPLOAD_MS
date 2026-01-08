# Documentación UPLOAD_MS - Microservicio de Almacenamiento y Reportes

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura y Tecnologías](#arquitectura-y-tecnologías)
- [Conexiones y Dependencias](#conexiones-y-dependencias)
- [Estructura del Código](#estructura-del-código)
- [Endpoints y Rutas](#endpoints-y-rutas)
- [Módulo de Reportes (En Desarrollo)](#módulo-de-reportes-en-desarrollo)
- [Integración con AWS S3](#integración-con-aws-s3)
- [Configuración](#configuración)
- [Reglas de Commit](#reglas-de-commit)

---

## Descripción General
**UPLOAD_MS** (Upload Microservice) es un microservicio dedicado al almacenamiento de archivos y generación de reportes de productividad. Sus funciones principales son:

- Almacenar archivos en AWS S3
- Gestionar reportes PDF de métricas de productividad
- Consultar métricas desde ADT_MS/ClickHouse
- Generar reportes PDF dinámicos con filtros (en desarrollo)
- Distribuir reportes por email (en desarrollo)
- Auto-gestionar ciclo de vida de archivos en S3

### Propósito Principal

El microservicio actúa como el punto central de almacenamiento y generación de reportes:

- Almacena archivos de forma persistente en AWS S3
- Genera reportes PDF de métricas de productividad
- Consulta datos desde ADT_MS con filtros dinámicos
- Distribuye reportes a usuarios autorizados
- Gestiona URLs públicas de acceso a archivos

---

## Arquitectura y Tecnologías

### Stack Tecnológico

- **Framework**: NestJS 11.x
- **Lenguaje**: TypeScript 5.7.3
- **Almacenamiento**: AWS S3 (us-east-2)
- **Comunicación**: NATS (configurado, no activo)
- **HTTP Client**: Axios
- **PDF Generator**: Puppeteer (pendiente)
- **Email**: Nodemailer (pendiente)
- **Validación**: Joi, class-validator
- **Gestión de Paquetes**: pnpm

### Patrón de Arquitectura
El microservicio sigue una arquitectura híbrida HTTP + NATS (NATS actualmente inactivo):

```
Cliente HTTP → UPLOAD_MS → AWS S3
                    ↓
                ADT_MS (HTTP) → ClickHouse
                    ↓
                PDF Generator → S3
                    ↓
                Email Service → Usuario
```

### Componentes Principales

- **S3Controller**: Maneja endpoints HTTP de S3
- **S3Service**: Lógica de negocio de almacenamiento
- **ReportsController**: Endpoints de generación de reportes (en desarrollo)
- **ReportsService**: Orquestador de generación de reportes (en desarrollo)
- **AuthGuard**: Validación de JWT
- **RolesGuard**: Control de acceso basado en roles

---

## Conexiones y Dependencias

### Conexiones de Entrada (HTTP)

El microservicio expone los siguientes endpoints HTTP:

| Endpoint | Método | Descripción | Autenticación |
|----------|--------|-------------|---------------|
| `/s3/upload/report` | POST | Subir archivo de reporte manualmente | Público (temporal) |
| `/s3/test-connection` | GET | Verificar conexión con AWS S3 | Público |
| `/reports/generate` | POST | Generar reporte PDF (en desarrollo) | JWT + Roles |
| `/reports/health` | GET | Health check del módulo (en desarrollo) | Público |

### Conexiones de Salida (a ADT_MS)
El microservicio se comunica con ADT_MS mediante HTTP para obtener métricas:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `GET /adt/realtime-metrics` | GET | Obtener métricas en tiempo real con filtros |
| `GET /adt/daily-metrics` | GET | Obtener métricas diarias pre-calculadas |

### Servicios Externos

**AWS S3**: Almacenamiento de archivos
- Bucket: `andes-workforce-s3`
- Región: `us-east-2`

**SMTP**: Envío de emails (pendiente configurar)
- Host: `smtp.gmail.com`
- Puerto: `587`

---

## Estructura del Código


UPLOAD_MS/
├── src/
│   ├── main.ts                    # Punto de entrada (HTTP server)
│   ├── app.module.ts              # Módulo principal
│   ├── s3/                        # Módulo de AWS S3
│   │   ├── s3.controller.ts       # Controlador HTTP
│   │   ├── s3.service.ts          # Servicio de S3
│   │   ├── s3.module.ts           # Módulo de S3
│   │   ├── dto/                   # Data Transfer Objects
│   │   │   ├── create-s3.dto.ts   # DTO de creación (vacío)
│   │   │   └── update-s3.dto.ts   # DTO de actualización (vacío)
│   │   └── entities/              # Entidades
│   │       └── s3.entity.ts       # Entidad S3 (vacía)
│   ├── reports/                   # Módulo de reportes (en desarrollo)
│   │   ├── reports.controller.ts  # Controlador de reportes
│   │   ├── reports.service.ts     # Servicio de reportes
│   │   ├── reports.module.ts      # Módulo de reportes
│   │   ├── dto/                   # DTOs
│   │   │   └── generate-report.dto.ts
│   │   ├── services/              # Servicios especializados
│   │   │   ├── adt-client.service.ts
│   │   │   ├── pdf-generator.service.ts
│   │   │   └── email.service.ts
│   │   ├── templates/             # Templates HTML
│   │   │   └── report.hbs
│   │   └── interfaces/            # Interfaces TypeScript
│   ├── guards/                    # Guards de autenticación
│   │   ├── auth.guard.ts          # Validación JWT
│   │   └── roles.guard.ts         # Validación de roles
│   ├── decorators/                # Decoradores personalizados
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── roles.decorator.ts
│   ├── common/                    # Recursos comunes
│   │   └── enums/
│   │       └── role.enum.ts       # Roles del sistema
│   ├── nats/                      # Módulo NATS (inactivo)
│   │   └── nats.module.ts
│   └── config/                    # Configuración
│       ├── envs.ts                # Variables de entorno
│       ├── index.ts
│       └── logging.ts             # Configuración de logs
├── test/                          # Tests E2E
└── package.json
```

---

## Endpoints y Rutas

### 1. Subir Archivo de Reporte

**Método**: `POST`  
**Ruta**: `/s3/upload/report`  
**Descripción**: Permite subir manualmente archivos de reportes (PDF, Excel, CSV, TXT) a AWS S3.  
**Autenticación**: Público (temporal, cambiar a protegido en producción)

**Headers**:
```http
Content-Type: multipart/form-data
```

**Body (form-data)**:

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `file` | File | Archivo a subir (max 10MB) | ✅ |
| `folder` | String | Carpeta destino en S3 | ❌ |

**Tipos de archivo permitidos**:
- PDF (`.pdf`)
- Excel (`.xlsx`, `.xls`)
- CSV (`.csv`)
- Text (`.txt`)

**Respuesta exitosa (200)**:



```json
{
  "url": "https://andes-workforce-s3.s3.us-east-2.amazonaws.com/reports/uuid.pdf"
}
```

**Errores**:
- `400 Bad Request`: Archivo no proporcionado, tipo no permitido o tamaño excedido
- `500 Internal Server Error`: Error al subir a S3

**Ejemplo con cURL**:



```bash
curl -X POST http://localhost:3006/s3/upload/report \
  -F "file=@report.pdf" \
  -F "folder=reports/2025-12"
```

### 2. Test de Conexión S3

**Método**: `GET`  
**Ruta**: `/s3/test-connection`  
**Descripción**: Verifica la conexión con AWS S3 y lista buckets disponibles.  
**Autenticación**: Público

**Respuesta exitosa (200)**:



```json
{
  "status": "success",
  "message": "Conexión exitosa al servicio de almacenamiento",
  "bucketName": "andes-workforce-s3",
  "bucketsAvailable": 5
}
```

**Respuesta de error**:
```json
{
  "status": "error",
  "message": "Error al conectar con S3"
}
```

**Ejemplo con cURL**:
```bash
curl http://localhost:3006/s3/test-connection
```

### 3. Generar Reporte (En Desarrollo)

**Método**: `POST`  
**Ruta**: `/reports/generate`  
**Descripción**: Genera un reporte PDF de métricas de productividad con filtros dinámicos.  
**Autenticación**: JWT + Roles (Superadmin, TeamAdmin)

**Headers**:
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Body**:
```json
{
  "email": "admin@example.com",
  "from": "2025-12-01",
  "to": "2025-12-15",
  "contractor_id": "clx123abc",     // Opcional
  "name": "John Doe",                // Opcional
  "country": "CO",                   // Opcional
  "client_id": "client_acme",        // Opcional
  "team_id": "team_dev",             // Opcional
  "job_position": "Developer",       // Opcional
  "useCache": true                   // Opcional (default: true)
}
```

**Validaciones**:
- `email`: Requerido, formato de email válido
- `from`: Requerido, formato YYYY-MM-DD
- `to`: Requerido, formato YYYY-MM-DD
- `from` debe ser anterior o igual a `to`
- Máximo 90 días de rango
- No se permiten fechas futuras

**Respuesta exitosa (200)**:



```json
{
  "success": true,
  "pdfUrl": "https://andes-workforce-s3.s3.us-east-2.amazonaws.com/reports/report_2025-12-01_2025-12-15_1734518400.pdf",
  "metricsCount": 25,
  "generatedAt": "2025-12-18T10:30:00Z",
  "duration_ms": 4532
}
```

**Errores**:
- `400 Bad Request`: Validación fallida, datos faltantes o formato incorrecto
- `401 Unauthorized`: Token JWT inválido o expirado
- `403 Forbidden`: Usuario sin permisos (rol no autorizado)
- `500 Internal Server Error`: Error al generar reporte, consultar ADT_MS, o subir a S3

**Proceso**:
1. Validación de JWT y roles
2. Validación de filtros y fechas
3. Consulta a ADT_MS con filtros
4. Preparación de datos para template
5. Renderizado HTML con Handlebars
6. Generación de PDF con Puppeteer
7. Subida a S3
8. Envío de email (opcional)
9. Retorno de URL pública

**Ejemplo con cURL**:
```bash
curl -X POST http://localhost:3006/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "email": "admin@example.com",
    "from": "2025-12-01",
    "to": "2025-12-15",
    "team_id": "team_dev_backend"
  }'
```

### 4. Health Check de Reportes (En Desarrollo)

**Método**: `GET`  
**Ruta**: `/reports/health`  
**Descripción**: Verifica el estado del módulo de reportes.  
**Autenticación**: Público

**Respuesta exitosa (200)**:



```json
{
  "status": "ok",
  "service": "upload_ms:reports",
  "timestamp": "2025-12-18T10:30:00Z"
}
```

---

## Módulo de Reportes (En Desarrollo)

### Filtros Dinámicos

El sistema de reportes soporta múltiples dimensiones de filtrado:

| Filtro | Tipo | Descripción | Requerido |
|--------|------|-------------|--------|
| `from` | String | Fecha inicio (YYYY-MM-DD) | ✅ |
| `to` | String | Fecha fin (YYYY-MM-DD) | ✅ |
| `contractor_id` | String | ID de usuario específico | ❌ |
| `name` | String | Nombre del usuario | ❌ |
| `country` | String | País (CO, PE, MX, etc.) | ❌ |
| `client_id` | String | ID del cliente | ❌ |
| `team_id` | String | ID del equipo | ❌ |
| `job_position` | String | Cargo (QA, Developer, etc.) | ❌ |
| `email` | String | Email para envío del reporte | ❌ |
| `useCache` | Boolean | Usar caché de métricas (default: true) | ❌ | 

### Casos de Uso de Filtros

**Reporte de un usuario específico**:
```json
{
  "email": "admin@example.com",
  "from": "2025-12-01",
  "to": "2025-12-15",
  "contractor_id": "clx123abc"
}
```

**Reporte de un equipo completo**:
```json
{
  "email": "manager@example.com",
  "from": "2025-12-01",
  "to": "2025-12-15",
  "team_id": "team_dev_backend"
}
```

**Reporte por país y cargo**:
```json
{
  "email": "hr@example.com",
  "from": "2025-12-01",
  "to": "2025-12-15",
  "country": "CO",
  "job_position": "QA"
}
```
### Métricas Incluidas en Reportes

**Resumen Agregado**:
```json
{
  "total_contractors": 25,
  "total_work_hours": 1125.5,
  "avg_productivity": 87.3,
  "total_sessions": 450,
  "date_range": "2025-12-01 - 2025-12-15"
}
```

**Métricas por Usuario**:
```json
{
  "contractor_id": "clx123abc",
  "name": "John Doe",
  "country": "CO",
  "client": "Acme Corp",
  "team": "Backend Development",
  "job_position": "Senior Developer",
  
  "total_work_hours": 45.5,
  "total_sessions": 18,
  "avg_session_duration": 2.53,
  
  "total_keyboard_inputs": 125000,
  "total_mouse_clicks": 45000,
  "activity_percentage": 92.5,
  "idle_percentage": 7.5,
  
  "productivity_score": 87.0,
  "total_productive_hours": 39.6,
  "total_unproductive_hours": 5.9,
  
  "top_apps": [
    {
      "app_name": "Visual Studio Code",
      "duration_seconds": 91800,
      "percentage": 55.8
    },
    {
      "app_name": "Chrome",
      "duration_seconds": 43560,
      "percentage": 26.5
    }
  ],
  
  "top_domains": [
    {
      "domain": "github.com",
      "duration_seconds": 28800,
      "percentage": 17.5
    }
  ]
}
```
### Flujo de Generación de Reportes

**1. Solicitud del Reporte**
```
Cliente → POST /reports/generate
```

**2. Validación y Autenticación**
```
AuthGuard → Validar JWT
    ↓
RolesGuard → Verificar rol (Superadmin/TeamAdmin)
    ↓
DTO Validator → Validar formato de fechas y filtros
```

**3. Consulta a ADT_MS**
```
ReportsService → AdtClientService
    ↓
HTTP GET → ADT_MS /adt/realtime-metrics
    ↓
Respuesta: { summary, metrics }
```

**4. Preparación de Datos**
```
ReportsService
    ↓
Formatear números y porcentajes
    ↓
Calcular totales adicionales
    ↓
Ordenar usuarios por productividad
    ↓
Limitar top apps/domains a Top 5
```

**5. Renderizado HTML**
```
PdfGeneratorService
    ↓
Cargar template Handlebars (report.hbs)
    ↓
Inyectar datos de métricas
    ↓
Renderizar HTML completo
```
**6. Generación de PDF**
```
PdfGeneratorService → Puppeteer
    ↓
Iniciar navegador headless
    ↓
Cargar HTML renderizado
    ↓
Configurar formato (A4)
    ↓
Generar PDF buffer
```

**7. Subida a S3**
```
S3Service
    ↓
Generar clave única: reports/YYYY-MM-DD_uuid.pdf
    ↓
Subir buffer a S3
    ↓
Obtener URL pública
```

**8. Envío de Email (Opcional)**
```
EmailService
    ↓
Preparar email HTML
    ↓
Incluir link de descarga del PDF
    ↓
Enviar via Nodemailer (SMTP)
```

**9. Respuesta al Cliente**
```
ReportsService → Cliente
    ↓
{ success, pdfUrl, metricsCount, generatedAt }
```

> **Tiempo total estimado**: 3-8 segundos

---

## Integración con AWS S3

### Configuración del Cliente S3

```typescript
import * as AWS from 'aws-sdk';

AWS.config.update({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
```

### Estructura de Carpetas en S3

```
andes-workforce-s3/
├── reports/                # Reportes generados
│   ├── 2025-12/
│   │   ├── report_2025-12-01_2025-12-15_1734518400.pdf
│   │   └── report_2025-12-10_2025-12-15_1734605000.pdf
│   └── ...
├── pdfs/                   # PDFs manuales
└── documents/              # Otros documentos
```
### Gestión de URLs Públicas

Las URLs de S3 tienen el formato:
```
https://andes-workforce-s3.s3.us-east-2.amazonaws.com/reports/filename.pdf
```

**Consideraciones**:
- URLs son públicas (sin expiración)
- Para mayor seguridad, considerar URLs firmadas con expiración
- Implementar política de ciclo de vida para archivos antiguos

---

## Configuración

### Variables de Entorno

El microservicio requiere las siguientes variables de entorno:

| Variable | Descripción | Ejemplo |
|----------|-------------|------|
| `AWS_REGION` | Región de AWS | `us-east-2` |
| `AWS_S3_BUCKET` | Nombre del bucket S3 | `andes-workforce-s3` |
| `AWS_ACCESS_KEY_ID` | Access Key de AWS | `AKIAYT...` |
| `AWS_SECRET_ACCESS_KEY` | Secret Key de AWS | `Qy57fr...` |
| `PORT` | Puerto del microservicio | `3006` |
| `ENVIRONMENT` | Entorno (development, staging, production) | `development` |
| `DEV_LOGS` | Habilitar logs detallados (true/false) | `true` |
| `NATS_HOST` | Host de NATS (no usado actualmente) | `localhost` |
| `NATS_PORT` | Puerto de NATS (no usado actualmente) | `4222` |
| `NATS_USERNAME` 

Usuario de NATS 

nats_user 

NATS_PASSWORD 

Contraseña de NATS 

nats_pass 

JWT_SECRET_PASSWORD 

Secret para JWT 

andesmetrics 

ADT_MS_URL 

URL del microservicio ADT 

http://localhost:3002 

SMTP_HOST 

Host SMTP (pendiente) 

smtp.gmail.com 

SMTP_PORT 

Puerto SMTP (pendiente) 

587 

SMTP_SECURE 

Usar SSL/TLS (pendiente) 

false 

SMTP_USER 

Usuario SMTP (pendiente) 

reports@andesworkforce.com 

SMTP_PASSWORD 

Contraseña SMTP (pendiente) 

app-password 

SMTP_FROM 

Email remitente (pendiente) 

Andes Workforce <reports@andesworkforce.com> 

### Archivo .env

Ejemplo de archivo `.env`:

```bash
# AWS S3
AWS_REGION=us-east-2
AWS_S3_BUCKET=andes-workforce-s3
AWS_ACCESS_KEY_ID=AKIAYT...
AWS_SECRET_ACCESS_KEY=Qy57fr...

# Server
PORT=3006
ENVIRONMENT=development
DEV_LOGS=true

# NATS (no usado actualmente)
NATS_HOST=72.61.129.234
NATS_PORT=4222
NATS_USERNAME=andes_nats
NATS_PASSWORD=andesworkforce_nats

# Security
JWT_SECRET_PASSWORD=andesmetrics

# Integration
ADT_MS_URL=http://localhost:3002

# Email (pendiente configurar)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=reports@andesworkforce.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Andes Workforce Reports <reports@andesworkforce.com>
```
### Validación con Joi

Las variables de entorno se validan al iniciar usando Joi:

```typescript
import * as Joi from 'joi';

const envSchema = Joi.object({
  AWS_REGION: Joi.string().required().default('us-east-2'),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  PORT: Joi.number().required(),
  ENVIRONMENT: Joi.string()
    .valid('development', 'production', 'staging')
    .default('development'),
  DEV_LOGS: Joi.boolean().default(false),
  JWT_SECRET_PASSWORD: Joi.string().required(),
  ADT_MS_URL: Joi.string().uri().required()
}).unknown(true);
```

> Si falta alguna variable requerida, el servicio no inicia.

### Inicialización

Al iniciar, el microservicio:

1. Valida variables de entorno con Joi
2. Configura cliente AWS S3
3. Verifica credenciales de S3
4. Inicia servidor HTTP en el puerto configurado
5. Activa guards de autenticación y autorización
6. Está listo para recibir requests

Reglas de Commit
El proyecto usa Conventional Commits con Commitlint. Todos los commits deben seguir el formato:



<type>: <subject>
Tipos Permitidos
feat: Nueva funcionalidad

fix: Corrección de bugs

docs: Cambios en documentación

style: Cambios de formato (espacios, comas, etc.)

refactor: Refactorización de código

perf: Mejoras de rendimiento

test: Agregar o modificar tests

build: Cambios en sistema de build

ci: Cambios en CI/CD

chore: Tareas de mantenimiento

revert: Revertir un commit previo

Ejemplos


✅ feat: agregar módulo de generación de reportes
✅ fix: corregir subida de archivos a S3
✅ docs: actualizar documentación de endpoints
✅ refactor: simplificar servicio de PDF
Husky + Lint-staged
El proyecto usa Husky para ejecutar validaciones antes de commit:

Pre-commit: Ejecuta ESLint y Prettier en archivos staged

Commit-msg: Valida formato de commit con Commitlint

---

## Manejo de Errores

### Excepciones HTTP

- **400 Bad Request**: Validación fallida, datos faltantes o formato incorrecto
- **401 Unauthorized**: Token JWT inválido, expirado o ausente
- **403 Forbidden**: Usuario sin permisos (rol no autorizado)
- **500 Internal Server Error**: Errores de S3, ADT_MS, generación de PDF, o base de datos

### Estructura de Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Guards de Autenticación
**AuthGuard**:
- Extrae token JWT del header `Authorization: Bearer <token>`
- Valida firma del token con `JWT_SECRET_PASSWORD`
- Decodifica información del usuario
- Inyecta datos del usuario en el request

**RolesGuard**:
- Verifica roles del usuario autenticado
- Compara con roles permitidos en el endpoint
- Solo permite acceso si el usuario tiene un rol autorizado

### Endpoints Públicos

Para hacer un endpoint público (sin autenticación):

```typescript
@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```
---

## Performance

### Optimizaciones Actuales

- **Validación con Joi**: Validación eficiente al iniciar
- **Índices de AWS S3**: Acceso rápido a archivos por ruta
- **Logs condicionales**: Solo logs detallados en desarrollo
- **Caché de ADT_MS**: Las métricas tienen caché de 30s

### Optimizaciones Futuras (Módulo de Reportes)

- **Caché de templates**: Templates Handlebars compilados en memoria
- **Pool de Puppeteer**: Reutilizar instancias de navegador
- **Compresión de PDFs**: Reducir tamaño de archivos
- **Queue system**: Bull/BullMQ para reportes pesados

Redis cache: Cachear reportes generados

### Consideraciones

- **Timers de Puppeteer**: Inicialización puede tardar 1-2s
- **Volumen de archivos**: S3 puede manejar millones de archivos
- **Latencia de ADT_MS**: Depende del rango de fechas consultado
- **Tamaño de PDFs**: Considerar límite de 10MB para uploads

---

## Scripts y Utilidades

### Scripts NPM

```bash
# Desarrollo
pnpm start:dev          # Inicia en modo watch
pnpm start:debug        # Inicia en modo debug

# Producción
pnpm build              # Compila TypeScript
pnpm start:prod         # Inicia versión compilada

# Testing
pnpm test               # Ejecuta tests unitarios
pnpm test:e2e           # Ejecuta tests e2e
pnpm test:cov           # Tests con cobertura

# Calidad de código
pnpm lint               # Ejecuta ESLint
pnpm format             # Formatea con Prettier
```
---

## Notas Adicionales

### Dependencia de ADT_MS

UPLOAD_MS depende de ADT_MS para:
- Consultar métricas de productividad (realtime-metrics, daily-metrics)
- Obtener datos de ClickHouse con filtros

> **Importante**: Si ADT_MS no está disponible, el módulo de reportes no puede funcionar.

### Estado del Módulo de Reportes

El módulo de reportes está documentado pero **no implementado**. Requiere:

1. Instalar dependencias: `handlebars`, `nodemailer`, `@types/handlebars`, `@types/nodemailer`
2. Crear estructura de carpetas y módulos
3. Implementar servicios (AdtClientService, PdfGeneratorService, EmailService)
4. Crear templates HTML
5. Configurar SMTP para envío de emails
6. Tests E2E completos

> **Tiempo estimado de implementación**: 10-14 días

### Seguridad en Producción

**Cambiar endpoints públicos a protegidos**:
- `/s3/upload/report` debe requerir autenticación
- Configurar URLs firmadas de S3 con expiración
- Implementar rate limiting para prevenir abuso
- Auditoría de quién genera qué reportes
- Validar tamaño máximo de reportes generados

**Implementar políticas de ciclo de vida en S3**:
- Mover archivos antiguos a S3 Glacier después de 30 días
- Eliminar archivos después de 90 días
- Backups periódicos del bucket S3

---

## Roadmap

### Q1 2026 - Módulo de Reportes
- Implementar cliente ADT_MS
- Integrar Puppeteer y Handlebars
- Crear templates de reportes
- Implementar generador de PDFs
- Configurar envío de emails
- Tests E2E completos

### Q2 2026 - Optimizaciones
- Caché distribuido con Redis
- Queue system para reportes pesados
- Monitoreo con Prometheus
- Compresión de PDFs

### Q3 2026 - Features Avanzadas
- Reportes programados (cron jobs)
- Múltiples formatos (Excel, CSV)
- Templates personalizados por cliente
- Dashboard de reportes generados
- Análisis de uso de reportes