# 📊 Reportes con Campos Dinámicos

## ✨ Nueva Funcionalidad

El sistema de reportes ahora soporta **selección dinámica de campos**, permitiendo personalizar qué columnas aparecen en el PDF generado.

## 🔧 Cambios Implementados

### 1. **DTO Actualizado** ([report-request.dto.ts](src/reports/dto/report-request.dto.ts))

```typescript
export class ReportRequestDto {
  // ... campos existentes
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedFields?: string[]; // ✨ NUEVO
}
```

### 2. **Campos Disponibles** ([report.interfaces.ts](src/reports/interfaces/report.interfaces.ts))

```typescript
export const AVAILABLE_REPORT_FIELDS: FieldConfig[] = [
  { key: 'contractorName', label: 'User', required: true },
  { key: 'jobPosition', label: 'Job Position', required: false },
  { key: 'clientName', label: 'Client', required: false },
  { key: 'teamName', label: 'Team', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'timeWorked', label: 'Time Worked', required: true },
  { key: 'activityPercentage', label: 'Activity %', required: false },
  { key: 'productivityScore', label: 'Productivity', required: false },
];
```

**Campos Requeridos:**
- ✅ `contractorName` - Siempre debe incluirse
- ✅ `timeWorked` - Siempre debe incluirse

**Campos Opcionales:**
- `jobPosition`, `clientName`, `teamName`, `country`, `activityPercentage`, `productivityScore`

### 3. **Template Service** ([template.service.ts](src/reports/templates/template.service.ts))

Ahora acepta `selectedFields` como parámetro opcional:

```typescript
renderProductivityReport(
  data: ReportData,
  selectedFields?: string[], // ✨ NUEVO parámetro
): string
```

**Comportamiento:**
- Si `selectedFields` no se proporciona → Muestra **todos los campos** (comportamiento por defecto)
- Si `selectedFields` se proporciona → Muestra **solo los campos especificados**

### 4. **Template Handlebars** ([productivity-report.hbs](src/reports/templates/productivity-report.hbs))

Usa condicionales `{{#if showField_xxx}}` para renderizar columnas dinámicamente:

```handlebars
<thead>
  <tr>
    {{#if showField_contractorName}}
    <th>User</th>
    {{/if}}
    {{#if showField_jobPosition}}
    <th>Job Position</th>
    {{/if}}
    <!-- ... más campos -->
  </tr>
</thead>
```

## 📡 Uso con NATS

### Ejemplo 1: Todos los campos (por defecto)

```typescript
natsClient.send('upload.reports.generate', {
  from: '2025-01-01',
  to: '2025-01-31',
  team_id: 'team-123',
  // selectedFields no especificado = mostrar todos
});
```

### Ejemplo 2: Solo campos esenciales

```typescript
natsClient.send('upload.reports.generate', {
  from: '2025-01-01',
  to: '2025-01-31',
  team_id: 'team-123',
  selectedFields: [
    'contractorName',
    'timeWorked',
    'activityPercentage'
  ]
});
```

### Ejemplo 3: Vista de performance

```typescript
natsClient.send('upload.reports.generate', {
  from: '2025-01-01',
  to: '2025-01-31',
  selectedFields: [
    'contractorName',
    'jobPosition',
    'activityPercentage',
    'productivityScore'
  ]
});
```

### Ejemplo 4: Vista de ubicación

```typescript
natsClient.send('upload.reports.generate', {
  from: '2025-01-01',
  to: '2025-01-31',
  selectedFields: [
    'contractorName',
    'country',
    'clientName',
    'teamName'
  ]
});
```

## 🧪 Testing

Ejecuta el script de prueba:

```bash
node scripts/test-dynamic-fields.js
```

**Output esperado:**
```
🧪 Test 1: Todos los campos
✅ HTML generado: 7565 caracteres
   Columnas visibles: 8

🧪 Test 2: Solo campos esenciales
✅ HTML generado: 6979 caracteres
   Columnas visibles: 3

✨ Todos los tests pasaron exitosamente!
```

## 🎯 Casos de Uso

### 📊 Reporte Ejecutivo (mínimo)
```typescript
selectedFields: ['contractorName', 'timeWorked', 'activityPercentage']
```

### 📈 Reporte de Performance Detallado
```typescript
selectedFields: [
  'contractorName',
  'jobPosition',
  'timeWorked',
  'activityPercentage',
  'productivityScore'
]
```

### 🌍 Reporte de Distribución Geográfica
```typescript
selectedFields: ['contractorName', 'country', 'clientName', 'teamName', 'timeWorked']
```

### 👔 Reporte por Cliente
```typescript
selectedFields: ['contractorName', 'clientName', 'jobPosition', 'activityPercentage']
```

## ⚠️ Validaciones

El sistema valida:
- ✅ `selectedFields` debe ser un array de strings
- ✅ Cada elemento debe ser un string válido
- ✅ Si está vacío, se usan todos los campos

**Campos inválidos son ignorados silenciosamente.**

## 🔄 Retrocompatibilidad

Los reportes existentes **siguen funcionando sin cambios**:
- Si no se envía `selectedFields` → Se muestran todos los campos
- No requiere actualización de código existente
- Totalmente compatible con versiones anteriores

## 📝 Próximos Pasos

### Para el Frontend (ExportPdfModal):
1. Crear componente modal con checkboxes para cada campo
2. Enviar array `selectedFields` al API Gateway
3. Llamar endpoint NATS con los campos seleccionados

### Para el API Gateway:
1. Crear endpoint `POST /reports/export-pdf`
2. Validar `selectedFields` en el DTO
3. Reenviar al UPLOAD_MS vía NATS

## 📊 Estructura del Payload

```typescript
interface ExportPdfRequest {
  from: string;              // ISO date
  to: string;                // ISO date
  contractor_id?: string;    // Optional
  name?: string;
  country?: string;
  client_id?: string;
  team_id?: string;
  job_position?: string;
  useCache?: boolean;
  selectedFields?: string[]; // ✨ NUEVO
}
```

## 🎨 Ejemplo de UI (Modal)

```typescript
// Estado del modal
const [selectedFields, setSelectedFields] = useState([
  'contractorName', // requerido
  'timeWorked',     // requerido
  'activityPercentage',
  'productivityScore',
]);

// Al exportar
const exportPdf = async () => {
  await reportsService.exportPdf({
    from: filters.from,
    to: filters.to,
    ...otherFilters,
    selectedFields,
  });
};
```

## ✅ Checklist de Implementación

- [x] Agregar `selectedFields` a ReportRequestDto
- [x] Modificar TemplateService para campos dinámicos
- [x] Actualizar template .hbs con condicionales
- [x] Crear configuración de campos disponibles
- [x] Implementar flags de visibilidad
- [x] Testing con script de prueba
- [x] Documentación completa
- [ ] Crear ExportPdfModal en frontend
- [ ] Endpoint en API Gateway
- [ ] Integración end-to-end

---

**🎉 El microservicio UPLOAD_MS está listo para recibir campos dinámicos!**
