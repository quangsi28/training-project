# AI Training Demo Project

A comprehensive TypeScript-based enterprise application demonstrating AI and machine learning capabilities for developer training and adoption.

## 🚀 Features

### Core Functionality
- **AI Text Analysis**: Sentiment analysis, text classification, summarization, translation, and entity extraction
- **Machine Learning**: Linear regression, classification, clustering, and anomaly detection
- **Data Management**: CRUD operations with analytics and export capabilities
- **User Authentication**: JWT-based authentication with role-based access control
- **System Metrics**: Performance monitoring and usage analytics

### Technical Stack
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Joi schema validation
- **Testing**: Jest with comprehensive unit and integration tests
- **Documentation**: Swagger/OpenAPI 3.0
- **Containerization**: Docker and Docker Compose
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## 📋 Prerequisites

- Node.js 18+ and npm 8+
- PostgreSQL 13+
- Docker and Docker Compose (optional)

## 🛠️ Installation

### Local Development

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd windsurf-project
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up database**
```bash
# Start PostgreSQL and create database
createdb ai_training_demo

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate
```

4. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000` with documentation at `http://localhost:3000/api/docs`.

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### AI Analysis Endpoints
- `POST /api/ai/analyze` - Perform AI text analysis
- `GET /api/ai/history` - Get analysis history
- `POST /api/ai/batch-analyze` - Batch analysis

### Machine Learning Endpoints
- `POST /api/ml/predict` - Make ML predictions
- `GET /api/ml/models/{type}/metrics` - Get model metrics
- `GET /api/ml/predictions/history` - Prediction history
- `POST /api/ml/batch-predict` - Batch predictions

### Data Management Endpoints
- `POST /api/data/points` - Create data points
- `GET /api/data/points` - Retrieve data points
- `GET /api/data/analytics` - Get analytics
- `GET /api/data/export` - Export data

### System Endpoints
- `GET /api/health` - Health check
- `GET /api/metrics/system` - System metrics
- `GET /api/metrics/usage` - Usage statistics

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔧 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

## 🏗️ Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # Database connection
│   └── logger.ts    # Logging configuration
├── middleware/      # Express middleware
│   ├── auth.ts      # Authentication middleware
│   ├── validation.ts # Request validation
│   └── errorHandler.ts # Error handling
├── routes/          # API route handlers
│   ├── auth.ts      # Authentication routes
│   ├── ai.ts        # AI analysis routes
│   ├── ml.ts        # Machine learning routes
│   ├── data.ts      # Data management routes
│   ├── metrics.ts   # System metrics routes
│   └── health.ts    # Health check routes
├── services/        # Business logic services
│   ├── aiService.ts # AI analysis service
│   └── mlService.ts # ML prediction service
├── types/           # TypeScript type definitions
│   └── index.ts     # Shared types and interfaces
├── app.ts           # Express application setup
└── index.ts         # Application entry point

tests/
├── unit/            # Unit tests
├── integration/     # Integration tests
└── setup.ts         # Test configuration

prisma/
└── schema.prisma    # Database schema
```

## 🎯 Demo Use Cases

### 1. AI Text Analysis
Demonstrate various AI capabilities:
- **Sentiment Analysis**: Analyze customer feedback sentiment
- **Text Classification**: Categorize documents by topic
- **Summarization**: Generate concise summaries of long texts
- **Translation**: Translate text between languages
- **Entity Extraction**: Extract emails, phones, dates, URLs

### 2. Machine Learning Predictions
Show different ML model types:
- **Linear Regression**: Predict continuous values
- **Classification**: Binary/multi-class predictions
- **Clustering**: Group similar data points
- **Anomaly Detection**: Identify outliers in data

### 3. Data Analytics
Demonstrate data processing capabilities:
- **Data Ingestion**: Store and manage data points
- **Analytics**: Calculate trends and statistics
- **Visualization**: Export data for visualization tools
- **Real-time Metrics**: Monitor system performance

### 4. Enterprise Features
Show production-ready capabilities:
- **Authentication & Authorization**: Secure API access
- **Rate Limiting**: Prevent API abuse
- **Logging & Monitoring**: Track system health
- **Error Handling**: Graceful error management
- **API Documentation**: Interactive Swagger docs

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Request validation with Joi schemas
- Rate limiting to prevent abuse
- Helmet.js security headers
- CORS configuration
- SQL injection prevention with Prisma

## 📊 Monitoring & Observability

- Structured logging with Winston
- Health check endpoints for Kubernetes
- Performance metrics collection
- Database query monitoring
- Error tracking and reporting

## 🚀 Deployment

### Production Checklist
- [ ] Set strong JWT secret
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Server
PORT=3000
NODE_ENV=production

# Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# External APIs (optional)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions and support:
- Check the API documentation at `/api/docs`
- Review the test files for usage examples
- Open an issue for bug reports or feature requests

---

**Built for Enterprise AI Training** - This project demonstrates production-ready patterns and best practices for AI-enabled applications.
