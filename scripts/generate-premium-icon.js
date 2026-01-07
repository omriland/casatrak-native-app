#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Icon sizes needed (in points, will be multiplied by scale)
const iosIconSizes = [
    { size: 20, scales: [2, 3] },      // 40x40, 60x60
    { size: 29, scales: [2, 3] },     // 58x58, 87x87
    { size: 40, scales: [2, 3] },     // 80x80, 120x120
    { size: 60, scales: [2, 3] },     // 120x120, 180x180
    { size: 1024, scales: [1] },      // 1024x1024 (marketing)
];

const androidIconConfigs = [
    { name: 'mipmap-mdpi', size: 48 },
    { name: 'mipmap-hdpi', size: 72 },
    { name: 'mipmap-xhdpi', size: 96 },
    { name: 'mipmap-xxhdpi', size: 144 },
    { name: 'mipmap-xxxhdpi', size: 192 },
];

const sourceIcon = process.argv[2];
if (!sourceIcon) {
    console.error('Please provide a source icon path: node scripts/generate-premium-icon.js <path-to-png>');
    process.exit(1);
}

const iosOutputDir = path.join(__dirname, '../ios/CasaTrackApp/Images.xcassets/AppIcon.appiconset');
const androidOutputDir = path.join(__dirname, '../android/app/src/main/res');

async function generateIcons() {
    try {
        const sharp = require('sharp');
        const sourcePath = path.resolve(sourceIcon);

        if (!fs.existsSync(sourcePath)) {
            console.error(`Source icon not found: ${sourcePath}`);
            process.exit(1);
        }

        console.log(`Using source icon: ${sourcePath}`);

        // --- iOS ---
        console.log('\nGenerating iOS icons...');
        if (!fs.existsSync(iosOutputDir)) {
            fs.mkdirSync(iosOutputDir, { recursive: true });
        }

        for (const { size, scales } of iosIconSizes) {
            for (const scale of scales) {
                const pixelSize = size * scale;
                const filename = `icon-${size}@${scale}x.png`;
                const filepath = path.join(iosOutputDir, filename);

                await sharp(sourcePath)
                    .resize(pixelSize, pixelSize)
                    .png()
                    .toFile(filepath);

                console.log(`Generated iOS: ${filename} (${pixelSize}x${pixelSize})`);
            }
        }

        // --- Android ---
        console.log('\nGenerating Android icons...');
        for (const config of androidIconConfigs) {
            const dir = path.join(androidOutputDir, config.name);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const filepath = path.join(dir, 'ic_launcher.png');
            const roundFilepath = path.join(dir, 'ic_launcher_round.png');

            // Rectangular icon
            await sharp(sourcePath)
                .resize(config.size, config.size)
                .png()
                .toFile(filepath);

            // Round icon (with circular mask)
            const radius = config.size / 2;
            const circleSvg = Buffer.from(
                `<svg><circle cx="${radius}" cy="${radius}" r="${radius}" /></svg>`
            );

            await sharp(sourcePath)
                .resize(config.size, config.size)
                .composite([{ input: circleSvg, blend: 'dest-in' }])
                .png()
                .toFile(roundFilepath);

            console.log(`Generated Android: ${config.name}/ic_launcher.png (${config.size}x${config.size})`);
        }

        console.log('\n✅ All app icons generated successfully!');

    } catch (error) {
        console.error('Error generating icons:', error);
        process.exit(1);
    }
}

generateIcons();
