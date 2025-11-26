const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const iconSizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

// Paths
const sourceIcon = path.join(__dirname, '../public/images/business/icon.png');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  try {
    console.log('🎨 Starting PWA icon generation...');
    console.log(`📂 Source: ${sourceIcon}`);
    console.log(`📂 Output: ${outputDir}\n`);

    // Check if source file exists
    if (!fs.existsSync(sourceIcon)) {
      throw new Error(`Source icon not found: ${sourceIcon}`);
    }

    // Read source image metadata
    const metadata = await sharp(sourceIcon).metadata();
    console.log(`📐 Source image: ${metadata.width}x${metadata.height}px\n`);

    // Generate each icon size
    for (const size of iconSizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      // Maskable icon safe zone: 80% of canvas (10% padding on all sides)
      // This ensures the G is visible in all Android shapes (round, square, curved)
      // and iOS rounded square icons
      const safeZone = Math.floor(size * 0.8);
      const safeZonePadding = Math.floor((size - safeZone) / 2);
      
      // Make the G larger within the safe zone (90% of safe zone) for maximum clarity
      const gSize = Math.floor(safeZone * 0.9);
      const gPadding = Math.floor((safeZone - gSize) / 2);

      // Create a square canvas with black background for contrast
      // This ensures the gold G stands out clearly
      const canvas = sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        }
      });

      // Resize source image to fit within the G size area while maintaining aspect ratio
      const resizedImage = await sharp(sourceIcon)
        .resize(gSize, gSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Calculate position to center the G within the safe zone
      const gTop = safeZonePadding + gPadding;
      const gLeft = safeZonePadding + gPadding;

      // Composite the resized G image onto the canvas, centered in safe zone
      const icon = await canvas
        .composite([
          {
            input: resizedImage,
            top: gTop,
            left: gLeft
          }
        ])
        .png()
        .toBuffer();

      // Apply rounded corners mask (22% border radius for modern, friendly look)
      // This works well for Android curved/square icons and iOS rounded square
      const borderRadius = Math.floor(size * 0.22);
      
      // Create rounded rectangle mask using SVG
      const maskSvg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="${size}" height="${size}" rx="${borderRadius}" ry="${borderRadius}" fill="white"/>
        </svg>
      `;

      const maskBuffer = Buffer.from(maskSvg);

      // Apply the rounded mask to create final icon with curved edges
      await sharp(icon)
        .composite([
          {
            input: maskBuffer,
            blend: 'dest-in'
          }
        ])
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: icon-${size}x${size}.png (Safe zone: ${safeZone}px, G size: ${gSize}px)`);
    }

    console.log(`\n✨ Successfully generated ${iconSizes.length} icon sizes!`);
    console.log(`📁 Icons saved to: ${outputDir}`);
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Run the generator
generateIcons();

