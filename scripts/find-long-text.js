const fs = require('fs');

function findLongVisibleText(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n========================================\nFILE: ${filePath}\n========================================`);

  // Match JSX elements with text content: <tag ...>text</tag>
  const tagRegex = /<([a-z0-9]+)[^>]*>([^<>{}]*)<\/\1>/gi;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1];
    if (tag === 'script' || tag === 'style') continue;
    const text = match[2].replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length > 5) {
      const lineNo = content.substring(0, match.index).split('\n').length;
      console.log(`[L${lineNo}] <${tag}> (${words.length}w): "${text}"`);
    }
  }

  // Also check attributes: title, subtitle, description, label, placeholder
  const attrRegex = /\b(title|subtitle|description|label|placeholder)=["']([^"']+)["']/g;
  while ((match = attrRegex.exec(content)) !== null) {
    const attr = match[1];
    const val = match[2].replace(/\s+/g, ' ').trim();
    const words = val.split(/\s+/).filter(Boolean);
    if (words.length > 5) {
      const lineNo = content.substring(0, match.index).split('\n').length;
      console.log(`[L${lineNo}] [${attr}] (${words.length}w): "${val}"`);
    }
  }
}

const targetFiles = process.argv[2] ? [process.argv[2]] : [
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

targetFiles.forEach(findLongVisibleText);
