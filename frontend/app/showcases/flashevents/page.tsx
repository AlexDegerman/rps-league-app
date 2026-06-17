'use client'
import Image from 'next/image'

interface FlashEventCardProps {
  name: string
  effect: string
  trigger: string
  duration: string
  description: string
  extra?: string
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

function FlashEventCard({
  name,
  effect,
  trigger,
  duration,
  description,
  extra,
  theme,
  color,
  badge,
  gif,
  tiers
}: FlashEventCardProps) {
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
        {effect}
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
          Introduced Number Tiers
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

export default function FlashEventsShowcase() {
  return (
    <div className="bg-[#f8f7f4] min-h-screen font-[Space_Grotesk] antialiased">
      <div className="max-w-2xl mx-auto px-4">
        <div className="pt-1 pb-6 text-center">
          <div className="text-[11px] tracking-[0.15em] uppercase text-[#999] mb-2 font-[DM_Mono]">
            RPS League · Core Mechanics
          </div>
          <div className="text-[28px] font-bold text-[#1a1a1a] leading-tight mb-1">
            Flash Events
          </div>
          <div className="text-[13px] text-[#888] font-[DM_Mono]">
            Four volatile states · 5% chance per bet placement
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm mb-6">
          <div className="text-[10px] tracking-[0.12em] uppercase text-[#bbb] font-[DM_Mono] mb-3">
            Event Rules
          </div>
          <ul className="flex flex-col gap-2">
            {[
              [
                'Duration lock',
                'Each Flash Event is guaranteed to last exactly 3 predictions from the moment of activation.'
              ],
              [
                'Guaranteed win',
                'During a Flash Event active phase, prediction safety protocols force win resolutions for all outcomes.'
              ],
              [
                'Atmospheric shader',
                'The active event injects complete UI color sweeps, specialized audio layers, and dynamic particle systems.'
              ],
              [
                'Weighted rotation',
                'Certain thematic events feature higher random selection rates without increasing the base trigger probability.'
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
          {/* Hellfire */}
          <FlashEventCard
            name="Hellfire"
            effect="3.0x Wins + Guaranteed Win"
            trigger="5% random trigger on bet placement"
            duration="3 Predictions"
            description="A high-intensity pressure state that heats up the interface. Win effects are replaced with layered hellfire columns, screen-flash ignition, and ambient ground glows."
            extra="Equipped with specialized high-pressure combustion and fire audio feedback loops to reinforce betting momentum."
            theme="Deep Crimson and Burning Orange, rising flame vectors, falling ash particles"
            color="#b91c1c"
            badge="flame blitz"
            gif="/assets/hellfire_event_demo.gif"
            tiers={[
              {
                name: 'Septenvigintillion',
                scale: '10⁸⁴',
                tag: 'molten',
                cls: 'g-spv',
                shorthand: '1.2Spv',
                desc: 'Solid orange-red gradient cycling color stops combined with dynamic skew-X distortion and pulsing blur filters.'
              },
              {
                name: 'Octovigintillion',
                scale: '10⁸⁷',
                tag: 'lava overload',
                cls: 'g-ovg',
                shorthand: '1.2Ovg',
                desc: 'Radial gradient from gold core to deep crimson, background position wandering via magma-flow. Full-width sawtooth flame crown above via clip-path, jittering on a 0.15s steps loop. Ambient blur glow bleeds behind the number. Three animations desync deliberately, magma-flow, heat-flicker, micro-jitter all run on different durations.'
              }
            ]}
          />

          {/* Luck in the Card */}
          <FlashEventCard
            name="Luck in the Card"
            effect="1.5x Wins + Guaranteed Legendary Bonus"
            trigger="5% random trigger on bet placement"
            duration="3 Predictions"
            description="A premium high-roller casino state. On win moments, a cascading shower of playing card suit particles, gold rectangles, and shimmer trails replaces standard win effects."
            extra="Legendary Bonus guaranteed on every win (10x reward multiplier) with card shuffle audio effects reinforcing jackpot resolutions."
            theme="Lustrous Amber and Solar Gold, cascading suit symbols, metallic coin particles"
            color="#b45309"
            badge="high roller"
            gif="/assets/cards_event_demo.gif"
            tiers={[
              {
                name: 'Quinvigintillion',
                scale: '10⁷⁸',
                tag: 'holographic foil',
                cls: 'g-qiv',
                shorthand: '1.2Qiv',
                desc: '7-stop oil-slick rainbow at 45° with 400% background-size cycling diagonally. Drop-shadow color rotates each keyframe to track the dominant hue, pink at 0%, amber at 25%, green at 50%, cyan at 75%.'
              },
              {
                name: 'Sexvigintillion',
                scale: '10⁸¹',
                tag: 'the jackpot',
                cls: 'g-svg',
                shorthand: '1.2Svg',
                desc: 'Gold-pink-teal holographic gradient streams continuously. Two 🎲 satellites orbit on separate radii in opposite directions, one clockwise at 1.8em, one counter-clockwise at 2.2em, each with an independent colored drop-shadow.'
              }
            ]}
          />

          {/* Electric Surge */}
          <FlashEventCard
            name="Electric Surge"
            effect="3.0x Wins + Guaranteed Win"
            trigger="5% random trigger on bet placement"
            duration="3 Predictions"
            description="A volatile kinetic state. The viewport shifts into a dark storm grid with vertical streams of static-like lightning rain, sharp light flashes, and high-frequency sparks."
            extra="Sharp lightning audio cues reinforce prediction resolutions inside the electric supercell atmosphere."
            theme="Neon Violet and Electric Purple, vivid border glows, vertical lightning stream lines"
            color="#4c1d95"
            badge="storm surge"
            gif="/assets/electric_event_demo.gif"
            tiers={[
              {
                name: 'Trevigintillion',
                scale: '10⁷²',
                tag: 'charged',
                cls: 'g-tvg',
                shorthand: '1.2Tvg',
                desc: 'Purple neon solid color with a scripted flicker sequence, double blink at 4-6%, opacity drop at 36%, stutter at 92-93%. Scale and glow radius peak together at 60%.'
              },
              {
                name: 'Quattuorvigintillion',
                scale: '10⁷⁵',
                tag: 'supercell',
                cls: 'g-qvg',
                shorthand: '1.2Qvg',
                desc: 'Blue-purple gradient streams left to right continuously. A repeating conic-gradient overlay fires in color-dodge mode via steps(1), fractal lightning spokes rotate and reposition each burst. White-out filter at 63% simulates a direct strike.'
              }
            ]}
          />

          {/* Moon's Blessing */}
          <FlashEventCard
            name="Moon's Blessing"
            effect="3.0x Wins + Guaranteed Win"
            trigger="5% random trigger on bet placement"
            duration="3 Predictions"
            description="A serene lunar-inspired state. Viewport elements shift to moonlight colors, with drifting luminous particles mimicking snow falling quietly behind matches."
            extra="Features soft ethereal audio soundscapes and crescent shadow animations running on continuous low-frequency sweep cycles."
            theme="Ethereal Lunar Blue and Soft Frost White, drifting snow particles, calm crescent motifs"
            color="#1e3a8a"
            badge="lunar shift"
            gif="/assets/moon_event_demo.gif"
            tiers={[
              {
                name: 'Unvigintillion',
                scale: '10⁶⁶',
                tag: 'moonlit',
                cls: 'g-uvg',
                shorthand: '1.2Uvg',
                desc: 'Navy-to-white-to-navy gradient sweeps at 135° across 200% background-size on a 4s linear loop. Drop-shadow pulses from a tight blue edge glow to a wider soft cyan bloom and back.'
              },
              {
                name: 'Duovigintillion',
                scale: '10⁶⁹',
                tag: 'full eclipse',
                cls: 'g-dvg',
                shorthand: '1.2Dvg',
                desc: 'Two gradients blended with screen mode, a radial white-core circle over a sweeping linear diagonal. Both background positions animate independently, making the bright lunar surface crawl across the letterforms on a 6s ease loop.'
              }
            ]}
          />
        </div>

        <div className="text-center pt-4 pb-12 text-[11px] text-[#bbb] font-[DM_Mono] leading-relaxed">
          rpsleaguegame.vercel.app
          <br />
          guaranteed win resolution · 3-match duration
        </div>
      </div>
    </div>
  )
}
