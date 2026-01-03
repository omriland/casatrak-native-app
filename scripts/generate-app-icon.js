#!/usr/bin/env node

/**
 * Generate iOS App Icons with house icon and purple gradient background
 * 
 * This script generates all required app icon sizes for iOS.
 * Run: node scripts/generate-app-icon.js
 * 
 * Requirements: Install sharp first: npm install --save-dev sharp
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed (in points, will be multiplied by scale)
const iconSizes = [
  { size: 20, scales: [2, 3] },      // 40x40, 60x60
  { size: 29, scales: [2, 3] },     // 58x58, 87x87
  { size: 40, scales: [2, 3] },     // 80x80, 120x120
  { size: 60, scales: [2, 3] },     // 120x120, 180x180
  { size: 1024, scales: [1] },      // 1024x1024 (marketing)
];

const outputDir = path.join(__dirname, '../ios/CasaTrackApp/Images.xcassets/AppIcon.appiconset');

async function generateIcons() {
  try {
    // Check if sharp is available
    const sharp = require('sharp');
    
    console.log('Generating app icons...');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate each icon size
    for (const { size, scales } of iconSizes) {
      for (const scale of scales) {
        const pixelSize = size * scale;
        const filename = `icon-${size}@${scale}x.png`;
        const filepath = path.join(outputDir, filename);
        
        // Create SVG with house icon and purple gradient
        const svg = `
          <svg width="${pixelSize}" height="${pixelSize}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#9333EA;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="${pixelSize}" height="${pixelSize}" fill="url(#purpleGradient)" rx="${pixelSize * 0.2}"/>
            <g transform="translate(${pixelSize * 0.5}, ${pixelSize * 0.5})">
              <!-- House icon -->
              <path d="M ${-pixelSize * 0.25} ${-pixelSize * 0.1} L 0 ${-pixelSize * 0.25} L ${pixelSize * 0.25} ${-pixelSize * 0.1} L ${pixelSize * 0.25} ${pixelSize * 0.2} L ${-pixelSize * 0.25} ${pixelSize * 0.2} Z" 
                    fill="white" stroke="white" stroke-width="${pixelSize * 0.01}"/>
              <!-- Door -->
              <rect x="${-pixelSize * 0.08}" y="${pixelSize * 0.05}" 
                    width="${pixelSize * 0.16}" height="${pixelSize * 0.15}" 
                    fill="url(#purpleGradient)" rx="${pixelSize * 0.01}"/>
              <!-- Window -->
              <rect x="${pixelSize * 0.05}" y="${-pixelSize * 0.05}" 
                    width="${pixelSize * 0.12}" height="${pixelSize * 0.12}" 
                    fill="white" rx="${pixelSize * 0.01}"/>
              <line x1="${pixelSize * 0.11}" y1="${-pixelSize * 0.05}" 
                    x2="${pixelSize * 0.11}" y2="${-pixelSize * 0.05 + pixelSize * 0.12}" 
                    stroke="url(#purpleGradient)" stroke-width="${pixelSize * 0.008}"/>
              <line x1="${pixelSize * 0.05}" y1="${-pixelSize * 0.05 + pixelSize * 0.06}" 
                    x2="${pixelSize * 0.05 + pixelSize * 0.12}" y2="${-pixelSize * 0.05 + pixelSize * 0.06}" 
                    stroke="url(#purpleGradient)" stroke-width="${pixelSize * 0.008}"/>
            </g>
          </svg>
        `;
        
        // Convert SVG to PNG
        await sharp(Buffer.from(svg))
          .png()
          .toFile(filepath);
        
        console.log(`Generated: ${filename} (${pixelSize}x${pixelSize})`);
      }
    }
    
    console.log('\n✅ All app icons generated successfully!');
    console.log('Next step: Update Contents.json to reference these files.');
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n❌ Error: sharp module not found.');
      console.log('\nPlease install sharp first:');
      console.log('  npm install --save-dev sharp\n');
      console.log('Then run this script again.');
    } else {
      console.error('Error generating icons:', error);
    }
    process.exit(1);
  }
}

generateIcons();
