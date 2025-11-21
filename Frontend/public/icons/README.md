# PWA Icons

This directory should contain PWA icons in multiple sizes for "Add to Home Screen" functionality.

## Required Icon Sizes

The following icon sizes are required for full PWA support across all platforms:

- `icon-72x72.png` - 72x72px (Android)
- `icon-96x96.png` - 96x96px (Android)
- `icon-128x128.png` - 128x128px (Android)
- `icon-144x144.png` - 144x144px (Android)
- `icon-152x152.png` - 152x152px (iOS)
- `icon-180x180.png` - 180x180px (iOS - required)
- `icon-192x192.png` - 192x192px (Android - required)
- `icon-384x384.png` - 384x384px (Android)
- `icon-512x512.png` - 512x512px (Android splash - required)

## Generating Icons

### Option 1: Using Online Tools
1. Use tools like [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) or [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload your source icon (`/images/business/G.png` or `Logo.png`)
3. Download the generated icons and place them in this directory

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)

# Navigate to the Frontend directory
cd Frontend

# Generate all required sizes from the source icon
convert public/images/business/G.png -resize 72x72 public/icons/icon-72x72.png
convert public/images/business/G.png -resize 96x96 public/icons/icon-96x96.png
convert public/images/business/G.png -resize 128x128 public/icons/icon-128x128.png
convert public/images/business/G.png -resize 144x144 public/icons/icon-144x144.png
convert public/images/business/G.png -resize 152x152 public/icons/icon-152x152.png
convert public/images/business/G.png -resize 180x180 public/icons/icon-180x180.png
convert public/images/business/G.png -resize 192x192 public/icons/icon-192x192.png
convert public/images/business/G.png -resize 384x384 public/icons/icon-384x384.png
convert public/images/business/G.png -resize 512x512 public/icons/icon-512x512.png
```

### Option 3: Using Sharp (Node.js)
A script is available at `scripts/generate-icons.js` to generate all required icon sizes.

## Icon Requirements

- **Format**: PNG with transparency
- **Shape**: Square (will be automatically masked on iOS)
- **Background**: Transparent or solid color matching brand
- **Content**: Should be centered and clearly visible at small sizes
- **Maskable**: Icons should work well when masked (rounded corners on Android)

## Current Status

Currently, the app uses `/images/business/G.png` as a fallback for all icon sizes. For optimal PWA experience, generate and add the properly sized icons listed above.
