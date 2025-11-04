import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'
export const alt = 'Glister London - The Soul of Interior'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: '#F5F5F0', // Ivory background
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          position: 'relative',
          border: '4px solid #1E1E1E', // Charcoal border
        }}
      >
        {/* Top Section - Golden G Logo on Ivory Background */}
        <div
          style={{
            width: '100%',
            height: '65%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F5F5F0', // Ivory background matching website
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: 280,
              fontWeight: 700,
              color: '#C9A66B', // Golden/brass color
              fontFamily: 'serif',
              textShadow: '0 0 20px rgba(201, 166, 107, 0.5)',
              letterSpacing: '-0.05em',
            }}
          >
            G
          </div>
        </div>

        {/* Bottom Section - Charcoal Background with Text */}
        <div
          style={{
            width: '100%',
            height: '35%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1E1E1E', // Charcoal background matching website dark sections
            padding: '40px 60px',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#F5F5F0', // Ivory text
              fontFamily: 'serif',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            Glister London - The Soul of Interior
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#F5F5F0', // Ivory text
              fontFamily: 'sans-serif',
              textAlign: 'center',
              lineHeight: 1.4,
              opacity: 0.9,
            }}
          >
            Crafting the finest solid brass cabinet hardware and interior accessories since 2025. Premium hardware for discerning customers.
          </div>
          <div
            style={{
              fontSize: 20,
              color: '#C9A66B', // Golden accent for URL
              fontFamily: 'monospace',
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            glister-londonn.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
