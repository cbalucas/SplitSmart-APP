// Script para generar ícono de la app
const fs = require('fs');

// SVG del ícono de SplitSmart
const iconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4B89DC;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2C5AA0;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fondo -->
  <rect width="1024" height="1024" rx="180" fill="url(#grad1)"/>
  
  <!-- Billete de dinero -->
  <rect x="212" y="362" width="600" height="300" rx="30" fill="#FFFFFF" opacity="0.95"/>
  <circle cx="512" cy="512" r="80" fill="#4B89DC" opacity="0.3"/>
  
  <!-- Símbolo de división/split -->
  <path d="M 312 512 L 712 512" stroke="#4B89DC" stroke-width="12" stroke-linecap="round"/>
  <circle cx="362" cy="462" r="20" fill="#4B89DC"/>
  <circle cx="662" cy="562" r="20" fill="#4B89DC"/>
  
  <!-- Monedas -->
  <circle cx="400" cy="430" r="35" fill="#FFD700" opacity="0.8"/>
  <circle cx="450" cy="420" r="35" fill="#FFD700" opacity="0.6"/>
  <circle cx="624" cy="594" r="35" fill="#FFD700" opacity="0.8"/>
  <circle cx="574" cy="604" r="35" fill="#FFD700" opacity="0.6"/>
  
  <!-- S inicial -->
  <text x="512" y="550" font-family="Arial, sans-serif" font-size="140" font-weight="bold" fill="#4B89DC" text-anchor="middle">S</text>
</svg>`;

// Guardar el SVG
fs.writeFileSync('assets/icon.svg', iconSVG);
console.log('✅ Ícono SVG creado en assets/icon.svg');

// Crear adaptive icon para Android
const adaptiveIconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4B89DC;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2C5AA0;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fondo circular para adaptive icon -->
  <circle cx="512" cy="512" r="512" fill="url(#grad1)"/>
  
  <!-- Billete de dinero -->
  <rect x="262" y="412" width="500" height="200" rx="25" fill="#FFFFFF" opacity="0.95"/>
  <circle cx="512" cy="512" r="60" fill="#FFFFFF" opacity="0.3"/>
  
  <!-- Símbolo de división -->
  <path d="M 362 512 L 662 512" stroke="#4B89DC" stroke-width="10" stroke-linecap="round"/>
  <circle cx="397" cy="477" r="15" fill="#4B89DC"/>
  <circle cx="627" cy="547" r="15" fill="#4B89DC"/>
  
  <!-- S inicial grande -->
  <text x="512" y="545" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="#4B89DC" text-anchor="middle">S</text>
</svg>`;

fs.writeFileSync('assets/adaptive-icon.svg', adaptiveIconSVG);
console.log('✅ Adaptive icon creado en assets/adaptive-icon.svg');
