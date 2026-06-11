// Bandera nacional de cada selección (símbolos de estado, dominio público).
// PNGs autoalojados en public/flags/, generados con scripts/build-flags.mjs.
export const TEAM_ISO = {
  Mexico: 'mx', 'South Africa': 'za', 'South Korea': 'kr', 'Czech Republic': 'cz',
  Canada: 'ca', 'Bosnia-Herzegovina': 'ba', Qatar: 'qa', Switzerland: 'ch',
  Brazil: 'br', Scotland: 'gb-sct', Morocco: 'ma', Haiti: 'ht',
  USA: 'us', Paraguay: 'py', Australia: 'au', Turkey: 'tr',
  Germany: 'de', 'Curaçao': 'cw', 'Ivory Coast': 'ci', Ecuador: 'ec',
  Netherlands: 'nl', Japan: 'jp', Sweden: 'se', Tunisia: 'tn',
  Belgium: 'be', Egypt: 'eg', Iran: 'ir', 'New Zealand': 'nz',
  Spain: 'es', 'Cape Verde': 'cv', 'Saudi Arabia': 'sa', Uruguay: 'uy',
  France: 'fr', Senegal: 'sn', Iraq: 'iq', Norway: 'no',
  Argentina: 'ar', Algeria: 'dz', Austria: 'at', Jordan: 'jo',
  Portugal: 'pt', 'DR Congo': 'cd', Uzbekistan: 'uz', Colombia: 'co',
  England: 'gb-eng', Croatia: 'hr', Ghana: 'gh', Panama: 'pa',
}

export const flag = (team) => (TEAM_ISO[team] ? `/flags/${TEAM_ISO[team]}.png` : null)
