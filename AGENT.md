## Dev Environment Setup

### Start Containers
Run these commands to start the dev environment:
```bash
# Docker Compose
docker-compose up -d

# Podman Compose (Alternative)
podman-compose up -d
```

### Verify Status
Check container status with:
```bash
docker ps
podman ps
```

### Pre-Test Requirement
Ensure containers are running before executing tests. The PostgreSQL and Redis services are required for test execution.