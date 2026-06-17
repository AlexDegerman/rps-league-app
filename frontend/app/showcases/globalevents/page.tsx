'use client'
import Image from 'next/image'

interface GlobalEventCardProps {
  name: string
  modifier: string
  weight: string
  duration: string
  description: string
  extra?: string
  trigger: string
  theme: string
  color: string
  badge: string
  gif?: string
  tiers: {
    name: string
    scale: string
    tag: string
    cls: string
    shorthand: string
    desc: string
  }[]
}

function GlobalEventCard({
  name,
  modifier,
  weight,
  duration,
  description,
  extra,
  trigger,
  theme,
  color,
  badge,
  gif,
  tiers
}: GlobalEventCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="font-[DM_Mono] min-w-0">
          <span className="text-xs text-[#444] font-bold block mb-1">
            {name}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[9px] py-0.5 px-1.5 rounded font-medium uppercase tracking-wider"
              style={{
                background: `${color}18`,
                color: color,
                border: `1px solid ${color}40`
              }}
            >
              {badge}
            </span>
            <span className="text-[9px] text-[#bbb] font-[DM_Mono] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
              Weight: {weight}
            </span>
            <span className="text-[9px] text-[#bbb] font-[DM_Mono]">
              {duration}
            </span>
          </div>
        </div>
        {gif && (
          <Image
            src={gif}
            alt={`${name} in action`}
            width={120}
            height={90}
            className="rounded-lg shrink-0 border border-[#e8e6e1]/60"
            unoptimized
          />
        )}
      </div>

      <div className="text-[11px] font-bold mb-1" style={{ color }}>
        Active Modifier: {modifier}
      </div>

      <p className="text-[11px] text-[#555] font-[DM_Mono] leading-relaxed mb-2">
        {description}
      </p>

      {extra && (
        <p className="text-[11px] text-[#888] font-[DM_Mono] leading-relaxed mb-2 italic">
          {extra}
        </p>
      )}

      <div className="border-t border-[#f8f7f4] pt-3 mt-2">
        <div className="text-[9px] tracking-widest uppercase text-[#bbb] font-bold font-[DM_Mono] mb-2">
          Linked Number Tiers
        </div>
        <div className="flex flex-col gap-2">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="bg-[#f8f7f4]/50 rounded-lg p-2.5 border border-[#e8e6e1]/30"
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="font-[DM_Mono] min-w-0">
                  <span className="text-[10px] font-bold text-gray-800 block leading-tight">
                    {tier.name}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-[9px] text-[#aaa] font-[DM_Mono]">
                      {tier.scale}
                    </span>
                    <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider font-[DM_Mono]">
                      {tier.tag}
                    </span>
                  </div>
                </div>
                <div
                  className="text-lg font-bold leading-none tracking-tight relative pr-1 shrink-0 select-none"
                  style={{ overflow: 'visible' }}
                >
                  <span className={tier.cls} data-text={tier.shorthand}>
                    {tier.shorthand}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 font-[DM_Mono] leading-relaxed">
                {tier.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#f8f7f4] pt-3 mt-3 flex flex-col gap-1.5">
        <div className="flex gap-1.5 text-[10px] font-[DM_Mono]">
          <span className="text-[#bbb] shrink-0">Trigger:</span>
          <span className="text-[#777]">{trigger}</span>
        </div>
        <div className="flex gap-1.5 text-[10px] font-[DM_Mono]">
          <span className="text-[#bbb] shrink-0">Theme:</span>
          <span className="text-[#777]">{theme}</span>
        </div>
      </div>
    </div>
  )
}

export default function GlobalEventsShowcase() {
  return (
    <div className="bg-[#f8f7f4] min-h-screen font-[Space_Grotesk] antialiased">
      <div className="max-w-2xl mx-auto px-4">
        <div className="pt-6 pb-6 text-center">
          <div className="text-[11px] tracking-[0.15em] uppercase text-[#999] mb-2 font-[DM_Mono]">
            RPS League · Server Orchestration
          </div>
          <div className="text-[28px] font-bold text-[#1a1a1a] leading-tight mb-1">
            Global Events
          </div>
          <div className="text-[13px] text-[#888] font-[DM_Mono]">
            Synchronized via SSE · Managed entirely by backend orchestrator
          </div>
        </div>

        {/* System Rules */}
        <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm mb-6">
          <div className="text-[10px] tracking-[0.12em] uppercase text-[#bbb] font-[DM_Mono] mb-3">
            Event Lifecycle & Rules
          </div>
          <ul className="flex flex-col gap-2">
            {[
              [
                'Event Cooldown',
                'A randomized 10 to 30-minute quiet period follows each active event before the next selection cycle occurs.'
              ],
              [
                'Warning Phase',
                'A 1.5 to 3-minute period initiating telemetry warnings, warning UI clocks, Oracle voice updates, and spoken count alerts at 60s/30s.'
              ],
              [
                'Active Phase',
                'A high-intensity 1 to 3-minute window applying active modifiers, card transforms, and full viewport CSS visual shaders.'
              ],
              [
                'Universal Sync',
                'Since state is pushed strictly from the server, all connected players participate on identical timelines and match IDs.'
              ]
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-2 text-[11px] font-[DM_Mono]">
                <span className="text-[#1a1a1a] font-bold shrink-0">
                  {title}:
                </span>
                <span className="text-[#888]">{desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4 pb-20">
          {/* Tidal Surge */}
          <GlobalEventCard
            name="Tidal Surge"
            modifier="Win Echo Protocol (+20% signal payout echo)"
            weight="30%"
            duration="1 - 3 Minutes"
            description="Deep ocean-themed currents submerge the interface. Every successful prediction triggers a 20% ghostly win echo that floats up and adds directly to your payout total."
            extra="Announced by pre-active Oracle warnings and telemetry shifts. Integrates deep-sea wave shaders across all prediction cards."
            trigger="Weighted random selection (30% weight) at the end of a system cooldown"
            theme="Oceanic teal and emerald gradients, deep-sea cyan current loops, hydro-telemetry effects"
            color="#0f766e"
            badge="ocean surge"
            gif="/assets/tidal_surge_demo.gif"
            tiers={[
              {
                name: 'Trigintillion',
                scale: '10⁹³',
                tag: 'leviathan maelstrom / trg',
                cls: 'g-trg',
                shorthand: '1.2Trg',
                desc: 'Teal and emerald flowing gradients beneath animated cyan currents while a towering water vortex sways above the text. Below, a jagged tsunami crashes with animated white foam and violent wave motion.'
              },
              {
                name: 'Novemvigintillion',
                scale: '10⁹⁰',
                tag: 'abyssal trench / nvg',
                cls: 'g-nvg',
                shorthand: '1.2Nvg',
                desc: 'Deep midnight-blue typography with neon cyan outlines, sapphire glow effects, a pulsing aura, and falling sapphire spores.'
              }
            ]}
          />

          {/* Cyclone Blitz */}
          <GlobalEventCard
            name="Cyclone Blitz"
            modifier="Streak Turbocurrent (+2 Win Streak per prediction)"
            weight="25%"
            duration="1 - 3 Minutes"
            description="Atmospheric hurricane winds and storm vectors sweep the screen, speeding up win-streak progression to quickly reach max streak multipliers."
            extra="Pushes high-velocity wind vectors across the display. Win effects trigger rapid wind draft and static thunder-spark transitions."
            trigger="Weighted random selection (25% weight) at the end of a system cooldown"
            theme="Slate and emerald storm vectors, diagonal gale wind lines, high-velocity currents"
            color="#047857"
            badge="atmospheric storm"
            gif="/assets/cyclone_blitz_demo.gif"
            tiers={[
              {
                name: 'Duotrigintillion',
                scale: '10⁹⁹',
                tag: 'razor tempest / dtr',
                cls: 'g-dtr',
                shorthand: '1.2Dtr',
                desc: 'Slate-and-emerald chrome typography with a static 3D shadow, serrated green mechanical tracks, needle-thin vertical sparks, and slowly bobbing spiky icons.'
              },
              {
                name: 'Untrigintillion',
                scale: '10⁹⁶',
                tag: 'gale-force aero / utr',
                cls: 'g-utr',
                shorthand: '1.2Utr',
                desc: 'Liquid platinum-silver text with trailing smoked-slate wind plumes, wind threads, and tiny silver condensation droplets.'
              }
            ]}
          />

          {/* Solar Flare */}
          <GlobalEventCard
            name="Solar Flare"
            modifier="Solar Overdrive (All wins gain a 2.0x payout multiplier)"
            weight="20%"
            duration="1 - 3 Minutes"
            description="Stellar eruptions, coronal ring loops, and star-white flares take over the interface. Every winning prediction has its final payout doubled."
            extra="The live marquee streams real-time coronal mass ejection forecasts, while the backdrop activates high-intensity bloom filters."
            trigger="Weighted random selection (20% weight) at the end of a system cooldown"
            theme="Star-white plasma shifts, golden-orange prominence loops, expanding volumetric lens flares"
            color="#c2410c"
            badge="plasma burst"
            gif="/assets/solar_flare_demo.gif"
            tiers={[
              {
                name: 'Quattuortrigintillion',
                scale: '10¹⁰⁵',
                tag: 'zenith supernova / qtr',
                cls: 'g-qtr',
                shorthand: '1.2Qtr',
                desc: 'Star-white and lavender gradients pulsing beneath rotating lens flares and glowing plasma sparks with expanding bloom effects.'
              },
              {
                name: 'Trestrigintillion',
                scale: '10¹⁰²',
                tag: 'solar prominence / ttr',
                cls: 'g-ttr',
                shorthand: '1.2Ttr',
                desc: 'Golden plasma typography illuminated by a descending volumetric light cone feeding directly into a five-peak animated solar crown.'
              }
            ]}
          />

          {/* Mirage Cataclysm */}
          <GlobalEventCard
            name="Mirage Cataclysm"
            modifier="Variable Echo Field (Random 15% to 50% phantom payout)"
            weight="20%"
            duration="1 - 3 Minutes"
            description="Shifting sandstorms, heat warp, and unstable mirage shadows distort the board, rolling randomized auxiliary phantom payouts on every victory."
            extra="Applies a high-contrast heat-shimmer layout warp. Wins display unstable clone numbers and trailing mirage shadow layers."
            trigger="Weighted random selection (20% weight) at the end of a system cooldown"
            theme="Neon-gold windswept sand dunes, unstable heat-wave mirages, localized dust storm grids"
            color="#7e22ce"
            badge="desert illusion"
            gif="/assets/mirage_cataclysm_demo.gif"
            tiers={[
              {
                name: 'Sextrigintillion',
                scale: '10¹¹¹',
                tag: 'phantasm core / str',
                cls: 'g-str',
                shorthand: '1.2Str',
                desc: 'Smoked amethyst typography under a royal crown with gold-purple shimmers and concentric shockwaves.'
              },
              {
                name: 'Quintrigintillion',
                scale: '10¹⁰⁸',
                tag: 'dune illusion / qntr',
                cls: 'g-qntr',
                shorthand: '1.2Qntr',
                desc: 'Golden-sand gradient text with a heat-haze mirage shadow, rising gold dust, top/bottom glowing rails, and slowly shifting parallax desert dunes.'
              }
            ]}
          />
        </div>

        <div className="text-center pt-4 pb-12 text-[11px] text-[#bbb] font-[DM_Mono] leading-relaxed">
          rpsleaguegame.vercel.app
          <br />
          server synchronized sse loop · weighted random selection
        </div>
      </div>
    </div>
  )
}
