import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/components/landing/Hero'
import { CapabilitiesSection } from '@/components/landing/CapabilitiesSection'
import { ProductsSection } from '@/components/landing/ProductsSection'
import { ProcesoSection } from '@/components/landing/ProcesoSection'
import { BusinessTypes } from '@/components/landing/BusinessTypes'
import { Testimonials } from '@/components/landing/Testimonials'
import { FaqSection } from '@/components/landing/FaqSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { Footer } from '@/components/landing/Footer'
import { OrganizationSchema } from '@/components/seo/OrganizationSchema'
import { FaqSchema } from '@/components/seo/FaqSchema'
import { WebSiteSchema } from '@/components/seo/WebSiteSchema'

export default function LandingPage() {
  return (
    <>
      <WebSiteSchema />
      <OrganizationSchema />
      <FaqSchema />
      <main className="min-h-screen bg-white">
        <Navbar />
        <Hero />
        <CapabilitiesSection />
        <ProductsSection />
        <ProcesoSection />
        <BusinessTypes />
        <Testimonials />
        <FaqSection />
        <CtaSection />
        <Footer />
      </main>
    </>
  )
}
