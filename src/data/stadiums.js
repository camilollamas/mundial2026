// Info de las 16 sedes del torneo (capacidades aproximadas para el 2026).
// Las claves coinciden con strVenue de TheSportsDB.
export const STADIUMS = {
  'Estadio Azteca': { city: 'Ciudad de México, México', capacity: '83.000' },
  'Estadio Akron': { city: 'Guadalajara, México', capacity: '48.000' },
  'Estadio BBVA': { city: 'Monterrey, México', capacity: '53.500' },
  'BMO Field': { city: 'Toronto, Canadá', capacity: '45.000' },
  'BC Place': { city: 'Vancouver, Canadá', capacity: '54.000' },
  'MetLife Stadium': { city: 'Nueva York / Nueva Jersey, EE. UU.', capacity: '82.500' },
  'SoFi Stadium': { city: 'Los Ángeles, EE. UU.', capacity: '70.000' },
  'AT&T Stadium': { city: 'Dallas, EE. UU.', capacity: '80.000' },
  'NRG Stadium': { city: 'Houston, EE. UU.', capacity: '72.000' },
  'GEHA Field at Arrowhead Stadium': { city: 'Kansas City, EE. UU.', capacity: '76.000' },
  'Mercedes-Benz Stadium': { city: 'Atlanta, EE. UU.', capacity: '71.000' },
  'Hard Rock Stadium': { city: 'Miami, EE. UU.', capacity: '65.000' },
  'Lincoln Financial Field': { city: 'Filadelfia, EE. UU.', capacity: '69.000' },
  'Gillette Stadium': { city: 'Boston, EE. UU.', capacity: '65.000' },
  'Lumen Field': { city: 'Seattle, EE. UU.', capacity: '69.000' },
  "Levi's Stadium": { city: 'San Francisco, EE. UU.', capacity: '71.000' },
}

export const stadiumInfo = (venue) => STADIUMS[venue] || null
