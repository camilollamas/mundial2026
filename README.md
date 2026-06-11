# ⚽ Fútbol Tracker M26

App web-mobile personal para seguir el torneo de selecciones 2026 (Canadá · México · EE. UU.) en tiempo real.

Identidad visual: banderas nacionales (dominio público, vía `flag-icons`) autoalojadas en
`public/flags/`; regenerar con `node scripts/build-flags.mjs` si cambia el mapeo en
`src/data/flags.js`.

## Arranque

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # producción en dist/
```

## Arquitectura

- **Vite + React 18**, sin backend: la API pública gratuita de [TheSportsDB](https://www.thesportsdb.com/league/4429-fifa-world-cup) (liga 4429) se consume directo desde el navegador.
- **Offline-first**: los 72 partidos de fase de grupos están embebidos en `src/data/seed-matches.json`; si no hay conexión la app funciona igual ("Modo sin conexión").
- **Caché en localStorage** con TTL por endpoint (90 s resultados, 5 min eliminatorias, 1 h cronologías, 24 h plantillas).
- **Auto-refresh**: cada 60 s cuando hay partidos en vivo, cada 5 min en reposo.
- **PWA completa**: service worker (vite-plugin-pwa/Workbox) con precache del app shell,
  auto-actualización en cada deploy y caché de escudos/fotos; manifest con iconos PNG
  192/512 + maskable y apple-touch-icon. Instalable desde Chrome/Android ("Instalar app")
  y iOS (Compartir → Agregar a pantalla de inicio), funciona offline.
  Si cambias `public/icon.svg`, regenera los PNG con `node scripts/build-icons.mjs`.

## Pestañas

| Pestaña | Qué hace |
|---|---|
| Fixture | 104 partidos por fecha, hora local, filtros por grupo/selección; al tocar un partido se abre el detalle con tabs **Alineaciones** (el once inicial oficial con formación y suplentes vía API pública de ESPN; si aún no se publica, mensaje "sin definir") y **Estadísticas** (probabilidad de victoria, incidencias, tabla del grupo y sede) |
| Grupos | Tablas de los 12 grupos calculadas client-side (criterio FIFA) + ranking de mejores terceros |
| Llaves | Bracket de dieciseisavos a la final; los cruces se llenan solos cuando la API los publica (clasificación por fecha oficial) |
| Stats | Goles totales, promedio, mejores ataques/defensas, y goleadores/amarillas/rojas agregando las cronologías de los partidos |
| Equipos | Las 48 selecciones por grupo con su DT; al tocar una se ve la plantilla oficial FIFA completa (26 jugadores: dorsal, edad, club, partidos y goles internacionales, fotos cuando la API las tiene) |

## Plantillas completas

Las plantillas oficiales (48 selecciones × 26 jugadores + técnico) provienen de la
página de Wikipedia "2026 FIFA World Cup squads" (listas FIFA publicadas el 2-jun-2026)
y están embebidas en `src/data/squads.json`. Para regenerarlas tras un cambio de
convocatoria: `node scripts/build-squads.mjs` (borra antes `scripts/squads-wikitext.txt`
para forzar descarga fresca).

La probabilidad de victoria del detalle de partido es una estimación propia
(modelo Elo con los ratings de `src/data/ratings.js`).

## Límites de la API gratuita (clave `123`)

- `eventsseason` corta en 15 eventos → se usa `eventsround` (devuelve la jornada completa).
- Plantillas: máx. 10 jugadores por selección.
- Cronologías: eventos principales por partido.
- Las eliminatorias aparecen en la API cuando se conocen los cruces; la app las sondea automáticamente.
