# Testing Utilities

This directory contains testing utilities for the UPLOAD_MS microservice, specifically for the reports generation module.

## 📁 Structure

```
src/testing/
├── index.ts                          # Main entry point
├── mock-data.ts                      # Mock data for testing
├── generators/
│   ├── test-dynamic-fields.generator.ts  # Tests dynamic field selection
│   └── pdf.generator.ts              # Generates sample PDFs
└── outputs/                          # Generated test files (gitignored)
```

## 🧪 Testing Modules

### Mock Data (`mock-data.ts`)

Contains realistic mock data for testing report generation:

- **`mockReportData`**: Basic 3-contractor dataset
- **`mockReportDataExtended`**: Extended 10-contractor dataset
- **`mockIndividualReportData`**: Single contractor report data

### Dynamic Fields Generator (`generators/test-dynamic-fields.generator.ts`)

Tests template rendering with different field combinations:

```bash
# Run from project root
npm run test:dynamic-fields
# or
pnpm test:dynamic-fields
```

**Test Cases:**
1. All Fields (8 fields)
2. Essential Fields (3 fields)
3. Performance Metrics (3 fields)
4. Location View (4 fields)
5. Organizational View (5 fields)
6. Time Tracking (3 fields)

### PDF Generator (`generators/pdf.generator.ts`)

Generates sample PDFs for manual testing:

```bash
# Run from project root
npm run generate:pdfs
# or
pnpm generate:pdfs
```

**Generated Reports:**
- Standard Report (all fields)
- Essential Fields Report
- Performance Report
- Location Report
- Extended Report (10 users)
- Individual Report

## 🚀 Usage

### From TypeScript (in development)

```typescript
import { runDynamicFieldsTests, PdfGenerator } from './testing';

// Run dynamic fields tests
await runDynamicFieldsTests();

// Generate PDFs
const generator = new PdfGenerator();
await generator.initialize();
await generator.generateAllReports();
await generator.cleanup();
```

### Adding to package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test:dynamic-fields": "ts-node -r tsconfig-paths/register src/testing/generators/test-dynamic-fields.generator.ts",
    "generate:pdfs": "ts-node -r tsconfig-paths/register src/testing/generators/pdf.generator.ts"
  }
}
```

## 📊 Output

All generated files are saved to `src/testing/outputs/` (gitignored):

```
src/testing/outputs/
├── standard-report-1704729600000.pdf
├── custom-essential-1704729601000.pdf
├── custom-performance-1704729602000.pdf
├── custom-location-1704729603000.pdf
├── extended-report-1704729604000.pdf
└── individual-report-1704729605000.pdf
```

## 🎯 Purpose

These testing utilities serve multiple purposes:

1. **Validation**: Ensure template rendering works with dynamic field selection
2. **Development**: Generate sample PDFs during feature development
3. **Documentation**: Provide visual examples of different report types
4. **Debugging**: Quickly test changes without full microservice setup

## ⚙️ Dependencies

Testing utilities use the same services as the production code:

- `TemplateService` - Handlebars template rendering
- `ReportPdfService` - Puppeteer PDF generation
- Mock data complies with `ReportData` interface

## 🔧 Development Notes

### Adding New Test Cases

To add a new test case to dynamic fields generator:

```typescript
const testCases: TestCase[] = [
  // ... existing cases
  {
    name: 'Your Custom Test',
    description: 'What this test validates',
    selectedFields: ['contractorName', 'yourField'],
  },
];
```

### Adding New Mock Data

To add new mock datasets:

```typescript
export const mockYourDataset: ReportData = {
  summary: { /* ... */ },
  items: [ /* ... */ ],
};
```

### Generating Custom PDFs

```typescript
const generator = new PdfGenerator();
await generator.initialize();

// Custom field selection
await generator.generateCustomFieldsReport(
  ['contractorName', 'timeWorked'],
  'custom-suffix'
);

await generator.cleanup();
```

## 🚨 Important Notes

- **Output directory is gitignored**: Generated PDFs won't be committed
- **Services auto-initialize**: No manual setup needed
- **Cleanup is automatic**: Puppeteer browser closes properly
- **TypeScript native**: No compilation needed with ts-node

## 🐛 Troubleshooting

### "Cannot find module" errors

Ensure you have tsconfig-paths installed:

```bash
npm install -D tsconfig-paths ts-node
```

### Puppeteer errors

If Puppeteer fails to launch:

```bash
# Install dependencies (Linux)
sudo apt-get install -y chromium-browser

# Or use bundled Chromium
npm install puppeteer
```

### Memory issues with large datasets

Increase Node.js memory limit:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run generate:pdfs
```

## 📚 Related Documentation

- [DYNAMIC_FIELDS_GUIDE.md](../../docs/DYNAMIC_FIELDS_GUIDE.md) - Dynamic fields implementation
- [FLUJO_COMPLETO.md](../../docs/FLUJO_COMPLETO.md) - Complete system flow
- [REPORTS_MODULE_README.md](../../REPORTS_MODULE_README.md) - Reports module overview

---

**Last Updated**: January 8, 2026
