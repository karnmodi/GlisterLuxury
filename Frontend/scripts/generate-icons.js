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
      
      // Calculate safe area (80% of canvas) to ensure G is clearly visible
      const safeArea = Math.floor(size * 0.8);
      const padding = Math.floor((size - safeArea) / 2);

      // Create a square canvas with transparent background
      const canvas = sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      });

      // Resize source image to fit within safe area while maintaining aspect ratio
      const resizedImage = await sharp(sourceIcon)
        .resize(safeArea, safeArea, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Apply rounded corners mask (25% border radius for more pronounced rounded edges)
      const borderRadius = Math.floor(size * 0.25);
      
      // Create rounded rectangle mask using SVG
      const maskSvg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="rounded">
              <rect x="0" y="0" width="${size}" height="${size}" rx="${borderRadius}" ry="${borderRadius}"/>
            </clipPath>
          </defs>
          <rect x="0" y="0" width="${size}" height="${size}" rx="${borderRadius}" ry="${borderRadius}" fill="white"/>
        </svg>
      `;

      const maskBuffer = Buffer.from(maskSvg);

      // First, composite the resized image onto the canvas
      const iconWithBackground = await canvas
        .composite([
          {
            input: resizedImage,
            top: padding,
            left: padding
          }
        ])
        .png()
        .toBuffer();

      // Create the rounded mask
      const maskImage = await sharp(maskBuffer)
        .resize(size, size)
        .greyscale()
        .toBuffer();

      // Apply the rounded mask to clip the icon (dest-in blend mode creates the rounded edges)
      await sharp(iconWithBackground)
        .composite([
          {
            input: maskImage,
            blend: 'dest-in'
          }
        ])
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: icon-${size}x${size}.png`);
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

