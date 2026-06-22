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

// Código de 3 letras (estándar FIFA) para espacios reducidos como el cuadro.
export const TEAM_CODE = {
  Mexico: 'MEX', 'South Africa': 'RSA', 'South Korea': 'KOR', 'Czech Republic': 'CZE',
  Canada: 'CAN', 'Bosnia-Herzegovina': 'BIH', Qatar: 'QAT', Switzerland: 'SUI',
  Brazil: 'BRA', Scotland: 'SCO', Morocco: 'MAR', Haiti: 'HAI',
  USA: 'USA', Paraguay: 'PAR', Australia: 'AUS', Turkey: 'TUR',
  Germany: 'GER', 'Curaçao': 'CUW', 'Ivory Coast': 'CIV', Ecuador: 'ECU',
  Netherlands: 'NED', Japan: 'JPN', Sweden: 'SWE', Tunisia: 'TUN',
  Belgium: 'BEL', Egypt: 'EGY', Iran: 'IRN', 'New Zealand': 'NZL',
  Spain: 'ESP', 'Cape Verde': 'CPV', 'Saudi Arabia': 'KSA', Uruguay: 'URU',
  France: 'FRA', Senegal: 'SEN', Iraq: 'IRQ', Norway: 'NOR',
  Argentina: 'ARG', Algeria: 'ALG', Austria: 'AUT', Jordan: 'JOR',
  Portugal: 'POR', 'DR Congo': 'COD', Uzbekistan: 'UZB', Colombia: 'COL',
  England: 'ENG', Croatia: 'CRO', Ghana: 'GHA', Panama: 'PAN',
}

export const teamCode = (team) => TEAM_CODE[team] || ''
