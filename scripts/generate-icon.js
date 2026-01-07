const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Glassmorphic app icon - similar to the reference with stacked cards
const createIconSVG = (size) => {
  const scale = size / 1024;
  
  return `
<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
    
    <!-- Glass effect for cards -->
    <linearGradient id="glassGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.35" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.15" />
    </linearGradient>
    
    <linearGradient id="glassGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.45" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.25" />
    </linearGradient>
    
    <!-- Main card gradient -->
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
    
    <!-- Card shadow -->
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="20" flood-color="#1e40af" flood-opacity="0.4"/>
    </filter>
    
    <filter id="glassShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#1e40af" flood-opacity="0.2"/>
    </filter>
  </defs>
  
  <!-- Background with rounded corners (iOS style) -->
  <rect width="1024" height="1024" rx="224" fill="url(#bgGradient)"/>
  
  <!-- Back card (most transparent) - rotated slightly -->
  <g transform="translate(512, 420) rotate(-8) translate(-512, -420)">
    <rect x="200" y="240" width="624" height="400" rx="40" fill="url(#glassGradient1)" filter="url(#glassShadow)"/>
    <rect x="200" y="240" width="624" height="400" rx="40" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
  </g>
  
  <!-- Middle card - slight rotation -->
  <g transform="translate(512, 450) rotate(-4) translate(-512, -450)">
    <rect x="180" y="280" width="664" height="420" rx="44" fill="url(#glassGradient2)" filter="url(#glassShadow)"/>
    <rect x="180" y="280" width="664" height="420" rx="44" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
  </g>
  
  <!-- Front main card -->
  <rect x="160" y="340" width="704" height="460" rx="48" fill="url(#cardGradient)" filter="url(#cardShadow)"/>
  <rect x="160" y="340" width="704" height="460" rx="48" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  
  <!-- Card content - horizontal lines (list items) -->
  <rect x="240" y="440" width="400" height="20" rx="10" fill="rgba(255,255,255,0.9)"/>
  <rect x="240" y="500" width="320" height="20" rx="10" fill="rgba(255,255,255,0.7)"/>
  <rect x="240" y="560" width="360" height="20" rx="10" fill="rgba(255,255,255,0.7)"/>
  
</svg>`;
};

const outputDir = path.join(__dirname, '../ios/CasaTrackApp/Images.xcassets/AppIcon.appiconset');

const sizes = [
  { name: 'icon-20@2x.png', size: 40 },
  { name: 'icon-20@3x.png', size: 60 },
  { name: 'icon-29@2x.png', size: 58 },
  { name: 'icon-29@3x.png', size: 87 },
  { name: 'icon-40@2x.png', size: 80 },
  { name: 'icon-40@3x.png', size: 120 },
  { name: 'icon-60@2x.png', size: 120 },
  { name: 'icon-60@3x.png', size: 180 },
  { name: 'icon-1024@1x.png', size: 1024 },
];

async function generateIcons() {
  console.log('Generating glassmorphic app icons...');
  
  for (const { name, size } of sizes) {
    const svg = createIconSVG(1024); // Always use 1024 for source, then resize
    const outputPath = path.join(outputDir, name);
    
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`Generated ${name} (${size}x${size})`);
  }
  
  console.log('\nAll icons generated! Rebuild the app in Xcode to see the new icon.');
}

generateIcons().catch(console.error);
