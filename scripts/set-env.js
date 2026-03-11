// scripts/set-env.js
const fs = require('fs');
const env = {
  production: true,
  apiUrl: process.env.API_URL || 'https://viatl-back.onrender.com'
};
fs.writeFileSync('src/environments/environment.prod.ts',
  `export const environment = ${JSON.stringify(env, null, 2)};`
);
console.log('✅ Environment written:', env);
