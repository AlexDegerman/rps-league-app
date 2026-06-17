// Utility to turn massive strings into readable stats
export const formatStat = (val: string | number | null | undefined) => {
  if (!val || val === '0' || val === 0) return { formatted: '0', name: 'None' }

  const b = BigInt(val.toString())

  const tiers = [
    { n: 10n ** 111n, s: 'Str', name: 'Sextrigintillion' },
    { n: 10n ** 108n, s: 'Qntr', name: 'Quintrigintillion' },
    { n: 10n ** 105n, s: 'Qtr', name: 'Quattuortrigintillion' },
    { n: 10n ** 102n, s: 'Ttr', name: 'Trestrigintillion' },
    { n: 10n ** 99n, s: 'Dtr', name: 'Duotrigintillion' },
    { n: 10n ** 96n, s: 'Utr', name: 'Untrigintillion' },
    { n: 10n ** 93n, s: 'Trg', name: 'Trigintillion' },
    { n: 10n ** 90n, s: 'Nvg', name: 'Novemvigintillion' },
    { n: 10n ** 87n, s: 'Ovg', name: 'Octovigintillion' },
    { n: 10n ** 84n, s: 'Nvg', name: 'Septenvigintillion' },
    { n: 10n ** 81n, s: 'Sxg', name: 'Sexvigintillion' },
    { n: 10n ** 78n, s: 'Qvg', name: 'Quinvigintillion' },
    { n: 10n ** 75n, s: 'Kvg', name: 'Quattuorvigintillion' },
    { n: 10n ** 72n, s: 'Tvg', name: 'Trevigintillion' },
    { n: 10n ** 69n, s: 'Dvg', name: 'Duovigintillion' },
    { n: 10n ** 66n, s: 'Uvg', name: 'Unvigintillion' },
    { n: 10n ** 63n, s: 'Vg', name: 'Vigintillion' },
    { n: 10n ** 60n, s: 'No', name: 'Novemdecillion' },
    { n: 10n ** 57n, s: 'Oc', name: 'Octodecillion' },
    { n: 10n ** 54n, s: 'Sp', name: 'Septendecillion' },
    { n: 10n ** 51n, s: 'Sx', name: 'Sexdecillion' },
    { n: 10n ** 48n, s: 'Qi', name: 'Quindecillion' },
    { n: 10n ** 45n, s: 'Qa', name: 'Quattuordecillion' },
    { n: 10n ** 42n, s: 'Td', name: 'Tredecillion' },
    { n: 10n ** 39n, s: 'Dd', name: 'Duodecillion' },
    { n: 10n ** 36n, s: 'Ud', name: 'Undecillion' },
    { n: 10n ** 33n, s: 'Dc', name: 'Decillion' },
    { n: 10n ** 30n, s: 'N', name: 'Nonillion' },
    { n: 10n ** 27n, s: 'O', name: 'Octillion' },
    { n: 10n ** 24n, s: 'Sp', name: 'Septillion' },
    { n: 10n ** 21n, s: 'Sx', name: 'Sextillion' },
    { n: 10n ** 18n, s: 'Qi', name: 'Quintillion' },
    { n: 10n ** 15n, s: 'Qa', name: 'Quadrillion' },
    { n: 10n ** 12n, s: 'T', name: 'Trillion' },
    { n: 10n ** 9n, s: 'B', name: 'Billion' },
    { n: 10n ** 6n, s: 'M', name: 'Million' }
  ]

  for (const t of tiers) {
    if (b >= t.n) {
      const head = Number((b * 100n) / t.n) / 100
      return { formatted: `${head}${t.s}`, name: t.name }
    }
  }

  return { formatted: b.toString(), name: 'Points' }
}
