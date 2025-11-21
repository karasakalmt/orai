# Orai Backend - Quick Start Tasks

## Immediate Setup Tasks (Day 1)

### 1. Initialize Project
```bash
# Create package.json
npm init -y

# Install core dependencies
npm install fastify @fastify/cors @fastify/helmet @fastify/rate-limit @fastify/websocket @fastify/jwt
npm install ethers
npm install @prisma/client prisma pg
npm install redis bullmq
npm install pino pino-pretty
npm install zod dotenv

# Install dev dependencies
npm install -D typescript @types/node tsx vitest @vitest/ui
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D @types/node
```

### 2. Create Configuration Files

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### .eslintrc.json
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

#### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

#### .env.example
```bash
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://orai_user:password@localhost:5432/orai_db

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain
RPC_URL=https://rpc-testnet.0g.ai
ORACLE_HUB_ADDRESS=0x0000000000000000000000000000000000000000

# 0G Services
OG_COMPUTE_API_KEY=your_compute_api_key_here
OG_STORAGE_API_KEY=your_storage_api_key_here
OG_NETWORK=testnet

# Security
BACKEND_SECRET=your_backend_secret_here
JWT_SECRET=your_jwt_secret_here

# Logging
LOG_LEVEL=debug
```

#### .gitignore
```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
coverage/
.vscode/
.idea/
*.swp
*.swo
.nyc_output/
```

### 3. Create Directory Structure
```bash
mkdir -p src/{config,controllers,services,repositories,routes,middleware,schemas,workers,types,utils,contracts}
mkdir -p tests/{unit,integration,e2e}
mkdir -p prisma/migrations
```

### 4. Create Initial Files

#### src/server.ts
```typescript
import { buildApp } from './app';
import { logger } from './utils/logger';

const start = async () => {
  try {
    const app = await buildApp();
    const port = process.env.PORT || 3001;

    await app.listen({ port: Number(port), host: '0.0.0.0' });
    logger.info(`Server listening on port ${port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
```

#### src/app.ts
```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { logger } from './utils/logger';

export async function buildApp() {
  const app = Fastify({
    logger: logger,
  });

  // Register plugins
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://orai.xyz'
      : true,
  });

  await app.register(helmet);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}
```

#### src/utils/logger.ts
```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      }
    : undefined,
});
```

### 5. Initialize Prisma
```bash
npx prisma init
```

Then update `prisma/schema.prisma` with the models from BACKEND.md.

### 6. Update package.json Scripts
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --check src/**/*.ts",
    "format:fix": "prettier --write src/**/*.ts",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

### 7. Database Setup
```bash
# Start PostgreSQL (using Docker)
docker run -d \
  --name orai-postgres \
  -e POSTGRES_USER=orai_user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=orai_db \
  -p 5432:5432 \
  postgres:15-alpine

# Start Redis (using Docker)
docker run -d \
  --name orai-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### 8. Run Initial Migration
```bash
npx prisma migrate dev --name init
```

### 9. Test the Setup
```bash
# Start development server
npm run dev

# In another terminal, test health endpoint
curl http://localhost:3001/health
```

## Next Priority Tasks

Once the basic setup is complete, proceed with:

1. **Implement Core Config Files** (Day 2)
   - [ ] src/config/database.ts
   - [ ] src/config/blockchain.ts
   - [ ] src/config/redis.ts
   - [ ] src/config/env.ts

2. **Create Base Services** (Day 3-4)
   - [ ] src/services/oracle.service.ts
   - [ ] src/services/blockchain.service.ts
   - [ ] src/repositories/base.repository.ts

3. **Setup First API Endpoint** (Day 5)
   - [ ] POST /api/questions endpoint
   - [ ] Input validation with Zod
   - [ ] Error handling

4. **0G Integration** (Week 2)
   - [ ] Research 0G SDK documentation
   - [ ] Implement compute service
   - [ ] Implement storage service
   - [ ] Test with testnet

## Verification Checklist

- [ ] Server starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Database connection successful
- [ ] Redis connection successful
- [ ] TypeScript compilation works
- [ ] Linting passes
- [ ] Basic test runs

## Common Issues & Solutions

### Issue: Database connection fails
**Solution:** Ensure PostgreSQL is running and credentials in .env match

### Issue: TypeScript compilation errors
**Solution:** Check tsconfig.json and ensure all dependencies are installed

### Issue: Port already in use
**Solution:** Change PORT in .env or stop other services on port 3001

### Issue: 0G SDK not found
**Solution:** The @0g/sdk package may need special access - check 0G documentation

---

**Note:** This quick start guide assumes local development. For production deployment, additional security and configuration steps are required.

**Last Updated:** November 21, 2024