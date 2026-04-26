import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/components/landing/Hero'
import { ProductsSection } from '@/components/landing/ProductsSection'
import { ServiciosSection } from '@/components/landing/ServiciosSection'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { BusinessTypes } from '@/components/landing/BusinessTypes'
import { StatsSection } from '@/components/landing/StatsSection'
import { Testimonials } from '@/components/landing/Testimonials'
import { FaqSection } from '@/components/landing/FaqSection'
import { Pricing } from '@/components/landing/Pricing'
import { SuiteJuridicaSection } from '@/components/landing/SuiteJuridicaSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { Footer } from '@/components/landing/Footer'
import { OrganizationSchema } from '@/components/seo/OrganizationSchema'
import { FaqSchema } from '@/components/seo/FaqSchema'

export default function LandingPage() {
  return (
    <>
      <OrganizationSchema />
      <FaqSchema />
      <main className="min-h-screen bg-white">
        <Navbar />
        <Hero />
        <ProductsSection />
        <ServiciosSection />
        <SuiteJuridicaSection />
        <HowItWorks />
        <StatsSection />
        <Features />
        <BusinessTypes />
        <Testimonials />
        <FaqSection />
        <Pricing />
        <CtaSection />
        <Footer />
      </main>
    </>
  )
}
