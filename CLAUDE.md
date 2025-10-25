# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an extensible interactive map quiz web application built with Next.js 15, TypeScript, and MapLibre GL JS. Users click on geographical regions on a map to test their knowledge with scoring, streaks, and multiple difficulty levels. The app supports multiple maps (Oslo districts and Norwegian municipalities) with per-map configuration, localization, and persistent state isolation.

## Development Commands

### Primary Commands (via Makefile)
- `make dev` - Run Next.js development server with Turbopack
- `make build` - Build production application
- `make lint` - Run ESLint across the codebase
- `make ci` - Full CI pipeline (install, data, lint, build)
- `make install` - Install dependencies for monorepo
- `make data` - Generate normalized GeoJSON boundary data (Oslo districts)
- `make data-kommuner` - Process Norwegian municipalities GeoJSON data
- `make clean` - Remove build artifacts and generated data

### Direct Package Commands
- `npm run dev --prefix web` - Development server
- `npm run build --prefix web` - Production build
- `npm run lint --prefix web` - ESLint for web package

## Architecture

### Monorepo Structure
- **pnpm workspace** with two packages:
  - `/web/` - Next.js application with App Router
  - `/scripts/` - Data processing utilities for GeoJSON normalization

### Key Components
- **Map Component** (`web/src/components/Map.tsx`) - MapLibre GL JS integration with click-based polygon selection, configurable center and zoom
- **Game State** (`web/src/lib/game.ts`) - Functional state machine: `idle` → `playing` → `ended`
- **Data Hooks**
  - `useRegionData(mapId)` (`web/src/hooks/useRegionData.ts`) - Generic GeoJSON data fetching with map config support
  - `useBydelerData()` (`web/src/hooks/useBydelerData.ts`) - Legacy wrapper for backward compatibility
- **Map Configuration** (`web/src/config/maps/`) - Registry pattern for managing multiple map configs with type-safe map IDs
- **Types** (`web/src/lib/types.ts`) - Core TypeScript interfaces including `Region`, `MapConfig`, `MapMetadata`, game state, and quiz settings
- **Internationalization** (`web/src/i18n/`) - Translation system with support for multiple locales (Norwegian, English)

### State Management Pattern
Uses **functional state management** with immutable updates rather than complex state libraries. Game state flows through a state machine with scoring, streaks, and multi-attempt logic. Local persistence via `web/src/lib/persistence.ts`.

### Data Pipeline
- GeoJSON boundaries sourced from authoritative data (Oslo districts and Norwegian municipalities)
- Processing scripts at `scripts/scripts/` with topology-preserving simplification:
  - `fetch_oslo_geo.ts` - Oslo districts from ArcGIS
  - `fetch_kommuner_geo.ts` - Norwegian municipalities from local GeoJSON
- Outputs both full precision and web-optimized versions to `web/public/data/`

## Technology Stack
- **Framework**: Next.js 15.5.2 with App Router and React 18
- **Language**: TypeScript with strict typing
- **Mapping**: MapLibre GL JS (open-source Mapbox alternative)
- **Styling**: Tailwind CSS v4
- **Build**: Turbopack for faster development builds
- **Package Manager**: pnpm

## Code Patterns

### Component Architecture
- Keep components under 300 LOC for maintainability
- Use TypeScript strict mode with no `any` in core logic
- Dynamic imports for MapLibre (SSR-safe)
- Graceful fallbacks for data loading and map failures

### Game Logic
- Functional approach with pure functions for state transitions
- Immutable state updates using spread operators
- Scoring system with points + streak bonuses
- Multiple difficulty levels affecting question selection

## Data Structure
- **Oslo districts**: GeoJSON with properties `navn` (name), `bydelsnummer` (number), `areal_km2` (area)
- **Norwegian municipalities**: GeoJSON with properties `name`, `id`, `slug`, `area_km2`, `centroid`
- Centroids calculated for hint positioning
- Simplified topology for web performance while maintaining accuracy

## Accessibility & UX
- WCAG 2.1 AA compliance design patterns
- ARIA labels for map interactions
- Keyboard navigation support
- Mobile-responsive with touch-friendly interactions
- Multi-language support with Norwegian and English
- Dark mode support with theme-aware styling

## Routing Architecture

### Landing Page
- **Route**: `/`
- **Component**: `web/src/app/page.tsx`
- **Purpose**: Map selector with card-based UI showing all available maps
- **Features**: Dark mode support, map metadata display, difficulty indicators

### Game Pages
- **Route**: `/game/[mapId]`
- **Server Component**: `web/src/app/game/[mapId]/layout.tsx` with `generateStaticParams()`
- **Client Component**: `web/src/app/game/[mapId]/page.tsx`
- **Purpose**: Play the map quiz with dynamic routing support
- **Features**: Per-map state isolation, configurable map parameters (center, zoom, bounds)

## Adding a New Map

To add a new map to the application:

1. **Create map configuration** in `web/src/config/maps/[mapName].ts`:
   ```typescript
   export const mapConfig: MapConfigWithMetadata = {
     id: 'unique-id',
     dataPath: '/data/filename.geo.json',
     center: [lng, lat],
     initialZoom: 10,
     bounds: [[minLng, minLat], [maxLng, maxLat]],
     language: 'no',
     nameKey: 'maps.mapName.name',
     descriptionKey: 'maps.mapName.description',
     featureCount: 15,
     difficulty: 'medium',
   };
   ```

2. **Update map types** in `web/src/config/maps/types.ts`:
   ```typescript
   export type MapId = 'oslo' | 'kommuner' | 'newMap';
   ```

3. **Register map** in `web/src/config/maps/index.ts`:
   ```typescript
   import { mapConfig } from './[mapName]';
   
   const mapRegistry: Record<MapId, MapConfigWithMetadata> = {
     oslo: osloMapConfig,
     kommuner: kommunerMapConfig,
     newMap: mapConfig,
   };
   ```

4. **Add GeoJSON data** to `web/public/data/filename.geo.json` with features containing:
   - `name` (display name)
   - `centroid` [lng, lat] (for hints)
   - `id` (unique identifier)

5. **Add translations** for map names and descriptions in `web/src/i18n/translations/*.json`

6. **Add data processing script** (optional) in `scripts/scripts/fetch_[mapName]_geo.ts` for automated data generation

7. **Build and deploy** - Static generation automatically includes the new map route

## Available Maps

### Oslo Districts (`oslo`)
- **Features**: 15 districts of Oslo
- **Difficulty**: Medium
- **Data Source**: ArcGIS Oslo delbydeler
- **Center**: Oslo city center
- **Properties**: `navn`, `bydelsnummer`, `areal_km2`

### Norwegian Municipalities (`kommuner`)
- **Features**: 357 Norwegian municipalities
- **Difficulty**: Expert
- **Data Source**: Local GeoJSON data
- **Center**: Norway center (65.0°N, 10.75°E)
- **Properties**: `name`, `id`, `slug`, `area_km2`, `centroid`

## Multi-Map State Isolation

Each map maintains isolated state using localStorage keys scoped by mapId:
- `locale:{mapId}` - Language preference per map
- `settings:{mapId}` - Game settings (rounds, difficulty) per map
- `seed:{mapId}` - Random seed for consistent question selection per map

This prevents settings from one map affecting another map during gameplay.