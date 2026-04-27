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
          {/* SECTION: SEASON 1 */}
          {false && (
            <>
              <div className="pt-4 px-1 pb-2 text-[10px] tracking-[0.12em] uppercase text-[#bbb] font-[DM_Mono] flex items-center gap-2">
                <span> Season 1 tiers</span>
                <div className="h-px flex-1 bg-[#e8e6e1]/50"></div>
              </div>

              {/* Octovigintillion - Hellfire Glow 2 */}
              <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-[DM_Mono]">
                    <span className="text-xs text-[#444] font-bold block mb-0.5">
                      Octovigintillion
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#aaa]">10⁸⁷</span>
                      <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#fff4f0] text-[#9a2a00] font-medium uppercase tracking-wider">
                        lava overload
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-2xl font-bold leading-none tracking-tight relative"
                    style={{ overflow: 'visible' }}
                  >
                    <span className="g-ovg">1.2Ovg</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
                  Radial gradient from gold core to deep crimson, background
                  position wandering via magma-flow. Full-width sawtooth flame
                  crown above via clip-path, jittering on a 0.15s steps loop.
                  Ambient blur glow bleeds behind the number. Three animations
                  desync deliberately - magma-flow, heat-flicker, micro-jitter
                  all run on different durations.
                </div>
              </div>

              {/* Septenvigintillion - Hellfire Glow 1 */}
              <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-[DM_Mono]">
                    <span className="text-xs text-[#444] font-bold block mb-0.5">
                      Septenvigintillion
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#aaa]">10⁸⁴</span>
                      <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#fff4f0] text-[#9a2a00] font-medium uppercase tracking-wider">
                        molten
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold leading-none tracking-tight">
                    <span className="g-spv">1.2Spv</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
                  Solid orange-red cycling through four color stops. Heat-haze
                  skewX distortion shifts direction each quarter-cycle. Blur
                  filter pulses with contrast - peak at 75% where scale, skew,
                  and contrast hit simultaneously.
                </div>
              </div>

              {/* Sexvigintillion - Cards Glow 2 */}
              <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-[DM_Mono]">
                    <span className="text-xs text-[#444] font-bold block mb-0.5">
                      Sexvigintillion
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#aaa]">10⁸¹</span>
                      <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#fdf4ff] text-[#7e1d9c] font-medium uppercase tracking-wider">
                        the jackpot
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-2xl font-bold leading-none tracking-tight relative"
                    style={{ overflow: 'visible' }}
                  >
                    <span className="g-svg">1.2Svg</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
                  Gold-pink-teal holographic gradient streams continuously. Two
                  🎲 satellites orbit on separate radii in opposite directions -
                  one clockwise at 1.8em, one counter-clockwise at 2.2em - each
                  with an independent colored drop-shadow.
                </div>
              </div>

              {/* Quinvigintillion - Cards Glow 1 */}
              <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-[DM_Mono]">
                    <span className="text-xs text-[#444] font-bold block mb-0.5">
                      Quinvigintillion
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#aaa]">10⁷⁸</span>
                      <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#fdf4ff] text-[#7e1d9c] font-medium uppercase tracking-wider">
                        holographic foil
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold leading-none tracking-tight">
                    <span className="g-qiv">1.2Qiv</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
                  7-stop oil-slick rainbow at 45° with 400% background-size
                  cycling diagonally. Drop-shadow color rotates each keyframe to
                  track the dominant hue - pink at 0%, amber at 25%, green at
                  50%, cyan at 75%.
                </div>
              </div>

              {/* Quattuorvigintillion - Electric Glow 2 */}
              <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-[DM_Mono]">
                    <span className="text-xs text-[#444] font-bold block mb-0.5">
                      Quattuorvigintillion
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#aaa]">10⁷⁵</span>
                      <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#f3f0ff] text-[#4c1d95] font-medium uppercase tracking-wider">
                        supercell
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-2xl font-bold leading-none tracking-tight relative"
                    style={{ overflow: 'visible' }}
                  >
                    <span className="g-qvg" data-text="1.2Qvg">
                      1.2Qvg
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
                  Blue-purple gradient streams left to right continuously. A
                  repeating conic-gradient overlay fires in color-dodge mode via
                  steps(1) - fractal lightning spokes rotate and reposition each
                  burst. White-out filter at 63% simulates a direct strike.
                </div>
              </div>

              {/* Trevigintillion - Electric Glow 1 */}
              <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-[DM_Mono]">
                    <span className="text-xs text-[#444] font-bold block mb-0.5">
                      Trevigintillion
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#aaa]">10⁷²</span>
                      <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#f3f0ff] text-[#4c1d95] font-medium uppercase tracking-wider">
                        charged
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold leading-none tracking-tight">
                    <span className="g-tvg">1.2Tvg</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
                  Purple neon solid color with a scripted flicker sequence -
                  double blink at 4-6%, opacity drop at 36%, stutter at 92-93%.
                  Scale and glow radius peak together at 60%.
                </div>
              </div>
              {/* Move block ending up every week */}
            </>
          )}

          {/* Duovigintillion - Moon Glow 2 */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Duovigintillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10⁶⁹</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#eff6ff] text-[#1e3a8a] font-medium uppercase tracking-wider">
                    full eclipse
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-dvg">1.2Dvg</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Two gradients blended with screen mode - a radial white-core
              circle over a sweeping linear diagonal. Both background positions
              animate independently, making the bright lunar surface crawl
              across the letterforms on a 6s ease loop.
            </div>
          </div>

          {/* Unvigintillion - Moon Glow 1 */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Unvigintillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10⁶⁶</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#eff6ff] text-[#1e3a8a] font-medium uppercase tracking-wider">
                    moonlit
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-uvg">1.2Uvg</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Navy-to-white-to-navy gradient sweeps at 135° across 200%
              background-size on a 4s linear loop. Drop-shadow pulses from a
              tight blue edge glow to a wider soft cyan bloom and back.
            </div>
          </div>

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
              Color cycling + dual layered drop-shadows + scale throb. The glow
              radius and contrast intensify at each phase peak.
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
              Indigo-to-periwinkle shimmer gradient with scale pulse. Glow
              radius doubles at peak, text-stroke in navy.
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
                <span className="g-qad">9.1Qad</span>
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
              5-stop sunset shimmer at 3x speed with independent scale breathe.
              Dual warm shadows baked in, not animated.
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
              Purple gradient shimmer + scale pulse combined. Glow doubles in
              radius and brightness at peak.
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
              Diagonal steel shimmer moving on both axes simultaneously. Glow
              brightens in sync with diagonal travel.
            </div>
          </div>

          {/* Decillion */}
          <div className="bg-white rounded-xl border border-[#e8e6e1]/60 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="font-[DM_Mono]">
                <span className="text-xs text-[#444] font-bold block mb-0.5">
                  Decillion
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#aaa]">10³³</span>
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-[#f0f9ff] text-[#0369a1] font-medium uppercase tracking-wider">
                    sky shimmer
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold leading-none tracking-tight">
                <span className="g-dc">3.8Dc</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Brilliant icy-white surge with a 2s sky-blue bloom. Features a
              high-contrast luminance pulse for maximum clarity during
              high-frequency activity.
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
              Full 6-stop rainbow gradient cycling at 4s with color-synced
              drop-shadows that shift between red, green, and purple phases.
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
              Orange gradient shimmer with irregular flicker - glow spikes at
              33% and dips at 66%, mimicking real flame variance.
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
              5-stop cyan-to-navy diagonal wave with static dual drop-shadows.
              Background position oscillates on both X and Y.
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
              Dark purple to fuchsia to magenta sweep gradient + breathe.
              Gradient moves at 2.5s, glow breathes independently at 3s.
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
              Rose-to-pink shimmer gradient running at 3s with breathe glow
              layered on top. Gradient visible now, was solid before
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
                <span className="g-qa">1.2Qa</span>
              </div>
            </div>
            <div className="text-[11px] text-[#aaa] font-[DM_Mono] leading-normal border-t border-[#f8f7f4] pt-3">
              Hot pink with animated pulse glow - shadow radius expands and
              brightness flickers. First tier with a living glow.
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
