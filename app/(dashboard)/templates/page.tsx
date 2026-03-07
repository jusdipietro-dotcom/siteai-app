'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { mockTemplates } from '@/data/mockTemplates'

const filters = ['Todos', 'Popular', 'Gastronomía', 'Legal', 'Salud', 'Negocios']

export default function TemplatesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Todos')

  const filtered = mockTemplates.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'Todos' ||
      (filter === 'Popular' && t.popular) ||
      t.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
    return matchSearch && matchFilter
  })

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-surface-100 px-6 lg:px-10 py-6">
        <div className="flex items-center gap-4 mb-1">
          <Link href="/dashboard">
            <button className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-surface-900">Templates</h1>
            <p className="text-sm text-surface-500">Elegí el diseño base para tu sitio</p>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Input
            placeholder="Buscar templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="max-w-xs"
          />
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="group bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden hover:shadow-card hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="relative h-48 bg-surface-100 overflow-hidden">
                <Image
                  src={template.thumbnail}
                  alt={template.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Link href="/wizard">
                    <button className="bg-white text-surface-900 rounded-xl px-4 py-2 text-sm font-semibold shadow-elevated hover:bg-surface-50 flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5" /> Usar template
                    </button>
                  </Link>
                </div>
                {template.popular && (
                  <div className="absolute top-3 left-3">
                    <Badge variant="default" className="bg-brand-600 text-white border-0 text-xs">Popular</Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-surface-900 mb-1">{template.name}</h3>
                <p className="text-xs text-surface-500 leading-relaxed mb-3">{template.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {template.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-surface-50 text-surface-500 border border-surface-100 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href="/wizard">
                  <Button variant="outline" size="sm" className="w-full">Usar este template</Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-surface-500 mb-2">No se encontraron templates</p>
            <button onClick={() => { setSearch(''); setFilter('Todos') }} className="text-brand-600 text-sm hover:underline">
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
