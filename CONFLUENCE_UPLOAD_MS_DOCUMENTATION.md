Documentación UPLOAD_MS - Microservicio de Almacenamiento y Reportes

📋 Tabla de Contenidos
Descripción General

Arquitectura y Tecnologías

Conexiones y Dependencias

Estructura del Código

Endpoints y Rutas

Módulo de Reportes (En Desarrollo)

Integración con AWS S3

Base de Datos

Configuración

Reglas de Commit

Descripción General
UPLOAD_MS (Upload Microservice) es un microservicio dedicado al almacenamiento de archivos y generación de reportes de productividad. Sus funciones principales son:

Almacenar archivos en AWS S3

Gestionar reportes PDF de métricas de productividad

Consultar métricas desde ADT_MS/ClickHouse

Generar reportes PDF dinámicos con filtros

Distribuir reportes por email (en desarrollo)

Auto-gestionar ciclo de vida de archivos en S3

Propósito Principal
El microservicio actúa como el punto central de almacenamiento y generación de reportes:

Almacena archivos de forma persistente en AWS S3

Genera reportes PDF de métricas de productividad

Consulta datos desde ADT_MS con filtros dinámicos

Distribuye reportes a usuarios autorizados

Gestiona URLs públicas de acceso a archivos

Arquitectura y Tecnologías

Stack Tecnológico
Framework: NestJS 11.x

Lenguaje: TypeScript 5.7.3

Almacenamiento: AWS S3 (us-east-2)

Comunicación: NATS (configurado, no activo)

HTTP Client: Axios

PDF Generator: Puppeteer (pendiente instalación)

Email: Nodemailer (pendiente instalación)

Validación: Joi, class-validator

Gestión de Paquetes: pnpm

Patrón de Arquitectura
El microservicio sigue una arquitectura híbrida HTTP + NATS (NATS actualmente inactivo):



Cliente HTTP → UPLOAD_MS → AWS S3
                    ↓
                ADT_MS (HTTP) → ClickHouse
                    ↓
                PDF Generator → S3
                    ↓
                Email Service → Usuario
Componentes Principales
S3Controller: Maneja endpoints HTTP de S3

S3Service: Lógica de negocio de almacenamiento

ReportsController: Endpoints de generación de reportes (en desarrollo)

ReportsService: Orquestador de generación de reportes (en desarrollo)

AuthGuard: Validación de JWT

RolesGuard: Control de acceso basado en roles

---

## 📁 Estructura del Proyecto

{expand:title=Ver estructura completa}
```
upload_ms/
├── src/
│   ├── config/                    # Configuración y variables de entorno
│   │   ├── envs.ts               # Validación con Joi
│   │   ├── index.ts              # Exports
│   │   └── logging.ts            # Configuración de logs
│   │
│   ├── s3/                       # Módulo AWS S3
│   │   ├── s3.controller.ts      # Endpoints HTTP
│   │   ├── s3.service.ts         # Lógica de negocio S3
│   │   ├── s3.module.ts          # Módulo NestJS
│   │   ├── dto/                  # Data Transfer Objects
│   │   └── entities/             # Entidades del dominio
│   │
│   ├── guards/                   # Seguridad
│   │   ├── auth.guard.ts         # Autenticación JWT
│   │   └── roles.guard.ts        # Autorización por roles
│   │
│   ├── decorators/               # Decoradores custom
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── roles.decorator.ts
│   │
│   ├── common/                   # Recursos compartidos
│   │   └── enums/
│   │       └── role.enum.ts      # Roles: Superadmin, TeamAdmin
│   │
│   ├── nats/                     # Módulo NATS (inactivo)
│   │   └── nats.module.ts
│   │
│   ├── app.module.ts             # Módulo raíz
│   └── main.ts                   # Bootstrap de la aplicación
│
├── test/                         # Tests E2E
├── .env                          # Variables de entorno
├── package.json                  # Dependencias
└── tsconfig.json                 # Configuración TypeScript
```
{expand}

---

## ⚙️ Configuración

### Variables de Entorno

{warning:title=Credenciales Sensibles}
Las siguientes variables contienen información sensible. **NO** commitear en Git.
Usar `.env.example` como referencia.
{warning}

#### AWS S3 Configuration

||Variable||Descripción||Valor por Defecto||Requerido||
|AWS_REGION|Región de AWS|us-east-2|✅|
|AWS_S3_BUCKET|Nombre del bucket S3|andes-workforce-s3|✅|
|AWS_ACCESS_KEY_ID|Access Key de AWS|-|✅|
|AWS_SECRET_ACCESS_KEY|Secret Key de AWS|-|✅|

#### Server Configuration

||Variable||Descripción||Valor por Defecto||Requerido||
|PORT|Puerto del servidor|3006|✅|
|ENVIRONMENT|Entorno de ejecución|development|✅|
|DEV_LOGS|Habilitar logs detallados|false|❌|

#### NATS Configuration (Inactivo)

||Variable||Descripción||Valor por Defecto||Requerido||
|NATS_HOST|Host del servidor NATS|72.61.129.234|✅|
|NATS_PORT|Puerto de NATS|4222|✅|
|NATS_USERNAME|Usuario de NATS|andes_nats|✅|
|NATS_PASSWORD|Contraseña de NATS|-|✅|

#### Security

||Variable||Descripción||Valor por Defecto||Requerido||
|JWT_SECRET_PASSWORD|Secret para JWT|andesmetrics|✅|

#### Integration

||Variable||Descripción||Valor por Defecto||Requerido||
|ADT_MS_URL|URL del microservicio ADT|http://localhost:3002|✅|

### Ejemplo de .env

{code:bash}
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
{code}

---

## 🚀 Instalación y Ejecución

### Requisitos Previos

- Node.js 18+ o 20+
- pnpm instalado globalmente
- Credenciales de AWS S3 configuradas
- Acceso al servidor NATS (si se habilita)

### Instalación

{code:bash}
# 1. Clonar el repositorio (si aplica)
cd upload_ms

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Verificar compilación
pnpm run build
{code}

### Ejecución

{panel:title=Comandos Disponibles|borderStyle=solid}

**Desarrollo (con hot-reload):**
{code:bash}
pnpm run start:dev
{code}

**Producción:**
{code:bash}
pnpm run build
pnpm run start:prod
{code}

**Tests:**
{code:bash}
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Coverage
pnpm run test:cov
{code}

**Linting:**
{code:bash}
pnpm run lint
{code}

{panel}

---

## 🔌 API Endpoints

### S3 Module

#### POST /s3/upload/report

{tip:title=Endpoint de Subida de Reportes}
Permite subir manualmente archivos de reportes (PDF, Excel, CSV, TXT)
{tip}

**Autenticación:** Público (para testing) - Cambiar a protegido en producción

**Headers:**
{code}
Content-Type: multipart/form-data
{code}

**Body (form-data):**
||Campo||Tipo||Descripción||Requerido||
|file|File|Archivo a subir (max 10MB)|✅|
|folder|String|Carpeta destino en S3|❌|

**Tipos de archivo permitidos:**
- PDF (`.pdf`)
- Excel (`.xlsx`, `.xls`)
- CSV (`.csv`)
- Text (`.txt`)

**Respuesta exitosa (200):**
{code:json}
{
  "url": "https://andes-workforce-s3.s3.us-east-2.amazonaws.com/reports/uuid.pdf"
}
{code}

**Ejemplo con cURL:**
{code:bash}
curl -X POST http://localhost:3006/s3/upload/report \
  -F "file=@report.pdf" \
  -F "folder=reports/2025-12"
{code}

---

#### GET /s3/test-connection

{info:title=Health Check de S3}
Verifica la conexión con AWS S3
{info}

**Autenticación:** Público

**Respuesta exitosa (200):**
{code:json}
{
  "status": "success",
  "message": "Conexión exitosa al servicio de almacenamiento",
  "bucketName": "andes-workforce-s3",
  "bucketsAvailable": 5
}
{code}

**Ejemplo con cURL:**
{code:bash}
curl http://localhost:3006/s3/test-connection
{code}

---

## 🎯 Sistema de Reportes (En Desarrollo)

{warning:title=Módulo en Desarrollo}
El módulo de reportes está **planificado pero no implementado**. Esta sección describe la arquitectura propuesta.
{warning}

### Visión General

El sistema de generación de reportes permitirá:
- ✅ Consultar métricas desde ADT_MS/ClickHouse
- ✅ Aplicar filtros dinámicos (fechas, usuarios, equipos, clientes)
- ✅ Generar PDFs profesionales con Puppeteer
- ✅ Almacenar en AWS S3
- ✅ Enviar por email con Nodemailer

### Filtros Disponibles

{panel:title=Dimensiones de Filtrado|borderStyle=solid}

**Temporal (Requerido):**
- `from` - Fecha inicio (YYYY-MM-DD)
- `to` - Fecha fin (YYYY-MM-DD)

**Dimensionales (Opcionales):**
- `contractor_id` - ID de usuario específico
- `name` - Nombre del usuario
- `country` - País (CO, PE, MX, etc.)
- `client_id` - Cliente específico
- `team_id` - Equipo específico
- `job_position` - Cargo (QA, Developer, etc.)

**Configuración:**
- `email` - Email para envío del reporte
- `useCache` - Usar caché de métricas (default: true)

{panel}

### Métricas Incluidas en Reportes

{expand:title=Ver estructura completa de métricas}

**Resumen Agregado:**
{code:typescript}
{
  total_contractors: number;      // Usuarios únicos en el periodo
  total_work_hours: number;       // Horas totales trabajadas
  avg_productivity: number;       // Productividad promedio (0-100)
  total_sessions: number;         // Sesiones de trabajo totales
  date_range: string;             // Periodo del reporte
}
{code}

**Métricas por Usuario:**
{code:typescript}
{
  // Identificación
  contractor_id: string;
  name: string;
  country: string;
  client: string;
  team: string;
  job_position: string;
  
  // Tiempo y sesiones
  total_work_hours: number;
  total_sessions: number;
  avg_session_duration: number;
  
  // Actividad
  total_keyboard_inputs: number;
  total_mouse_clicks: number;
  activity_percentage: number;     // % de tiempo activo
  idle_percentage: number;         // % de tiempo inactivo
  
  // Productividad
  productivity_score: number;      // Score 0-100
  total_productive_hours: number;
  total_unproductive_hours: number;
  
  // Aplicaciones más usadas
  top_apps: [
    {
      app_name: string;
      duration_seconds: number;
      percentage: number;
    }
  ];
  
  // Dominios más visitados
  top_domains: [
    {
      domain: string;
      duration_seconds: number;
      percentage: number;
    }
  ];
}
{code}

{expand}

### Integración con ADT_MS

{info:title=Endpoint de Consulta}
El servicio consulta métricas desde ADT_MS usando el endpoint:
`GET http://localhost:3002/adt/realtime-metrics`
{info}

**Tablas de ClickHouse consultadas:**
- `contractor_activity_15s` - Actividad cada 15 segundos
- `contractor_daily_metrics` - Métricas diarias pre-calculadas
- `session_summary` - Resúmenes de sesiones

**Características:**
- ✅ Caché de 30 segundos en ADT_MS
- ✅ Filtros multidimensionales
- ✅ Enriquecimiento con datos de USER_MS
- ✅ Agregación en tiempo real

### Flujo de Generación (Propuesto)

{panel:title=Proceso Completo - 9 Fases|borderStyle=solid|titleBGColor=#4A90E2}

**1. Solicitud del Reporte**
Cliente envía POST con filtros y email

**2. Validación y Autenticación**
Verificar JWT, rol, y formato de parámetros

**3. Consulta a ADT_MS**
Obtener métricas según filtros

**4. Preparación de Datos**
Formatear números, calcular totales, ordenar

**5. Renderizado HTML**
Generar HTML desde template Handlebars

**6. Generación de PDF**
Convertir HTML a PDF con Puppeteer

**7. Subida a S3**
Almacenar PDF y obtener URL pública

**8. Envío de Email**
Enviar email con link de descarga (opcional)

**9. Respuesta al Cliente**
Retornar URL del PDF y metadata

{panel}

**Tiempo total estimado:** 3-8 segundos

---

## 🔐 Seguridad

### Autenticación

{info:title=JWT Authentication}
Todos los endpoints (excepto los marcados con `@Public()`) requieren autenticación JWT.
{info}

**Header requerido:**
{code}
Authorization: Bearer <jwt_token>
{code}

**Guard implementado:** `AuthGuard`
- Extrae y valida el token JWT
- Decodifica información del usuario
- Inyecta datos en el request para uso posterior

### Autorización por Roles

{tip:title=Role-Based Access Control}
El sistema implementa control de acceso basado en roles.
{tip}

**Roles disponibles:**
- `Superadmin` - Acceso completo a todos los recursos
- `TeamAdmin` - Acceso limitado a su equipo

**Guard implementado:** `RolesGuard`
- Verifica roles del usuario autenticado
- Se aplica después de AuthGuard
- Decorador `@Roles(Role.Superadmin, Role.TeamAdmin)`

**Ejemplo de protección:**
{code:typescript}
@Roles(Role.Superadmin, Role.TeamAdmin)
@Controller('reports')
export class ReportsController {
  // Solo Superadmin y TeamAdmin pueden acceder
}
{code}

### Endpoints Públicos

Para hacer un endpoint público (sin autenticación):
{code:typescript}
@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
{code}

---

## 📊 Estado de Implementación

### Componentes Completados ✅

||Componente||Estado||Descripción||
|Configuración AWS S3|✅ 100%|Cliente S3 configurado y funcional|
|Validación de Variables|✅ 100%|Esquema Joi completo con validaciones|
|Autenticación JWT|✅ 100%|Guards implementados y testeados|
|Subida de archivos|✅ 100%|Endpoint funcional con validaciones|
|Sistema de Logging|✅ 100%|Winston configurado con niveles|
|Test de conexión S3|✅ 100%|Health check funcional|
|Decoradores custom|✅ 100%|@Public(), @Roles(), @CurrentUser()|
|Enums y tipos|✅ 100%|Role enum y FileType enum|

### Componentes Planificados ⏳

{warning:title=Desarrollo Pendiente}
Los siguientes componentes están **documentados pero no implementados**:
{warning}

||Componente||Estado||Prioridad||Complejidad||Tiempo Estimado||
|Módulo de Reportes|❌ 0%|ALTA|Media|2-3 días|
|Cliente HTTP ADT_MS|❌ 0%|ALTA|Baja|1 día|
|Generador de PDFs|❌ 0%|ALTA|Alta|3-4 días|
|Templates Handlebars|❌ 0%|ALTA|Media|1-2 días|
|Servicio de Email|❌ 0%|MEDIA|Baja|1 día|
|DTOs de Reportes|❌ 0%|ALTA|Baja|0.5 días|
|Tests E2E Reportes|❌ 0%|MEDIA|Media|2 días|

**Total estimado:** 10-14 días de desarrollo

---

## 🧪 Testing

### Estrategia de Testing

{panel:title=Niveles de Testing|borderStyle=solid}

**Unit Tests (80%+ cobertura):**
- Servicios individuales
- Guards y decoradores
- Transformaciones de datos
- Validaciones de DTOs

**Integration Tests:**
- Flujo S3 completo
- Integración con ADT_MS
- Caché de métricas

**E2E Tests:**
- Flujo completo de generación de reportes
- Diferentes combinaciones de filtros
- Manejo de errores

{panel}

### Ejecutar Tests

{code:bash}
# Unit tests
pnpm run test

# Unit tests en watch mode
pnpm run test:watch

# E2E tests
pnpm run test:e2e

# Cobertura de código
pnpm run test:cov
{code}

### Ejemplo de Test Unitario

{code:typescript}
describe('S3Service', () => {
  let service: S3Service;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();
    
    service = module.get<S3Service>(S3Service);
  });
  
  it('should upload file to S3', async () => {
    const file = createMockFile();
    const url = await service.uploadFile(file);
    expect(url).toContain('s3.amazonaws.com');
  });
});
{code}

---

## 🔍 Monitoreo y Logs

### Sistema de Logging

{info:title=Winston Logger}
El servicio usa Winston con niveles configurables según el entorno.
{info}

**Niveles de log:**
- `error` - Errores críticos
- `warn` - Advertencias
- `log` - Información general
- `debug` - Debugging (solo en desarrollo)
- `verbose` - Información detallada (solo en desarrollo)

**Configuración por entorno:**
{code:typescript}
// Desarrollo
LOG_LEVELS = ['error', 'warn', 'log', 'debug', 'verbose']

// Producción
LOG_LEVELS = ['error', 'warn', 'log']
{code}

### Métricas Clave

{panel:title=Métricas a Monitorear|borderStyle=solid}

**Performance:**
- Tiempo de subida a S3
- Tiempo de generación de PDF (cuando se implemente)
- Latencia de consultas a ADT_MS

**Uso de Recursos:**
- CPU/Memoria de Puppeteer
- Tamaño de archivos subidos
- Tráfico de red a S3

**Errores:**
- Tasa de errores por endpoint
- Fallos de autenticación
- Timeouts de integración

{panel}

---

## 🚨 Troubleshooting

### Problemas Comunes

{expand:title=Error de Conexión a S3}

**Síntoma:**
{code}
Error: Faltan credenciales de AWS
{code}

**Solución:**
1. Verificar que `.env` tiene las credenciales correctas
2. Validar permisos del usuario IAM en AWS
3. Verificar región configurada (debe ser `us-east-2`)
4. Probar endpoint `/s3/test-connection`

{expand}

{expand:title=Error de Autenticación JWT}

**Síntoma:**
{code}
401 Unauthorized - Token inválido
{code}

**Solución:**
1. Verificar que el token no haya expirado
2. Validar que `JWT_SECRET_PASSWORD` sea el mismo en todos los servicios
3. Verificar formato del header: `Authorization: Bearer <token>`
4. Regenerar token si es necesario

{expand}

{expand:title=Error de Validación de Archivo}

**Síntoma:**
{code}
400 Bad Request - File type not allowed
{code}

**Solución:**
1. Verificar extensión del archivo (solo PDF, XLSX, XLS, CSV, TXT)
2. Verificar tamaño del archivo (max 10MB)
3. Validar que el campo del formulario sea `file`

{expand}

{expand:title=Timeout en Consulta a ADT_MS}

**Síntoma:**
{code}
Error: timeout of 30000ms exceeded
{code}

**Solución:**
1. Verificar que ADT_MS esté corriendo
2. Validar URL en variable `ADT_MS_URL`
3. Reducir rango de fechas si es muy amplio
4. Verificar conectividad de red
5. Revisar logs de ADT_MS para errores

{expand}

---

## 📚 Referencias

### Documentación Interna

- [[UPLOAD_MS_CONTEXT.md]] - Contexto completo del microservicio
- [[REPORTS_MODULE_README.md]] - Documentación del módulo de reportes
- [[ADT_MS ETL Guide|ADT_MS/docs/ETL_AND_QUERY_GUIDE.md]] - Guía de consultas a ADT_MS
- [[Data Warehouse Analysis|ADT_MS/docs/DATA_WAREHOUSE_ANALYSIS.md]] - Análisis del Data Warehouse

### Documentación Externa

- [NestJS Documentation|https://docs.nestjs.com/]
- [Puppeteer Documentation|https://pptr.dev/]
- [AWS SDK for JavaScript|https://docs.aws.amazon.com/sdk-for-javascript/]
- [ClickHouse Official Docs|https://clickhouse.com/docs/]

### Repositorios Relacionados

- `EVENTS_MS` - Recepción de eventos del agente
- `ADT_MS` - Procesamiento y transformación de datos
- `USER_MS` - Gestión de usuarios y permisos
- `API_GATEWAY` - Gateway de entrada al ecosistema

---

## 👥 Equipo y Contacto

{info:title=Información del Equipo}
**Mantenedores:** Equipo de Backend
**Stack:** NestJS, TypeScript, AWS
**Repositorio:** [Link al repositorio]
**Documentación adicional:** [Link a Confluence]
{info}

### Canales de Comunicación

- **Slack:** #backend-support
- **Email:** backend-team@andesworkforce.com
- **Jira:** [Board del proyecto]

---

## 📝 Changelog

### Version 0.0.1 (Actual)

**Fecha:** Diciembre 2025

**Completado:**
- ✅ Configuración inicial del proyecto
- ✅ Integración con AWS S3
- ✅ Sistema de autenticación JWT
- ✅ Guards de autorización por roles
- ✅ Endpoints de subida de archivos
- ✅ Validación de variables de entorno
- ✅ Sistema de logging

**Pendiente:**
- ⏳ Módulo de generación de reportes
- ⏳ Integración con ADT_MS
- ⏳ Generador de PDFs con Puppeteer
- ⏳ Sistema de envío de emails
- ⏳ Tests E2E completos

---

## 🗺️ Roadmap

### Q1 2026 - Generación de Reportes

{panel:title=Objetivos del Trimestre|borderStyle=solid|titleBGColor=#2ECC71}

**Semana 1-2: Módulo Base**
- Estructura de carpetas y módulos
- DTOs y validaciones
- Interfaces y tipos

**Semana 3: Integración ADT_MS**
- Cliente HTTP
- Manejo de errores
- Tests de integración

**Semana 4-5: Generación de PDFs**
- Templates Handlebars
- Puppeteer setup
- Optimizaciones

**Semana 6: Email y Testing**
- Servicio de email
- Tests E2E
- Documentación

{panel}

### Q2 2026 - Optimizaciones

- Caché distribuido con Redis
- Queue system para reportes pesados
- Monitoreo con Prometheus
- Métricas de performance

### Q3 2026 - Features Avanzadas

- Reportes programados (cron jobs)
- Múltiples formatos (Excel, CSV)
- Templates personalizados por cliente
- Dashboard de reportes generados

---

{tip:title=Documento Vivo}
Esta documentación se actualiza continuamente. Última actualización: **18 de Diciembre, 2025**
{tip}

---

**Generado por:** Equipo de Desarrollo  
**Versión del documento:** 1.0  
**Licencia:** Propietaria - Andes Workforce
