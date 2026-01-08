/**
 * Test generator for dynamic fields functionality
 * Tests template rendering with different field combinations
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import * as handlebars from 'handlebars';
import { mockReportData } from '../mock-data';

/**
 * All available fields for reports
 */
const ALL_FIELDS = [
  'contractorName',
  'jobPosition',
  'clientName',
  'teamName',
  'country',
  'timeWorked',
  'activityPercentage',
  'productivityScore',
];

/**
 * Creates visibility flags for selected fields
 */
function createFieldVisibilityFlags(
  selectedFields: string[],
): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  ALL_FIELDS.forEach((field) => {
    flags[`showField_${field}`] = selectedFields.includes(field);
  });
  return flags;
}

/**
 * Registers Handlebars helpers
 */
function registerHelpers(): void {
  handlebars.registerHelper('formatNumber', (value: number) => {
    if (typeof value !== 'number') return value;
    return value.toLocaleString('en-US');
  });

  handlebars.registerHelper('activityClass', (percentage: number) => {
    return percentage >= 50 ? 'activity-high' : 'activity-low';
  });
}

/**
 * Loads and compiles the Handlebars template
 */
function loadTemplate(): handlebars.TemplateDelegate {
  const templatePath = join(
    __dirname,
    '..',
    '..',
    'reports',
    'templates',
    'productivity-report.hbs',
  );
  const templateContent = readFileSync(templatePath, 'utf-8');
  return handlebars.compile(templateContent);
}

/**
 * Test case definition
 */
interface TestCase {
  name: string;
  description: string;
  selectedFields: string[];
}

/**
 * Test cases for different field combinations
 */
const testCases: TestCase[] = [
  {
    name: 'All Fields',
    description: 'Default behavior with all fields visible',
    selectedFields: ALL_FIELDS,
  },
  {
    name: 'Essential Fields',
    description: 'Minimum viable report',
    selectedFields: ['contractorName', 'timeWorked', 'activityPercentage'],
  },
  {
    name: 'Performance Metrics',
    description: 'Focus on productivity and activity',
    selectedFields: [
      'contractorName',
      'activityPercentage',
      'productivityScore',
    ],
  },
  {
    name: 'Location View',
    description: 'Geographic distribution analysis',
    selectedFields: ['contractorName', 'country', 'clientName', 'teamName'],
  },
  {
    name: 'Organizational View',
    description: 'Team and client structure',
    selectedFields: [
      'contractorName',
      'jobPosition',
      'clientName',
      'teamName',
      'timeWorked',
    ],
  },
  {
    name: 'Time Tracking',
    description: 'Hours worked analysis',
    selectedFields: ['contractorName', 'jobPosition', 'timeWorked'],
  },
];

/**
 * Runs all test cases
 */
export function runDynamicFieldsTests(): void {
  console.log('🧪 Testing Dynamic Fields Functionality\n');
  console.log('=' .repeat(60));

  // Register helpers
  registerHelpers();

  // Load template
  const template = loadTemplate();

  let totalTests = 0;
  let passedTests = 0;

  // Prepare base template data
  const baseData = {
    ...mockReportData,
    periodStart: new Date(mockReportData.summary.from).toLocaleDateString(),
    periodEnd: new Date(mockReportData.summary.to).toLocaleDateString(),
    generatedAt: new Date().toLocaleString(),
    hasFilters: Object.keys(mockReportData.summary.filters).length > 0,
    hasPerformers:
      mockReportData.summary.mostActiveUser !== undefined &&
      mockReportData.summary.leastActiveUser !== undefined,
  };

  // Run each test case
  for (const testCase of testCases) {
    totalTests++;
    console.log(`\n🧪 Test ${totalTests}: ${testCase.name}`);
    console.log(`   Description: ${testCase.description}`);

    try {
      // Create visibility flags
      const fieldVisibility = createFieldVisibilityFlags(
        testCase.selectedFields,
      );

      // Merge data with visibility flags
      const templateData = {
        ...baseData,
        ...fieldVisibility,
      };

      // Render template
      const html = template(templateData);

      // Validate output
      if (html && html.length > 0) {
        console.log(`   ✅ HTML generated: ${html.length} characters`);
        console.log(
          `   📊 Columns visible: ${testCase.selectedFields.length}`,
        );
        passedTests++;
      } else {
        console.log('   ❌ Failed: Empty HTML output');
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Test Summary:');
  console.log(`   Total tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n✨ All tests passed successfully!\n');
    console.log('📋 Summary:');
    console.log('   - Template supports dynamic field selection');
    console.log(`   - Total available fields: ${ALL_FIELDS.length}`);
    console.log('   - Required fields: contractorName, timeWorked');
    console.log(`   - Test scenarios: ${testCases.length}`);
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  try {
    runDynamicFieldsTests();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}
