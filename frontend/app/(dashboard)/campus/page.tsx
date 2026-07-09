'use client'

import { useState } from 'react'
import {
  MapPin, Phone, Mail, ExternalLink, BookOpen, Coffee, Beaker, Monitor,
  Wrench, Bus, Building2, Users, Trophy, Clock, Globe, ChevronRight,
  Wifi, Printer, Dumbbell, Music, Camera, Shield, GraduationCap, Info,
  Landmark, Star, Navigation
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Reveal from '@/components/motion/Reveal'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'

// ─── Data ────────────────────────────────────────────────────────────────────

const FACILITIES = [
  {
    id: 'library',
    name: 'Central Library',
    description: 'Digital and physical collection of 50,000+ books, journals, and research papers. 24/7 reading room access.',
    icon: BookOpen,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    hours: 'Mon–Sat: 8 AM – 9 PM',
    floor: 'Block A, Ground Floor',
    tags: ['Books', 'E-Resources', 'Reading Room'],
  },
  {
    id: 'canteen',
    name: 'Campus Canteen',
    description: 'Multi-cuisine food court with vegetarian and non-vegetarian options. Cashless UPI payments accepted.',
    icon: Coffee,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    hours: 'Mon–Sat: 8 AM – 8 PM',
    floor: 'Main Campus, Central Block',
    tags: ['Food', 'Beverages', 'UPI'],
  },
  {
    id: 'labs',
    name: 'Research Laboratories',
    description: 'State-of-the-art computing, electronics, and research labs equipped with modern hardware and software.',
    icon: Beaker,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    hours: 'Mon–Sat: 9 AM – 6 PM',
    floor: 'Block B, C & D',
    tags: ['Computing', 'Electronics', 'Research'],
  },
  {
    id: 'computer',
    name: 'Computer Centre',
    description: 'High-speed internet lab with 200+ workstations. Licensed software, printing, and cloud access.',
    icon: Monitor,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    hours: 'Mon–Sat: 8 AM – 9 PM',
    floor: 'Block C, 2nd Floor',
    tags: ['Internet', 'Printing', '200+ PCs'],
  },
  {
    id: 'workshop',
    name: 'Workshop & Fab Lab',
    description: 'Fully equipped mechanical workshop and fabrication lab with 3D printers, CNC machines, and tools.',
    icon: Wrench,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    hours: 'Mon–Fri: 9 AM – 5 PM',
    floor: 'Block D, Ground Floor',
    tags: ['3D Print', 'CNC', 'Fabrication'],
  },
  {
    id: 'sports',
    name: 'Sports Complex',
    description: 'Indoor and outdoor sports facilities including a gymnasium, cricket ground, basketball court, and more.',
    icon: Dumbbell,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    hours: 'Mon–Sat: 6 AM – 8 PM',
    floor: 'Campus Ground, East Wing',
    tags: ['Gym', 'Cricket', 'Basketball'],
  },
  {
    id: 'auditorium',
    name: 'Auditorium',
    description: 'AC-equipped 1000-seat auditorium with professional AV setup, used for seminars, fests, and events.',
    icon: Music,
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    hours: 'Booking required',
    floor: 'Admin Block, 1st Floor',
    tags: ['Events', 'Seminars', '1000 seats'],
  },
  {
    id: 'hostel',
    name: 'Hostel & Accommodation',
    description: 'Separate boys and girls hostels with 24/7 security, Wi-Fi, mess facility, and common rooms.',
    icon: Building2,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    hours: '24/7',
    floor: 'Campus Residential Area',
    tags: ['Boys', 'Girls', 'Wi-Fi', 'Mess'],
  },
]

const CONTACTS = [
  {
    department: 'Main Reception',
    icon: Building2,
    color: 'text-primary',
    bg: 'bg-primary/10',
    phone: '+91 21 2763 9000',
    email: 'info@mitaoe.ac.in',
    hours: 'Mon–Sat: 9 AM – 5 PM',
  },
  {
    department: 'Examination Cell',
    icon: GraduationCap,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    phone: '+91 21 2763 9020',
    email: 'exam@mitaoe.ac.in',
    hours: 'Mon–Fri: 10 AM – 4 PM',
  },
  {
    department: 'Hostel Office',
    icon: Shield,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    phone: '+91 21 2763 9040',
    email: 'hostel@mitaoe.ac.in',
    hours: 'Mon–Sat: 9 AM – 6 PM',
  },
  {
    department: 'Transport Office',
    icon: Bus,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    phone: '+91 21 2763 9060',
    email: 'transport@mitaoe.ac.in',
    hours: 'Mon–Sat: 8 AM – 6 PM',
  },
  {
    department: 'Student Affairs',
    icon: Users,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10',
    phone: '+91 21 2763 9080',
    email: 'studentaffairs@mitaoe.ac.in',
    hours: 'Mon–Fri: 10 AM – 5 PM',
  },
  {
    department: 'Placement Cell',
    icon: Trophy,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    phone: '+91 21 2763 9100',
    email: 'placement@mitaoe.ac.in',
    hours: 'Mon–Fri: 10 AM – 5 PM',
  },
]

const QUICK_LINKS = [
  { label: 'MITAOE Website', url: 'https://mitaoe.ac.in', icon: Globe, desc: 'Official college portal' },
  { label: 'Fee Payment Portal', url: 'https://mitaoe.ac.in/fee', icon: Landmark, desc: 'Pay fees online' },
  { label: 'NPTEL Courses', url: 'https://nptel.ac.in', icon: BookOpen, desc: 'Free online courses' },
  { label: 'MITAOE Campus Map', url: 'https://maps.app.goo.gl/Rf3wYpYmQdKCBsqe7', icon: Navigation, desc: 'Google Maps' },
]

const STATS = [
  { label: 'Established', value: '1983', icon: Star },
  { label: 'Acres Campus', value: '50+', icon: Landmark },
  { label: 'Students', value: '5000+', icon: Users },
  { label: 'Faculty', value: '250+', icon: GraduationCap },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function CampusPage() {
  const [activeTab, setActiveTab] = useState<'facilities' | 'contacts' | 'links'>('facilities')
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null)

  const selected = FACILITIES.find(f => f.id === selectedFacility)

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-16">

      {/* ── Hero Banner ── */}
      <Reveal as="section" direction="down" pop onView={false}
        className="relative overflow-hidden rounded-[2.5rem] bg-card/60 backdrop-blur-3xl border border-white/20 shadow-[0_24px_80px_rgba(16,185,129,0.1)] dark:border-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)] p-6 md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-emerald-400/20 bg-emerald-400/10 blur-sm animate-floaty" />
        <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
              <MapPin className="h-3.5 w-3.5" />
              MIT Academy of Engineering
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Explore Campus
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground max-w-lg">
              Everything you need to know about MIT Academy of Engineering — facilities, contacts, map, and campus resources in one place.
            </p>
          </div>
          <a
            href="https://maps.app.goo.gl/Rf3wYpYmQdKCBsqe7"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 group/btn relative overflow-hidden rounded-full bg-primary text-primary-foreground px-6 py-3 font-bold text-[11px] uppercase tracking-wider shadow-[0_0_30px_rgba(var(--primary),0.25)] transition-transform duration-300 hover:scale-105 flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            Get Directions
            <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform duration-300 group-hover/btn:translate-y-0" />
          </a>
        </div>

        {/* Stats Row */}
        <div className="relative z-10 mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-background/40 backdrop-blur border border-border/40 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground leading-none">{value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── Embedded Map ── */}
      <div className="overflow-hidden rounded-[2rem] border border-border/60 shadow-lg bg-muted">
        <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border">
          <MapPin className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold text-foreground">MIT Academy of Engineering, Alandi, Pune</p>
          <a
            href="https://maps.app.goo.gl/Rf3wYpYmQdKCBsqe7"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline uppercase tracking-wider"
          >
            Open in Maps <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3782.0291866836!2d73.89755837467936!3d18.63893498247613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c77d5100b91d%3A0x7c4c9a43ba32c2d3!2sMIT%20Academy%20Of%20Engineering!5e0!3m2!1sen!2sin!4v1720520000000!5m2!1sen!2sin"
          width="100%"
          height="360"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="MITAOE Campus Map"
        />
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-2 rounded-2xl bg-muted/50 p-1.5 border border-border/50">
        {(['facilities', 'contacts', 'links'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 rounded-xl py-2.5 text-[11px] font-black uppercase tracking-widest transition-all',
              activeTab === tab
                ? 'bg-card text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            {tab === 'facilities' ? '🏛 Facilities' : tab === 'contacts' ? '📞 Contacts' : '🔗 Quick Links'}
          </button>
        ))}
      </div>

      {/* ── Facilities Tab ── */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Facility Cards */}
          <Stagger className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FACILITIES.map((facility) => {
              const Icon = facility.icon
              const isSelected = selectedFacility === facility.id
              return (
                <StaggerItem key={facility.id}>
                  <button
                    onClick={() => setSelectedFacility(isSelected ? null : facility.id)}
                    className={cn(
                      'w-full text-left p-5 rounded-[1.75rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group',
                      isSelected
                        ? `${facility.bg} ${facility.border} border shadow-lg`
                        : 'bg-card border-border/60 hover:border-primary/20'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center shrink-0', facility.bg, isSelected && 'scale-110 transition-transform')}>
                        <Icon className={cn('h-5 w-5', facility.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-foreground truncate">{facility.name}</h3>
                          <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', isSelected && 'rotate-90')} />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{facility.description}</p>
                        <div className="flex gap-1 flex-wrap mt-2.5">
                          {facility.tags.map(tag => (
                            <span key={tag} className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', facility.bg, facility.color, facility.border)}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                </StaggerItem>
              )
            })}
          </Stagger>

          {/* Facility Detail Panel */}
          <div className="lg:col-span-1">
            {selected ? (
              <div className={cn('rounded-[2rem] border p-6 space-y-5 sticky top-4', selected.bg, selected.border)}>
                <div className="flex items-center gap-3">
                  <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center', selected.bg)}>
                    <selected.icon className={cn('h-7 w-7', selected.color)} />
                  </div>
                  <div>
                    <h2 className="font-black text-base text-foreground">{selected.name}</h2>
                    <p className={cn('text-[11px] font-bold uppercase tracking-wider', selected.color)}>Campus Facility</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hours</p>
                      <p className="text-sm font-semibold text-foreground">{selected.hours}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location</p>
                      <p className="text-sm font-semibold text-foreground">{selected.floor}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-border/60 p-8 flex flex-col items-center justify-center text-center gap-3 h-full min-h-[200px] bg-muted/20">
                <Info className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-semibold">Select a facility to see details</p>
                <p className="text-[11px] text-muted-foreground/60">Hours, location, and more</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Contacts Tab ── */}
      {activeTab === 'contacts' && (
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONTACTS.map((contact) => {
            const Icon = contact.icon
            return (
              <StaggerItem key={contact.department}>
                <div className="p-5 rounded-[1.75rem] border border-border/60 bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center shrink-0', contact.bg)}>
                      <Icon className={cn('h-5 w-5', contact.color)} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{contact.department}</h3>
                      <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {contact.hours}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors group"
                    >
                      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      {contact.phone}
                    </a>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors group"
                    >
                      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <span className="truncate">{contact.email}</span>
                    </a>
                  </div>
                </div>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}

      {/* ── Quick Links Tab ── */}
      {activeTab === 'links' && (
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon
            return (
              <StaggerItem key={link.label}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 rounded-[1.75rem] border border-border/60 bg-card hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 group"
                >
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <Icon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">{link.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{link.desc}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </a>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}

      {/* ── Address Footer ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-border/60 bg-card/60 px-6 py-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">MIT Academy of Engineering</p>
          <p className="text-xs text-muted-foreground mt-0.5">Alandi (D), Dehu Phata, Pune – 412105, Maharashtra, India</p>
        </div>
        <a
          href="https://maps.app.goo.gl/Rf3wYpYmQdKCBsqe7"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline uppercase tracking-wider shrink-0"
        >
          View on Maps <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}
