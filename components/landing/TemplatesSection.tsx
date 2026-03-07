'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mockTemplates } from '@/data/mockTemplates'
import { ArrowRight } from 'lucide-react'

export function TemplatesSection() {
  return (
    <section id="templates" className="py-24 bg-surface-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3"
            >
              Templates
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-extrabold text-surface-900"
            >
              Elegí el diseño<br />que más te guste
            </motion.h2>
          </div>
          <Link href="/templates">
            <Button variant="outline" className="gap-2 shrink-0">
              Ver todos los templates <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTemplates.slice(0, 6).map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white rounded-2xl overflow-hidden border border-surface-100 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1"
            >
              {/* Thumbnail */}
              <div className="relative h-44 overflow-hidden bg-surface-100">
                <Image
                  src={template.thumbnail}
                  alt={template.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {template.popular && (
                  <div className="absolute top-3 left-3">
                    <Badge variant="default" className="bg-brand-600 text-white border-0 text-xs">Popular</Badge>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-surface-900">{template.name}</h3>
                </div>
                <p className="text-sm text-surface-500 mb-3 leading-relaxed">{template.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {template.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-surface-50 text-surface-500 border border-surface-100 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
