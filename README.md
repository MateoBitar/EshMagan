# EshMagan: Intelligent Wildfire Management & Emergency Response Platform

## Table of Contents
1. [Project Overview](#project-overview)
2. [Problem Statement & Objectives](#problem-statement--objectives)
3. [System Architecture](#system-architecture)
4. [Key Features](#key-features)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Technology Stack](#technology-stack)
7. [Folder Structure](#folder-structure)
8. [Frontend Overview](#frontend-overview)
9. [Backend Overview](#backend-overview)
10. [Database Schema](#database-schema)
11. [API Documentation](#api-documentation)
12. [Real-time Communication](#real-time-communication)
13. [Authentication & Authorization](#authentication--authorization)
14. [System Requirements](#system-requirements)
15. [Installation Guide](#installation-guide)
16. [Python Dependencies](#python-dependencies)
17. [Environment Configuration](#environment-configuration)
18. [Frontend API Configuration](#frontend-api-configuration)
19. [Running the Application](#running-the-application)
20. [Thermal Camera & AI Integration](#thermal-camera--ai-integration)
21. [Ngrok Configuration](#ngrok-configuration)
22. [Google Colab AI Setup](#google-colab-ai-setup)
23. [Example Data Flows](#example-data-flows)
24. [Complete System Startup Sequence](#complete-system-startup-sequence)
25. [Demo Accounts](#demo-accounts)
26. [Verification & Testing](#verification--testing)
27. [Important Implementation Details](#important-implementation-details)
28. [Security Considerations](#security-considerations)
29. [Known Limitations](#known-limitations)
30. [Future Improvements](#future-improvements)
31. [License](#license)

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

---

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
            GraphQL Mutation: createFireAndTriggerSystem()
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
The system uses an event-driven architecture built on NATS JetStream.
However, some events are fully implemented while others are currently reserved for future enhancements.

### Events Fully Implemented
- `fire.detected` - Fire confirmed by AI
- `fire.risk.predicted` - AI prediction alert
- `alert.created` - Alert broadcast
- `assignment.created` - Responder assignment
- `evacuation.updated` - Route updates

### Events Partially Implemented
- `fire.spread` - Fire severity/spread update
- `fire.extinguished` - Fire extinguished

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

## System Requirements

### Hardware

- Raspberry Pi Pico
- MLX90640 Thermal Camera
- USB Connection to Host Computer
- Internet Connection for Google Colab Communication

### Software

- Node.js >= 22
- npm >= 10
- PostgreSQL >= 16
- PostGIS Extension
- NATS Server with JetStream
- Python >= 3.10
- Ngrok
- Git

### Supported Platforms

- Windows 10 / 11
- macOS
- Linux
- Android
- iOS
- Modern Web Browsers

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

## Python Dependencies

The thermal gateway and AI communication layer require Python packages.

### Install Dependencies

```bash
pip install pyserial requests geocoder numpy opencv-python matplotlib
```

### Using a Virtual Environment (Recommended)

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Linux / macOS:

```bash
source venv/bin/activate
```

Install packages:

```bash
pip install pyserial requests geocoder numpy opencv-python matplotlib
```

### Verify Installation

```bash
python --version
pip list
```

Ensure all required packages are installed before launching:

```bash
python thermal_dashboard_ai.py
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

## Frontend API Configuration

Before launching the frontend applications, ensure the correct backend endpoint is configured.

### Local Development

Replace the GraphQL endpoint with your machine's local IP address:

```javascript
const GRAPHQL_URL = "http://192.168.1.10:5000/eshmagan";
```

Example:

```text
http://192.168.1.10:5000/eshmagan
```

### Ngrok Development

When using Google Colab or testing on external devices, use the Ngrok URL:

```javascript
const GRAPHQL_URL =
  "https://abcd-1234.ngrok-free.app/eshmagan";
```

### Important Notes

- Mobile devices cannot access `localhost`.
- Android emulators may require `10.0.2.2`.
- Physical devices must use the host machine's IP address or Ngrok URL.
- Ensure backend, GraphQL, and NATS services are running before launching the frontend.

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

## Ngrok Configuration

Google Colab cannot directly access services running on localhost.

Ngrok creates a secure public tunnel to the backend.

### Installation

Download and install Ngrok.

### Authenticate

```bash
ngrok config add-authtoken YOUR_TOKEN
```

### Expose Backend

```bash
ngrok http 5000
```

Example:

```text
https://abcd-1234.ngrok-free.app
```

Use this URL inside Google Colab when configuring GraphQL communication.

### Verification

Open the generated URL in a browser.

You should receive a backend response.

If inaccessible:

* Verify backend is running
* Verify port number
* Restart Ngrok

---

## Google Colab AI Setup

The AI subsystem is responsible for:

* Thermal frame processing
* Fire verification
* Fire spread prediction
* Evacuation route generation

### Opening the Notebook

Open:

```text
EshMagan_Ai.ipynb
```

in Google Colab.

### Runtime

Select:

```text
Runtime → Run All
```

### Configure Backend Endpoint

Replace the backend URL with the Ngrok URL.

Example:

```python
BACKEND_URL = "https://abcd-1234.ngrok-free.app"
```

### Startup Validation

Verify:

* Notebook starts without errors
* GraphQL connection established
* AI model loaded
* Route generation available

### Fire Creation Pipeline

```text
Thermal Frame
    ↓
AI Processing
    ↓
Fire Verification
    ↓
GraphQL Mutation
    ↓
Fire Record Creation
    ↓
NATS Publication
    ↓
Alerts
    ↓
Firebase Notifications
    ↓
Resident & Responder Applications
```

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

## Complete System Startup Sequence

To ensure all platform components communicate correctly, start services in the following order.

### Step 0 — Configure Environment Variables

Verify:

- backend/.env
- Firebase credentials
- Database credentials
- JWT secrets
- NATS URL

The backend will not start correctly unless all required environment variables are configured.

### Step 1 — PostgreSQL + PostGIS

Verify PostgreSQL is running.

```bash
createdb eshmagan
psql -d eshmagan -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

Load schema:

```bash
psql -d eshmagan -f EshMagan.sql
```

Verify connectivity:

```bash
curl http://localhost:5000/db-test
```

---

### Step 2 — Start NATS JetStream

Open Terminal 1:

```bash
nats-server -js
```

Expected output:

```text
Server is ready
JetStream is enabled
```

NATS is responsible for:

* fire.detected
* fire.spread
* fire.extinguished
* fire.risk.predicted
* alert.created
* assignment.created
* evacuation.updated

Without NATS, alerts and assignments will not propagate.

---

### Step 3 — Start Backend

Open Terminal 2:

```bash
cd backend
npm install
npm run dev
```

Expected services:

* Express API
* Apollo GraphQL
* gRPC Location Service
* Firebase Integration
* NATS Consumers

Verify:

```bash
curl http://localhost:5000/
```

---

### Step 4 — Expose Backend with Ngrok

Open Terminal 3:

```bash
ngrok http 5000
```

Example output:

```text
https://abcd-1234.ngrok-free.app
```

Copy this URL.

The AI server running in Google Colab requires this public URL to communicate with the backend.

---

### Step 5 — Launch Google Colab AI

Open:

```text
EshMagan_Ai.ipynb
```

Update the backend endpoint using the Ngrok URL.

Run all notebook cells in order.

Verify:

* AI model loads successfully
* GraphQL endpoint reachable
* Fire creation mutation available
* Evacuation generation operational

---

### Step 6 — Connect MLX90640 Thermal Camera

Connect Raspberry Pi Pico via USB.

Flash:

```text
main.py
```

onto the Pico.

Verify thermal frames are transmitted.

---

### Step 7 — Launch Thermal Gateway

Open Terminal 4:

```bash
cd backend/src/eshmagan_mlx
python thermal_dashboard_ai.py
```

This service:

* Reads thermal frames
* Retrieves laptop geolocation
* Sends data to Google Colab
* Displays thermal analysis results

---

### Step 8 — Launch Frontend

Open Terminal 5:

```bash
cd frontend/EshMagan
npm install
```

Web:

```bash
npm run web
```

Desktop:

```bash
npm run electron
```

Android:

```bash
npm run android
```

iOS:

```bash
npm run ios
```

---

### Step 9 — Login and Verify

Use test accounts for:

* Resident
* Responder
* Municipality
* Administrator

Confirm:

* GraphQL queries succeed
* Notifications are received
* Maps render correctly
* Fire events appear
* Assignments update
* Evacuation routes load

---

## Demo Accounts

The following accounts can be used for testing and demonstration purposes.

### Resident

```text
Email: resident@test.com
Password: password123
```

### Responder

```text
Email: responder@test.com
Password: password123
```

### Municipality

```text
Email: municipality@test.com
Password: password123
```

### Administrator

```text
Email: admin@test.com
Password: password123
```

> Replace these credentials with the actual seeded accounts available in your database.

---

## Verification & Testing

### Backend Health

```bash
curl http://localhost:5000/
```

Expected:

```text
Backend running
```

### Database Connectivity

```bash
curl http://localhost:5000/db-test
```

Expected:

```text
Database connected
```

### GraphQL Endpoint

Open:

```text
http://localhost:5000/eshmagan
```

Verify schema loads.

### NATS Connectivity

Verify subscribers start without errors.

Expected subjects:

* fire.detected
* fire.spread
* fire.extinguished
* alert.created
* assignment.created

### Firebase Verification

Send a test notification.

Expected:

* Android receives push notification
* iOS receives push notification
* Web receives notification

### AI Verification

Introduce a heat source near the MLX90640.

Verify:

1. Thermal frame detected
2. AI processes frame
3. Fire created
4. NATS event published
5. Alert generated
6. Notification delivered
7. Incident appears on dashboards

### End-to-End Success Criteria

A complete system test is successful when:

* Fire appears in Municipality Dashboard
* Residents receive evacuation alerts
* Responders receive assignments
* Evacuation routes are generated
* Notification delivery status updates
* Fire status changes propagate in real time
* All dashboards remain synchronized

---

## Important Implementation Details

### Event-Driven Architecture
- All critical system actions are propagated through **NATS JetStream**
- Fire lifecycle is fully event-driven:
  - Detection → Assignment → Evacuation → Resolution
- Ensures decoupling between backend services

### Real-Time Systems
- gRPC is used for live responder location streaming
- Firebase handles push notification delivery
- GraphQL handles complex relational queries
- REST is strictly used for authentication

### AI Integration Pattern
- AI does NOT directly modify the database
- Instead:
  1. Detects fire
  2. Calls GraphQL mutation
  3. Backend handles persistence and event publishing

### Geospatial Logic
- PostGIS is used for:
  - Fire radius calculations
  - Evacuation route generation
  - Safe zone proximity checks

---

## Security Considerations

### Authentication Security
- JWT access tokens expire after 15 minutes
- Refresh tokens are securely stored and rotated
- Passwords are hashed using bcrypt (10 rounds minimum)

### API Protection
- All protected routes use authentication middleware
- Role-based access control enforced at:
  - REST layer
  - GraphQL resolvers
  - Frontend route guards

### Data Protection
- Sensitive data is filtered based on user role
- Fire and evacuation data is restricted per permissions

### Communication Security
- Ngrok is strictly for development use only
- Firebase tokens required for push notifications
- Environment variables must never be committed

---

## Known Limitations

### AI Limitations
- Fire detection depends on thermal camera accuracy and environmental conditions
- False positives may occur in high-heat environments
- AI model requires stable internet connection via Colab

### Infrastructure Limitations
- NATS must remain running for event propagation
- System depends on stable PostgreSQL + PostGIS setup
- Ngrok required for external AI communication (dev mode only)

### Mobile Limitations
- AR mode only available on supported mobile devices
- Background GPS tracking may vary by OS restrictions
- Push notifications depend on Firebase delivery success

### Network Limitations
- Real-time features require stable internet connection
- gRPC streaming may drop under weak connectivity

---

## Future Improvements

### Full Fire Lifecycle Event System
- Implement fire.spread publishing in real-time fire severity updates
- Enable dynamic evacuation route recalculation based on spread events
- Complete end-to-end fire lifecycle automation across all services

### Event-Driven System Completion
- Fully integrate fire.extinguished consumer logic
- Ensure cleanup workflows (alerts, assignments, evacuation closure)

### AI Enhancements
- Train local edge AI model (remove Colab dependency)
- Improve fire spread prediction accuracy
- Add smoke detection alongside thermal detection

### System Improvements
- Replace Ngrok with permanent cloud deployment
- Add Kubernetes orchestration for backend scaling
- Introduce Redis caching layer for performance

### Feature Expansions
- Satellite-based fire detection integration
- Drone integration for live aerial monitoring
- SMS fallback alerts (in case of no internet)
- Offline-first mobile evacuation mode

### Analytics & Reporting
- Fire trend prediction dashboard
- Heatmap-based risk analysis
- Historical incident AI insights

---

## License

This project is developed for academic and demonstration purposes.

All rights reserved © 2026 EshMagan Project Team.

Unauthorized commercial use, redistribution, or modification without permission is prohibited.