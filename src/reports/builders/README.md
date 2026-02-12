# Builders de Reportes - UPLOAD_MS

## 📋 Descripción

Los builders son componentes especializados que transforman datos brutos de métricas (desde ADT_MS) en estructuras de datos enriquecidas y listas para generar reportes PDF.

## 🏗️ Arquitectura de Builders

```
ReportDataBuilder (Base)
    ├── IndividualReportBuilder (Reportes de un solo contractor)
    └── GroupReportBuilder (Reportes de múltiples contractors)
```

---

## 1️⃣ ReportDataBuilder (Base)

**Propósito**: Builder base que proporciona funcionalidad común para todos los reportes.

### Características

- Construye `ReportData` con summary y items
- Limpia filtros removiendo valores vacíos
- Normaliza métricas desde ADT_MS
- Calcula métricas agregadas del summary

### Uso

```typescript
import { ReportDataBuilder } from './builders';

// Inyectar en el servicio
constructor(private readonly builder: ReportDataBuilder) {}

// Usar
const reportData = this.builder.build(adtMetrics, metadata);
```

### Salida

```typescript
{
  summary: {
    from: "2025-12-01",
    to: "2025-12-15",
    metricsCount: 25,
    totalUsers: 25,
    totalTimeWorked: "1125:30:00",
    averageActivity: 87.3,
    averageProductivity: 82.5,
    totalActiveBeats: 45000,
    totalIdleBeats: 8000,
    totalKeyboardInputs: 125000,
    totalMouseClicks: 45000,
    mostActiveUser: { name: "John Doe", activityPercentage: 95.2 },
    leastActiveUser: { name: "Jane Smith", activityPercentage: 65.4 }
  },
  items: [
    {
      contractorId: "clx123abc",
      contractorName: "John Doe",
      jobPosition: "Senior Developer",
      clientName: "Acme Corp",
      teamName: "Backend Team",
      country: "CO",
      timeWorked: "45:30:00",
      activityPercentage: 92.5,
      productivityScore: 87.0
    },
    // ... más contractors
  ]
}
```

---

## 2️⃣ IndividualReportBuilder

**Propósito**: Genera reportes detallados para un **solo contractor**.

### Características

- ✅ Información completa del contractor
- ✅ Métricas extendidas (beats, keyboard, mouse, etc.)
- ✅ Análisis de rendimiento comparado con promedios
- ✅ Ranking y clasificación
- ✅ Insights de productividad (promedio diario, consistencia)

### Uso

```typescript
import { IndividualReportBuilder } from './builders';

// Inyectar en el servicio
constructor(private readonly individualBuilder: IndividualReportBuilder) {}

// Usar para reporte individual
const reportData = this.individualBuilder.buildIndividualReport(
  adtMetrics,
  metadata
);
```

### Cuándo Usar

- Usuario solicita reporte de un solo contractor
- Frontend envía `contractor_id` en los filtros
- Requiere análisis detallado de rendimiento individual

### Salida Extendida

```typescript
{
  summary: { /* igual que base builder */ },
  items: [ /* contractor data */ ],
  
  // 👤 Información del contractor
  contractor: {
    id: "clx123abc",
    name: "John Doe",
    jobPosition: "Senior Developer",
    clientName: "Acme Corp",
    teamName: "Backend Team",
    country: "CO"
  },
  
  // 📊 Métricas detalladas
  metrics: {
    timeWorked: "45:30:00",
    activityPercentage: 92.5,
    productivityScore: 87.0,
    totalBeats: 1800,
    activeBeats: 1665,
    idleBeats: 135,
    totalKeyboardInputs: 12500,
    totalMouseClicks: 4500,
    avgKeyboardPerMin: 45.5,
    avgMousePerMin: 16.3,
    effectiveWorkSeconds: 163800
  },
  
  // 🏆 Análisis de rendimiento
  performance: {
    isAboveAverageActivity: true,
    isAboveAverageProductivity: true,
    activityRank: "Top 10% - Exceptional",
    productivityRank: "Top 25% - Excellent"
  },
  
  // 💡 Insights
  insights: {
    mostProductiveDay: undefined,      // Requiere data diaria
    leastProductiveDay: undefined,     // Requiere data diaria
    averageDailyHours: "4:33",         // Promedio de horas por día
    consistencyScore: 56               // 0-100: qué tan consistente es
  }
}
```

### Rankings

| Desviación del Promedio | Clasificación |
|------------------------|---------------|
| +30% o más | Top 10% - Exceptional |
| +15% a +29% | Top 25% - Excellent |
| +5% a +14% | Above Average |
| -5% a +4% | Average |
| -15% a -6% | Below Average |
| Menos de -15% | Needs Improvement |

---

## 3️⃣ GroupReportBuilder

**Propósito**: Genera reportes comparativos de **múltiples contractors**.

### Características

- ✅ Rankings por actividad y productividad
- ✅ Distribución de contractors por rangos
- ✅ Comparación top vs bottom performers
- ✅ Insights del equipo/grupo
- ✅ Análisis de cohesión del grupo
- ✅ Descripción de filtros aplicados

### Uso

```typescript
import { GroupReportBuilder } from './builders';

// Inyectar en el servicio
constructor(private readonly groupBuilder: GroupReportBuilder) {}

// Usar para reporte grupal
const reportData = this.groupBuilder.buildGroupReport(
  adtMetrics,
  metadata
);
```

### Cuándo Usar

- Usuario solicita reporte de un equipo completo
- Frontend envía `team_id`, `client_id`, o filtros múltiples
- Requiere comparación entre contractors
- Necesita identificar top/bottom performers

### Salida Extendida

```typescript
{
  summary: { /* igual que base builder */ },
  items: [ /* contractors con deltas calculados */ ],
  
  // 🏆 Rankings
  rankings: {
    byActivity: [
      {
        contractorId: "clx123",
        contractorName: "John Doe",
        rank: 1,
        performanceLabel: "Exceptional Activity",
        activityPercentage: 95.2,
        activityDelta: +7.9,           // Diferencia con promedio
        productivityDelta: +4.5,
        // ... resto de campos
      },
      // ... más contractors ordenados por actividad
    ],
    byProductivity: [
      // ... contractors ordenados por productividad
    ]
  },
  
  // 📊 Distribución
  distribution: {
    activityDistribution: {
      high: 8,      // >= 80%
      medium: 12,   // 50-80%
      low: 5        // < 50%
    },
    productivityDistribution: {
      excellent: 5,           // >= 85%
      good: 10,               // 70-85%
      average: 7,             // 50-70%
      needsImprovement: 3     // < 50%
    }
  },
  
  // 🔍 Comparación
  comparison: {
    topPerformers: [
      // Top 10% de contractors
    ],
    bottomPerformers: [
      // Bottom 10% de contractors
    ],
    medianContractor: {
      // Contractor del medio (mediana)
    }
  },
  
  // 👥 Insights del equipo
  teamInsights: {
    totalContractors: 25,
    atRiskCount: 3,              // Productividad < 50%
    topPerformersCount: 5,       // Productividad >= 85%
    averageHoursWorked: "45:12:00",
    groupCohesion: 78            // 0-100: qué tan similar es el rendimiento
  },
  
  // 🔖 Filtros aplicados
  filters: {
    applied: {
      team_id: "team_dev_backend",
      country: "CO"
    },
    description: "Team: team_dev_backend | Country: CO"
  }
}
```

### Distribuciones

**Actividad**:
- **High**: >= 80%
- **Medium**: 50-80%
- **Low**: < 50%

**Productividad**:
- **Excellent**: >= 85%
- **Good**: 70-85%
- **Average**: 50-70%
- **Needs Improvement**: < 50%

### Cohesión del Grupo

Indica qué tan similar es el rendimiento entre contractors:

- **90-100**: Grupo muy cohesionado (rendimiento similar)
- **70-89**: Buena cohesión
- **50-69**: Cohesión moderada
- **< 50**: Baja cohesión (rendimientos muy dispares)

**Cálculo**: Basado en desviación estándar de productivityScore

---

## 🎯 Casos de Uso

### Caso 1: Reporte Individual de un Contractor

**Request desde Frontend**:
```typescript
{
  from: "2025-12-01",
  to: "2025-12-15",
  contractor_id: "clx123abc"
}
```

**Builder a Usar**: `IndividualReportBuilder`

**Resultado**: Reporte detallado con métricas extendidas, análisis de rendimiento, y comparación con promedios generales.

---

### Caso 2: Reporte de un Equipo Completo

**Request desde Frontend**:
```typescript
{
  from: "2025-12-01",
  to: "2025-12-15",
  team_id: "team_dev_backend"
}
```

**Builder a Usar**: `GroupReportBuilder`

**Resultado**: Reporte comparativo con rankings, distribución, top/bottom performers, y insights del equipo.

---

### Caso 3: Reporte Filtrado por Cliente y País

**Request desde Frontend**:
```typescript
{
  from: "2025-12-01",
  to: "2025-12-15",
  client_id: "acme_corp",
  country: "CO"
}
```

**Builder a Usar**: `GroupReportBuilder`

**Resultado**: Reporte comparativo de todos los contractors en Colombia que trabajan para Acme Corp.

---

### Caso 4: Reporte de All Contractors (Sin Filtros)

**Request desde Frontend**:
```typescript
{
  from: "2025-12-01",
  to: "2025-12-15"
}
```

**Builder a Usar**: `GroupReportBuilder`

**Resultado**: Reporte comparativo de todos los contractors en el período especificado.

---

## 🔧 Integración en ReportsService

### Ejemplo de Implementación

```typescript
import { Injectable } from '@nestjs/common';
import {
  IndividualReportBuilder,
  GroupReportBuilder,
  ReportMetadata,
} from './builders';
import { AdtMetricsResponse } from './interfaces/adt-metrics.interfaces';

@Injectable()
export class ReportsService {
  constructor(
    private readonly individualBuilder: IndividualReportBuilder,
    private readonly groupBuilder: GroupReportBuilder,
  ) {}

  async generateReport(filters: any) {
    // 1. Consultar ADT_MS
    const adtMetrics: AdtMetricsResponse = await this.fetchAdtMetrics(filters);

    // 2. Preparar metadata
    const metadata: ReportMetadata = {
      from: filters.from,
      to: filters.to,
      contractorId: filters.contractor_id,
      filters: filters,
      source: 'Upload_MS',
      environment: process.env.ENVIRONMENT,
    };

    // 3. Determinar tipo de reporte
    const isIndividualReport = !!filters.contractor_id && adtMetrics.items.length === 1;

    // 4. Usar builder apropiado
    let reportData;
    
    if (isIndividualReport) {
      reportData = this.individualBuilder.buildIndividualReport(
        adtMetrics,
        metadata,
      );
    } else {
      reportData = this.groupBuilder.buildGroupReport(
        adtMetrics,
        metadata,
      );
    }

    // 5. Generar PDF con reportData enriquecido
    const pdfBuffer = await this.generatePdf(reportData);

    // 6. Subir a S3 y retornar URL
    return this.uploadToS3(pdfBuffer);
  }
}
```

---

## 📝 Notas Importantes

### Métricas Extendidas (Individual Reports)

Algunas métricas detalladas (beats, keyboard, mouse) dependen de que ADT_MS las proporcione. Si ADT no las envía, los builders usan valores por defecto (0).

### Insights Diarios

Los campos `mostProductiveDay` y `leastProductiveDay` en `IndividualReportData.insights` requieren métricas diarias que actualmente no están disponibles. Se pueden implementar consultando `/adt/daily-metrics` en el futuro.

### Cohesión del Grupo

La fórmula de cohesión asume una desviación estándar máxima esperada de 25 puntos. Ajustar según datos reales del sistema.

### Performance

Los builders son síncronos y ligeros (solo transformaciones de datos). El cuello de botella es la consulta a ADT_MS, no los builders.

---

## ✅ Checklist de Implementación

- [x] ReportDataBuilder (base)
- [x] IndividualReportBuilder
- [x] GroupReportBuilder
- [x] Interfaces y tipos
- [x] Registro en ReportsModule
- [x] Documentación

**Pendiente**:
- [ ] Tests unitarios para cada builder
- [ ] Integración en ReportsService
- [ ] Templates Handlebars actualizados
- [ ] Validación con datos reales de ADT_MS
- [ ] Tests E2E completos
