const fs = require('fs');
const path = require('path');

function scanFileMultiLine(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n========================================\nFILE: ${filePath}\n========================================`);

  // Strip code blocks / comments
  const stripped = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

  // 1. Match JSX text blocks between > and <
  const jsxTagRegex = />([^<]+)</g;
  let match;
  while ((match = jsxTagRegex.exec(stripped)) !== null) {
    let raw = match[1];
    // Remove inline curly braces expressions like {item.name} or {foo ? bar : baz}
    let withoutBraces = raw.replace(/\{[^}]*\}/g, ' ');
    // Decode html entities
    withoutBraces = withoutBraces.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&bull;/g, '•');
    // Normalize spaces
    const text = withoutBraces.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    // Count words
    const words = text.split(/\s+/).filter(w => w.length > 0 && !w.match(/^[{}\(\)\[\]:,.;|•\/\-_+]+$/));
    if (words.length > 5) {
      const lineNo = stripped.substring(0, match.index).split('\n').length;
      console.log(`[L${lineNo}] [${words.length}w] JSX: "${text}"`);
    }
  }

  // 2. Match attributes like title="...", subtitle="...", placeholder="...", description="..."
  const attrRegex = /\b(?:title|subtitle|placeholder|description|label)=["']([^"']+)["']/g;
  while ((match = attrRegex.exec(stripped)) !== null) {
    const text = match[1].replace(/\s+/g, ' ').trim();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 5) {
      const lineNo = stripped.substring(0, match.index).split('\n').length;
      console.log(`[L${lineNo}] [${words.length}w] ATTR: "${text}"`);
    }
  }
}

const targetFiles = [
  'src/app/management/ManagementClient.tsx',
  'src/app/dentist/DentistDeskClient.tsx',
  'src/app/dentist/chart/[patientId]/DentistPatientChartClient.tsx',
  'src/app/reception/ReceptionWorkspaceClient.tsx',
  'src/app/portal/PatientDashboardClient.tsx',
  'src/app/billing/BillingDeskClient.tsx',
  'src/app/inventory/InventoryDeskClient.tsx',
  'src/app/crm/CrmDashboardClient.tsx',
  'src/app/admin/AdminDashboardClient.tsx'
];

targetFiles.forEach(scanFileMultiLine);
