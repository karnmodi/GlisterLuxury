import LuxuryNavigation from '@/components/LuxuryNavigation'
import CinematicHero from '@/components/CinematicHero'
import VisionMissionSection from '@/components/VisionMissionSection'
import CoreValuesCarousel from '@/components/CoreValuesCarousel'
import SignatureCraftGallery from '@/components/SignatureCraftGallery'
import LuxuryFooter from '@/components/LuxuryFooter'
import FloatingSearchBar from '@/components/FloatingSearchBar'

import AnnouncementBanner from '@/components/AnnouncementBanner'

export default function Home() {
  return (
    <div className="min-h-screen bg-ivory">
      <AnnouncementBanner />
      <LuxuryNavigation />
      <FloatingSearchBar />
      <main>
        <CinematicHero />
        <VisionMissionSection />
        <CoreValuesCarousel />
        <SignatureCraftGallery />
      </main>
      <LuxuryFooter />
    </div>
  )
}
