import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/components/landing/Hero'
import { LogoBar } from '@/components/landing/LogoBar'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Features } from '@/components/landing/Features'
import { BusinessTypes } from '@/components/landing/BusinessTypes'
import { TemplatesSection } from '@/components/landing/TemplatesSection'
import { Testimonials } from '@/components/landing/Testimonials'
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
      <Features />
      <BusinessTypes />
      <TemplatesSection />
      <Testimonials />
      <Pricing />
      <CtaSection />
      <Footer />
    </div>
  )
}
