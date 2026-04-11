'use client'

export default function Showcase() {
  return (
    <div className="bg-[#f8f7f4] min-h-screen font-[Space_Grotesk] antialiased">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header Section */}
        <div className="pt-1 pb-6 text-center">
          <div className="text-[11px] tracking-[0.15em] uppercase text-[#999] mb-2 font-[DM_Mono]">
            RPS League · Point Tier System
          </div>
          <div className="text-[28px] font-bold text-[#1a1a1a] leading-tight mb-1">
            Every glow, ranked.
          </div>
          <div className="text-[13px] text-[#888] font-[DM_Mono]">
            Light theme · Live animation · No precision loss
          </div>
        </div>

        <div className="flex flex-col gap-2 pb-20">
          {/* SECTION: ENDGAME */}
          <div className="pt-4 px-1 pb-2 text-[10px] tracking-[0.12em] uppercase text-[#bbb] font-[DM_Mono] flex items-center gap-2">
            <span>⚡ Endgame tiers</span>
            <div className="h-px flex-1 bg-[#e8e6e1]/50"></div>
          </div>

          {/* Vigintillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Vigintillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10⁶³</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#fff1f2] text-[#9f1239] font-medium uppercase tracking-wider">
                    holy bloom
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-vg">1.2Vg</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Cycling green → red → blue → violet. Constant color shift,
              drop-shadow synced.
            </div>
          </div>

          {/* Novemdecillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Novemdecillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10⁶⁰</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#fffbeb] text-[#92400e] font-medium uppercase tracking-wider">
                    gold radial
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-nod">4.7Nod</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Radial gold gradient with hue-rotate breathing. Text-stroke in
              dark amber.
            </div>
          </div>

          {/* Octodecillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Octodecillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10⁵⁷</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#f0f9ff] text-[#0369a1] font-medium uppercase tracking-wider">
                    rgb cycle
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-ocd">2.1Ocd</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              RGB linear gradient + hue-rotate(360deg) for full spectrum
              rotation.
            </div>
          </div>

          {/* SECTION: ULTRA */}
          <div className="pt-6 px-1 pb-2 text-[10px] tracking-[0.12em] uppercase text-[#bbb] font-[DM_Mono] flex items-center gap-2">
            <span>🔥 Ultra tiers</span>
            <div className="h-px flex-1 bg-[#e8e6e1]/50"></div>
          </div>

          {/* Septendecillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Septendecillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10⁵⁴</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#f5f3ff] text-[#5b21b6] font-medium uppercase tracking-wider">
                    indigo pulse
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-spd">8.8Spd</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Solid indigo with violet drop-shadow and dark-blue text-stroke.
            </div>
          </div>

          {/* Sexdecillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Sexdecillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10⁵¹</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#fef2f2] text-[#991b1b] font-medium uppercase tracking-wider">
                    red shimmer
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-sxd">3.3Sxd</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Dark-red shimmer slide. Dual directional drop-shadows.
            </div>
          </div>

          {/* Quindecillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Quindecillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10⁴⁸</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#ecfdf5] text-[#065f46] font-medium uppercase tracking-wider">
                    emerald wave
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-qid">6.5Qid</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Vertical gradient wave, cyan-to-emerald. Strong top glow.
            </div>
          </div>

          {/* Quattuordecillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Quattuordecillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10⁴⁵</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#ecfdf5] text-[#065f46] font-medium uppercase tracking-wider">
                    cyan pulse
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-qud">9.1Qud</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Solid cyan with soft breathing glow, upper/lower shadows.
            </div>
          </div>

          {/* SECTION: HIGH */}
          <div className="pt-6 px-1 pb-2 text-[10px] tracking-[0.12em] uppercase text-[#bbb] font-[DM_Mono] flex items-center gap-2">
            <span>✨ High tiers</span>
            <div className="h-px flex-1 bg-[#e8e6e1]/50"></div>
          </div>

          {/* Tredecillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Tredecillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10⁴²</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#fffbeb] text-[#92400e] font-medium uppercase tracking-wider">
                    sunset flow
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-td">1.8Td</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Yellow → orange → rose shimmer. Warm dual shadow.
            </div>
          </div>

          {/* Duodecillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Duodecillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10³⁹</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#f5f3ff] text-[#5b21b6] font-medium uppercase tracking-wider">
                    purple breathe
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-dd">5.5Dd</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Soft purple pulse with violet glow, slow 4s cycle.
            </div>
          </div>

          {/* Undecillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Undecillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10³⁶</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#f8fafc] text-[#475569] font-medium uppercase tracking-wider">
                    steel shimmer
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-ud">7.2Ud</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Slate vertical gradient with text-stroke and dual glow shimmer.
            </div>
          </div>

          {/* Nonillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Nonillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10³⁰</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#fdf2f7] text-[#9d174d] font-medium uppercase tracking-wider">
                    mini rainbow
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-no">2.9No</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Red → green → purple moving gradient with slow cycle.
            </div>
          </div>

          {/* SECTION: MID */}
          <div className="pt-6 px-1 pb-2 text-[10px] tracking-[0.12em] uppercase text-[#bbb] font-[DM_Mono] flex items-center gap-2">
            <span>💎 Mid tiers</span>
            <div className="h-px flex-1 bg-[#e8e6e1]/50"></div>
          </div>

          {/* Octillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Octillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10²⁷</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#fffbeb] text-[#92400e] font-medium uppercase tracking-wider">
                    orange flicker
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-oc">4.4Oc</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Solid orange with breathing drop-shadow, 3s interval.
            </div>
          </div>

          {/* Septillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Septillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10²⁴</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#f0fdfa] text-[#0f766e] font-medium uppercase tracking-wider">
                    ocean shine
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-sp">8.1Sp</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Cyan-to-blue gradient shimmer glow.
            </div>
          </div>

          {/* Sextillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Sextillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10²¹</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#fdf2f7] text-[#9d174d] font-medium uppercase tracking-wider">
                    fuchsia pulse
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-sx">3.6Sx</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Fuchsia with static breathe animation. Upper/lower glow.
            </div>
          </div>

          {/* Quintillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Quintillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10¹⁸</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#fff1f2] text-[#9f1239] font-medium uppercase tracking-wider">
                    rose glow
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-qi">6.0Qi</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Rose-red breathing glow. Slower 4s cycle, subtle.
            </div>
          </div>

          {/* Quadrillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Quadrillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10¹⁵</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#f8fafc] text-[#475569] font-medium uppercase tracking-wider">
                    pink shadow
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-qd">1.2Qd</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Hot pink, static drop-shadow. First glow tier.
            </div>
          </div>

          {/* SECTION: BASE */}
          <div className="pt-6 px-1 pb-2 text-[10px] tracking-[0.12em] uppercase text-[#bbb] font-[DM_Mono] flex items-center gap-2">
            <span>📈 Base tiers (No Glow)</span>
            <div className="h-px flex-1 bg-[#e8e6e1]/50"></div>
          </div>

          {/* Trillion */}
          <div className="bg-white/60 rounded-xl border border-[#e8e6e1]/40 p-4 opacity-75">
            <div className="flex justify-between items-center">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block">
                  Trillion
                </span>
                <span className="text-[10px] text-[#aaa]">10¹²</span>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-t">4.1T</span>
              </div>
            </div>
          </div>

          {/* 100 Billion */}
          <div className="bg-white/60 rounded-xl border border-[#e8e6e1]/40 p-4 opacity-65">
            <div className="flex justify-between items-center">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block">
                  100 Billion
                </span>
                <span className="text-[10px] text-[#aaa]">10¹¹</span>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-b3">500B</span>
              </div>
            </div>
          </div>

          {/* 10 Billion */}
          <div className="bg-white/60 rounded-xl border border-[#e8e6e1]/40 p-4 opacity-55">
            <div className="flex justify-between items-center">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block">
                  10 Billion
                </span>
                <span className="text-[10px] text-[#aaa]">10¹⁰</span>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-b2">50B</span>
              </div>
            </div>
          </div>

          {/* Billion */}
          <div className="bg-white/60 rounded-xl border border-[#e8e6e1]/40 p-4 opacity-45">
            <div className="flex justify-between items-center">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block">
                  Billion
                </span>
                <span className="text-[10px] text-[#aaa]">10⁹</span>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-b1">7.7B</span>
              </div>
            </div>
          </div>

          {/* Million */}
          <div className="bg-white/60 rounded-xl border border-[#e8e6e1]/40 p-4 opacity-35">
            <div className="flex justify-between items-center">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block">
                  Million
                </span>
                <span className="text-[10px] text-[#aaa]">10⁶</span>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-m1">2.3M</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-12 text-[11px] text-[#bbb] font-[DM_Mono] leading-relaxed">
          rpsleaguegame.vercel.app
          <br />
          built with Next.js + BigInt · no precision loss
        </div>
      </div>
    </div>
  )
}
