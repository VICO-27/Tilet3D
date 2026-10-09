const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/account/components/AuthScreen.tsx', 'utf8');

// 1. Add ArrowLeft to imports if it's not there, or reuse something.
if (!content.includes('ArrowLeft')) {
    content = content.replace('ArrowRight,', 'ArrowLeft, ArrowRight,');
}

// 2. Add Back Button inside the RIGHT: Auth Box container.
// Or place it at the top-left of the entire screen. Let's add it at the top left of the Auth Box for mobile, 
// and top-left of the left column for desktop.
const authBoxMatch = /<div className="flex flex-1 items-center justify-center p-6 sm:p-12">/;
if (authBoxMatch.test(content)) {
    content = content.replace(authBoxMatch, 
        `<div className="relative flex flex-1 items-center justify-center p-6 sm:p-12">\n` +
        `      {/* Back Button */}\n` +
        `      <button \n` +
        `        onClick={() => navigate("/")} \n` +
        `        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-ink transition-colors"\n` +
        `      >\n` +
        `        <ArrowLeft className="h-4 w-4" />\n` +
        `        Back\n` +
        `      </button>`
    );
}

// 3. Fix AuthButton Layout
const oldAuthButton = /const AuthButton =[^]+?\n\);\n/m;
const newAuthButton = `const AuthButton = ({ icon, label, disabled }: { icon: React.ReactNode; label: string; disabled?: boolean }) => (
  <button
    disabled={disabled}
    className={\`group flex w-full items-center justify-between gap-3 rounded-full border border-ink/20 bg-white py-3 px-4 text-sm font-semibold text-ink transition-all \${
      disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-stone-50 hover:border-ink/30 active:scale-[0.98]"
    }\`}
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </div>
      <span className="truncate text-left">{label}</span>
    </div>
    {disabled && (
      <span className="shrink-0 rounded-md bg-stone-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
        Soon
      </span>
    )}
  </button>
);
`;

content = content.replace(oldAuthButton, newAuthButton);

// Also fix the Guest button to match styling if necessary, but guest button is fine as is, 
// we just need to ensure it doesn't overlap. Wait, Guest button is:
// className="flex w-full items-center justify-center gap-3 rounded-full border border-ink/20 bg-white py-3.5 px-4...

fs.writeFileSync('frontend/src/features/account/components/AuthScreen.tsx', content);
