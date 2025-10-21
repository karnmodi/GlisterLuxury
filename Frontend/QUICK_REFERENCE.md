# Glister London Homepage - Quick Reference

## 🎨 Color Palette

```
Deep Charcoal:  #1E1E1E  (Main backgrounds, nav, footer)
Antique Brass:  #C9A66B  (Accents, highlights, CTAs)
Ivory White:    #F5F5F0  (Light backgrounds, text)
Muted Olive:    #9A9774  (Secondary accents)
```

## 📐 Page Structure (Top to Bottom)

### 1. Navigation Bar (Fixed)
- Dark charcoal with transparency
- Logo with brass gradient
- Desktop menu: About | Collections | Products | Finishes | Contact
- "Explore Collections" CTA button
- Becomes more opaque on scroll

### 2. Hero Section (Full Screen)
- Dark charcoal background with brass pattern
- Animated light beam effect
- **Text hierarchy:**
  ```
  GLISTER LONDON          (Huge serif, ivory)
  ───                     (Brass line)
  The Soul of Interior    (Large serif, brass)
  Where Design Meets      (Medium, ivory/80)
  Craftsmanship
  [Explore Collections →] (Brass outline button)
  ```
- Scroll indicator at bottom
- Parallax effect on scroll

### 3. Vision & Mission Section
**Left Column (Vision):**
```
OUR VISION
───
To be a global leader in the
hardware industry

Known for innovative design...
```

**Right Column (Mission):**
```
OUR MISSION
───
• Deliver high-quality, durable and stylish...
• Foster a culture of continuous innovation...
• Maintain ethical business practices...

"Crafting excellence since 2025"
```

### 4. Core Values Section (Dark)
- Deep charcoal background
- 4 cards in a grid:
  ```
  [Icon]                [Icon]
  Quality &             Innovation &
  Durability            Design
  
  [Icon]                [Icon]
  Integrity &           Customer
  Ethical Practices     Focus
  ```
- Cards have brass borders and shine effect on hover

### 5. Signature Craft Gallery
**3-column grid:**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│             │ │             │ │             │
│   Brushed   │ │  Polished   │ │    Matte    │
│    Brass    │ │   Chrome    │ │    Black    │
│             │ │             │ │             │
│ Hover: Zoom │ │ Hover: Zoom │ │ Hover: Zoom │
│ + "Every    │ │ + "Every    │ │ + "Every    │
│ detail..."  │ │ detail..."  │ │ detail..."  │
└─────────────┘ └─────────────┘ └─────────────┘
```
- Images from Unsplash
- Zoom on hover
- Text overlay appears

### 6. Footer (Dark)
**4 columns:**
```
[Logo]              Products        Company         Support
Glister London      Cabinet HW      About Us        Contact
Description         Bathroom        Our Story       FAQs
[Social Icons]      Mortise         Sustain...      Finishes
                    Sockets         Craft...        Delivery
                    Interior        Trade           Returns
```

**Bottom:**
```
© 2025 Glister London  |  Privacy | Terms | Cookies
```

## ⚡ Key Interactions

### Cursor
- Custom brass circle follows mouse
- Scales 1.5x on hover over links/buttons
- Small brass dot in center

### Navigation
- Links get brass underline on hover (animates from left)
- Button has brass highlight shadow on hover

### Hero
- Text fades in sequentially with delays
- Background has moving light effect
- Parallax on scroll

### Cards (Values)
- Shine effect sweeps across on hover
- Icons rotate and scale
- Border color intensifies

### Gallery
- Images zoom 15% on hover
- Text slides up from bottom
- Brass corner accents appear

### Buttons/Links
- All transitions: 300-500ms
- Brass color on hover
- Smooth animations

## 🎭 Animations Timing

```
Fast    (0.2s): Cursor, quick hovers
Medium  (0.5s): Most transitions
Slow    (0.8s): Elegant reveals
Very    (1.2s): Hero text appears
Infinite (3s): Shine effects
```

## 📱 Responsive Breakpoints

```
Mobile:  < 768px  (1 column, mobile nav)
Tablet:  768px+   (2 columns)
Desktop: 1024px+  (Full layout, 3-4 columns)
```

## 🔧 Component Files

```
LuxuryNavigation.tsx       - Fixed top nav
CinematicHero.tsx          - Full-screen hero
VisionMissionSection.tsx   - Vision & Mission
CoreValuesCarousel.tsx     - 4 value cards
SignatureCraftGallery.tsx  - 3 product images
LuxuryFooter.tsx           - Footer with links
CustomCursor.tsx           - Brass cursor
```

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint check
npm run lint
```

## 🎯 Brand Voice

- **Tone:** Sophisticated, refined, confident
- **Language:** Timeless, craftsmanship, heritage, excellence
- **Values:** Quality, Innovation, Integrity, Customer Focus
- **Tagline:** "The Soul of Interior"
- **Established:** Since 2025
- **Origin:** Made in England

## 📝 Content Sources

- Vision & Mission: `public/BusinessDetails.md`
- Images: Unsplash (high-quality product photography)
- Brand assets: `public/images/business/Logo.png`

## ✨ Special Features

1. **Custom Cursor** - Brass-tinted, follows mouse
2. **Parallax Scrolling** - Hero section slows on scroll
3. **Intersection Observer** - Sections animate on scroll into view
4. **Framer Motion** - Professional, smooth animations
5. **Glassmorphism** - Backdrop blur on navigation
6. **Metallic Shine** - Animated shine effect on cards
7. **Zoom Gallery** - Interactive product showcase
8. **Sequential Reveals** - Staggered animations for elegance

## 🎨 Typography Scale

```
Hero Title:     6xl-8xl  (96-128px)
Hero Subtitle:  3xl-5xl  (48-64px)
Section Heads:  4xl-5xl  (48-56px)
Card Titles:    xl-2xl   (24-32px)
Body Text:      base-lg  (16-18px)
Small Text:     sm       (14px)
```

## 🌟 Design Philosophy

> "Modern minimalism meets timeless craftsmanship.
> The interface breathes with generous whitespace.
> Every animation is delayed and elegant.
> Nothing is fast or poppy.
> This is warm luxury."

---

**Need help?** Check `LUXURY_HOMEPAGE_IMPLEMENTATION.md` for detailed documentation.

