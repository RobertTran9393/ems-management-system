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
  if (!content.includes('API_BASE_URL')) {
    content = "import { API_BASE_URL } from '../config/api';\n" + content;
  }
  // Replace fetch('http://localhost:8000/api... with fetch(`${API_BASE_URL}/api...`
  content = content.split("'http://localhost:8000").join("`${API_BASE_URL}");
  content = content.split('"http://localhost:8000').join("`${API_BASE_URL}");
  content = content.split('http://localhost:8000').join('${API_BASE_URL}');
  fs.writeFileSync(f, content, 'utf8');
  console.log('Successfully updated:', f);
}
