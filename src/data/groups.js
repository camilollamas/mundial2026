// Sorteo oficial del Mundial 2026 (5-dic-2025, Washington DC).
// Los nombres coinciden EXACTAMENTE con los que devuelve TheSportsDB.
export const GROUPS = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czech Republic'],
  B: ['Canada', 'Bosnia-Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Scotland', 'Morocco', 'Haiti'],
  D: ['USA', 'Paraguay', 'Australia', 'Turkey'],
  E: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
}

export const TEAM_GROUP = Object.fromEntries(
  Object.entries(GROUPS).flatMap(([g, teams]) => teams.map((t) => [t, g]))
)

// Nombres en español para mostrar en la interfaz.
export const ES_NAMES = {
  Mexico: 'México', 'South Africa': 'Sudáfrica', 'South Korea': 'Corea del Sur',
  'Czech Republic': 'Chequia', Canada: 'Canadá', 'Bosnia-Herzegovina': 'Bosnia y Herzegovina',
  Qatar: 'Catar', Switzerland: 'Suiza', Brazil: 'Brasil', Scotland: 'Escocia',
  Morocco: 'Marruecos', Haiti: 'Haití', USA: 'Estados Unidos', Paraguay: 'Paraguay',
  Australia: 'Australia', Turkey: 'Turquía', Germany: 'Alemania', 'Curaçao': 'Curazao',
  'Ivory Coast': 'Costa de Marfil', Ecuador: 'Ecuador', Netherlands: 'Países Bajos',
  Japan: 'Japón', Sweden: 'Suecia', Tunisia: 'Túnez', Belgium: 'Bélgica',
  Egypt: 'Egipto', Iran: 'Irán', 'New Zealand': 'Nueva Zelanda', Spain: 'España',
  'Cape Verde': 'Cabo Verde', 'Saudi Arabia': 'Arabia Saudita', Uruguay: 'Uruguay',
  France: 'Francia', Senegal: 'Senegal', Iraq: 'Irak', Norway: 'Noruega',
  Argentina: 'Argentina', Algeria: 'Argelia', Austria: 'Austria', Jordan: 'Jordania',
  Portugal: 'Portugal', 'DR Congo': 'RD del Congo', Uzbekistan: 'Uzbekistán',
  Colombia: 'Colombia', England: 'Inglaterra', Croatia: 'Croacia', Ghana: 'Ghana',
  Panama: 'Panamá',
}

export const esName = (name) => ES_NAMES[name] || name

// Etapas eliminatorias clasificadas por fecha del calendario oficial FIFA.
export const KO_STAGES = [
  { key: 'r32', name: 'Dieciseisavos', from: '2026-06-28', to: '2026-07-03', slots: 16 },
  { key: 'r16', name: 'Octavos', from: '2026-07-04', to: '2026-07-07', slots: 8 },
  { key: 'qf', name: 'Cuartos', from: '2026-07-09', to: '2026-07-11', slots: 4 },
  { key: 'sf', name: 'Semifinales', from: '2026-07-14', to: '2026-07-15', slots: 2 },
  { key: 'third', name: 'Tercer puesto', from: '2026-07-18', to: '2026-07-18', slots: 1 },
  { key: 'final', name: 'Final', from: '2026-07-19', to: '2026-07-19', slots: 1 },
]

export const stageForDate = (date) =>
  KO_STAGES.find((s) => date >= s.from && date <= s.to)?.key || null
