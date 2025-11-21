/**
 * Script to generate PWA icons from source image
 * 
 * Usage: node scripts/generate-icons.js [source-image-path]
 * 
 * Example: node scripts/generate-icons.js public/images/business/G.png
 * 
 * Requires: npm install sharp (or yarn add sharp)
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const iconSizes = [
  72, 96, 128, 144, 152, 180, 192, 384, 512
];

// Get source image path from command line or use default
const sourceImage = process.argv[2] || path.join(__dirname, '../public/images/business/G.png');
const outputDir = path.join(__dirname, '../public/icons');

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.error(`Error: Source image not found at ${sourceImage}`);
  console.log('Usage: node scripts/generate-icons.js [source-image-path]');
  process.exit(1);
}

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('Error: sharp package not found.');
  console.log('Please install it first: npm install sharp');
  process.exit(1);
}

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created directory: ${outputDir}`);
}

// Generate icons
async function generateIcons() {
  console.log(`Generating PWA icons from: ${sourceImage}`);
  console.log(`Output directory: ${outputDir}\n`);

  try {
    for (const size of iconSizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 245, g: 245, b: 240, alpha: 1 } // Ivory background
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated: icon-${size}x${size}.png`);
    }

    console.log('\n✅ All icons generated successfully!');
    console.log(`\nIcons are located in: ${outputDir}`);
  } catch (error) {
    console.error('Error generating icons:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateIcons();

