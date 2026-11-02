# NestJS Authentication & User Management API

A backend REST API built with **NestJS, TypeScript, PostgreSQL, and Prisma ORM**, featuring secure authentication, user management, request validation, rate limiting, structured logging, and centralized exception handling.

## Features

- **JWT Authentication:** Secure authentication using access and refresh tokens.
- **Authorization:** Protected API endpoints using authentication and authorization mechanisms.
- **User Management:** RESTful APIs supporting complete CRUD operations.
- **DTOs & Validation:** Validates incoming requests and ensures data integrity.
- **Rate Limiting:** Controls API request frequency to prevent excessive requests and protect endpoints.
- **Custom Exception Filters:** Implements centralized exception handling for consistent API error responses.
- **Structured Logging:** Captures application events, requests, and errors for easier debugging and monitoring.
- **Modular Architecture:** Organizes functionality into reusable NestJS modules.

## Tech Stack

| Technology | Purpose |
|---|---|
| NestJS | Backend framework |
| TypeScript | Programming language |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and queries |
| JWT | Authentication and authorization |
| DTOs | Request validation |
| REST API | API architecture |

## Project Structure

```text
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── ...
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── ...
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   ├── guards/
│   └── ...
├── app.module.ts
└── main.ts

prisma/
└── schema.prisma

prisma.config.ts
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Harsh-Parwal/nestjs-auth-api.git
```

### 2. Navigate to the project directory

```bash
cd nestjs-auth-api
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="your_postgresql_connection_string"

JWT_ACCESS_SECRET="your_access_token_secret"
JWT_REFRESH_SECRET="your_refresh_token_secret"
```

Use the environment variable names configured in your application.

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Run database migrations

```bash
npx prisma migrate dev
```

### 7. Start the development server

```bash
npm run start:dev
```

The application will be available at:

```text
http://localhost:3000
```

## API Modules

| Module | Functionality |
|---|---|
| Authentication | JWT authentication using access and refresh tokens |
| Users | User management and CRUD operations |

## Backend Concepts Implemented

- **Authentication & Authorization:** JWT, access tokens, refresh tokens, and protected routes.
- **Database Management:** PostgreSQL integration using Prisma ORM.
- **Validation:** DTOs and request validation.
- **Rate Limiting:** Request throttling to protect API endpoints.
- **Exception Handling:** Custom exception filters and centralized error responses.
- **Logging:** Structured logging for application monitoring and debugging.
- **Architecture:** Modular design, controllers, services, and dependency injection.

## Author

**Harshvardhan Singh Parwal**

- GitHub: [Harsh-Parwal](https://github.com/Harsh-Parwal)