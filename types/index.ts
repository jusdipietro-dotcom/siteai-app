// ─── Project & Site ───────────────────────────────────────────────────────────

export type ProjectStatus = 'draft' | 'generating' | 'ready' | 'published' | 'error'
export type Plan = 'free' | 'essential' | 'professional'
export type DevicePreview = 'desktop' | 'tablet' | 'mobile'
export type SectionType =
  | 'hero' | 'about' | 'services' | 'gallery' | 'testimonials'
  | 'faq' | 'contact' | 'cta' | 'stats' | 'features' | 'team'
  | 'pricing' | 'footer'

export interface SectionConfig {
  id: SectionType
  label: string
  description: string
  enabled: boolean
  required: boolean
  order: number
  settings?: Record<string, unknown>
}

export interface Service {
  id: string
  name: string
  description: string
  price?: string
  emoji?: string
  imageId?: string
  image?: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  bio?: string
  imageId?: string
  image?: string
}

export interface Testimonial {
  id: string
  author: string
  role: string
  content: string
  rating: number
  avatarId?: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
}

export interface ContactData {
  phone: string
  whatsapp: string
  email: string
  address: string
  city: string
  province: string
  country: string
  schedule?: string
}

export interface SocialLinks {
  instagram: string
  facebook: string
  linkedin: string
  twitter: string
  tiktok: string
  youtube: string
}

export interface SEOData {
  title: string
  description: string
  keywords: string
  sitemapEnabled: boolean
}

export interface BrandingData {
  primaryColor: string
  fontHeading: string
  fontBody: string
  tone: 'profesional' | 'amigable' | 'formal' | 'moderno' | 'minimalista'
  colorTheme: ColorTheme
  logoId?: string
  faviconId?: string
}

export interface BusinessData {
  name: string
  tagline: string
  description: string
  businessType: string
  services: Service[]
  team: TeamMember[]
  testimonials: Testimonial[]
  faqs: FAQItem[]
  contact: ContactData
  socials: SocialLinks
  seo: SEOData
  branding: BrandingData
  gaId?: string
  heroImage?: string
  galleryImages?: string[]
}

export interface Project {
  id: string
  name: string
  slug: string
  status: ProjectStatus
  plan: Plan
  hasPaid?: boolean
  template: string
  sections: SectionConfig[]
  businessData: BusinessData
  mediaIds: string[]
  coverImageId?: string
  publishedUrl?: string
  createdAt: string
  updatedAt: string
  views?: number
  thumbnail?: string
}

// ─── Templates ────────────────────────────────────────────────────────────────

export interface Template {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  thumbnail: string
  colorTheme: ColorTheme
  popular?: boolean
  isNew?: boolean
  premium?: boolean
  suitableFor: string[]
}

// ─── Color & Theming ──────────────────────────────────────────────────────────

export type ColorTheme =
  | 'indigo' | 'legal' | 'medical' | 'restaurant'
  | 'boutique' | 'fitness' | 'gold' | 'mono'

export interface ColorPreset {
  id: ColorTheme
  name: string
  description: string
  primary: string
  swatches: string[]
  industries: string[]
}

export interface TypographyOption {
  id: string
  name: string
  category: 'sans' | 'serif' | 'mono' | 'display'
  previewClass: string
  cssFamily: string
  googleUrl: string
}

// ─── Business Types ───────────────────────────────────────────────────────────

export interface BusinessTypeOption {
  id: string
  name: string
  icon: string
  color: string
  bgColor: string
  description: string
  keywords: string[]
  defaultTemplate: string
  colorTheme: ColorTheme
}

// ─── Media ────────────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video'
export type MediaCategory =
  | 'hero' | 'gallery' | 'team' | 'services' | 'logo' | 'favicon' | 'misc'

export interface MediaFile {
  id: string
  name: string
  url: string
  thumbnailUrl?: string
  type: MediaType
  category: MediaCategory
  size: number
  width?: number
  height?: number
  alt?: string
  favorite: boolean
  usedIn: string[]
  createdAt: string
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

export interface WizardData {
  businessType: string
  name: string
  tagline: string
  description: string
  tone: string
  services: Service[]
  team: TeamMember[]
  phone: string
  whatsapp: string
  email: string
  address: string
  city: string
  province: string
  socials: Partial<SocialLinks>
  primaryColor: string
  colorTheme: ColorTheme
  fontHeading: string
  fontBody: string
  template: string
  enabledSections: SectionType[]
  logoId?: string
  heroImageId?: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export type EditorSidebarTab = 'sections' | 'styles' | 'seo' | 'media'
export type EditorRightTab = 'content' | 'design' | 'settings'

// ─── User / Auth ──────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'editor'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  plan: Plan
  role: UserRole
  projectCount: number
  createdAt: string
}
