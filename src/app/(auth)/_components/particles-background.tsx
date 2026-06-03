'use client'

/**
 * Particles background decoration cho auth pages.
 *
 * Bao gồm:
 * - Dots pattern (radial gradient) subtle
 * - 3 floating circles với animation pulse
 * - Warm pastel colors (peach, yellow, lavender)
 */
export function ParticlesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Dots pattern */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(circle, #FF9B71 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />

      {/* Floating circles decoration - warm pastel colors */}
      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-[#FFD97D]/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 h-40 w-40 rounded-full bg-[#C4A1FF]/20 blur-3xl animate-pulse [animation-delay:1000ms]" />
      <div className="absolute top-1/2 right-1/4 h-24 w-24 rounded-full bg-[#FF9B71]/15 blur-2xl animate-pulse [animation-delay:500ms]" />
    </div>
  )
}
