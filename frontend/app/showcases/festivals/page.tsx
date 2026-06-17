'use client'
import Image from 'next/image'

interface FestivalCardProps {
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
  stub?: boolean
}

function FestivalCard({
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
  stub
}: FestivalCardProps) {
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
            {stub && (
              <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#f1f5f9] text-[#94a3b8] font-medium uppercase tracking-wider border border-[#e2e8f0]">
                stub
              </span>
            )}
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

      <div className="border-t border-[#f8f7f4] pt-3 mt-2 flex flex-col gap-1.5">
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

export default function Festivals() {
  return (
    <div className="bg-[#f8f7f4] min-h-screen font-[Space_Grotesk] antialiased">
      <div className="max-w-2xl mx-auto px-4">
        <div className="pt-1 pb-6 text-center">
          <div className="text-[11px] tracking-[0.15em] uppercase text-[#999] mb-2 font-[DM_Mono]">
            RPS League · Global Event System
          </div>
          <div className="text-[28px] font-bold text-[#1a1a1a] leading-tight mb-1">
            Player Festivals
          </div>
          <div className="text-[13px] text-[#888] font-[DM_Mono]">
            Eight globally-triggered events · One active at a time
          </div>
        </div>

        {/* System Rules */}
        <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm mb-6">
          <div className="text-[10px] tracking-[0.12em] uppercase text-[#bbb] font-[DM_Mono] mb-3">
            System Rules
          </div>
          <ul className="flex flex-col gap-2">
            {[
              [
                'One at a time',
                'Only one Festival can be active globally. Triggers during an active Festival or cooldown are discarded.'
              ],
              [
                '5-minute cooldown',
                'A mandatory lockout follows every Festival conclusion. No queue exists.'
              ],
              [
                'Flash Events override',
                'Flash Event UI theming takes visual priority over an active Festival theme.'
              ],
              [
                'Oracle overrides all',
                "A player who defied the Daily Oracle Prophecy will still lose even during Sanguine's forced-win state."
              ],
              [
                'Autonomous demo festivals',
                'If no player festival has occurred in the last 10 minutes, the Oracle triggers a weighted random festival every 18 to 24 minutes.'
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
          {/* Spark */}
          <FestivalCard
            name="The Spark Festival"
            effect="Universal Synchronization"
            trigger="2 Flash Events completed in a row (100%) OR Legendary/Mythical Bonus during a Flash Event (100%)"
            duration="Immediate activation + 45 seconds"
            description="All active players instantly enter a Flash Event with 3 Flash Bets. Players already in a Flash Event have their remaining bets refilled to 3."
            extra="If triggered by chaining 2 Flash Events, the initiating player receives a guaranteed Bonus Roll on their next 3 predictions. Spark-granted Flash Events expire with the 45-second window. Independently earned Flash Events are unaffected."
            theme="Neon Violet and Electric Purple, vivid border glows and high-frequency light pulses"
            color="#a855f7"
            badge="flash sync"
            gif="/assets/spark_festival_demo.gif"
          />

          {/* Ghost */}
          <FestivalCard
            name="The Ghost Festival"
            effect="Win Echo"
            trigger="Total match multiplier 40x or higher (50% chance) OR 80x or higher (100%)"
            duration="1 minute · 12 matches"
            description="All wins generate a 20% signal echo. The final payout is multiplied by 1.2x."
            extra="The echo appears in the result animation: a ghostly value drifts upward and fades with a teal glow after the result number finishes counting."
            theme="Ethereal Teal and Ghost White, transparent floating particles, drifting echo silhouettes"
            color="#4dd0c4"
            badge="+20% echo"
            gif="/assets/ghost_festival_demo.gif"
          />

          {/* Resonance */}
          <FestivalCard
            name="The Resonance Festival"
            effect="Bonus Stabilization"
            trigger="3 tiered bonuses in a row (100%) OR Legendary Bonus (30% chance)"
            duration="40 seconds · 8 matches"
            description="Every prediction is guaranteed a Common or Rare Bonus. Epic and Legendary tiers are capped. Any roll that would produce Epic or higher is recalculated as Rare."
            theme="Lustrous Amber and Solar Gold, radiant golden aura"
            color="#ecc94b"
            badge="bonus floor"
            gif="/assets/resonance_festival_demo.gif"
          />

          {/* Surge */}
          <FestivalCard
            name="The Surge Festival"
            effect="Power Surge"
            trigger="Completion of a Chrono-Lap (Ascension) - 100%"
            duration="1 minute · 12 matches"
            description="A 3x global multiplier is applied to all win payouts for the duration of the Festival."
            theme="High-Voltage Cyan and Frost White, clean UI brightness boost, horizontal scanlines"
            color="#22d3ee"
            badge="2x wins"
            gif="/assets/surge_festival_demo.gif"
          />

          {/* Fever */}
          <FestivalCard
            name="The Fever Festival"
            effect="Streak Aegis"
            trigger="5-win streak (20% chance) OR 8-win streak (100%)"
            duration="30 seconds · 6 matches"
            description="Losses do not reset win streaks for the duration. Streak multipliers are frozen in place regardless of match outcome."
            theme="Crimson Red and Burning Orange, pulsing heat-haze distortion"
            color="#f97316"
            badge="streak shield"
            gif="/assets/fever_festival_demo.gif"
          />

          {/* Sanguine */}
          <FestivalCard
            name="The Sanguine Festival"
            effect="Absolute Correction"
            trigger="4-loss streak - 100%"
            duration="15 seconds · 3 matches"
            description="All predictions resolve as wins. Win streaks continue to increment normally."
            extra="Exception: players who defied the Daily Oracle Prophecy still lose. The Oracle overrides all correction protocols."
            theme="Blood Red and Deep Charcoal, pulsing crimson saturation, viscous liquid gradients"
            color="#991b1b"
            badge="100% win"
            gif="/assets/sanguine_festival_demo.gif"
          />

          {/* Safeguard */}
          <FestivalCard
            name="The Safeguard Festival"
            effect="Risk Shield"
            trigger="Legendary Achievement (50%) OR Mythical Achievement (100%)"
            duration="1 minute · 12 matches"
            description="Loss deductions are reduced by 20%. Losses only deduct 40% of the stake instead of the standard 50%."
            theme="Slate Blue and Shield Silver, metallic border-frame overrides, geometric shield-shimmer effects"
            color="#94a3b8"
            badge="40% deduction"
            gif="/assets/safeguard_festival_demo.gif"
            stub
          />

          {/* Vault */}
          <FestivalCard
            name="The Vault Festival"
            effect="Loot Echo"
            trigger="Discovery of a Mythical Relic - 100%"
            duration="2 minutes · 24 matches"
            description="All Relic drop rates are doubled for the duration."
            theme="Deep Cobalt and Chrome Silver, liquid metallic sheen on UI containers"
            color="#748ffc"
            badge="2x relics"
            gif="/assets/vault_festival_demo.gif"
            stub
          />
        </div>

        <div className="text-center pt-4 pb-12 text-[11px] text-[#bbb] font-[DM_Mono] leading-relaxed">
          rpsleaguegame.vercel.app
          <br />
          one active at a time · 5-minute global cooldown
        </div>
      </div>
    </div>
  )
}
