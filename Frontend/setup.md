# Glister Frontend Setup

## Installation Instructions

To set up the project, run the following commands in the Frontend directory:

```bash
# Install dependencies
npm install

# Or using yarn
yarn install

# Or using pnpm
pnpm install
```

## Development

### Using Next.js (Recommended)
```bash
npm run dev
```

### Using Vite
```bash
npm run dev:vite
```

## Build

### Next.js Build
```bash
npm run build
npm run start
```

### Vite Build
```bash
npm run build:vite
npm run preview
```

## Project Structure

```
Frontend/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # Reusable React components
│   ├── lib/                # Utility libraries
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── styles/             # Additional styles
├── public/
│   ├── images/
│   │   ├── business/       # Business logos and branding
│   │   ├── products/       # Product images
│   │   └── gallery/        # Gallery images
│   ├── icons/              # Icon files
│   └── fonts/              # Custom fonts
├── package.json
├── next.config.js
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Technologies

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **ESLint** - Code linting

## Next Steps

1. Add your business logo to `public/images/business/`
2. Add product images to `public/images/products/`
3. Create components in `src/components/`
4. Define types in `src/types/`
5. Add utility functions in `src/utils/`
6. Customize the design in `src/app/globals.css`
