const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/account/components/AuthScreen.tsx', 'utf8');

const oldAuthButton = /const AuthButton =[^]+?\n\);\n/m;
const newAuthButton = `const AuthButton = ({ icon, label, disabled }: { icon: React.ReactNode; label: string; disabled?: boolean }) => (
  <button
    disabled={disabled}
    className={\`group flex w-full items-center justify-center gap-2 sm:gap-3 rounded-full border border-ink/20 bg-white py-3 px-3 sm:px-4 text-sm font-semibold text-ink transition-all \${
      disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-stone-50 hover:border-ink/30 active:scale-[0.98]"
    }\`}
  >
    <div className="flex h-5 w-5 shrink-0 items-center justify-center">
      {icon}
    </div>
    <span className="truncate">{label}</span>
    {disabled && (
      <span className="shrink-0 rounded-md bg-stone-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-500">
        Soon
      </span>
    )}
  </button>
);
`;

content = content.replace(oldAuthButton, newAuthButton);
fs.writeFileSync('frontend/src/features/account/components/AuthScreen.tsx', content);
