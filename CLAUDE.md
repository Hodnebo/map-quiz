# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive Oslo neighbourhood map quiz web application built with Next.js 15, TypeScript, and MapLibre GL JS. Users click on Oslo districts (bydeler) on a map to test their geographical knowledge with scoring, streaks, and multiple difficulty levels.

## Development Commands

### Primary Commands (via Makefile)
- `make dev` - Run Next.js development server with Turbopack
- `make build` - Build production application
- `make lint` - Run ESLint across the codebase
- `make ci` - Full CI pipeline (install, data, lint, build)
- `make install` - Install dependencies for monorepo
- `make data` - Generate normalized GeoJSON boundary data
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
- **Map Component** (`web/src/components/Map.tsx`) - MapLibre GL JS integration with click-based polygon selection
- **Game State** (`web/src/lib/game.ts`) - Functional state machine: `idle` → `playing` → `ended`
- **Data Hook** (`web/src/hooks/useBydelerData.ts`) - GeoJSON data fetching and processing
- **Types** (`web/src/lib/types.ts`) - Core TypeScript interfaces for game state, quiz settings, and geographical data

### State Management Pattern
Uses **functional state management** with immutable updates rather than complex state libraries. Game state flows through a state machine with scoring, streaks, and multi-attempt logic. Local persistence via `web/src/lib/persistence.ts`.

### Data Pipeline
- GeoJSON boundaries sourced from authoritative Oslo data
- Processing script at `scripts/scripts/fetch_oslo_geo.ts` with topology-preserving simplification
- Outputs both full precision and web-optimized (<300KB) versions to `web/public/data/`

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
- Oslo districts stored as GeoJSON with properties: `navn` (name), `bydelsnummer` (number), `areal_km2` (area)
- Centroids calculated for hint positioning
- Simplified topology for web performance while maintaining accuracy

## Accessibility & UX
- WCAG 2.1 AA compliance design patterns
- ARIA labels for map interactions
- Keyboard navigation support
- Mobile-responsive with touch-friendly interactions
- Norwegian (nb-NO) as primary language with i18n-ready structure