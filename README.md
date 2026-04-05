# TIS — Tourism Intelligence System

A cross-platform tourism app (Android, iOS, HarmonyOS) that provides real-time, location-aware recommendations of tourist attractions along a user's travel route.

## Monorepo Structure

```
TIS/
├── api/        Node.js + Express backend (PostgreSQL + PostGIS)
├── app/        React Native (Expo) mobile app
├── admin/      React + Vite admin dashboard
├── shared/     Shared types and utilities
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Node.js >= 18
- Yarn >= 1.22
- Docker + Docker Compose

### 1. Clone & install
```bash
git clone https://github.com/kwadzigeorge-jpg/TIS.git
cd TIS
yarn install
```

### 2. Configure environment
```bash
cp api/.env.example api/.env
# Fill in your API keys (Mapbox, Firebase, etc.)
```

### 3. Start infrastructure
```bash
yarn docker:up
```

### 4. Run migrations & seed
```bash
yarn db:migrate
yarn db:seed
```

### 5. Start services
```bash
# API
yarn api

# Admin panel
yarn admin

# Mobile app
yarn app
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo) |
| Backend | Node.js + Express |
| Database | PostgreSQL + PostGIS |
| Cache | Redis |
| Maps | Mapbox |
| Notifications | Firebase Cloud Messaging |
| Auth | JWT + Google/Apple OAuth |
| Admin | React + Vite |
| Infra | Docker |

## API Base URL
`http://localhost:4000/v1`

## Features
- Route-based POI discovery
- Real-time geofence notifications
- Reviews & ratings
- Bookmarks & saved routes
- Offline caching
- Admin panel
