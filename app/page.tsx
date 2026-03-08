import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/components/landing/Hero'
import { LogoBar } from '@/components/landing/LogoBar'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { StatsSection } from '@/components/landing/StatsSection'
import { Features } from '@/components/landing/Features'
import { BusinessTypes } from '@/components/landing/BusinessTypes'
import { TemplatesSection } from '@/components/landing/TemplatesSection'
import { Testimonials } from '@/components/landing/Testimonials'
import { FaqSection } from '@/components/landing/FaqSection'
import { Pricing } from '@/components/landing/Pricing'
import { CtaSection } from '@/components/landing/CtaSection'
import { Footer } from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <LogoBar />
      <HowItWorks />
      <StatsSection />
      <Features />
      <BusinessTypes />
      <TemplatesSection />
      <Testimonials />
      <FaqSection />
      <Pricing />
      <CtaSection />
      <Footer />
    </div>
  )
}
