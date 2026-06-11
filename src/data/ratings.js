// Rating de fuerza por selección (escala Elo aprox., basado en ranking FIFA
// y desempeño reciente). Solo se usa para la barra de probabilidad estimada.
export const RATINGS = {
  Spain: 2060, Argentina: 2050, France: 2030, England: 2010, Brazil: 1990,
  Portugal: 1980, Netherlands: 1950, Belgium: 1930, Germany: 1920,
  Croatia: 1900, Morocco: 1890, Uruguay: 1880, Colombia: 1880, Japan: 1860,
  USA: 1850, Mexico: 1850, Senegal: 1850, Norway: 1850, Switzerland: 1840,
  Ecuador: 1840, Austria: 1830, 'South Korea': 1820, Iran: 1820,
  Canada: 1810, Turkey: 1810, Algeria: 1800, Egypt: 1790, Paraguay: 1790,
  Australia: 1780, Sweden: 1780, 'Ivory Coast': 1780, 'Czech Republic': 1770,
  Tunisia: 1770, Scotland: 1760, Ghana: 1760, 'Bosnia-Herzegovina': 1740,
  Panama: 1740, 'Saudi Arabia': 1730, Qatar: 1720, 'DR Congo': 1720,
  'South Africa': 1700, Uzbekistan: 1700, 'Cape Verde': 1700, Jordan: 1690,
  Iraq: 1680, 'New Zealand': 1680, 'Curaçao': 1670, Haiti: 1650,
}

// Probabilidades 1X2: modelo logístico Elo + componente de empate que crece
// cuando los equipos están parejos.
export function winProbability(home, away) {
  const ra = RATINGS[home] ?? 1750
  const rb = RATINGS[away] ?? 1750
  const pRaw = 1 / (1 + 10 ** (-(ra - rb) / 400))
  const draw = 0.22 + 0.1 * (1 - Math.abs(pRaw - 0.5) * 2)
  const homeP = pRaw * (1 - draw)
  const awayP = (1 - pRaw) * (1 - draw)
  const r = (x) => Math.round(x * 100)
  return { home: r(homeP), draw: 100 - r(homeP) - r(awayP), away: r(awayP) }
}
