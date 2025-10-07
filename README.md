# Kube Credential System

A production-ready microservices-based credential management system built for the Zupple Labs assignment.

## 🏗️ Architecture

This system consists of three main components:

### 1. Issuance Service (Port 3001)
- **Technology**: Node.js + TypeScript + Express
- **Purpose**: Issues new credentials and prevents duplicates
- **Storage**: SQLite database for persistence
- **Features**:
  - POST `/issue` - Issue new credentials
  - GET `/health` - Health check endpoint
  - Winston logging with file rotation
  - Rate limiting (100 requests per 15 minutes)
  - Swagger API documentation at `/api-docs`

### 2. Verification Service (Port 3002)
- **Technology**: Node.js + TypeScript + Express
- **Purpose**: Verifies credential authenticity
- **Storage**: Independent SQLite database
- **Features**:
  - POST `/verify` - Verify credentials
  - GET `/health` - Health check endpoint
  - Winston logging with file rotation
  - Rate limiting (100 requests per 15 minutes)
  - Swagger API documentation at `/api-docs`

### 3. Frontend (Port 8080)
- **Technology**: React + TypeScript + Vite + Tailwind CSS
- **Features**:
  - Issuance page with JSON input form
  - Verification page with credential validation
  - Real-time loading states and error handling
  - Responsive design (mobile & desktop)
  - Beautiful gradient UI with smooth animations
  - Form validation with user feedback

## 📊 Architecture Diagram

```
┌─────────────────┐
│    Frontend     │
│   (React)       │
│   Port: 8080    │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
┌───▼───┐  ┌───▼───┐
│Issuance│  │Verify │
│Service │  │Service│
│Port:   │  │Port:  │
│3001    │  │3002   │
└───┬────┘  └───┬───┘
    │           │
┌───▼───┐   ┌──▼────┐
│SQLite │   │SQLite │
│  DB   │   │  DB   │
└───────┘   └───────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Kubernetes cluster (optional)

### Local Development

1. **Install dependencies**:
```bash
# Frontend
npm install

# Issuance Service
cd backend/issuance-service
npm install

# Verification Service
cd backend/verification-service
npm install
```

2. **Run services**:
```bash
# Terminal 1 - Issuance Service
cd backend/issuance-service
npm run dev

# Terminal 2 - Verification Service
cd backend/verification-service
npm run dev

# Terminal 3 - Frontend
npm run dev
```

3. **Access the application**:
- Frontend: http://localhost:8080
- Issuance API: http://localhost:3001
- Verification API: http://localhost:3002
- Issuance API Docs: http://localhost:3001/api-docs
- Verification API Docs: http://localhost:3002/api-docs

### Docker Compose Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Kubernetes Deployment

```bash
# Build Docker images
docker build -t issuance-service:latest ./backend/issuance-service
docker build -t verification-service:latest ./backend/verification-service
docker build -t frontend:latest -f Dockerfile.frontend .

# Apply Kubernetes manifests
kubectl apply -f kubernetes/

# Check deployment status
kubectl get pods
kubectl get services

# Access frontend
kubectl port-forward service/frontend 8080:80
```

## 📡 API Documentation

### Issuance Service

**POST /issue**
```json
Request:
{
  "id": "CRED-12345",
  "name": "John Doe",
  "role": "Developer",
  "department": "Engineering"
}

Response (201):
{
  "message": "Credential issued by worker-abc123",
  "worker": "worker-abc123",
  "credentialId": "CRED-12345",
  "timestamp": "2025-10-07T12:00:00.000Z"
}

Response (409 - Already exists):
{
  "message": "Credential already issued"
}
```

### Verification Service

**POST /verify**
```json
Request:
{
  "id": "CRED-12345"
}

Response (200 - Valid):
{
  "status": "valid",
  "worker": "worker-abc123",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "credential": { ... }
}

Response (404 - Not found):
{
  "status": "invalid",
  "message": "Credential not found"
}
```

## 🧪 Testing

```bash
# Run tests for Issuance Service
cd backend/issuance-service
npm test

# Run tests for Verification Service
cd backend/verification-service
npm test

# Watch mode
npm run test:watch
```

## 🔒 Security Features

- **Helmet.js**: Security headers protection
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: JSON schema validation
- **Error Handling**: Proper error responses without sensitive data leakage

## 📈 Monitoring & Logging

- **Winston Logger**: Structured logging with file rotation
- **Health Endpoints**: `/health` for both services
- **Kubernetes Probes**: Liveness and readiness checks
- **Request Logging**: Morgan middleware for HTTP request logging

## 🛠️ Technology Stack

### Backend
- Node.js 20
- TypeScript
- Express.js
- SQLite (with sqlite3 driver)
- Winston (logging)
- Helmet (security)
- Express Rate Limit
- Swagger UI

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Sonner (toast notifications)

### DevOps
- Docker
- Docker Compose
- Kubernetes
- Nginx (reverse proxy)

## 📦 Project Structure

```
.
├── backend/
│   ├── issuance-service/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── storage.ts
│   │   │   └── logger.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── swagger.yaml
│   └── verification-service/
│       ├── src/
│       │   ├── index.ts
│       │   ├── storage.ts
│       │   └── logger.ts
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       └── swagger.yaml
├── kubernetes/
│   ├── issuance-deployment.yaml
│   ├── issuance-service.yaml
│   ├── verification-deployment.yaml
│   ├── verification-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   └── ingress.yaml
├── src/
│   ├── pages/
│   │   ├── Index.tsx
│   │   ├── Issuance.tsx
│   │   └── Verification.tsx
│   └── ...
├── docker-compose.yml
├── Dockerfile.frontend
├── nginx.conf
└── README.md
```

## 🎯 Design Decisions

1. **Microservices Architecture**: Separate services for issuance and verification ensure independence, scalability, and fault isolation.

2. **SQLite for Persistence**: Lightweight, file-based database suitable for the assignment scope. Can be easily replaced with PostgreSQL for production.

3. **TypeScript**: Strong typing reduces bugs and improves code maintainability.

4. **Worker Identification**: Each service instance has a unique worker ID for tracking and debugging.

5. **Health Checks**: Kubernetes probes ensure high availability and automatic recovery.

6. **Rate Limiting**: Prevents abuse and ensures fair resource allocation.

7. **Swagger Documentation**: Auto-generated API docs for easy integration and testing.

8. **Modern Frontend**: React with Tailwind CSS provides a professional, responsive UI.

## 🚀 Deployment Options

### Option 1: AWS Free Tier (Recommended)
- **EC2**: t2.micro instances for backend services
- **RDS Free Tier**: If upgrading from SQLite
- **S3 + CloudFront**: Static frontend hosting
- **Application Load Balancer**: Route traffic to services

### Option 2: Google Cloud Free Tier
- **Google Kubernetes Engine (GKE)**: Free cluster
- **Cloud Run**: Serverless container deployment
- **Cloud Storage**: Static frontend

### Option 3: DigitalOcean
- **Kubernetes**: Managed K8s cluster ($12/month for starter)
- **App Platform**: Easy deployment

## 📸 Screenshots

### Home Page
![Home Page - Modern landing with gradient design]

### Issuance Page
![Issuance - JSON input form with validation]

### Verification Page
![Verification - Credential validation interface]

## 🎥 Demo Video

[Link to screen recording demonstrating issuance and verification flows]

## 📝 Testing Instructions

1. **Issue a Credential**:
   - Navigate to the Issuance page
   - Enter credential JSON
   - Click "Issue Credential"
   - Verify success response with worker ID

2. **Verify the Credential**:
   - Navigate to the Verification page
   - Enter the same credential JSON
   - Click "Verify Credential"
   - Confirm it shows as valid with timestamp

3. **Test Duplicate Prevention**:
   - Try issuing the same credential again
   - Should receive "Credential already issued" error

4. **Test Invalid Credential**:
   - Verify a credential that wasn't issued
   - Should receive "Credential not found" error

## 🏆 Extra Features Implemented

✅ JWT-based authentication ready (auth middleware available)
✅ Rate limiting to prevent abuse
✅ Docker Compose for easy local development
✅ Centralized logging with Winston
✅ Health check endpoints
✅ Swagger API documentation
✅ Unit test structure with Jest
✅ Kubernetes manifests with 3 replicas
✅ Professional gradient UI design
✅ Form validation and error handling
✅ Responsive mobile design
✅ Loading states and animations

## 📄 License

MIT License - Built for Zupple Labs Assignment

## 👨‍💻 Author

[Your Name]
- Portfolio: [Your Portfolio URL]
- LinkedIn: [Your LinkedIn]
- GitHub: [Your GitHub]

---

**Note**: Replace backend service URLs in the frontend code (`src/pages/Issuance.tsx` and `src/pages/Verification.tsx`) with your deployed URLs when hosting.

For questions or issues, please open an issue in the repository.
