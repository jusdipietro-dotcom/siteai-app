import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingServices } from '@/components/landing/LandingServices'
import { LandingSolutions } from '@/components/landing/LandingSolutions'
import { LandingVerticals } from '@/components/landing/LandingVerticals'
import { LandingProcess } from '@/components/landing/LandingProcess'
import { LandingWhyUs } from '@/components/landing/LandingWhyUs'
import { LandingFaq } from '@/components/landing/LandingFaq'
import { LandingCta } from '@/components/landing/LandingCta'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { OrganizationSchema } from '@/components/seo/OrganizationSchema'
import { WebSiteSchema } from '@/components/seo/WebSiteSchema'

export default function LandingPage() {
  return (
    <>
      <WebSiteSchema />
      <OrganizationSchema />
      <main className="min-h-screen bg-white">
        <LandingNavbar />
        <LandingHero />
        <LandingServices />
        <LandingSolutions />
        <LandingVerticals />
        <LandingProcess />
        <LandingWhyUs />
        <LandingFaq />
        <LandingCta />
        <LandingFooter />
      </main>
    </>
  )
}
