# Image Analysis AI Backend

A Node.js + TypeScript backend API for the Image Analysis AI application with PostgreSQL database integration and Swagger documentation.

## Features

- **Authentication**: JWT-based user authentication
- **Image Analysis**: Single and batch image processing
- **Database**: PostgreSQL with Prisma ORM
- **Documentation**: Swagger/OpenAPI integration
- **File Upload**: Multer-based image upload handling
- **Security**: Helmet, CORS, and input validation
- **TypeScript**: Full TypeScript support with strict type checking

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **File Upload**: Multer
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, bcryptjs

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/image_analysis_db?schema=public"
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=uploads
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Set up PostgreSQL database**
   - Create a PostgreSQL database named `image_analysis_db`
   - Update the `DATABASE_URL` in your `.env` file

5. **Generate Prisma client**
   ```bash
   npm run prisma:generate
   ```

6. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## API Documentation

Once the server is running, you can access the Swagger API documentation at:
- **Swagger UI**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires authentication)

### Image Analysis
- `POST /api/analysis/upload` - Upload and analyze a single image
- `GET /api/analysis` - Get all analyses for authenticated user
- `GET /api/analysis/:id` - Get analysis by ID
- `DELETE /api/analysis/:id` - Delete analysis by ID

### Batch Analysis
- `POST /api/batch/upload` - Upload and analyze multiple images
- `GET /api/batch` - Get all batch analyses for authenticated user
- `GET /api/batch/:id` - Get batch analysis by ID
- `DELETE /api/batch/:id` - Delete batch analysis by ID

## Database Schema

The application uses the following main models:

- **User**: User accounts and authentication
- **Analysis**: Individual image analysis records
- **BatchAnalysis**: Batch processing records

## File Upload

- Images are uploaded to the `uploads/` directory
- Supported formats: All image types (JPEG, PNG, GIF, etc.)
- Maximum file size: 10MB (configurable via `MAX_FILE_SIZE`)

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Helmet security headers
- Input validation
- File type validation

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── index.ts         # Main server file
├── prisma/
│   └── schema.prisma    # Database schema
├── uploads/             # File upload directory
├── dist/                # Compiled JavaScript (production)
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License