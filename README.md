# 📤 UPLOAD Microservice

[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![AWS S3](https://img.shields.io/badge/AWS-S3-FF9900?logo=amazon-aws)](https://aws.amazon.com/s3/)
[![NATS](https://img.shields.io/badge/NATS-Messaging-27AAE1?logo=nats.io)](https://nats.io/)

Microservicio de gestión de archivos y generación de reportes PDF desarrollado con NestJS, especializado en almacenamiento S3 y reportes de productividad con campos dinámicos.

---

## 📋 Descripción

**UPLOAD_MS** es un microservicio híbrido (HTTP + NATS) que proporciona:

- 📂 **Gestión de archivos**: Upload, download y eliminación en AWS S3
- 📊 **Generación de reportes PDF**: Reportes profesionales de productividad con Puppeteer
- 🎨 **Selección dinámica de campos**: Personaliza qué columnas aparecen en los reportes
- 🔄 **Integración con ADT_MS**: Obtiene métricas de productividad en tiempo real
- ⚡ **Alto rendimiento**: Browser reutilizado, templates precompilados

---

## 🏗️ Arquitectura

### Stack Tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| Framework | NestJS 11.0.1 |
| Lenguaje | TypeScript 5.7.3 |
| Almacenamiento | AWS S3 (us-east-2) |
| Mensajería | NATS |
| PDF Generation | Puppeteer 22.15.0 |
| Templates | Handlebars 4.7.8 |
| Validación | Joi, class-validator |
| Package Manager | pnpm |

### Estructura del Proyecto

```
upload_ms/
├── config/              # Configuración y variables de entorno
├── docs/                # Documentación detallada
│   ├── DYNAMIC_FIELDS_GUIDE.md
│   ├── FLUJO_COMPLETO.md
│   └── CUESTIONARIO_CEO_REPORTES.md
├── src/
│   ├── common/          # Enums, filters compartidos
│   ├── decorators/      # Custom decorators (roles, user)
│   ├── guards/          # Auth & roles guards
│   ├── nats/            # Módulo NATS
│   ├── reports/         # 📊 Módulo de reportes
│   │   ├── builders/    # Construcción de datos
│   │   ├── dto/         # Data Transfer Objects
│   │   ├── interfaces/  # TypeScript interfaces
│   │   ├── mappers/     # Mapeo de datos ADT
│   │   ├── pdf/         # Generación PDF (Puppeteer)
│   │   ├── templates/   # Templates Handlebars
│   │   └── validators/  # Validadores personalizados
│   ├── s3/              # Módulo AWS S3
│   └── testing/         # 🧪 Utilidades de testing
│       ├── generators/  # Generadores de prueba
│       └── mock-data.ts # Datos de prueba
├── test/                # Tests E2E
└── reports/             # PDFs generados (gitignored)
```

---

## 🚀 Instalación

### Prerrequisitos

- Node.js >= 20
- pnpm >= 8
- AWS Account con acceso a S3
- NATS Server accesible

### Setup

```bash
# Clonar repositorio
git clone <repository-url>
cd UPLOAD_MS

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Compilar proyecto
pnpm build
```

### Variables de Entorno

```env
# Server
PORT=3006
ENVIRONMENT=development

# AWS S3
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=andes-workforce-s3

# NATS
NATS_SERVERS=nats://72.61.129.234:4222

# JWT (para guards)
JWT_SECRET=your_jwt_secret
```

---

## 💻 Uso

### Desarrollo

```bash
# Modo desarrollo con hot reload
pnpm run start:dev

# Modo debug
pnpm run start:debug
```

### Producción

```bash
# Compilar
pnpm build

# Ejecutar
pnpm run start:prod
```

### Testing

```bash
# Tests unitarios
pnpm test

# Tests E2E
pnpm test:e2e

# Coverage
pnpm test:cov

# 🧪 Test campos dinámicos
pnpm run test:dynamic-fields

# 📄 Generar PDFs de prueba
pnpm run generate:pdfs
```

---

## 📊 Módulo de Reportes

### Características

- ✅ **8 campos configurables**: Selecciona qué columnas mostrar
- ✅ **Templates Handlebars**: HTML profesional con estilos inline
- ✅ **Puppeteer optimizado**: Browser reutilizado para mejor performance
- ✅ **Upload automático a S3**: URLs firmadas con expiración
- ✅ **Integración ADT_MS**: Métricas en tiempo real

### Campos Disponibles

| Campo | Label | Requerido |
|-------|-------|-----------|
| `contractorName` | User | ✅ Sí |
| `jobPosition` | Job Position | ❌ No |
| `clientName` | Client | ❌ No |
| `teamName` | Team | ❌ No |
| `country` | Country | ❌ No |
| `timeWorked` | Time Worked | ✅ Sí |
| `activityPercentage` | Activity % | ❌ No |
| `productivityScore` | Productivity | ❌ No |

### Uso con NATS

#### Todos los campos (por defecto)

```typescript
natsClient.send('upload.reports.generate', {
  from: '2025-01-01',
  to: '2025-01-31',
  team_id: 'team-123',
  // selectedFields no especificado = todos los campos
});
```

#### Campos personalizados

```typescript
natsClient.send('upload.reports.generate', {
  from: '2025-01-01',
  to: '2025-01-31',
  team_id: 'team-123',
  selectedFields: [
    'contractorName',    // ✅ Requerido
    'timeWorked',        // ✅ Requerido
    'activityPercentage',
    'productivityScore',
  ],
});
```

#### Respuesta

```json
{
  "success": true,
  "pdfUrl": "https://andes-workforce-s3.s3.us-east-2.amazonaws.com/documents/2026-01-08/report_uuid.pdf",
  "metricsCount": 15,
  "generatedAt": "2026-01-08T15:30:45.123Z",
  "summary": {
    "totalUsers": 15,
    "averageActivity": 72.5,
    "totalTimeWorked": "120:30:00"
  }
}
```

---

## 🧪 Testing y Desarrollo

### Generadores de Prueba

El microservicio incluye utilidades de testing en `src/testing/`:

#### Test Campos Dinámicos

```bash
pnpm run test:dynamic-fields
```

Valida renderizado de templates con 6 combinaciones de campos diferentes.

#### Generador de PDFs

```bash
pnpm run generate:pdfs
```

Genera 6 PDFs de ejemplo:
- Standard Report (todos los campos)
- Essential Fields Report
- Performance Report
- Location Report
- Extended Report (10 usuarios)
- Individual Report

**Output**: `src/testing/outputs/*.pdf`

### Mock Data

Datos de prueba disponibles en `src/testing/mock-data.ts`:

```typescript
import { mockReportData, mockReportDataExtended } from './testing';

// 3 contractors básico
const data = mockReportData;

// 10 contractors extendido
const extendedData = mockReportDataExtended;
```

---

## 📚 Documentación

### Guías Principales

- **[DYNAMIC_FIELDS_GUIDE.md](docs/DYNAMIC_FIELDS_GUIDE.md)** - Guía completa de campos dinámicos
- **[FLUJO_COMPLETO.md](docs/FLUJO_COMPLETO.md)** - Diagrama de flujo visual completo
- **[IMPLEMENTACION_COMPLETADA.md](IMPLEMENTACION_COMPLETADA.md)** - Resumen de implementación
- **[UPLOAD_MS_CONTEXT.md](UPLOAD_MS_CONTEXT.md)** - Contexto del microservicio
- **[REPORTS_MODULE_README.md](REPORTS_MODULE_README.md)** - Módulo de reportes

### Documentación de Testing

- **[src/testing/README.md](src/testing/README.md)** - Guía de utilidades de testing

---

## 🔄 Integración con Ecosistema

Este microservicio forma parte del ecosistema **Andes Workforce**:

```
┌─────────────┐
│ API_GATEWAY │◄─── HTTP Requests
└──────┬──────┘
       │ NATS
       ▼
┌─────────────┐     ┌─────────────┐
│  UPLOAD_MS  │◄────┤   ADT_MS    │
│             │     │  (Metrics)  │
└──────┬──────┘     └─────────────┘
       │
       ▼
   ┌────────┐
   │ AWS S3 │
   └────────┘
```

### Microservicios Relacionados

- **API_GATEWAY**: Gateway principal (port 3000)
- **AUTH_MS**: Autenticación y autorización
- **ADT_MS**: Análisis de datos y métricas
- **EVENTS_MS**: Gestión de eventos
- **USER_MS**: Gestión de usuarios

Todos se comunican vía NATS en `72.61.129.234:4222`

---

## 🐛 Debugging

### Logs

```bash
# Logs en desarrollo
tail -f logs/*.log

# Puppeteer debug
DEBUG=puppeteer:* pnpm run start:dev
```

### Errores Comunes

#### Puppeteer no inicia

```bash
# Instalar dependencias del sistema (Ubuntu/Debian)
sudo apt-get install -y chromium-browser

# O reinstalar Puppeteer
pnpm add -D puppeteer
```

#### AWS S3 403 Forbidden

- Verificar credenciales en `.env`
- Confirmar permisos IAM para S3
- Validar región correcta (us-east-2)

#### NATS Connection Refused

- Verificar NATS_SERVERS en `.env`
- Confirmar firewall permite puerto 4222
- Validar NATS server activo

---

## 🤝 Contribución

### Workflow

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Convenciones

- **Commits**: Conventional Commits
- **Código**: ESLint + Prettier
- **Tests**: Cobertura mínima 80%

---

## 📄 Licencia

Este proyecto es privado y propiedad de **Andes Workforce**.

---

## 👥 Equipo

**Desarrollado por**: Andes Workforce Engineering Team  
**Última actualización**: Enero 8, 2026  
**Versión**: 0.0.1

---

## 🔗 Links Útiles

- [NestJS Documentation](https://docs.nestjs.com)
- [Puppeteer Documentation](https://pptr.dev/)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [AWS S3 SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html)
- [NATS Documentation](https://docs.nats.io/)

---

**🎉 ¡Happy Coding!**
