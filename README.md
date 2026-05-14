# EshMagan: Intelligent Wildfire Management & Emergency Response Platform

## Table of Contents
1. [Project Overview](#project-overview)
2. [Problem Statement & Objectives](#problem-statement--objectives)
3. [Key Features](#key-features)
4. [User Roles & Permissions](#user-roles--permissions)
5. [System Architecture](#system-architecture)
6. [Technology Stack](#technology-stack)
7. [Folder Structure](#folder-structure)
8. [Frontend Overview](#frontend-overview)
9. [Backend Overview](#backend-overview)
10. [Database Schema](#database-schema)
11. [API Documentation](#api-documentation)
12. [Real-time Communication](#real-time-communication)
13. [Authentication & Authorization](#authentication--authorization)
14. [Installation Guide](#installation-guide)
15. [Environment Configuration](#environment-configuration)
16. [Running the Application](#running-the-application)
17. [Thermal Camera & AI Integration](#thermal-camera--ai-integration)
18. [Example Data Flows](#example-data-flows)
19. [Important Implementation Details](#important-implementation-details)
20. [Security Considerations](#security-considerations)
21. [Error Handling](#error-handling)
22. [Known Limitations](#known-limitations)
23. [Future Improvements](#future-improvements)
24. [License](#license)

---

## Project Overview

**EshMagan** is a comprehensive, intelligent wildfire detection and emergency response platform designed to coordinate multiple stakeholders in real-time during fire incidents. The system integrates thermal imaging technology with AI-powered fire detection, live location tracking, multi-role dashboards, and automated emergency notifications.

The platform serves four primary user roles:
- **Residents** receive evacuation alerts and safety guidance
- **First Responders** coordinate firefighting operations in real-time
- **Municipality Officials** oversee evacuation and resource management
- **Administrators** maintain system operations and oversight

The system architecture combines modern backend APIs (GraphQL, REST, gRPC), event-driven messaging (NATS), real-time location streaming, push notifications, and platform-agnostic frontend development (React Native supporting web, iOS, Android, and Electron desktop).

---

## Problem Statement & Objectives

### The Challenge
Wildfires represent a critical threat requiring rapid detection, immediate coordination, and organized evacuation. Traditional emergency response systems often suffer from:
- **Delayed Detection**: Fire incidents may not be reported until visible to the public
- **Coordination Gaps**: Multiple agencies operate in silos with limited real-time information sharing
- **Inefficient Evacuation**: Residents receive generic or delayed alerts rather than personalized guidance
- **Location Blindness**: First responders lack real-time visibility of resident locations and evacuation progress

### Project Objectives
1. **Early Fire Detection** via thermal imaging and AI-powered analysis
2. **Real-time Coordination** among residents, responders, and municipal officials
3. **Intelligent Evacuation** with AI-generated personalized routes based on fire spread prediction
4. **Live Situational Awareness** through integrated dashboards for all stakeholder roles
5. **Multi-Platform Accessibility** across mobile, web, and desktop environments
6. **Reliable Communication** through multiple channels (push notifications, in-app alerts, SMS-like notifications)

---

## Key Features

### Fire Detection & Monitoring
- **Thermal Imaging Integration**: Uses MLX90640 thermal camera connected to Raspberry Pi Pico for real-time temperature monitoring
- **Multi-Source Fire Detection**:
  - Infrared (thermal imaging)
  - Responder manual reporting
  - AI-powered prediction models
  - Weather-based risk assessment
- **Fire Severity Tracking**: Severity levels, verification status, and real-time status updates
- **Fire History**: Complete audit trail of fire creation, updates, and resolution

### AI-Powered Evacuation Planning
- **Automatic Route Generation**: When a fire is detected, the system generates multiple evacuation routes based on:
  - Fire location and spread prediction
  - Geographic terrain and infrastructure
  - Safe zone proximity
  - Resident density
- **Route Optimization**: Routes include priority levels, estimated evacuation time, and distance
- **Dynamic Updates**: Routes update as fires spread or are extinguished

### Real-time Coordination
- **Live Responder Tracking**: All responders' locations update via gRPC streaming
- **Dynamic Assignments**: Fire assignments automatically or manually assigned to responder units
- **Assignment Status Tracking**: Assigned → En Route → On Scene → Completed workflow
- **Incident Command View**: Centralized dashboard for municipality officials and admin

### Multi-Channel Alerts & Notifications
- **Firebase Cloud Messaging (FCM)**: Push notifications to mobile devices
- **Role-Based Alerts**:
  - Fire Alerts (for residents in affected areas)
  - Evacuation Alerts (with evacuation routes and safe zones)
  - Prediction Alerts (for residents in predicted high-risk zones)
- **Target-Specific Delivery**: Alerts delivered based on role, location, and incident type
- **Notification Status Tracking**: Sent → Delivered → Failed states

### User Authentication & Session Management
- **JWT-based Authentication**: Access tokens and refresh tokens for stateless sessions
- **Multi-device Session Management**: Logout from all devices or individual logout
- **Password Security**: Bcrypt-hashed passwords with optional rehashing on login
- **Refresh Token Rotation**: Secure token refresh mechanism
- **Role-Based Access Control**: Different endpoints/data based on user role

### Geolocation & Mapping
- **PostGIS Integration**: Geographic queries using PostgreSQL PostGIS extension
- **Reverse Geocoding**: Nominatim API integration for address lookup with caching
- **Location Tracking**: Support for home location, work location, and last known location
- **Unit Management**: Responder unit location tracking and region assignment
- **Safe Zone Management**: Polygon-based safe zone definitions for evacuations

### Mobile & Cross-Platform Support
- **React Native**: Single codebase for iOS and Android
- **React Web**: Web version with Electron desktop wrapper
- **Platform-Specific Features**:
  - AR Mode (mobile only): Augmented reality fire visualization
  - Native notifications (mobile) vs web notifications
  - Geolocation APIs optimized per platform
- **Responsive Design**: Optimized layouts for phone, tablet, desktop

### Dashboard & Visualization
- **Resident Dashboard**: Personal evacuation status, safe zone proximity, safety tips
- **Responder Command Center**: Active fires, assignments, location map, incident details
- **Municipality Incident Command**: Multi-incident overview, evacuation progress, resource status
- **Admin Dashboard**: System health, user management, fire history analytics

---

## User Roles & Permissions

### 1. Resident
**Purpose**: Evacuate safely and receive timely guidance during fire incidents

**Capabilities**:
- Register and manage personal profile
- View active fire incidents and their locations
- Receive evacuation alerts with suggested routes
- Access safety tips and emergency contacts
- View nearest safe zones
- Report fire incidents (future enhancement)
- Track evacuation status
- Receive push notifications

**Data Access**:
- Own profile and location history
- Active fire incidents in their region
- Evacuation routes relevant to their location
- Alerts and notifications targeted at residents

**Restrictions**:
- Cannot access responder data or assignments
- Cannot modify fire records
- Cannot view sensitive municipality data

### 2. First Responder
**Purpose**: Coordinate firefighting operations and manage emergency response

**Capabilities**:
- Access responder profile and unit information
- Receive fire assignments
- Update location in real-time
- Change assignment status (Assigned → En Route → On Scene → Completed)
- View all active fires and evacuation progress
- Coordinate with other responders
- Receive push notifications about new assignments

**Data Access**:
- Own unit profile and location
- Current and historical fire incidents
- Evacuation routes for fire incidents
- Other responder locations and assignments
- Alert status and resident notification progress

**Restrictions**:
- Cannot modify fire severity or verification status
- Cannot change assignments for other responders
- Limited access to administrative functions

### 3. Municipality Official
**Purpose**: Oversee incident response, coordinate evacuations, and manage resources

**Capabilities**:
- View all fire incidents and evacuation status
- Monitor responder assignments and locations
- Verify fire incidents
- Update fire status and severity
- Manage evacuation routes
- View evacuation progress and resident movement
- Generate incident reports
- Access dashboard with key metrics

**Data Access**:
- Complete incident data
- All responder locations and assignments
- Evacuation status across the municipality
- Alert delivery status
- Historical incident data

**Restrictions**:
- Cannot modify user credentials
- Cannot directly assign responders (system does automatic assignment)
- Limited access to system configuration

### 4. Administrator
**Purpose**: Maintain system operations, user management, and system configuration

**Capabilities**:
- Create, read, update, delete all entities
- Manage user accounts across all roles
- System configuration and settings
- Access audit logs and analytics
- Manage alert and notification templates
- System health monitoring

**Data Access**:
- Complete access to all data
- System logs and audit trails
- Configuration and settings

**Restrictions**:
- Typically used by system operators only

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  React Native        Web (React)        Electron Desktop         │
│  ├─ iOS             ├─ Browser          ├─ Windows              │
│  └─ Android         └─ Web Build        └─ macOS                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┴────────┬────────────┬──────────────┐
        │                  │            │              │
    REST API        GraphQL API      gRPC        Firebase
   /api/auth/      /eshmagan        50051        Messaging
                                                  (FCM)
        │                  │            │              │
└────────────────────┬─────────────────┴────────┬──────┴──────┐
                     │                          │             │
        ┌────────────────────────────────────┐  │     Firebase
        │   EXPRESS.JS BACKEND               │  │     Cloud
        │   ─────────────────────────────    │  │
        │  • REST Routes (Auth)              │  │
        │  • GraphQL Server (Apollo)         │  │
        │  • Middleware (Auth, Validation)   │  │
        │  • Services & Repositories         │  │
        │  • gRPC Server (Location Stream)   │  │
        └────────────────┬────────────────┬─┘  │
                         │                │     │
        ┌────────────────────────────────────┐  │
        │         NATS JetStream             │◄─┘
        │  Event-Driven Messaging            │
        │  ────────────────────────────────  │
        │  • fire.detected                   │
        │  • fire.spread                     │
        │  • fire.extinguished               │
        │  • fire.risk.predicted             │
        │  • alert.created                   │
        │  • assignment.created              │
        │  • evacuation.updated              │
        └────────┬───────────────────────┬──┘
                 │                       │
    ┌────────────────────────┐  ┌────────────────────┐
    │ POSTGRESQL DATABASE    │  │  RASPBERRY PI PICO │
    │ + PostGIS             │  │  MLX90640 Thermal  │
    │ ──────────────────    │  │  Camera (UART)     │
    │ • Users               │  │ ────────────────── │
    │ • Fire Events         │  │ Thermal Frames     │
    │ • Alerts              │  │ (→ Google Colab AI)│
    │ • Evacuation Routes   │  │                    │
    │ • Assignments         │  │ Fire Detection     │
    │ • Notifications       │  │ (Confirmed → gQL) │
    │ • Geographic Data     │  │                    │
    └────────────────────────┘  └────────────────────┘
                 │
    ┌────────────────────────────────────┐
    │   GOOGLE COLAB AI SERVER           │
    │   ──────────────────────────────── │
    │   • Thermal Frame Processing       │
    │   • Fire Detection Model           │
    │   • Fire Spread Prediction         │
    │   • Evacuation Route Generation    │
    │   • Calls GraphQL API (Backend)    │
    └────────────────────────────────────┘
```

### Data Flow: Fire Detection to Evacuation

```
Thermal Camera (Pico)
    ↓
    [USB Serial → Laptop]
    ↓
thermal_dashboard_ai.py (Laptop Gateway)
    ├─ Reads frames from Pico serial
    ├─ Gets laptop geolocation
    └─ Sends frames to Google Colab
        ↓
        [Google Colab AI Server]
        ├─ Processes thermal frames
        ├─ Runs fire detection model
        ├─ Identifies fire hotspots
        └─ If fire confirmed:
            ↓
            GraphQL Mutation: createFireWithEvacuation()
                ├─ Create fire record
                ├─ Generate evacuation routes
                ├─ Publish NATS: fire.detected
                └─ Publish NATS: evacuation.updated
                    ↓
                    [Backend NATS Consumers]
                    ├─ fireDetected subscriber
                    │   └─ Create/broadcast alerts
                    │
                    └─ evacuationUpdated subscriber
                        └─ Notify affected residents
                            ↓
                            Firebase Messaging
                                ↓
                            Mobile Push Notifications
                                ↓
                            Resident Evacuation Alerts
```

---

## Technology Stack

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | JavaScript Runtime | ES Modules (type: "module") |
| **Express.js** | Web Framework | 4.18.2 |
| **Apollo Server** | GraphQL API | 5.5.0 |
| **GraphQL** | Query Language | 16.12.0 |
| **gRPC** | RPC Framework | 1.14.3 |
| **NATS** | Event Messaging | 2.29.3 |
| **PostgreSQL** | Database | 8.18.0 (pg driver) |
| **PostGIS** | Geographic Extension | Built into PostgreSQL |
| **Firebase Admin SDK** | Push Notifications | 13.8.0 |
| **JWT** | Authentication | 9.0.3 |
| **bcrypt** | Password Hashing | 6.0.0 |
| **CORS** | Cross-Origin Requests | 2.8.6 |
| **Morgan** | HTTP Logging | 1.10.1 |
| **dotenv** | Environment Variables | 17.2.4 |
| **UUID** | ID Generation | 13.0.0 |

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React Native** | Mobile Framework | 0.84.1 |
| **React** | Web Framework | 19.2.3 |
| **React DOM** | Web Rendering | 19.2.3 |
| **Apollo Client** | GraphQL Client | 3.14.0 |
| **React Navigation** | Routing (Native) | 7.1.33 |
| **React Native Maps** | Map Component | 1.27.2 |
| **React Native Vision Camera** | Camera Access | 4.7.3 |
| **React Native Geolocation** | GPS/Location | 3.4.0 |
| **Firebase Messaging** | Push Notifications | 24.0.0 |
| **Notifee** | Local Notifications | 9.1.8 |
| **AsyncStorage** | Local Storage | 1.23.1 |
| **Webpack** | Web Bundler | 5.105.4 |
| **Babel** | JavaScript Transpiler | 7.29.0 |
| **Electron** | Desktop Runtime | 40.8.0 |

---

## Folder Structure

```
EshMagan/
├── README.md                         # Project documentation
├── package.json                      # Node.js dependencies
├── EshMagan.sql                      # PostgreSQL schema initialization
├── project-structure.txt             # Folder structure reference
│
├── backend/                          # Backend Node.js/Express Application
│   ├── server.js                     # Express server entry point
│   ├── src/
│   │   ├── app.js                    # Express app configuration & middleware
│   │   │
│   │   ├── api/                      # API Layer
│   │   │   ├── rest/                 # REST API
│   │   │   │   ├── routes/
│   │   │   │   │   ├── index.js
│   │   │   │   │   └── auth.routes.js
│   │   │   │   └── controllers/
│   │   │   │       └── auth.controller.js
│   │   │   │
│   │   │   └── graphql/              # GraphQL API
│   │   │       ├── index.js
│   │   │       ├── context.js
│   │   │       ├── schema/           # GraphQL type definitions
│   │   │       └── resolvers/        # GraphQL resolvers
│   │   │
│   │   ├── config/                   # Configuration & Initialization
│   │   │   ├── env.js
│   │   │   ├── db.js
│   │   │   ├── firebaseAdmin.js
│   │   │   ├── grpc.js
│   │   │   ├── nats.js
│   │   │   └── nats.consumers.js
│   │   │
│   │   ├── domain/                   # Domain Layer (Entities & Repositories)
│   │   │   ├── entities/
│   │   │   └── repositories/
│   │   │
│   │   ├── services/                 # Business Logic Layer
│   │   │   ├── auth.service.js
│   │   │   ├── fire.service.js
│   │   │   ├── alert.service.js
│   │   │   └── [other services...]
│   │   │
│   │   ├── middleware/               # Express Middleware
│   │   │   ├── auth.middleware.js
│   │   │   └── validation.middleware.js
│   │   │
│   │   ├── grpc/                     # gRPC Server
│   │   │   ├── server.js
│   │   │   ├── proto/
│   │   │   └── services/
│   │   │
│   │   ├── events/                   # Event-Driven Messaging
│   │   │   ├── publishers/
│   │   │   └── subscribers/
│   │   │
│   │   ├── utils/                    # Utility Functions
│   │   └── eshmagan_mlx/             # ML/AI Integration
│   │       ├── main.py
│   │       ├── thermal_dashboard_ai.py
│   │       └── README_CONNECT_PIPELINE_AND_GUIDE.md
│   │
│
├── frontend/                         # Frontend React Native/React Application
│   ├── EshMagan/
│   │   ├── package.json
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── index.web.js
│   │   ├── electron.js
│   │   ├── webpack.config.js
│   │   │
│   │   ├── src/
│   │   │   ├── context/              # React Context (State Management)
│   │   │   ├── navigation/           # Screen Navigation
│   │   │   ├── screens/              # UI Screens (by role)
│   │   │   │   ├── auth/
│   │   │   │   ├── resident/
│   │   │   │   ├── responder/
│   │   │   │   ├── municipality/
│   │   │   │   └── admin/
│   │   │   ├── services/             # API services & utilities
│   │   │   ├── styles/
│   │   │   ├── images/
│   │   │   └── stubs/
│   │   │
│   │   ├── android/
│   │   ├── ios/
│   │   └── public/
│   │
│
└── node_modules/                     # Dependencies
```

---

## Frontend Overview

### Architecture
Single codebase for mobile (iOS/Android), web, and desktop:
- **React Native**: Mobile apps
- **React + React Native Web**: Web apps
- **Electron**: Desktop wrapper for web build

### Communication
- **REST API** (Authentication)
- **GraphQL** (Data queries/mutations)
- **gRPC** (Real-time location streaming)
- **Firebase FCM** (Push notifications)

### Screen Organization by Role
- **Auth**: LoginScreen, RegisterScreen
- **Resident**: HomeScreen, MapScreen, AlertsScreen, EvacuationScreen, SafetyTipsScreen, ARMode
- **Responder**: CommandView, assignments, incident tracking
- **Municipality**: Dashboard, IncidentDetails, evacuation coordination
- **Admin**: System dashboard

---

## Backend Overview

### Layered Architecture
1. **API Layer** - REST, GraphQL, gRPC endpoints
2. **Middleware** - Auth validation, request validation
3. **Service Layer** - Business logic
4. **Domain Layer** - Entities and repositories
5. **Config Layer** - Database, Firebase, NATS setup
6. **Event Layer** - NATS publishers and subscribers

### Core Services
- AuthService: User registration, login, token management
- FireService: Fire incident operations
- AlertService: Alert creation and targeting
- EvacuationService: Route management
- NotificationService: Notification delivery
- PushService: Firebase integration

---

## Database Schema

### Core Tables
- **users**: Base table for all user roles
- **fireevents**: Fire incidents with location (PostGIS)
- **residentdetails**, **responderdetails**, **municipalitydetails**, **admins**: Role-specific profiles
- **firerespondassignments**: Responder assignments to fires
- **alerts**: Broadcast alerts
- **evacuationroutes**: AI-generated routes (PostGIS geometries)
- **notifications**: Delivery records
- **refresh_tokens**: JWT token lifecycle

### Key Features
- PostGIS integration for geographic queries
- Foreign keys with cascade delete
- Timestamp audit trails
- Constraint-based data validation

---

## API Documentation

### REST Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - Logout
- `POST /api/auth/logout-all` - Logout all devices
- `POST /api/auth/change-password` - Change password
- `GET /api/geo/reverse?lat=X&lon=Y` - Reverse geocoding

### GraphQL Endpoint
- `POST /eshmagan` - GraphQL queries/mutations for:
  - Users, Residents, Responders, Municipality, Admins
  - Fires, Alerts, Evacuation Routes
  - Assignments, Notifications

### gRPC Service (Port 50051)
- **LocationService**:
  - `UpdateLocation`: Single location update RPC
  - `StreamLocations`: Real-time location stream

---

## Real-time Communication

### NATS JetStream Events
- `fire.detected` - Fire confirmed by AI
- `fire.spread` - Fire severity/spread update
- `fire.extinguished` - Fire extinguished
- `fire.risk.predicted` - AI prediction alert
- `alert.created` - Alert broadcast
- `assignment.created` - Responder assignment
- `evacuation.updated` - Route updates

### Firebase Cloud Messaging
- Push notification delivery
- Token management
- Deep linking to relevant screens

---

## Authentication & Authorization

### JWT Flow
1. `POST /api/auth/login` with credentials
2. Backend validates, creates access token (15 min) and refresh token (7 days)
3. Frontend stores tokens in secure storage
4. Attach access token to Authorization header: `Bearer <token>`
5. Backend verifies token via `authenticateToken` middleware
6. On expiry, use refresh token to get new access token

### Password Security
- Bcrypt hashing (10 rounds)
- Secure comparison during login
- Optional rehashing on version updates

### Role-Based Access Control
Enforced at:
- GraphQL resolvers (check context.user.user_role)
- REST route handlers
- Frontend navigation logic

---

## Installation Guide

### Prerequisites
- Node.js >= 22.11.0
- PostgreSQL with PostGIS
- NATS server
- Git

### Backend Setup
```bash
git clone https://github.com/MateoBitar/EshMagan.git
cd EshMagan
npm install

# Database
createdb eshmagan
psql -d eshmagan -c "CREATE EXTENSION postgis;"
psql -d eshmagan -f EshMagan.sql

# Configure backend/.env (see Environment Configuration)
npm run dev  # Development with nodemon
```

### Frontend Setup
```bash
cd frontend/EshMagan
npm install

# For web
npm run web

# For Electron
npm run electron

# For Android
npm run android

# For iOS
npm run ios
```

---

## Environment Configuration

Create `backend/.env`:
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/eshmagan
JWT_ACCESS_SECRET=your_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_secret_key_min_32_chars
ENCRYPTION_KEY=your_key_min_32_chars
NATS_URL=nats://localhost:4222
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_email
```

---

## Running the Application

### Backend
```bash
npm run dev     # Development (nodemon + gRPC)
npm start       # Production
```

### Frontend (Web)
```bash
npm run web     # Browser at localhost:3000
npm run electron # Electron desktop app
```

### Frontend (Mobile)
```bash
npm run android
npm run ios
```

### Health Checks
```bash
curl http://localhost:5000/           # Backend health
curl http://localhost:5000/db-test    # Database connectivity
```

---

## Thermal Camera & AI Integration

### System Flow
```
MLX90640 Thermal Camera
  ↓ UART
Raspberry Pi Pico (main.py)
  ↓ USB Serial
Laptop Gateway (thermal_dashboard_ai.py)
  ↓ HTTP
Google Colab (EshMagan_Ai.ipynb)
  ↓ GraphQL
Backend
  ↓ NATS Events
Frontend Alerts
```

### Hardware Wiring
```
GY-MCU90640 VIN → Pico 3V3(OUT)
GY-MCU90640 GND → Pico GND
GY-MCU90640 TX  → Pico GP1 (UART0 RX)
GY-MCU90640 RX  → Pico GP0 (UART0 TX)
```

### Setup
1. Flash MicroPython to Pico, run main.py
2. Run thermal_dashboard_ai.py on laptop (connects to COM port)
3. Configure Google Colab with backend URL
4. AI server processes frames and calls GraphQL mutations

---

## Example Data Flows

### Fire Detection → Evacuation Alert (30 seconds)
1. Thermal camera detects hotspot
2. Pico validates frame
3. Laptop sends to Colab
4. Colab AI confirms fire, calls GraphQL
5. Backend creates fire, publishes NATS event
6. Alert subscriber creates alert
7. Notification subscriber sends Firebase FCM
8. Residents receive push notification: "Fire Alert - Evacuate"

### Responder Assignment → Dispatch (5 seconds)
1. Fire created by AI
2. System finds nearest 3 responders
3. Creates assignments
4. Firebase notifies responders
5. Responders update status
6. Municipality sees real-time assignments

---

## Important Implementation Details

### Location Handling
- PostGIS geography (WGS84/EPSG:4326)
- Format: `POINT(longitude latitude)` or `{latitude, longitude}`
- Reverse geocoding cached to 4 decimal places (~11 meters)

### Fire Severity (1-5 Scale)
- Level 1-2: Contained, <50 hectares
- Level 3: Moderate, 50-500 hectares
- Level 4-5: Severe, >500 hectares

### Evacuation Routes
- AI generates 5 routes per fire
- Properties: path, safe zone, distance, time, priority
- Dynamically updated as fire spreads

### Database Pooling
- 2-10 connections
- 30 second idle timeout
- 10 second query timeout

---

## Security Considerations

✓ **Implemented**:
- Bcrypt password hashing (10 rounds)
- JWT with strong secrets
- Token revocation on logout
- CORS for frontend origin
- Input validation

⚠ **Gaps**:
- No rate limiting
- No field-level encryption (encryption_key unused)
- No API key for service-to-service auth
- Firebase credentials not encrypted in config

### Recommendations
1. Add rate limiting (express-rate-limit)
2. Implement HTTPS/TLS for production
3. Encrypt sensitive fields (phone, ID numbers)
4. Add password complexity requirements
5. Implement comprehensive audit logging
6. Regular security dependency audits

---

## Error Handling

**HTTP Status Codes**:
- 400: Validation failed
- 401: Unauthorized/expired token
- 403: Insufficient permissions
- 404: Not found
- 500: Server error
- 503: Service unavailable (NATS/DB down)

**GraphQL**: Returns errors in response, not HTTP status

**Resilience**: Failed notifications don't break flow, logged instead

---

## Known Limitations

1. **No Automated Testing** - Manual testing only
2. **Single Production Server** - No horizontal scaling
3. **Colab AI** - Not suitable for production (queue delays)
4. **No Offline Support** - Requires constant connectivity
5. **No Monitoring** - Limited production visibility
6. **Basic Assignment** - No sophisticated routing optimization
7. **Firebase Only** - Single notification provider
8. **No SMS/Email** - Limited communication channels
9. **Limited Documentation** - Minimal inline comments
10. **Scalability Limits** - Single database, single server

---

## Future Improvements

### High Priority
- Automated testing suite (Jest)
- Dedicated AI server (not Colab)
- Real-time WebSocket dashboards
- Mobile offline maps
- Production monitoring (APM, errors, logs)

### Medium Priority
- Multi-factor authentication
- Advanced resource management
- Historical analytics
- Multi-language support
- SMS & Email integration

### Lower Priority
- Custom role system
- Blockchain incident records
- Weather data integration
- ML route optimization
- Inter-municipality coordination

---

## License

ISC

---

## Summary

**EshMagan** is a sophisticated emergency management platform combining:
- Real-time fire detection (thermal imaging + AI)
- Intelligent evacuation coordination
- Multi-role dashboards
- Cross-platform support (mobile, web, desktop)
- Event-driven architecture

The system demonstrates professional software engineering with modular architecture, separation of concerns, comprehensive error handling, and security awareness.

**Repository**: [GitHub - MateoBitar/EshMagan](https://github.com/MateoBitar/EshMagan)

**Last Updated**: May 14, 2026 | **Version**: 1.0.0
