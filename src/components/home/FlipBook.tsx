'use client'

import React, { useState } from 'react'
import {
  Heart,
  Wallet,
  ShieldCheck,
  Sprout,
  GitBranch,
  Smile,
  Sun,
  TrendingUp,
  Zap,
  Users,
} from 'lucide-react'

// Story content for pages
const storyContent = [
  {
    title: 'Sleepy Coins',
    text: 'Once, u had some coins. They were bored doing nothing.',
    visual: (
      <div className="relative">
        <Wallet className="w-28 h-28 text-stone-700 inner-book-icon" />
        <span className="absolute top-1 left-28 text-3xl">Zzz...</span>
      </div>
    ),
  },
  {
    title: 'Safe Box',
    text: 'You put them in a Magic Box. It keeps them super safe!',
    visual: <ShieldCheck className="w-28 h-28 text-emerald-700 inner-book-icon" />,
  },
  {
    title: 'It Grows!',
    text: 'The box plants seeds. Suddenly, new money grows on top!',
    visual: <Sprout className="w-28 h-28 text-green-600 inner-book-icon float-icon" />,
  },
  {
    title: 'The Split',
    text: 'The magic box cuts the new money in half. Chop chop!',
    visual: <GitBranch className="w-28 h-28 text-amber-700 inner-book-icon rotate-90" />,
  },
  {
    title: 'Good Deeds',
    text: 'Half goes to fix the world. Planting trees & helping kids.',
    visual: <Heart className="w-28 h-28 text-red-500 fill-red-200 inner-book-icon" />,
  },
  {
    title: 'Happy Ending',
    text: 'The other half goes to you. Everyone wins! The End.',
    visual: (
      <div className="relative">
        <Smile className="w-28 h-28 text-yellow-500 inner-book-icon" />
        <Sun className="absolute -top-3 -right-3 w-12 h-12 text-orange-400 inner-book-icon animate-spin-slow" />
      </div>
    ),
  },
]

const howItWorksSteps = [
  {
    icon: Wallet,
    title: 'Deposit USDC',
    desc: 'Your principal stays 100% safe and withdrawable anytime.',
  },
  {
    icon: TrendingUp,
    title: 'Earn Yield',
    desc: 'DeFi protocols like Aave generate interest on your deposit.',
  },
  {
    icon: Zap,
    title: 'Auto-Donate',
    desc: '50% of yield goes to your chosen cause automatically.',
  },
  {
    icon: Users,
    title: 'Community Votes',
    desc: 'Stakers verify milestones before funds are released.',
  },
]

// 1. Shared Styles for Consistency
// Old yellowish paper texture (aged parchment look)
const paperStyle =
  "bg-[#f5e6c8] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] border-amber-200"
// Dark green leather texture
const leatherStyle =
  "bg-[#064e3b] bg-[url('https://www.transparenttextures.com/patterns/leather.png')] border-[#022c22]"

// Book page component with front/back faces
interface BookPageProps {
  children: React.ReactNode
  pageNum: number
  zIndex: number
  flipped: boolean
  onFlip: () => void
}

const BookPage = ({ children, pageNum, zIndex, flipped, onFlip }: BookPageProps) => {
  return (
    <div
      className="absolute top-0 left-0 w-full h-full cursor-pointer select-none transition-transform duration-1000 ease-in-out"
      style={{
        // Flipped pages get high z-index to appear on top of the inner cover
        zIndex: flipped ? 100 + zIndex : zIndex,
        transformOrigin: 'left center',
        transform: flipped ? 'rotateY(-180deg)' : 'rotateY(0deg)',
        transformStyle: 'preserve-3d',
      }}
      onClick={onFlip}
    >
      {/* --- FRONT OF PAGE (Right Side) --- */}
      <div
        className={`absolute inset-0 w-full h-full rounded-r-md border-l shadow-md overflow-hidden text-emerald-900 ${paperStyle}`}
        style={{
          backfaceVisibility: 'hidden',
          zIndex: 2,
          // Subtle gradient to simulate curve near spine
          backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05), transparent 10%)',
        }}
      >
        <div className="h-full w-full p-6 flex flex-col relative font-messy">
          {children}
          <div className="absolute bottom-4 right-6 text-stone-500 text-xl font-serif">
            {pageNum}
          </div>
        </div>
      </div>

      {/* --- BACK OF PAGE (Left Side) --- */}
      <div
        className={`absolute inset-0 w-full h-full rounded-l-md border-r shadow-md overflow-hidden ${paperStyle}`}
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          // Reverse gradient for the other side of the spine
          backgroundImage: 'linear-gradient(to left, rgba(0,0,0,0.05), transparent 10%)',
        }}
      >
        {/* We leave this blank or add a faint see-through text effect if desired */}
      </div>
    </div>
  )
}

// Cover component with leather texture and gold engraved elements
const Cover = ({ isOpen, onOpen }: { isOpen: boolean; onOpen: () => void }) => (
  <div
    className="absolute top-0 left-0 w-full h-full cursor-pointer transition-transform duration-1000 ease-in-out z-50"
    style={{
      transformOrigin: 'left center',
      transform: isOpen ? 'rotateY(-180deg)' : 'rotateY(0deg)',
      transformStyle: 'preserve-3d',
    }}
    onClick={onOpen}
  >
    {/* --- FRONT COVER (Outside) --- */}
    <div
      className={`absolute inset-0 rounded-r-lg shadow-2xl flex flex-col items-center justify-center text-center p-6 border-l-4 ${leatherStyle}`}
      style={{
        backfaceVisibility: 'hidden',
        zIndex: 2,
      }}
    >
      {/* Decorative Gold Border Box */}
      <div
        className="w-full h-full rounded-lg flex flex-col items-center justify-center p-6"
        style={{
          border: '2px solid #bfa15f',
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)', // Inner shadow for depth
        }}
      >
        <Heart
          className="w-16 h-16 mb-6"
          fill="#bfa15f"
          stroke="none"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
        />

        {/* Realistic Engraved Text Effect */}
        <h2
          className="text-xl font-serif font-bold mb-2 tracking-widest uppercase"
          style={{
            background: 'linear-gradient(45deg, #cfaa60 0%, #f4e2ae 40%, #b8924a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            // This creates the "pressed in" look
            filter:
              'drop-shadow(0 1px 1px rgba(0,0,0,0.8)) drop-shadow(0 -1px 0px rgba(255,255,255,0.2))',
          }}
        >
          Give
          <br />
          Protocol
        </h2>

        <div className="w-16 h-0.5 bg-[#bfa15f] my-6 shadow-sm"></div>

        <p className="text-[#bfa15f] font-serif italic text-sm shadow-sm">Vol. 1</p>
      </div>
    </div>

    {/* --- INNER COVER (Inside Left) --- */}
    {/* This is what you see on the LEFT when the book is open */}
    <div
      className={`absolute inset-0 rounded-l-lg shadow-inner flex items-center justify-center ${leatherStyle}`}
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)', // Standard flip logic
        borderRight: '4px solid #04352f', // Spine shadow
      }}
    >
      {/* Inner paper pasted on the leather */}
      <div className="w-[90%] h-[94%] bg-[#f4ebd0] rounded shadow-inner flex items-center justify-center p-8 text-center opacity-90">
        <div className="border border-double border-stone-400 p-4 h-full w-full flex items-center justify-center">
          <p className="font-serif italic text-emerald-900/80 text-lg">
            &ldquo;A brand new chapter
            <br />
            for sustainable,
            <br />
            no-loss giving.&rdquo;
          </p>
        </div>
      </div>
    </div>
  </div>
)

export const FlipBook = () => {
  const [pageIndex, setPageIndex] = useState(0)
  const totalContentPages = 6

  const handleNext = () => {
    if (pageIndex <= totalContentPages) setPageIndex(pageIndex + 1)
  }

  const handleFlip = (clickedPageIndex: number) => {
    if (clickedPageIndex === totalContentPages) setPageIndex(0)
    else handleNext()
  }

  return (
    <div className="w-full h-[90vh] flex items-center justify-center overflow-hidden relative py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 items-center gap-24 ml-20">
          {/* Left: Book */}
          <div className="flex justify-center lg:justify-end">
            <div
              className="relative w-[288px] md:w-[336px] h-[416px] md:h-[464px] drop-shadow-2xl"
              style={{ perspective: '1600px' }}
            >
              {/* Back Cover (Thick Green) */}
              <div className="absolute inset-0 bg-[#064e3b] rounded-r-lg border-l-8 border-[#022c22]"></div>

              {/* Dynamic Pages */}
              {storyContent.map((page, index) => {
                const actualIndex = index + 1
                const z = storyContent.length - index
                const isFlipped = pageIndex > actualIndex

                return (
                  <BookPage
                    key={index}
                    pageNum={actualIndex}
                    zIndex={z}
                    flipped={isFlipped}
                    onFlip={() => handleFlip(actualIndex)}
                  >
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 pt-2">
                      <div className="transform rotate-1 hover:rotate-3 transition-transform duration-300">
                        {page.visual}
                      </div>
                      <div>
                        <h3 className="text-3xl font-handwritten text-stone-700 mb-2 leading-tight">
                          {page.title}
                        </h3>
                        <div className="w-24 h-0.5 bg-stone-800/20 mx-auto rounded-full mb-4"></div>
                        <p className="text-2xl font-messy text-stone-600 leading-[1.15] max-w-[200px] mx-auto transform -rotate-1">
                          {page.text}
                        </p>
                      </div>

                      {index === storyContent.length - 1 && (
                        <div className="text-emerald-700 text-2xl animate-bounce mt-2 cursor-pointer font-bold">
                          ( Close Book )
                        </div>
                      )}
                    </div>
                  </BookPage>
                )
              })}

              <Cover isOpen={pageIndex > 0} onOpen={() => setPageIndex(1)} />
            </div>
          </div>

          {/* Right: How It Works */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-2">How It Works</h2>
              <p className="text-muted-foreground">
                Tap the book to learn, or read the quick summary below.
              </p>
            </div>

            <div className="space-y-4">
              {howItWorksSteps.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 bg-card rounded-2xl border border-border hover:shadow-lg transition-all duration-300 hover:-translate-x-1"
                >
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
