# 🔄 Flujo Completo: Export PDF con Campos Dinámicos

## 📊 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                   │
│  (SOFTWARE_DEVELOPMEN_CLIENT)                                       │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ 1. Usuario click "Export PDF"
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│  📋 ExportPdfModal                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ☑ User (requerido)                                           │   │
│  │ ☑ Job Position                                               │   │
│  │ ☑ Client                                                      │   │
│  │ ☑ Team                                                        │   │
│  │ ☐ Country                                                     │   │
│  │ ☑ Time Worked (requerido)                                    │   │
│  │ ☑ Activity %                                                  │   │
│  │ ☑ Productivity                                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  [Select All] [Deselect All]          [Cancel] [Export PDF]        │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ 2. onExport(selectedFields)
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│  packages/api/reports/reports.service.ts                            │
│                                                                      │
│  exportPdf({                                                         │
│    from: '2025-01-01',                                              │
│    to: '2025-01-31',                                                │
│    team_id: 'team-123',                                             │
│    selectedFields: [                                                │
│      'contractorName',                                              │
│      'jobPosition',                                                 │
│      'timeWorked',                                                  │
│      'activityPercentage',                                          │
│      'productivityScore'                                            │
│    ]                                                                │
│  })                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ 3. POST /api/reports/export-pdf
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                   │
│                       (port 3000)                                    │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ 4. NATS: "upload.reports.generate"
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      UPLOAD_MS ✅                                    │
│                      (port 3006)                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ 1. ReportsListener                                             │ │
│  │    └─> Recibe mensaje NATS                                     │ │
│  │                                                                 │ │
│  │ 2. ReportsService.generateReport(dto)                          │ │
│  │    ├─> Extrae selectedFields del DTO                           │ │
│  │    ├─> Valida fechas                                            │ │
│  │    └─> Obtiene métricas de ADT_MS                              │ │
│  │                                                                 │ │
│  │ 3. TemplateService.renderProductivityReport(data, selectedFields)│ │
│  │    ├─> createFieldVisibilityFlags(selectedFields)              │ │
│  │    │   └─> { showField_contractorName: true,                   │ │
│  │    │         showField_jobPosition: true,                       │ │
│  │    │         showField_country: false, ... }                    │ │
│  │    │                                                             │ │
│  │    └─> Template Handlebars                                      │ │
│  │        {{#if showField_contractorName}}                         │ │
│  │          <th>User</th>                                           │ │
│  │        {{/if}}                                                   │ │
│  │                                                                 │ │
│  │ 4. ReportPdfService.generatePdf(html)                          │ │
│  │    └─> Puppeteer genera PDF                                     │ │
│  │                                                                 │ │
│  │ 5. S3Service.uploadBuffer(pdfBuffer)                           │ │
│  │    └─> Upload a AWS S3                                          │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ 5. Return { pdfUrl, metricsCount, ... }
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ 6. Response JSON
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                    │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  window.open(response.pdfUrl, '_blank')                        │ │
│  │  toast.success('PDF generado exitosamente')                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ↓
                    🎉 Usuario descarga el PDF
```

---

## 📦 Payload Completo

### Request (Frontend → API Gateway)

```json
{
  "from": "2025-01-01",
  "to": "2025-01-31",
  "team_id": "team-engineering",
  "client_id": "client-acme",
  "useCache": true,
  "selectedFields": [
    "contractorName",
    "jobPosition",
    "clientName",
    "teamName",
    "timeWorked",
    "activityPercentage",
    "productivityScore"
  ]
}
```

### Request (API Gateway → UPLOAD_MS via NATS)

```typescript
natsClient.send('upload.reports.generate', {
  from: '2025-01-01',
  to: '2025-01-31',
  team_id: 'team-engineering',
  client_id: 'client-acme',
  useCache: true,
  selectedFields: [
    'contractorName',
    'jobPosition',
    'clientName',
    'teamName',
    'timeWorked',
    'activityPercentage',
    'productivityScore',
  ],
});
```

### Response (UPLOAD_MS → API Gateway → Frontend)

```json
{
  "success": true,
  "pdfUrl": "https://andes-workforce-s3.s3.us-east-2.amazonaws.com/documents/2026-01-08/report_a1b2c3d4.pdf?X-Amz-Algorithm=...",
  "metricsCount": 15,
  "generatedAt": "2026-01-08T15:30:45.123Z",
  "environment": "production",
  "source": "adt.getAllRealtimeMetrics",
  "summary": {
    "from": "2025-01-01T00:00:00.000Z",
    "to": "2025-01-31T23:59:59.999Z",
    "totalUsers": 15,
    "totalTimeWorked": "120:30:00",
    "averageActivity": 72.5,
    "averageProductivity": 85.3,
    "totalActiveBeats": 180000,
    "totalIdleBeats": 45000,
    "totalKeyboardInputs": 500000,
    "totalMouseClicks": 250000,
    "mostActiveUser": {
      "name": "John Doe",
      "activityPercentage": 95
    },
    "leastActiveUser": {
      "name": "Jane Smith",
      "activityPercentage": 45
    },
    "metricsCount": 15,
    "environment": "production",
    "source": "adt.getAllRealtimeMetrics",
    "filters": {
      "team_id": "team-engineering",
      "client_id": "client-acme"
    }
  }
}
```

---

## 🎨 PDF Generado - Vista Previa

### Con todos los campos:
```
┌────────────────────────────────────────────────────────────────┐
│  📊 Productivity Report                                        │
│  Period: 1/1/2025 - 1/31/2025                                  │
│  📈 Metrics: 15  🌍 Env: production  🔌 Source: adt.all...     │
├────────────────────────────────────────────────────────────────┤
│  📊 Summary Metrics                                            │
│  ┌──────────┬──────────┬──────────┬──────────┐               │
│  │ 15 Users │ 120:30:00│  72.5%   │   85.3   │               │
│  └──────────┴──────────┴──────────┴──────────┘               │
├────────────────────────────────────────────────────────────────┤
│  👥 Activity Details (15 users)                                │
│  ┌──────┬────────┬────────┬──────┬────────┬──────┬──────┬───┐│
│  │User  │Job Pos │Client  │Team  │Country │Time  │Act % │Pro││
│  ├──────┼────────┼────────┼──────┼────────┼──────┼──────┼───┤│
│  │John  │Sr Dev  │Acme    │Eng   │USA     │8:30  │95%   │92 ││
│  │Jane  │FE Dev  │Tech    │Prod  │Canada  │8:00  │45%   │58 ││
│  │...   │...     │...     │...   │...     │...   │...   │...││
│  └──────┴────────┴────────┴──────┴────────┴──────┴──────┴───┘│
└────────────────────────────────────────────────────────────────┘
```

### Con campos seleccionados (User, Time, Activity):
```
┌────────────────────────────────────────────────────────────────┐
│  📊 Productivity Report                                        │
│  Period: 1/1/2025 - 1/31/2025                                  │
│  📈 Metrics: 15  🌍 Env: production  🔌 Source: adt.all...     │
├────────────────────────────────────────────────────────────────┤
│  📊 Summary Metrics                                            │
│  ┌──────────┬──────────┬──────────┬──────────┐               │
│  │ 15 Users │ 120:30:00│  72.5%   │   85.3   │               │
│  └──────────┴──────────┴──────────┴──────────┘               │
├────────────────────────────────────────────────────────────────┤
│  👥 Activity Details (15 users)                                │
│  ┌──────────────────┬──────────────┬──────────────┐          │
│  │ User             │ Time         │ Activity     │          │
│  ├──────────────────┼──────────────┼──────────────┤          │
│  │ John Doe         │ 8:30:00      │ 95%          │          │
│  │ Jane Smith       │ 8:00:00      │ 45%          │          │
│  │ Bob Johnson      │ 8:00:00      │ 65%          │          │
│  │ ...              │ ...          │ ...          │          │
│  └──────────────────┴──────────────┴──────────────┘          │
└────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Tiempo de Generación

| Componente | Tiempo Estimado |
|-----------|-----------------|
| Frontend Modal | < 100ms |
| API Gateway | < 50ms |
| NATS Message | < 10ms |
| ADT Fetch | 500ms - 2s |
| Template Render | < 100ms |
| PDF Generation | 2s - 5s |
| S3 Upload | 500ms - 1s |
| **TOTAL** | **~3s - 8s** |

---

## 🔒 Seguridad

### Validaciones en UPLOAD_MS:
- ✅ Validación de fechas (formato ISO)
- ✅ Validación de arrays (selectedFields)
- ✅ Validación de strings (cada campo)
- ✅ Sanitización de filtros

### Validaciones en API Gateway:
- ✅ Autenticación JWT
- ✅ Autorización por roles (Superadmin, TeamAdmin)
- ✅ Rate limiting
- ✅ Validación de DTOs

### AWS S3:
- ✅ URLs firmadas (tiempo limitado)
- ✅ Bucket privado
- ✅ Encriptación en tránsito

---

## 🎯 Casos de Uso Reales

### 1. Reporte Ejecutivo (CEO/Director)
**Campos**: `contractorName`, `timeWorked`, `activityPercentage`  
**Razón**: Vista simple y clara de productividad general

### 2. Reporte de RH
**Campos**: `contractorName`, `jobPosition`, `clientName`, `teamName`, `timeWorked`  
**Razón**: Análisis de asignaciones y estructura organizacional

### 3. Reporte de Performance Review
**Campos**: `contractorName`, `jobPosition`, `activityPercentage`, `productivityScore`  
**Razón**: Evaluaciones de desempeño individual

### 4. Reporte de Billing
**Campos**: `contractorName`, `clientName`, `timeWorked`  
**Razón**: Facturación por horas trabajadas

### 5. Reporte Geográfico
**Campos**: `contractorName`, `country`, `clientName`, `teamName`  
**Razón**: Análisis de distribución geográfica del equipo

---

## 📈 Métricas de Éxito

Para medir el éxito de esta implementación:

- ✅ **Reducción en tiempo de generación**: < 10 segundos
- ✅ **Flexibilidad**: 8 campos configurables
- ✅ **Adopción**: > 80% de reportes usan campos personalizados
- ✅ **Satisfacción**: Feedback positivo de usuarios
- ✅ **Retrocompatibilidad**: 0 reportes rotos

---

**🎉 Sistema listo para producción!**
