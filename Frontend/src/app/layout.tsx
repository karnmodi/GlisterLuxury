import type { Metadata } from 'next'
import { Inter, Playfair_Display, Crimson_Text } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { CartProvider } from '@/contexts/CartContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { LoadingProvider } from '@/contexts/LoadingContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { CategoriesProvider } from '@/contexts/CategoriesContext'
import { CollectionsProvider } from '@/contexts/CollectionsContext'
import VisitTracker from '@/components/VisitTracker'
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton'
import PWASetup from '@/components/PWASetup'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const crimson = Crimson_Text({ 
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-crimson',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://glisterluxury.com'),
  title: 'Glister Luxury - The Soul of Interior',
  description: 'Crafting the finest solid brass cabinet hardware and interior accessories since 2025. Premium hardware for discerning customers.',
  manifest: '/manifest.json',
  themeColor: '#C9A66B',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Glister Luxury',
  },
  icons: {
    icon: [
      { url: '/images/business/G.png', sizes: 'any' },
      { url: '/images/business/G.png', sizes: '192x192', type: 'image/png' },
      { url: '/images/business/G.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/images/business/G.png',
    apple: [
      { url: '/images/business/G.png', sizes: '180x180', type: 'image/png' },
      { url: '/images/business/G.png', sizes: '152x152', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Glister Luxury - The Soul of Interior',
    description: 'Crafting the finest solid brass cabinet hardware and interior accessories since 2025. Premium hardware for discerning customers.',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Glister Luxury - The Soul of Interior',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Glister Luxury - The Soul of Interior',
    description: 'Crafting the finest solid brass cabinet hardware and interior accessories since 2025.',
    images: ['/opengraph-image'],
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Glister Luxury',
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${crimson.variable}`}>
      <body className={`${inter.className} antialiased`}>
      <ToastProvider>
        <LoadingProvider>
          <AuthProvider>
            <SettingsProvider>
              <CategoriesProvider>
                <CollectionsProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <VisitTracker />
                      <PWASetup />
                      {children}
                      <WhatsAppFloatingButton />
                    </WishlistProvider>
                  </CartProvider>
                </CollectionsProvider>
              </CategoriesProvider>
            </SettingsProvider>
          </AuthProvider>
        </LoadingProvider>
      </ToastProvider>
      </body>
    </html>
  )
}
