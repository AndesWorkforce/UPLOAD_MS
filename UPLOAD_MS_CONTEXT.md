# Upload Microservice - Contexto y Documentación

## 📋 Descripción General

El **Upload Microservice** es un microservicio desarrollado con NestJS que proporciona funcionalidades de gestión y almacenamiento de archivos mediante AWS S3. Su propósito principal es **almacenar reportes generados por el ADT_MS** (Analytics Data Transformation Microservice) y otros documentos relacionados con métricas de productividad.

Este servicio forma parte de un ecosistema de microservicios que se comunican a través de NATS (sistema de mensajería) y opera en **modo híbrido**: 
- **HTTP**: Para uploads directos de archivos
- **NATS**: Para comunicación con otros microservicios del ecosistema

## 🏗️ Arquitectura

### Stack Tecnológico

- **Framework**: NestJS 11.x
- **Lenguaje**: TypeScript 5.7.3
- **Node.js**: Compatible con Node.js moderno (ES2023)
- **Almacenamiento**: AWS S3
- **Mensajería**: NATS
- **Gestión de Paquetes**: pnpm
- **Testing**: Jest
- **Validación**: Joi
- **Linting**: ESLint 9.x con TypeScript ESLint

### Estructura del Proyecto

```
upload_ms/
├── src/
│   ├── config/           # Configuración y variables de entorno
│   │   ├── envs.ts      # Esquema de validación y exportación de envs
│   │   └── index.ts     # Punto de entrada de configuración
│   ├── s3/              # Módulo de AWS S3
│   │   ├── dto/         # Data Transfer Objects
│   │   │   ├── create-s3.dto.ts
│   │   │   └── update-s3.dto.ts
│   │   ├── entities/    # Entidades
│   │   │   └── s3.entity.ts
│   │   ├── s3.controller.ts   # Controlador con message patterns
│   │   ├── s3.service.ts      # Servicio con lógica de S3
│   │   └── s3.module.ts       # Módulo S3
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts    # Módulo raíz
│   └── main.ts          # Punto de entrada
├── test/                # Tests end-to-end
├── .env                 # Variables de entorno (no versionado)
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── nest-cli.json
```

## 🔧 Configuración

### Variables de Entorno

El microservicio utiliza las siguientes variables de entorno, validadas mediante Joi:

#### AWS S3
- `AWS_REGION`: Región de AWS (default: us-east-2)
- `AWS_S3_BUCKET`: Nombre del bucket S3
- `AWS_ACCESS_KEY_ID`: Access Key de AWS
- `AWS_SECRET_ACCESS_KEY`: Secret Key de AWS

#### Servidor
- `PORT`: Puerto del servicio (default: 3006)
- `ENVIRONMENT`: Entorno (development, production, staging)
- `DEV_LOGS`: Habilitar logs de desarrollo (boolean)

#### NATS (Mensajería)
- `NATS_HOST`: Host del servidor NATS
- `NATS_PORT`: Puerto de NATS
- `NATS_USERNAME`: Usuario de NATS
- `NATS_PASSWORD`: Contraseña de NATS

#### Seguridad
- `JWT_SECRET_PASSWORD`: Secreto para JWT

### Configuración Actual (.env)

```
AWS_REGION=us-east-2
AWS_S3_BUCKET=andes-workforce-s3
PORT=3006
NATS_HOST=72.61.129.234
NATS_PORT=4222
NATS_USERNAME=andes_nats
JWT_SECRET_PASSWORD=andesmetrics
DEV_LOGS=true
ENVIRONMENT=development
```

### Sistema de Validación

El archivo `src/config/envs.ts` implementa un sistema robusto de validación:

```typescript
- Esquema Joi que valida todas las variables requeridas
- Conversión automática de tipos (boolean, number)
- Valores por defecto para variables opcionales
- Lanza error si falta alguna variable requerida
- Exporta objeto envs con valores tipados
- Usa registerAs de NestJS para integración con ConfigModule
```

## 📦 Módulo S3

### S3Service

Responsable de la interacción con AWS S3:

```typescript
- Inicialización del cliente AWS S3
- Configuración automática desde ConfigService
- Validación de credenciales al iniciar
- Gestión del bucket configurado
- Region configurable (default: us-east-2)
```

**Estado Actual**: El servicio está inicializado pero los métodos de negocio (create, findAll, etc.) no están implementados.

### S3Controller

Controlador híbrido que soporta tanto HTTP como NATS:

**Endpoints HTTP**:
- `POST /s3/upload/image/:type`: Subir imágenes (max 5MB, formatos: jpg, jpeg, png, gif, webp)
- `POST /s3/upload/pdf`: Subir archivos PDF (max 5MB)
- `GET /s3/test-connection`: Probar conexión con S3

**Message Patterns NATS**:
- `upload.file`: Subir archivo desde otro microservicio (recibe buffer en base64)
- `upload.test-connection`: Probar conexión a S3 via NATS

**Características**:
- Validación de tipos de archivo con `ParseFilePipe`
- Validación de tamaño máximo (5MB)
- Soporte para carpetas personalizadas
- Soporte para claves de archivo explícitas

### DTOs

- **CreateS3Dto**: Actualmente vacío, pendiente de definir estructura
- **UpdateS3Dto**: Para actualizaciones, pendiente de definir

## 🔐 Seguridad

### Autenticación y Autorización (Implementado)

El microservicio utiliza un sistema de autenticación y autorización basado en guards y decorators, similar al API_GATEWAY:

#### Guards Globales
1. **AuthGuard**: Valida tokens JWT con AUTH_MS via NATS
   - Extrae token del header Authorization (Bearer token)
   - Valida con el microservicio AUTH_MS
   - Inyecta información del usuario en el request

2. **RolesGuard**: Valida permisos basados en roles
   - Verifica roles requeridos (Superadmin, TeamAdmin, Visualizer)
   - Soporte para clientes (`@AllowClient()`)
   - Permite rutas públicas (`@Public()`)

#### Decorators Disponibles
- `@Public()`: Marca rutas como públicas (sin autenticación)
- `@Roles(...roles)`: Requiere roles específicos
- `@AllowClient()`: Permite acceso a clientes
- `@CurrentUser()`: Inyecta usuario actual en parámetros

#### Configuración de Rutas
```typescript
// Nivel de controlador: Todas las rutas requieren Superadmin o TeamAdmin
@Roles(Role.Superadmin, Role.TeamAdmin)
@Controller('s3')

// Ruta pública (sin autenticación)
@Public()
@Get('test-connection')

// Ruta protegida (heredada del controlador)
@Post('upload/report')
```

### Credenciales AWS
- Access Key y Secret Key configuradas en variables de entorno
- No versionadas en el repositorio
- Validación obligatoria al iniciar el servicio

### Integración NATS
- Conectado al servidor NATS para validación de tokens
- Comunicación con AUTH_MS para autenticación
- Message patterns con prefijo por ambiente (dev/prod/staging)

## 🎯 Patrones y Arquitectura

### Patrón de Microservicios
- Comunicación asíncrona mediante NATS
- Message Patterns para operaciones CRUD
- Servicio desacoplado e independiente

### Inyección de Dependencias
- Uso extensivo de decoradores NestJS (@Injectable, @Module)
- ConfigService para gestión centralizada de configuración
- Módulos lazy-loading compatibles

### Configuración Global
- ConfigModule como módulo global (isGlobal: true)
- Acceso a configuración en cualquier parte del servicio

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
pnpm start:dev          # Modo watch con hot-reload
pnpm start:debug        # Modo debug

# Producción
pnpm build              # Compilar a JavaScript
pnpm start:prod         # Ejecutar versión compilada

# Calidad de Código
pnpm lint               # Ejecutar ESLint con fix automático
pnpm format             # Formatear código con Prettier

# Testing
pnpm test               # Tests unitarios
pnpm test:watch         # Tests en modo watch
pnpm test:cov           # Coverage de tests
pnpm test:e2e           # Tests end-to-end
```
 en modo híbrido (HTTP + NATS)
   - Sistema de variables de entorno con validación Joi
   - Integración con AWS SDK v2
   - Configuración de ESLint y Prettier
   - Estructura de módulos modular

2. **Configuración de Servicios Externos**
   - Conexión con AWS S3 (bucket: andes-workforce-s3)
   - Transporte NATS configurado
   - Sistema de logging por niveles (dev/prod)

3. **S3Service - Funcionalidades Implementadas**
   - ✅ uploadFile(): Subida de archivos con UUID
   - ✅ testConnection(): Verificación de conectividad S3
   - ✅ getBasePath(): Rutas por tipo de archivo
   - ✅ getPublicUrl(): Generación de URLs públicas
   - ✅ Soporte para carpetas personalizadas
   - ✅ Soporte para claves explícitas

4. **S3Controller - Endpoints Implementados**
   - ✅ HTTP: POST /s3/upload/image/:type
   - ✅ HTTP: POST /s3/upload/pdf
   - ✅ HTTP: GET /s3/test-connection
   - ✅ NATS: upload.file (con buffer base64)
   - Features Adicionales de S3**
   - Método deleteFile(): Eliminar archivos de S3
   - Método listFiles(): Listar archivos por prefijo
   - Método downloadFile(): Descargar archivos
   - Generación de URLs firmadas (presigned URLs)
   - Gestión de metadatos personalizados

2. **Integración con ADT_MS**
   - Listener para recibir solicitudes de generación de reportes
   - Integración con realtime-metrics.service del ADT_MS
   - Generación automática de reportes PDF/Excel
   - Notificaciones de reporte generado

3. **Testing**
   - Tests unitarios para S3Service
   - Tests e2e para flujos HTTP
   - Tests de integración con NATS
   - Mocks de AWS SDK

4. **Documentación**
   - Swagger/OpenAPI documentation
   - Ejemplos de uso de endpoints HTTP
   - Ejemplos de uso de message patterns
   - Diagramas de flujo

5. **Seguridad y Optimización**
   - Validas de Datos

### Flujo HTTP (Upload Directo)
```
1. Cliente → POST /s3/upload/image o /s3/upload/pdf
2. S3Controller valida archivo (tipo, tamaño)
3. S3Controller → S3Service.uploadFile()
4. S3Service genera UUID para nombre único
5. S3Service → AWS S3 SDK (putObject)
6. AWS S3 almacena archivo
7. S3Service genera URL pública
8. Cliente recibe URL del archivo
```

### Flujo NATS (Desde Microservicios)
```
1. ADT_MS genera reporte → Emite mensaje 'upload.file'
2. Upload MS recibe mensaje via NATS
3. S3Controller decodifica buffer base64
4. S3Controller → S3Service.uploadFile()
5. S3Service → AWS S3 SDK
6. AWS S3 almacena archivo
7. S3Service retorna URL via NATS
8. ADT_MS recibe URL del reporte generado
```

### Flujo Propuesto: Generación de Reportes
```
1. Usuario solicita reporte → API Gateway
2. API Gateway → ADT_MS ('generate.report')
### Prioridad Alta
1. **Integración con ADT_MS para Reportes**:
   - Crear ReportsModule para generación de reportes
   - Implementar listeners para solicitudes de reportes
   - Integrar con librería de generación PDF (puppeteer/pdfkit)
   - Implementar templates de reportes

2. **Seguridad en Endpoints HTTP**:
   - Agregar guards JWT para proteger endpoints
   - Validar tokens desde AUTH_MS
   - Implementar rate limiting

3. **Implementar métodos adicionales de S3**:
   - deleteFile(key): Eliminar archivos
   - listFiles(prefix): Listar por carpeta
   - getSignedUrl(key, expiration): URLs temporales

### Prioridad Media
4. **Manejo de Errores Robusto**:
   - Exception filters personalizados
   - Retry policies para operaciones S3
   - Logging estructurado de errores

5. **Optimizaciones**:
   - Compresión de imágenes antes de subir
   - Generación de thumbnails
   - Validación de virus/malware

### Prioridad Baja
6. **Testing Completo**:
   - Unit tests con mocks de AWS
   - Integration tests con LocalStack
   - E2E tests con NATS real

7. **Documentación y Monitoreo**:
   - Swagger/OpenAPI
   - Métricas de uso de S3
   - Dashboard de archivos subidoprocesa respuesta
7. S3Controller envía respuesta via NATS
8. Cliente/Gateway recibe respuesta
```

## 🚀 Próximos Pasos Recomendados

1. **Implementar métodos de S3Service**:
   - uploadFile(file, key)
   - downloadFile(key)
   - deleteFile(key)
   - listFiles(prefix)
   - getSignedUrl(key, expiration)

2. **Definir DTOs con validación**:
   - Agregar class-validator
   - Validar tipos de archivo permitidos
   - Límites de tamaño

3. **Conectar NATS como transport**:
   - Modificar main.ts para usar microservice transport
   - Configurar opciones de NATS

4. **Implementar manejo de errores**:
   - Exception filters personalizados
   - Logging estructurado
   - Retry policies

5. **Tests**:
   - Unit tests con mocks de AWS
   - Integration tests con LocalStack
   - E2E tests

## 🔍 Observaciones Técnicas

### TypeScript Configuration
- Uso de `module: "nodenext"` para soporte ESM moderno
- Decoradores habilitados para NestJS
- Strict null checks activado
- Source maps para debugging

### ESLint Configuration
- Configuración modular con typescript-eslint
- Reglas personalizadas de naming-convention
- Integración con Prettier
- Excepciones específicas para bibliotecas (Joi, AWS)

### Dependencias Clave
- `@nestjs/config`: Gestión de configuración
- `aws-sdk`: SDK v2 de AWS (considerar migrar a v3)
- `joi`: Validación de esquemas
- `multer`: Procesamiento de archivos multipart

## 📝 Notas de Desarrollo

### Problemas Resueltos
1. ✅ Error de naming-convention con imports "AWS" y "Joi"
2. ✅ Errores de unsafe operations con tipos de Joi
3. ✅ Path incorrecto en export de config/index.ts (envs → env)

### Consideraciones
- El bucket S3 "andes-workforce-s3" debe existir en us-east-2
- Las credenciales AWS deben tener permisos S3 apropiados
- NATS debe estar accesible en el host configurado
- Puerto 3006 debe estar disponible para el servicio

## 🔗 Integración con el Ecosistema

Este microservicio forma parte de un sistema mayor que incluye:
- API_GATEWAY: Gateway principal
- AUTH_MS: Autenticación y autorización
- ADT_MS: Análisis de datos
- EVENTS_MS: Gestión de eventos
- USER_MS: Gestión de usuarios

Todos se comunican a través de NATS en el host 72.61.129.234:4222.

## 📊 Módulo de Reportes (Nuevo)

### Características Principales

El microservicio ahora incluye un **módulo completo de generación de reportes PDF** con:

- ✅ **Generación de PDFs profesionales** usando Puppeteer
- ✅ **Templates Handlebars** con estilos personalizados
- ✅ **Selección dinámica de campos** (nueva funcionalidad)
- ✅ **Integración con ADT_MS** para obtener métricas
- ✅ **Upload automático a S3** con URLs firmadas
- ✅ **Optimización de rendimiento** (browser reutilizado)

### Campos Disponibles

| Campo | Label | Requerido |
|-------|-------|-----------|
| `contractorName` | User | ✅ Sí |
| `jobPosition` | Job Position | No |
| `clientName` | Client | No |
| `teamName` | Team | No |
| `country` | Country | No |
| `timeWorked` | Time Worked | ✅ Sí |
| `activityPercentage` | Activity % | No |
| `productivityScore` | Productivity | No |

### Uso

```typescript
// Todos los campos (por defecto)
natsClient.send('upload.reports.generate', {
  from: '2025-01-01',
  to: '2025-01-31',
  team_id: 'team-123'
});

// Campos personalizados
natsClient.send('upload.reports.generate', {
  from: '2025-01-01',
  to: '2025-01-31',
  selectedFields: ['contractorName', 'timeWorked', 'activityPercentage']
});
```

### Documentación Detallada

Para más información sobre el módulo de reportes:
- [DYNAMIC_FIELDS_GUIDE.md](docs/DYNAMIC_FIELDS_GUIDE.md) - Guía de campos dinámicos
- [REPORTS_MODULE_README.md](REPORTS_MODULE_README.md) - Documentación del módulo

---

**Última Actualización**: Enero 8, 2026  
**Versión**: 0.0.1  
**Estado**: En Desarrollo (Módulo de Reportes: ✅ Listo para Frontend)
