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
import VisitTracker from '@/components/VisitTracker'
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton'

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
  title: 'Glister Luxury - The Soul of Interior',
  description: 'Crafting the finest solid brass cabinet hardware and interior accessories since 2025. Premium hardware for discerning customers.',
  icons: {
    icon: '/images/business/G.png',
    shortcut: '/images/business/G.png',
    apple: '/images/business/G.png',
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
                <CartProvider>
                  <WishlistProvider>
                    <VisitTracker />
                    {children}
                    <WhatsAppFloatingButton />
                  </WishlistProvider>
                </CartProvider>
              </CategoriesProvider>
            </SettingsProvider>
          </AuthProvider>
        </LoadingProvider>
      </ToastProvider>
      </body>
    </html>
  )
}
