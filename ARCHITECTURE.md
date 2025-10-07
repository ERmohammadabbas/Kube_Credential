# System Architecture Documentation

## Overview

The Kube Credential System is a microservices-based application designed for credential issuance and verification. The architecture follows cloud-native best practices with containerization, orchestration, and horizontal scalability.

## System Components

### 1. Frontend Application

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation

**Responsibilities:**
- User interface for credential issuance
- User interface for credential verification
- Form validation and error handling
- API communication with backend services

**Deployment:**
- Containerized with Nginx
- Served as static files
- Reverse proxy to backend services

### 2. Issuance Service

**Technology Stack:**
- Node.js 20 with TypeScript
- Express.js framework
- SQLite database
- Winston for logging

**Responsibilities:**
- Accept credential issuance requests
- Validate credential format
- Check for duplicate credentials
- Persist credentials to database
- Return worker ID and timestamp
- Log all issuance events

**API Endpoints:**
- `POST /issue` - Issue new credentials
- `GET /health` - Health check
- `GET /api-docs` - Swagger documentation

**Storage Schema:**
```sql
CREATE TABLE credentials (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Verification Service

**Technology Stack:**
- Node.js 20 with TypeScript
- Express.js framework
- SQLite database (independent from issuance)
- Winston for logging

**Responsibilities:**
- Accept credential verification requests
- Query credential database
- Return validity status with metadata
- Log all verification attempts

**API Endpoints:**
- `POST /verify` - Verify credentials
- `GET /health` - Health check
- `GET /api-docs` - Swagger documentation

## Architecture Patterns

### Microservices Pattern

Each service is independently:
- Developed
- Deployed
- Scaled
- Maintained

**Benefits:**
- Fault isolation
- Independent scaling
- Technology flexibility
- Team autonomy

### API Gateway Pattern

Nginx serves as a reverse proxy:
```
Client → Nginx → [Issuance Service]
              → [Verification Service]
              → [Frontend Static Files]
```

### Database Per Service

Each microservice has its own database:
- Issuance Service → SQLite DB
- Verification Service → SQLite DB

**Note:** In production, these would be separate PostgreSQL databases.

## Data Flow

### Credential Issuance Flow

```
┌──────┐    POST /issue     ┌───────────┐
│Client├──────────────────→│ Issuance  │
└──────┘                    │  Service  │
                            └─────┬─────┘
                                  │
                            ┌─────▼─────┐
                            │  SQLite   │
                            │ Database  │
                            └───────────┘
```

**Steps:**
1. Client sends JSON credential
2. Service validates format
3. Service checks for duplicates
4. Service stores credential with metadata
5. Service returns success with worker ID
6. Service logs the event

### Credential Verification Flow

```
┌──────┐    POST /verify    ┌─────────────┐
│Client├──────────────────→│Verification │
└──────┘                    │  Service    │
                            └──────┬──────┘
                                   │
                            ┌──────▼──────┐
                            │   SQLite    │
                            │  Database   │
                            └─────────────┘
```

**Steps:**
1. Client sends credential for verification
2. Service extracts credential ID
3. Service queries database
4. Service returns validity status
5. Service logs verification attempt

## Deployment Architecture

### Docker Compose (Development)

```yaml
Services:
  - issuance-service (Port 3001)
  - verification-service (Port 3002)
  - frontend (Port 8080)

Volumes:
  - issuance-data (persistent)
  - verification-data (persistent)
  - logs (ephemeral)
```

### Kubernetes (Production)

```
┌─────────────────────────────────────┐
│           Ingress Controller        │
│         (nginx-ingress)             │
└─────┬───────────────────────────────┘
      │
┌─────▼──────────┬───────────────┬────────────────┐
│   Frontend     │  Issuance     │ Verification   │
│   Service      │  Service      │   Service      │
│   (2 replicas) │  (3 replicas) │  (3 replicas)  │
└────────────────┴───────────────┴────────────────┘
```

**Resources:**
- **Frontend Pods:**
  - Requests: 128Mi RAM, 100m CPU
  - Limits: 256Mi RAM, 200m CPU
  - Replicas: 2

- **Backend Pods:**
  - Requests: 128Mi RAM, 100m CPU
  - Limits: 256Mi RAM, 200m CPU
  - Replicas: 3

**Persistent Storage:**
- PersistentVolumeClaims for database files
- ReadWriteMany access mode
- 1Gi storage per service

## Security Architecture

### Network Security

1. **Helmet.js**: Security headers
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection

2. **CORS**: Controlled cross-origin access

3. **Rate Limiting**:
   - 100 requests per 15 minutes per IP
   - Applied to `/issue` and `/verify` endpoints

### Application Security

1. **Input Validation**:
   - JSON schema validation
   - Type checking
   - Required field validation

2. **Error Handling**:
   - Generic error messages to clients
   - Detailed logs for debugging
   - No sensitive data in responses

3. **Logging**:
   - All requests logged with Winston
   - Error logs separate from info logs
   - Timestamp and worker ID tracking

## Scalability

### Horizontal Scaling

Services can scale independently:
```bash
# Scale issuance service
kubectl scale deployment issuance-service --replicas=5

# Scale verification service
kubectl scale deployment verification-service --replicas=5
```

### Load Balancing

- Kubernetes Service load balances across pods
- Round-robin distribution
- Health checks ensure only healthy pods receive traffic

### Database Considerations

**Current:** SQLite (file-based)
- Simple for assignment
- Works with persistent volumes

**Production Recommendation:** PostgreSQL
- Better concurrency
- ACID compliance
- Connection pooling
- Replication support

## Monitoring & Observability

### Health Checks

Each service exposes `/health` endpoint:
```json
{
  "status": "healthy",
  "worker": "worker-abc123",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

### Logging Strategy

**Winston Configuration:**
- Info level for normal operations
- Error level for failures
- File rotation for log management
- Console output in development

**Log Format:**
```json
{
  "level": "info",
  "message": "Credential issued",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "credentialId": "CRED-12345",
  "worker": "worker-abc123"
}
```

### Kubernetes Probes

**Liveness Probe:**
- Checks if service is alive
- Restarts pod if unhealthy
- HTTP GET to `/health`

**Readiness Probe:**
- Checks if service is ready for traffic
- Removes from load balancer if not ready
- HTTP GET to `/health`

## Design Trade-offs

### SQLite vs PostgreSQL

**Chose SQLite for:**
- Simplicity in assignment context
- No external dependencies
- Easy backup (just copy file)

**Would use PostgreSQL for:**
- Production deployment
- Higher concurrency
- Better scalability
- Advanced features

### Separate Databases vs Shared

**Chose separate databases for:**
- True microservices independence
- Fault isolation
- Independent scaling

**Trade-off:**
- More storage overhead
- Data synchronization complexity

### REST API vs gRPC

**Chose REST for:**
- Universal compatibility
- Easy debugging
- Browser support
- Assignment requirements

**Would consider gRPC for:**
- Better performance
- Type safety
- Streaming support

## Future Enhancements

1. **Authentication & Authorization**:
   - JWT tokens
   - API keys
   - Role-based access control

2. **Database Migration**:
   - PostgreSQL with replication
   - Connection pooling
   - Query optimization

3. **Caching**:
   - Redis for frequently accessed credentials
   - Reduce database load

4. **Message Queue**:
   - RabbitMQ or Kafka
   - Async credential processing
   - Event-driven architecture

5. **Monitoring**:
   - Prometheus metrics
   - Grafana dashboards
   - Alert manager

6. **CI/CD Pipeline**:
   - GitHub Actions
   - Automated testing
   - Automated deployment

7. **Service Mesh**:
   - Istio or Linkerd
   - Advanced traffic management
   - mTLS between services

## Conclusion

This architecture provides a solid foundation for a production-ready credential management system. It demonstrates understanding of microservices principles, containerization, orchestration, and cloud-native best practices.

The system is designed to be:
- **Scalable**: Horizontal scaling of services
- **Resilient**: Health checks and automatic recovery
- **Maintainable**: Clean separation of concerns
- **Secure**: Multiple layers of security
- **Observable**: Comprehensive logging and health checks
