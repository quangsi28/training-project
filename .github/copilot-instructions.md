# AI Agent Instructions

## Project Overview
Enterprise TypeScript application demonstrating AI and ML capabilities with a focus on clean architecture and best practices.

## Core Architecture

### Service Layer Pattern
- Singleton services in `src/services/` handle core business logic
- Example: `AIService` and `MLService` use static `getInstance()` for singleton access
```typescript
const aiService = AIService.getInstance();
const mlService = MLService.getInstance();
```

### Request Flow
1. Routes (`src/routes/`) handle HTTP endpoints
2. Authentication/validation middleware intercepts
3. Service layer processes business logic
4. Prisma handles database operations
5. Standardized response format via `ApiResponse<T>` interface

## Key Conventions

### Error Handling
- Use `AppError` class for operational errors
- Wrap async route handlers in `asyncHandler`
- Centralized error handling in `errorHandler.ts`
```typescript
throw new AppError('Invalid credentials', 401);
```

### Validation
- Joi schemas in `validation.ts`
- Route-specific schemas exported from `schemas` object
- Validation middleware using `validateRequest`
```typescript
validateRequest({ body: schemas.aiAnalysis })
```

### Authentication
- JWT-based with `authenticateToken` middleware
- User roles: ADMIN, USER, DEVELOPER
- Access token in Authorization header

## Development Workflow

### Environment Setup
```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
```

### Common Commands
- `npm run dev` - Development with hot reload
- `npm test` - Run all tests
- `npm run lint:fix` - Fix linting issues
- `npm run db:studio` - Open Prisma Studio

### Testing
- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`
- Use Jest matchers and mock services where appropriate

## API Patterns

### Response Format
```typescript
{
  success: boolean,
  data?: T,
  error?: string,
  details?: string[],
  timestamp: string
}
```

### Analysis Endpoints
- `/api/ai/analyze` - Text analysis (sentiment, classification, etc.)
- `/api/ml/predict` - ML model predictions
- Include confidence scores and processing time in responses

### Rate Limiting
- 100 requests per 15 minutes by default
- Configurable via environment variables:
  - RATE_LIMIT_WINDOW_MS
  - RATE_LIMIT_MAX_REQUESTS

## Integration Points

### Database
- PostgreSQL with Prisma ORM
- Schema in `prisma/schema.prisma`
- Connection config in `src/config/database.ts`

### External Services
- AI Analysis endpoints mock responses for demonstration
- ML predictions use simple statistical models
- Built for easy replacement with real AI/ML services

## Monitoring
- Winston logger with structured JSON format
- Request logging middleware
- Service-level timing metrics
- Health check endpoint at `/api/health`

## Security Features
- Helmet.js for HTTP headers
- CORS with configurable origin
- Request rate limiting
- Request size limits (10MB)
- Input validation on all routes
