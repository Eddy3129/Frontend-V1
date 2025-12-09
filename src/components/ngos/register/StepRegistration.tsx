'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { type NGOFormData, COUNTRIES } from '@/types/ngo'
import { cn } from '@/lib/utils'
import { FileText, MapPin, Calendar, Hash, Search, Check, ChevronDown } from 'lucide-react'

interface StepRegistrationProps {
  formData: NGOFormData
  updateFormData: (updates: Partial<NGOFormData>) => void
}

// Searchable Country Dropdown Component
function CountrySelect({
  value,
  onChange,
}: {
  value: string
  onChange: (country: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(search.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-md border bg-background text-sm',
          'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
          isOpen && 'border-primary ring-2 ring-primary/20',
          !value && 'text-muted-foreground'
        )}
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" />
          {value || 'Select a country...'}
        </span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredCountries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No countries found</p>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => {
                    onChange(country)
                    setIsOpen(false)
                    setSearch('')
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md',
                    'hover:bg-accent hover:text-accent-foreground',
                    value === country && 'bg-primary/10 text-primary'
                  )}
                >
                  <span>{country}</span>
                  {value === country && <Check className="h-4 w-4" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function StepRegistration({ formData, updateFormData }: StepRegistrationProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Legal & Registration Details
        </h2>
        <p className="text-sm text-muted-foreground">
          Official registration information for verification
        </p>
      </div>

      {/* Registration Number */}
      <div className="space-y-2">
        <Label htmlFor="registrationNumber" className="required flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Registration / Tax ID Number
        </Label>
        <Input
          id="registrationNumber"
          placeholder="e.g., 501(c)(3) EIN, Charity Number, etc."
          value={formData.registrationNumber}
          onChange={(e) => updateFormData({ registrationNumber: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Your official nonprofit registration or tax exemption number
        </p>
      </div>

      {/* Country Selection - Searchable Dropdown */}
      <div className="space-y-2">
        <Label className="required flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Country of Registration
        </Label>
        <CountrySelect
          value={formData.country}
          onChange={(country) => updateFormData({ country })}
        />
      </div>

      {/* City & Address */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="required">
            City
          </Label>
          <Input
            id="city"
            placeholder="City"
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="foundedYear" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Year Founded (Optional)
          </Label>
          <Input
            id="foundedYear"
            type="number"
            placeholder="e.g., 2015"
            min="1800"
            max={new Date().getFullYear()}
            value={formData.foundedYear || ''}
            onChange={(e) => updateFormData({ foundedYear: e.target.value })}
          />
        </div>
      </div>

      {/* Full Address */}
      <div className="space-y-2">
        <Label htmlFor="address" className="required">
          Registered Address
        </Label>
        <Input
          id="address"
          placeholder="Street address, building, suite, etc."
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Official registered address of your organization
        </p>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <strong>Why do we need this?</strong>
            <br />
            Registration details help us verify your organization is a legitimate nonprofit. This
            information will be hashed and stored on-chain for transparency, while sensitive
            documents are stored securely off-chain.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
