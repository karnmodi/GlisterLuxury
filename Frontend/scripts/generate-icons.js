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
      // This ensures the G is visible in all Android shapes (round, square, curved, squircle)
      // and iOS rounded square icons
      const safeZone = Math.floor(size * 0.8);
      const safeZonePadding = Math.floor((size - safeZone) / 2);
      
      // Make the G larger within the safe zone (95% of safe zone) for maximum clarity
      // This ensures the G is prominent even when Android applies circular or other masks
      const gSize = Math.floor(safeZone * 0.95);
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
      // Use 'inside' fit to ensure the G fits completely and is centered
      const resizedImage = await sharp(sourceIcon)
        .resize(gSize, gSize, {
          fit: 'inside',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Get the actual dimensions of the resized image to ensure perfect centering
      const resizedMetadata = await sharp(resizedImage).metadata();
      const actualGWidth = resizedMetadata.width;
      const actualGHeight = resizedMetadata.height;
      
      // Calculate position to perfectly center the G within the safe zone
      const gTop = safeZonePadding + Math.floor((safeZone - actualGHeight) / 2);
      const gLeft = safeZonePadding + Math.floor((safeZone - actualGWidth) / 2);

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

      // For maskable icons, we keep the full square icon
      // Android will apply its own mask (circle, square, rounded, squircle)
      // iOS will apply rounded corners automatically
      // We still apply subtle rounded corners for better appearance in some contexts
      const borderRadius = Math.floor(size * 0.18);
      
      // Create rounded rectangle mask using SVG
      const maskSvg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="${size}" height="${size}" rx="${borderRadius}" ry="${borderRadius}" fill="white"/>
        </svg>
      `;

      const maskBuffer = Buffer.from(maskSvg);

      // Apply the rounded mask to create final icon with subtle curved edges
      // The icon will work perfectly with Android's adaptive icon system
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

