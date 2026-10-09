const fs = require('fs');
let content = fs.readFileSync('frontend/src/features/home/components/Footer.tsx', 'utf8');

content = content.replace(
  'rounded-xl bg-ink text-base font-black text-white">\n                ጥ',
  'rounded-xl bg-plum-600 text-base font-black text-white">\n                ጥ'
);

fs.writeFileSync('frontend/src/features/home/components/Footer.tsx', content);
