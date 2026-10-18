const fs = require('fs');

const files = [
  'd:/Apps/EMS/frontend/src/components/AcademicScreen.tsx',
  'd:/Apps/EMS/frontend/src/components/CrmScreen.tsx',
  'd:/Apps/EMS/frontend/src/components/PayrollScreen.tsx',
  'd:/Apps/EMS/frontend/src/components/POSScreen.tsx',
  'd:/Apps/EMS/frontend/src/components/ReceiptVerificationScreen.tsx',
  'd:/Apps/EMS/frontend/src/components/TeacherMobileScreen.tsx'
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  // Look for any `${API_BASE_URL}...') and replace the closing quote with backtick `
  content = content.replace(/\$\{API_BASE_URL\}([^`'"]*)'/g, '${API_BASE_URL}$1`');
  content = content.replace(/\$\{API_BASE_URL\}([^`'"]*)"/g, '${API_BASE_URL}$1`');
  
  // Also check if any opening quote was not converted
  content = content.replace(/fetch\('`\$\{API_BASE_URL\}/g, 'fetch(`${API_BASE_URL}');
  content = content.replace(/fetch\("`\$\{API_BASE_URL\}/g, 'fetch(`${API_BASE_URL}');
  
  fs.writeFileSync(f, content, 'utf8');
  console.log('Fixed quotes in:', f);
}
