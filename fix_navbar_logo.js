const fs = require('fs');

let content = fs.readFileSync('frontend/src/shared/components/layout/Navbar.tsx', 'utf8');

content = content.replace(
  'rounded-md bg-ink text-[11px] font-black text-white">\n              ጥ',
  'rounded-md bg-plum-600 text-[11px] font-black text-white">\n              ጥ'
);

fs.writeFileSync('frontend/src/shared/components/layout/Navbar.tsx', content);
