# Análisis del Microservicio Upload_MS: Sistema de Generación de Reportes

**Fecha de Análisis:** 18 de Diciembre, 2025  
**Versión del Microservicio:** 0.0.1  
**Framework:** NestJS 11.x  
**Lenguaje:** TypeScript 5.7.3

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura Actual](#arquitectura-actual)
3. [Estado de Implementación](#estado-de-implementación)
4. [Contexto del Proyecto: Sistema de Reportes](#contexto-del-proyecto-sistema-de-reportes)
5. [Integración con ADT_MS y ClickHouse](#integración-con-adt_ms-y-clickhouse)
6. [Flujo de Generación de Reportes](#flujo-de-generación-de-reportes)
7. [Estructura de Datos y Filtros](#estructura-de-datos-y-filtros)
8. [Propuesta de Implementación](#propuesta-de-implementación)
9. [Próximos Pasos](#próximos-pasos)
10. [Recomendaciones](#recomendaciones)

---

## 📊 Resumen Ejecutivo

El **Upload Microservice** es un servicio NestJS diseñado para gestionar la generación, almacenamiento y distribución de reportes PDF de métricas de productividad. Este microservicio forma parte de un ecosistema de análisis de datos que incluye:

- **EVENTS_MS**: Recibe eventos del agente de productividad
- **ADT_MS**: Procesa y transforma datos en ClickHouse
- **UPLOAD_MS**: Genera reportes PDF y los almacena en AWS S3

### Objetivo Principal

Generar reportes PDF dinámicos de métricas de productividad basados en datos de ClickHouse, con filtros personalizables (fechas, usuarios, equipos, clientes) y almacenarlos en AWS S3 para distribución.

### Estado Actual

- ✅ **Infraestructura base**: Configuración de AWS S3, NATS, autenticación
- ✅ **Subida de archivos**: Endpoints para subir PDFs manualmente
- ⚠️ **Generación de reportes**: Estructura base documentada, no implementada
- ❌ **Integración con ADT_MS**: Cliente HTTP configurado pero sin implementar
- ❌ **Generación dinámica de PDFs**: No implementada
- ❌ **Envío de emails**: No implementado

---

## 🏗️ Arquitectura Actual

### Stack Tecnológico

```typescript
{
  "framework": "NestJS 11.x",
  "runtime": "Node.js (ES2023)",
  "lenguaje": "TypeScript 5.7.3",
  "almacenamiento": "AWS S3 (us-east-2)",
  "mensajería": "NATS (comentado - no activo)",
  "gestión_paquetes": "pnpm",
  "testing": "Jest",
  "validación": "Joi, class-validator"
}
```

### Estructura del Proyecto

```
upload_ms/
├── src/
│   ├── config/                    # Configuración y variables de entorno
│   │   ├── envs.ts               # Validación con Joi
│   │   ├── index.ts              # Exports
│   │   └── logging.ts            # Configuración de logs
│   ├── s3/                       # Módulo de AWS S3
│   │   ├── s3.controller.ts      # Endpoints HTTP
│   │   ├── s3.service.ts         # Lógica de S3
│   │   ├── s3.module.ts          # Módulo
│   │   ├── dto/                  # DTOs (vacíos)
│   │   └── entities/             # Entidades (vacías)
│   ├── guards/                   # Auth y Roles
│   │   ├── auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/               # Custom decorators
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── roles.decorator.ts
│   ├── nats/                     # Módulo NATS (no usado)
│   │   └── nats.module.ts
│   ├── app.module.ts             # Módulo raíz
│   └── main.ts                   # Bootstrap
├── test/                         # Tests E2E
├── .env                          # Variables de entorno
└── package.json                  # Dependencias
```

### Módulos Principales

#### 1. **S3Module** (Implementado)

**Responsabilidades:**
- Configuración de AWS SDK
- Subida de archivos a S3
- Generación de URLs públicas
- Test de conexión

**Estado:** ✅ Funcional pero limitado

**Endpoints disponibles:**
```typescript
POST /s3/upload/report  // Subir archivo manualmente (max 10MB)
GET  /s3/test-connection // Verificar conexión con S3
```

**Características:**
- Validación de tipos de archivo (PDF, Excel, CSV, TXT)
- Límite de tamaño: 10MB
- Soporte para carpetas personalizadas
- Autenticación mediante JWT (pero endpoint público para testing)

#### 2. **Guards y Autenticación** (Implementado)

**AuthGuard:**
- Verifica JWT en headers
- Extrae información del usuario
- Protege todos los endpoints por defecto

**RolesGuard:**
- Verifica roles del usuario (Superadmin, TeamAdmin)
- Se aplica después de AuthGuard
- Permite acceso granular

#### 3. **ConfigModule** (Implementado)

**Variables de entorno configuradas:**

```env
# AWS S3
AWS_REGION=us-east-2
AWS_S3_BUCKET=andes-workforce-s3
AWS_ACCESS_KEY_ID=AKIAYT...
AWS_SECRET_ACCESS_KEY=Qy57fr...

# Servidor
PORT=3006
ENVIRONMENT=development
DEV_LOGS=true

# NATS (no usado actualmente)
NATS_HOST=72.61.129.234
NATS_PORT=4222
NATS_USERNAME=andes_nats
NATS_PASSWORD=andesworkforce_nats

# Seguridad
JWT_SECRET_PASSWORD=andesmetrics

# Integración ADT
ADT_MS_URL=http://localhost:3002
```

---

## 🔧 Estado de Implementación

### Componentes Implementados ✅

| Componente | Estado | Descripción |
|-----------|--------|-------------|
| Configuración AWS S3 | ✅ 100% | Cliente S3 configurado y funcional |
| Validación de Env Vars | ✅ 100% | Esquema Joi completo |
| Autenticación JWT | ✅ 100% | Guards implementados |
| Subida manual de archivos | ✅ 100% | Endpoint funcional |
| Logging configurado | ✅ 100% | Winston con niveles |
| Test de conexión S3 | ✅ 100% | Endpoint funcional |

### Componentes Planificados pero No Implementados ❌

| Componente | Estado | Prioridad | Complejidad |
|-----------|--------|-----------|-------------|
| Módulo de Reportes | ❌ 0% | ALTA | Media |
| Cliente ADT_MS | ❌ 0% | ALTA | Baja |
| Generador de PDFs | ❌ 0% | ALTA | Alta |
| Templates HTML/Handlebars | ❌ 0% | ALTA | Media |
| Servicio de Email | ❌ 0% | MEDIA | Baja |
| DTOs de Reportes | ❌ 0% | ALTA | Baja |

### Dependencias Instaladas pero No Usadas ⚠️

```json
{
  "puppeteer": "^22.15.0",      // Para generación de PDFs - NO USADO
  "axios": "^1.7.9",            // Para cliente HTTP - NO USADO
  "class-validator": "^0.14.1", // Para validación - PARCIALMENTE USADO
  "class-transformer": "^0.5.1" // Para transformación - NO USADO
}
```

**Falta instalar:**
```json
{
  "handlebars": "^4.7.8",       // Para templates HTML
  "nodemailer": "^6.9.0"        // Para envío de emails
}
```

---

## 🎯 Contexto del Proyecto: Sistema de Reportes

### Visión del Sistema

El sistema de reportes debe permitir a los administradores generar informes PDF de productividad de contratistas basados en datos almacenados en ClickHouse, con las siguientes características:

#### 1. **Filtros Dinámicos**

Los reportes deben soportar múltiples dimensiones de filtrado:

```typescript
interface ReportFilters {
  // Temporal (REQUERIDO)
  from: string;        // Fecha inicio (YYYY-MM-DD)
  to: string;          // Fecha fin (YYYY-MM-DD)
  
  // Dimensiones (OPCIONALES)
  contractor_id?: string;   // Usuario específico
  name?: string;            // Nombre del usuario
  country?: string;         // País (CO, PE, etc.)
  client_id?: string;       // Cliente específico
  team_id?: string;         // Equipo específico
  job_position?: string;    // Cargo (QA, Dev, etc.)
  
  // Configuración
  email?: string;           // Email para envío
  useCache?: boolean;       // Usar caché de métricas
}
```

#### 2. **Métricas Incluidas en Reportes**

Basado en la estructura de ClickHouse y ADT_MS, los reportes deben incluir:

**A. Métricas Agregadas (Resumen)**
```typescript
interface ReportSummary {
  total_contractors: number;     // Usuarios únicos
  total_work_hours: number;      // Horas totales trabajadas
  avg_productivity: number;      // Productividad promedio
  total_sessions: number;        // Sesiones totales
  date_range: string;            // Rango de fechas
}
```

**B. Métricas por Usuario**
```typescript
interface ContractorMetrics {
  // Identificación
  contractor_id: string;
  name: string;
  country: string;
  client: string;
  team: string;
  job_position: string;
  
  // Métricas de tiempo
  total_work_hours: number;
  total_sessions: number;
  avg_session_duration: number;
  
  // Métricas de actividad
  total_keyboard_inputs: number;
  total_mouse_clicks: number;
  activity_percentage: number;
  idle_percentage: number;
  
  // Métricas de productividad
  productivity_score: number;    // 0-100
  total_productive_hours: number;
  total_unproductive_hours: number;
  
  // Uso de aplicaciones
  top_apps: Array<{
    app_name: string;
    duration_seconds: number;
    percentage: number;
  }>;
  
  // Navegación web
  top_domains: Array<{
    domain: string;
    duration_seconds: number;
    percentage: number;
  }>;
}
```

#### 3. **Formato del Reporte PDF**

**Estructura propuesta:**

```
┌─────────────────────────────────────────────┐
│  REPORTE DE PRODUCTIVIDAD                   │
│  Andes Workforce                            │
│  Periodo: [from] - [to]                     │
│  Generado: [timestamp]                      │
├─────────────────────────────────────────────┤
│                                             │
│  RESUMEN EJECUTIVO                          │
│  • Total Usuarios: XX                       │
│  • Horas Trabajadas: XX.XX                  │
│  • Productividad Promedio: XX%              │
│  • Sesiones: XX                             │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  MÉTRICAS POR USUARIO                       │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ Usuario: John Doe                     │ │
│  │ Cliente: Acme Corp | Equipo: Dev      │ │
│  │ Cargo: Senior Developer               │ │
│  │                                       │ │
│  │ Horas Trabajadas: 45.5h              │ │
│  │ Productividad: 87%                    │ │
│  │ Actividad: 92%                        │ │
│  │                                       │ │
│  │ Top Aplicaciones:                     │ │
│  │  • VS Code: 25.3h (55%)              │ │
│  │  • Chrome: 12.1h (26%)               │ │
│  │  • Slack: 5.2h (11%)                 │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  [Más usuarios...]                          │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔗 Integración con ADT_MS y ClickHouse

### Arquitectura de Datos

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  PY_AGENT    │────▶│  EVENTS_MS   │────▶│   ADT_MS     │
│  (Python)    │     │  (Postgres)  │     │ (ClickHouse) │
└──────────────┘     └──────────────┘     └──────────────┘
                                                   │
                                                   │ Query
                                                   │ Métricas
                                                   ▼
                                           ┌──────────────┐
                                           │  UPLOAD_MS   │
                                           │   (Reports)  │
                                           └──────────────┘
                                                   │
                                                   │ PDF
                                                   ▼
                                           ┌──────────────┐
                                           │   AWS S3     │
                                           └──────────────┘
```

### Tablas Relevantes en ClickHouse

#### 1. **contractor_activity_15s** (Tabla de Actividad)

**Descripción:** Almacena beats de actividad cada 15 segundos

```sql
CREATE TABLE contractor_activity_15s (
  contractor_id String,
  agent_id String,
  session_id String,
  agent_session_id String,
  beat_timestamp DateTime64(3),
  workday Date,
  is_idle UInt8,
  keyboard_count UInt32,
  mouse_clicks UInt32,
  app_usage_json String,      -- JSON: { "Chrome": 450, "VSCode": 1200 }
  browser_usage_json String,  -- JSON: { "github.com": 15, "docs.google.com": 10 }
  keyboard_inactive_time Float32,
  mouse_inactive_time Float32,
  idle_time Float32,
  created_at DateTime64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(workday)
ORDER BY (workday, contractor_id, beat_timestamp);
```

#### 2. **contractor_daily_metrics** (Métricas Agregadas Diarias)

**Descripción:** Métricas pre-calculadas por día y usuario

```sql
CREATE TABLE contractor_daily_metrics (
  contractor_id String,
  workday Date,
  total_beats UInt32,
  active_beats UInt32,
  idle_beats UInt32,
  total_keyboard_inputs UInt64,
  total_mouse_clicks UInt64,
  total_app_usage_seconds Float64,
  total_browser_usage_seconds Float64,
  total_work_seconds Float64,
  productivity_score Float32,
  activity_percentage Float32,
  idle_percentage Float32,
  app_usage_json String,
  browser_usage_json String,
  top_app String,
  top_domain String,
  session_count UInt32,
  created_at DateTime64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(workday)
ORDER BY (workday, contractor_id);
```

#### 3. **session_summary** (Resúmenes de Sesión)

**Descripción:** Información de sesiones de trabajo

```sql
CREATE TABLE session_summary (
  session_id String,
  contractor_id String,
  workday Date,
  session_start DateTime64(3),
  session_end DateTime64(3),
  total_duration_seconds Float64,
  total_beats UInt32,
  active_beats UInt32,
  productivity_score Float32,
  app_usage_json String,
  browser_usage_json String,
  created_at DateTime64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(workday)
ORDER BY (workday, contractor_id, session_start);
```

### Endpoints Disponibles en ADT_MS

El servicio ADT_MS expone los siguientes endpoints para consultar métricas:

#### 1. **GET /adt/realtime-metrics** (Principal para Reportes)

**Descripción:** Obtiene métricas en tiempo real desde `contractor_activity_15s`

**Query Parameters:**
```typescript
{
  from?: string;          // Fecha inicio (YYYY-MM-DD)
  to?: string;            // Fecha fin (YYYY-MM-DD)
  contractor_id?: string; // Filtro por usuario
  name?: string;          // Filtro por nombre
  country?: string;       // Filtro por país
  client_id?: string;     // Filtro por cliente
  team_id?: string;       // Filtro por equipo
  job_position?: string;  // Filtro por cargo
  useCache?: boolean;     // Usar caché (default: true)
}
```

**Respuesta:**
```typescript
{
  filters: {
    from: string;
    to: string;
    // ... otros filtros aplicados
  },
  summary: {
    total_contractors: number;
    total_work_hours: number;
    avg_productivity: number;
    date_range: string;
  },
  metrics: Array<{
    contractor_id: string;
    name: string;
    country: string;
    client: string;
    team: string;
    job_position: string;
    total_work_hours: number;
    productivity_score: number;
    activity_percentage: number;
    idle_percentage: number;
    total_keyboard_inputs: number;
    total_mouse_clicks: number;
    top_apps: Array<{ app_name: string; duration_seconds: number }>;
    top_domains: Array<{ domain: string; duration_seconds: number }>;
  }>;
}
```

**Características:**
- ✅ Caché de 30 segundos
- ✅ Filtros multidimensionales
- ✅ Agregación en tiempo real
- ✅ Enriquecimiento con datos de USER_MS (nombres, equipos, clientes)

#### 2. **GET /adt/daily-metrics** (Alternativa con Datos Pre-calculados)

**Descripción:** Consulta `contractor_daily_metrics` (datos agregados)

**Query Parameters:** Similar a realtime-metrics

**Ventajas:**
- Más rápido (datos pre-agregados)
- Ideal para rangos grandes de fechas

**Desventajas:**
- Requiere ETL ejecutado previamente
- Puede no tener datos del día actual

---

## 🔄 Flujo de Generación de Reportes

### Flujo Completo Propuesto

```
┌─────────────────────────────────────────────────────────────┐
│  1. SOLICITUD DEL REPORTE                                    │
│     Cliente → POST /reports/generate                         │
│     Body: { email, from, to, ...filters }                    │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. VALIDACIÓN Y AUTENTICACIÓN                               │
│     • Validar JWT token                                      │
│     • Verificar rol (Superadmin/TeamAdmin)                   │
│     • Validar formato de fechas y filtros                    │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. CONSULTA A ADT_MS                                        │
│     UPLOAD_MS → GET ADT_MS/adt/realtime-metrics?from=...    │
│     Respuesta: { summary, metrics }                          │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4. PREPARACIÓN DE DATOS PARA TEMPLATE                       │
│     • Formatear números y porcentajes                        │
│     • Calcular totales y promedios adicionales               │
│     • Ordenar usuarios por productividad                     │
│     • Limitar top apps/domains a Top 5                       │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  5. RENDERIZADO HTML CON HANDLEBARS                          │
│     • Cargar template HTML                                   │
│     • Inyectar datos de métricas                             │
│     • Aplicar estilos CSS inline                             │
│     HTML completo generado                                   │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  6. GENERACIÓN DE PDF CON PUPPETEER                          │
│     • Iniciar navegador headless                             │
│     • Cargar HTML renderizado                                │
│     • Configurar formato (A4, landscape)                     │
│     • Generar PDF buffer                                     │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  7. SUBIDA A AWS S3                                          │
│     • Generar clave única: reports/YYYY-MM-DD_uuid.pdf      │
│     • Subir buffer a S3                                      │
│     • Obtener URL pública                                    │
│     URL: https://andes-workforce-s3.s3.us-east-2...         │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  8. ENVÍO DE EMAIL (OPCIONAL)                                │
│     • Preparar email HTML                                    │
│     • Incluir link de descarga del PDF                       │
│     • Enviar via Nodemailer (SMTP)                           │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  9. RESPUESTA AL CLIENTE                                     │
│     Response: {                                              │
│       success: true,                                         │
│       pdfUrl: "https://...",                                 │
│       metricsCount: 25,                                      │
│       generatedAt: "2025-12-18T10:30:00Z"                   │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
```

### Tiempos Estimados por Fase

| Fase | Tiempo Estimado | Cacheabilidad |
|------|----------------|---------------|
| Validación | < 10ms | No |
| Consulta ADT_MS | 200-500ms | Sí (30s) |
| Preparación datos | 50-100ms | No |
| Renderizado HTML | 100-200ms | Parcial (template) |
| Generación PDF | 1-3s | No |
| Subida S3 | 500ms-2s | No |
| Envío Email | 1-2s | No |
| **TOTAL** | **3-8s** | Depende |

---

## 📊 Estructura de Datos y Filtros

### Filtros Dinámicos: Casos de Uso

#### Caso 1: Reporte de un usuario específico
```typescript
POST /reports/generate
{
  "email": "admin@example.com",
  "from": "2025-12-01",
  "to": "2025-12-15",
  "contractor_id": "cm123abc",
  "useCache": true
}
// Resultado: 1 usuario, 15 días de datos
```

#### Caso 2: Reporte de un equipo completo
```typescript
POST /reports/generate
{
  "email": "manager@example.com",
  "from": "2025-12-01",
  "to": "2025-12-15",
  "team_id": "team_dev_backend",
  "useCache": true
}
// Resultado: N usuarios del equipo, 15 días de datos
```

#### Caso 3: Reporte de un cliente específico
```typescript
POST /reports/generate
{
  "email": "client@example.com",
  "from": "2025-11-01",
  "to": "2025-11-30",
  "client_id": "client_acme_corp",
  "useCache": true
}
// Resultado: Todos los usuarios del cliente, 30 días
```

#### Caso 4: Reporte por país y cargo
```typescript
POST /reports/generate
{
  "email": "hr@example.com",
  "from": "2025-12-01",
  "to": "2025-12-15",
  "country": "CO",
  "job_position": "QA",
  "useCache": true
}
// Resultado: Todos los QAs de Colombia, 15 días
```

### Validaciones de Filtros

```typescript
// DTO de validación (propuesto)
export class GenerateReportDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsDateString()
  @IsNotEmpty()
  from: string;

  @IsDateString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsOptional()
  contractor_id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(['CO', 'PE', 'MX', 'AR', 'CL']) // Países soportados
  country?: string;

  @IsString()
  @IsOptional()
  client_id?: string;

  @IsString()
  @IsOptional()
  team_id?: string;

  @IsString()
  @IsOptional()
  job_position?: string;

  @IsBoolean()
  @IsOptional()
  useCache?: boolean = true;
}
```

### Reglas de Negocio para Filtros

1. **Rango de fechas:**
   - `from` debe ser anterior o igual a `to`
   - Máximo 90 días de rango
   - No se permiten fechas futuras

2. **Combinación de filtros:**
   - Si se proporciona `contractor_id`, se ignoran otros filtros dimensionales
   - `team_id` y `client_id` pueden combinarse
   - `country` y `job_position` son complementarios

3. **Permisos por rol:**
   - **Superadmin**: Todos los filtros permitidos
   - **TeamAdmin**: Solo puede ver reportes de su equipo
   - **Client**: Solo puede ver reportes de su organización

---

## 💡 Propuesta de Implementación

### Fase 1: Módulo de Reportes Base (2-3 días)

**Objetivo:** Crear la estructura base del módulo de reportes

**Tareas:**
1. Crear módulo `reports/`
2. Crear DTOs de validación
3. Implementar interfaces de tipos
4. Crear controller con endpoints básicos
5. Crear service orquestador

**Archivos a crear:**
```
src/reports/
├── reports.module.ts
├── reports.controller.ts
├── reports.service.ts
├── dto/
│   └── generate-report.dto.ts
├── interfaces/
│   ├── report-filters.interface.ts
│   ├── report-summary.interface.ts
│   └── contractor-metrics.interface.ts
└── services/
    ├── adt-client.service.ts      (Fase 2)
    ├── pdf-generator.service.ts   (Fase 3)
    └── email.service.ts           (Fase 4)
```

**Resultado esperado:**
- Endpoint `/reports/generate` que valida y responde con estructura mock
- Tests unitarios para DTOs

---

### Fase 2: Cliente ADT_MS (1 día)

**Objetivo:** Integrar con ADT_MS para obtener métricas reales

**Tareas:**
1. Crear `adt-client.service.ts`
2. Configurar HttpModule de NestJS
3. Implementar método `getRealtimeMetrics(filters)`
4. Manejar errores y timeouts
5. Añadir logs de debugging

**Código propuesto:**

```typescript
// src/reports/services/adt-client.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdtClientService {
  private readonly logger = new Logger(AdtClientService.name);
  private readonly adtMsUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.adtMsUrl = this.configService.get<string>('envs.adtMsUrl');
  }

  async getRealtimeMetrics(filters: any) {
    try {
      this.logger.log(`Consultando métricas desde ADT_MS: ${JSON.stringify(filters)}`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.adtMsUrl}/adt/realtime-metrics`, {
          params: filters,
          timeout: 30000, // 30 segundos
        })
      );

      this.logger.log(`Métricas recibidas: ${response.data.metrics.length} usuarios`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error al consultar ADT_MS: ${error.message}`);
      throw new Error('No se pudieron obtener las métricas de productividad');
    }
  }
}
```

**Resultado esperado:**
- Servicio funcional que obtiene datos reales de ADT_MS
- Manejo de errores robusto
- Tests con mocks de axios

---

### Fase 3: Generación de PDFs (3-4 días)

**Objetivo:** Generar PDFs profesionales con Puppeteer y Handlebars

**Tareas:**
1. Instalar dependencias: `handlebars`, `@types/handlebars`
2. Crear template HTML/CSS
3. Implementar `pdf-generator.service.ts`
4. Configurar Puppeteer (headless, formato, estilos)
5. Optimizar performance (reuso de instancias de navegador)

**Template HTML propuesto:**

```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 40px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { font-size: 16px; opacity: 0.9; }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card .value {
      font-size: 28px;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }
    .summary-card .label {
      font-size: 14px;
      color: #666;
    }
    
    .contractor-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .contractor-header {
      border-bottom: 2px solid #667eea;
      padding-bottom: 15px;
      margin-bottom: 15px;
    }
    .contractor-name {
      font-size: 20px;
      font-weight: bold;
      color: #333;
    }
    .contractor-info {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    .metric {
      text-align: center;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 6px;
    }
    .metric-value {
      font-size: 20px;
      font-weight: bold;
      color: #667eea;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    
    .apps-list {
      margin-top: 15px;
    }
    .app-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .app-name { font-weight: 500; }
    .app-time { color: #667eea; }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Reporte de Productividad</h1>
    <p>Periodo: {{filters.from}} - {{filters.to}}</p>
    <p>Generado: {{generatedAt}}</p>
  </div>
  
  <div class="summary">
    <div class="summary-card">
      <div class="label">Total Usuarios</div>
      <div class="value">{{summary.total_contractors}}</div>
    </div>
    <div class="summary-card">
      <div class="label">Horas Trabajadas</div>
      <div class="value">{{summary.total_work_hours}}</div>
    </div>
    <div class="summary-card">
      <div class="label">Productividad Promedio</div>
      <div class="value">{{summary.avg_productivity}}%</div>
    </div>
    <div class="summary-card">
      <div class="label">Sesiones Totales</div>
      <div class="value">{{summary.total_sessions}}</div>
    </div>
  </div>
  
  {{#each metrics}}
  <div class="contractor-section">
    <div class="contractor-header">
      <div class="contractor-name">{{this.name}}</div>
      <div class="contractor-info">
        {{this.job_position}} | {{this.team}} | {{this.client}} | {{this.country}}
      </div>
    </div>
    
    <div class="metrics-grid">
      <div class="metric">
        <div class="metric-value">{{this.total_work_hours}}h</div>
        <div class="metric-label">Horas Trabajadas</div>
      </div>
      <div class="metric">
        <div class="metric-value">{{this.productivity_score}}%</div>
        <div class="metric-label">Productividad</div>
      </div>
      <div class="metric">
        <div class="metric-value">{{this.activity_percentage}}%</div>
        <div class="metric-label">Actividad</div>
      </div>
    </div>
    
    <div class="apps-list">
      <strong>Top Aplicaciones:</strong>
      {{#each this.top_apps}}
      <div class="app-item">
        <span class="app-name">{{this.app_name}}</span>
        <span class="app-time">{{this.duration_hours}}h ({{this.percentage}}%)</span>
      </div>
      {{/each}}
    </div>
  </div>
  {{/each}}
  
  <div class="footer">
    <p>Generado por Andes Workforce © 2025</p>
  </div>
</body>
</html>
```

**Servicio PDF Generator:**

```typescript
// src/reports/services/pdf-generator.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private browser: puppeteer.Browser | null = null;

  async onModuleInit() {
    // Pre-inicializar navegador para mejor performance
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.logger.log('Puppeteer browser initialized');
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Puppeteer browser closed');
    }
  }

  async generatePdf(data: any): Promise<Buffer> {
    try {
      // 1. Cargar template
      const templatePath = path.join(__dirname, '../templates/report.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);

      // 2. Renderizar HTML con datos
      const html = template(data);

      // 3. Generar PDF con Puppeteer
      const page = await this.browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      await page.close();
      
      this.logger.log(`PDF generado exitosamente (${pdfBuffer.length} bytes)`);
      return pdfBuffer;
    } catch (error) {
      this.logger.error(`Error generando PDF: ${error.message}`);
      throw new Error('No se pudo generar el PDF');
    }
  }
}
```

**Resultado esperado:**
- PDFs profesionales generados
- Performance optimizado (< 3s por PDF)
- Template personalizable

---

### Fase 4: Envío de Emails (1 día)

**Objetivo:** Enviar emails con link al reporte generado

**Tareas:**
1. Instalar `nodemailer` y `@types/nodemailer`
2. Configurar variables de entorno SMTP
3. Implementar `email.service.ts`
4. Crear template de email HTML
5. Manejar errores de envío

**Variables de entorno necesarias:**

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=reports@andesworkforce.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Andes Workforce Reports <reports@andesworkforce.com>
```

**Servicio de Email:**

```typescript
// src/reports/services/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendReportEmail(to: string, pdfUrl: string, reportData: any) {
    try {
      const mailOptions = {
        from: this.configService.get('SMTP_FROM'),
        to,
        subject: `Reporte de Productividad - ${reportData.date_range}`,
        html: this.buildEmailHtml(pdfUrl, reportData),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email enviado exitosamente a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando email: ${error.message}`);
      throw new Error('No se pudo enviar el email');
    }
  }

  private buildEmailHtml(pdfUrl: string, reportData: any): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #667eea;">Reporte de Productividad</h1>
          <p>Se ha generado exitosamente tu reporte de productividad.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Periodo:</strong> ${reportData.date_range}<br>
            <strong>Usuarios:</strong> ${reportData.total_contractors}<br>
            <strong>Horas Totales:</strong> ${reportData.total_work_hours}h
          </div>
          
          <a href="${pdfUrl}" 
             style="display: inline-block; background: #667eea; color: white; 
                    padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            📄 Descargar Reporte PDF
          </a>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Este link estará disponible por 30 días.<br>
            Generado por Andes Workforce © 2025
          </p>
        </body>
      </html>
    `;
  }
}
```

**Resultado esperado:**
- Emails HTML profesionales enviados
- Links de descarga funcionando
- Logs de envío

---

### Fase 5: Integración y Testing (2 días)

**Objetivo:** Integrar todas las fases y probar el flujo completo

**Tareas:**
1. Conectar todos los servicios en `reports.service.ts`
2. Implementar manejo de errores centralizado
3. Añadir logs completos en cada fase
4. Crear tests E2E
5. Optimizar performance
6. Documentar en README

**Service Principal Completo:**

```typescript
// src/reports/reports.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AdtClientService } from './services/adt-client.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { EmailService } from './services/email.service';
import { S3Service } from '../s3/s3.service';
import { GenerateReportDto } from './dto/generate-report.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly adtClient: AdtClientService,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly emailService: EmailService,
    private readonly s3Service: S3Service,
  ) {}

  async generateAndSendReport(dto: GenerateReportDto) {
    const startTime = Date.now();
    this.logger.log(`Iniciando generación de reporte: ${JSON.stringify(dto)}`);

    try {
      // 1. Obtener métricas de ADT_MS
      this.logger.log('Fase 1: Consultando métricas...');
      const metricsData = await this.adtClient.getRealtimeMetrics({
        from: dto.from,
        to: dto.to,
        contractor_id: dto.contractor_id,
        name: dto.name,
        country: dto.country,
        client_id: dto.client_id,
        team_id: dto.team_id,
        job_position: dto.job_position,
        useCache: dto.useCache,
      });

      // 2. Preparar datos para el template
      this.logger.log('Fase 2: Preparando datos...');
      const templateData = this.prepareTemplateData(metricsData, dto);

      // 3. Generar PDF
      this.logger.log('Fase 3: Generando PDF...');
      const pdfBuffer = await this.pdfGenerator.generatePdf(templateData);

      // 4. Subir a S3
      this.logger.log('Fase 4: Subiendo a S3...');
      const fileName = `report_${dto.from}_${dto.to}_${Date.now()}.pdf`;
      const pdfUrl = await this.s3Service.uploadFile(
        {
          buffer: pdfBuffer,
          originalname: fileName,
          mimetype: 'application/pdf',
        } as any,
        FileType.DOCUMENT,
        'reports',
      );

      // 5. Enviar email
      if (dto.email) {
        this.logger.log('Fase 5: Enviando email...');
        await this.emailService.sendReportEmail(
          dto.email,
          pdfUrl,
          metricsData.summary,
        );
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Reporte generado exitosamente en ${duration}ms`);

      return {
        success: true,
        pdfUrl,
        metricsCount: metricsData.metrics.length,
        generatedAt: new Date().toISOString(),
        duration_ms: duration,
      };
    } catch (error) {
      this.logger.error(`❌ Error generando reporte: ${error.message}`);
      throw error;
    }
  }

  private prepareTemplateData(metricsData: any, dto: GenerateReportDto) {
    return {
      filters: {
        from: dto.from,
        to: dto.to,
      },
      summary: {
        ...metricsData.summary,
        date_range: `${dto.from} - ${dto.to}`,
      },
      metrics: metricsData.metrics.map((m: any) => ({
        ...m,
        total_work_hours: (m.total_work_hours || 0).toFixed(2),
        productivity_score: (m.productivity_score || 0).toFixed(1),
        activity_percentage: (m.activity_percentage || 0).toFixed(1),
        top_apps: (m.top_apps || []).slice(0, 5).map((app: any) => ({
          ...app,
          duration_hours: (app.duration_seconds / 3600).toFixed(2),
          percentage: ((app.duration_seconds / m.total_work_seconds) * 100).toFixed(1),
        })),
      })),
      generatedAt: new Date().toISOString(),
    };
  }
}
```

**Controller Final:**

```typescript
// src/reports/reports.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Public } from '../decorators/public.decorator';

@Roles(Role.Superadmin, Role.TeamAdmin)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  async generateReport(@Body() dto: GenerateReportDto) {
    return this.reportsService.generateAndSendReport(dto);
  }

  @Public()
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'upload_ms:reports',
      timestamp: new Date().toISOString(),
    };
  }
}
```

**Resultado esperado:**
- Flujo completo funcionando end-to-end
- Tests E2E pasando
- Performance < 8s por reporte
- Documentación completa

---

## 🚀 Próximos Pasos

### Corto Plazo (1-2 semanas)

1. **Implementar Fase 1-2** (3 días)
   - Crear módulo de reportes
   - Integrar cliente ADT_MS
   - Tests básicos

2. **Implementar Fase 3** (4 días)
   - Instalar dependencias de PDF
   - Crear template HTML
   - Implementar generador de PDFs
   - Optimizar Puppeteer

3. **Implementar Fase 4-5** (3 días)
   - Configurar SMTP
   - Implementar envío de emails
   - Tests E2E completos
   - Documentación

### Mediano Plazo (1 mes)

1. **Optimizaciones**
   - Caché de templates compilados
   - Pool de instancias de Puppeteer
   - Compresión de PDFs
   - CDN para assets del template

2. **Features Adicionales**
   - Reportes programados (cron jobs)
   - Múltiples formatos (PDF, Excel, CSV)
   - Customización de templates por cliente
   - Dashboard de reportes generados

3. **Monitoreo y Observabilidad**
   - Métricas de performance (Prometheus)
   - Alertas de errores (Sentry)
   - Logs centralizados (ELK Stack)
   - Dashboard de uso

### Largo Plazo (3 meses)

1. **Escalabilidad**
   - Queue system (Bull/BullMQ) para reportes pesados
   - Microservicio separado para generación de PDFs
   - Horizontal scaling con Kubernetes
   - Caché distribuido (Redis)

2. **Business Intelligence**
   - Reportes interactivos (Grafana)
   - Exportación a BI tools (Power BI, Tableau)
   - Análisis predictivo
   - Alertas automáticas por umbrales

---

## 💡 Recomendaciones

### Arquitectura

1. **Separación de Responsabilidades**
   - Mantener lógica de negocio fuera de controllers
   - Usar servicios especializados para cada tarea
   - Interfaces claras entre módulos

2. **Manejo de Errores**
   - Try-catch en cada fase crítica
   - Logs detallados con niveles apropiados
   - Respuestas HTTP informativas
   - Rollback en caso de fallo (ej: eliminar PDF de S3 si falla email)

3. **Performance**
   - Cachear templates compilados de Handlebars
   - Reusar instancias de navegador Puppeteer
   - Lazy loading de módulos pesados
   - Timeouts apropiados en requests HTTP

### Seguridad

1. **Autenticación y Autorización**
   - Validar permisos en cada endpoint
   - Limitar acceso a reportes según rol
   - Rate limiting para prevenir abuso
   - Auditoría de quién genera qué reportes

2. **Datos Sensibles**
   - No incluir información sensible en logs
   - Encriptar PDFs si contienen datos confidenciales
   - URLs de S3 con tiempo de expiración
   - HTTPS obligatorio para todas las comunicaciones

3. **Validación de Inputs**
   - Validar exhaustivamente todos los filtros
   - Sanitizar inputs para prevenir inyecciones
   - Limitar rangos de fechas para prevenir DoS
   - Validar formato de emails

### Testing

1. **Unit Tests**
   - Todos los servicios con cobertura > 80%
   - Mocks de dependencias externas (ADT_MS, S3, SMTP)
   - Tests de validación de DTOs

2. **Integration Tests**
   - Flujo completo con servicios reales
   - Tests de caché
   - Tests de rate limiting

3. **E2E Tests**
   - Flujo completo desde request hasta PDF generado
   - Diferentes combinaciones de filtros
   - Manejo de errores

### Monitoreo

1. **Métricas Clave**
   - Tiempo de generación de reportes
   - Tasa de errores por fase
   - Uso de CPU/memoria de Puppeteer
   - Tamaño de PDFs generados

2. **Alertas**
   - Tiempo de generación > 10s
   - Tasa de errores > 5%
   - Fallo en envío de emails
   - Fallo en subida a S3

3. **Logs**
   - Log de inicio de cada reporte
   - Log de cada fase completada
   - Log de errores con stack traces
   - Log de performance (duración de cada fase)

### Documentación

1. **README del Módulo**
   - Descripción general
   - Guía de instalación
   - Variables de entorno requeridas
   - Ejemplos de uso

2. **API Docs**
   - Swagger/OpenAPI para endpoints
   - Ejemplos de requests/responses
   - Códigos de error y su significado
   - Rate limits y cuotas

3. **Guías Internas**
   - Cómo añadir nuevos filtros
   - Cómo personalizar templates
   - Cómo debuggear problemas comunes
   - Arquitectura de decisiones

---

## 📚 Referencias

### Documentación Interna

- [UPLOAD_MS_CONTEXT.md](./UPLOAD_MS_CONTEXT.md) - Contexto completo del microservicio
- [REPORTS_MODULE_README.md](./REPORTS_MODULE_README.md) - Documentación del módulo de reportes
- [ADT_MS/ETL_AND_QUERY_GUIDE.md](../ADT_MS/docs/ETL_AND_QUERY_GUIDE.md) - Guía de consultas a ADT_MS
- [ADT_MS/DATA_WAREHOUSE_ANALYSIS.md](../ADT_MS/docs/DATA_WAREHOUSE_ANALYSIS.md) - Análisis del Data Warehouse

### Tecnologías Utilizadas

- [NestJS Documentation](https://docs.nestjs.com/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Nodemailer Documentation](https://nodemailer.com/)

### ClickHouse y ADT_MS

- [ClickHouse Official Docs](https://clickhouse.com/docs/)
- Endpoint de métricas: `GET http://localhost:3002/adt/realtime-metrics`
- Tablas principales: `contractor_activity_15s`, `contractor_daily_metrics`, `session_summary`

---

## 📝 Notas Finales

Este documento representa un análisis completo del estado actual del microservicio `upload_ms` y una propuesta detallada para implementar el sistema de generación de reportes dinámicos en PDF.

**Última actualización:** 18 de Diciembre, 2025  
**Autor:** Análisis de sistema existente  
**Versión:** 1.0

Para cualquier duda o aclaración sobre la implementación, consultar la documentación de cada módulo o contactar al equipo de desarrollo.

---

**🎯 Objetivo Final:** Tener un sistema robusto, escalable y mantenible que permita generar reportes PDF profesionales de métricas de productividad con filtros dinámicos, almacenamiento en AWS S3 y distribución por email, todo integrado con el ecosistema ADT_MS y ClickHouse.
