export default {
  locales: ['en', 'am', 'om', 'fr'], // The languages you want
  output: 'public/locales/$LOCALE/translation.json', // Where to save them
  input: ['src/**/*.{js,jsx,ts,tsx}'], // Where to look for text
  keySeparator: false,
  namespaceSeparator: false,
  createOldCatalogs: false, // Don't create backup files
  defaultNs: 'translation',
};