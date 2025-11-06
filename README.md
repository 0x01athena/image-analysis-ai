# AI出品タイトル生成 (AI Product Title Generator)

A full-stack application for automated product title generation using AI image analysis. This application processes product images in batch and generates optimized titles for e-commerce platforms.

## 🚀 Features

### Core Functionality
- **Batch Image Processing**: Upload and process up to 5000 product images at once
- **AI-Powered Title Generation**: Automatically generates multiple title candidates using OpenAI Vision API
- **Product Management**: Complete CRUD operations for products with detailed information
- **Worker Management**: User/worker registration and management system
- **Progress Tracking**: Real-time upload and processing progress monitoring
- **Price Management**: Add and manage product prices
- **Search & Filter**: Advanced search and filtering capabilities across all products

### Key Features
- ✅ Upload progress bar with real-time updates
- ✅ AI analysis progress tracking
- ✅ Product details editing (title, category, condition, measurements, price, etc.)
- ✅ Multiple marketplace support (Mercari, Yahoo Auctions, Rakuten)
- ✅ Work process session management
- ✅ Navigation disabled during uploads
- ✅ Responsive design with modern UI

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQLite (via Prisma)
- **ORM**: Prisma
- **AI Integration**: OpenAI Vision API
- **File Upload**: Multer
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React Context API

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API Key

## 📦 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd image-anaysis-ai
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
# Create a .env file in the backend directory with:
PORT=5000
OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL="file:./prisma/dev.db"

# Generate Prisma client
npx prisma generate

# Push database schema (for development)
npx prisma db push

# Or run migrations (for production)
npx prisma migrate dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
# Create a .env file in the frontend directory with:
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

### Production Mode

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Project Structure

```
image-anaysis-ai/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic (OpenAI, Product, User, WorkProcess)
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utility functions
│   │   └── index.ts         # Main server file
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Database migrations
│   ├── public/
│   │   └── images/          # Uploaded product images
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # API client functions
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   │   ├── batch-processing/  # Batch upload page
│   │   │   ├── products/          # Product listing and details
│   │   │   ├── workers/           # Worker management
│   │   │   └── landing/           # Landing page
│   │   ├── hooks/           # Custom React hooks
│   │   ├── contexts/        # React Context providers
│   │   └── main.jsx         # Application entry point
│   └── package.json
│
└── README.md
```

## 🗄️ Database Schema

### Main Models

- **Product**: Stores product information including images, titles, categories, prices, etc.
- **User**: Worker/user accounts
- **WorkProcess**: Tracks batch processing jobs and their status

## 🔌 API Endpoints

### Batch Processing
- `POST /api/batch/upload-directory` - Upload images and create work process
- `POST /api/batch/start-processing` - Start AI analysis for uploaded images
- `GET /api/batch/work-process/:workProcessId` - Get work process status
- `PUT /api/batch/work-process/:workProcessId/finish` - Mark work process as finished
- `GET /api/batch/users/:userId/work-processes` - Get active work processes for user

### Products
- `GET /api/batch/products` - Get all products with pagination and filtering
- `GET /api/batch/products/:managementNumber` - Get single product
- `PUT /api/batch/products/:managementNumber` - Update product
- `DELETE /api/batch/products/:managementNumber` - Delete product
- `DELETE /api/batch/products` - Delete multiple products

### Users
- `GET /api/batch/users` - Get all users

## 🎯 Usage Guide

### 1. Worker Registration
- Navigate to "ワーカー管理" (Worker Management)
- Register a new worker/user

### 2. Batch Processing
- Navigate to "一括処理" (Batch Processing)
- Select a worker/user
- Optionally enter a price (applies to all products in the batch)
- Select a folder containing product images
- Click "バッチ処理を開始" (Start Batch Processing)
- Monitor upload and AI analysis progress

### 3. Product Management
- Navigate to "商品一覧" (Product List)
- Search and filter products
- Click on a product to view/edit details
- Update product information including title, category, price, etc.

### 4. Clearing Work Process
- If you need to clear an active work process session:
  - Click "現在の作業プロセスをクリア" button
  - This marks the work process as finished in the database and clears the session

## 🔒 Environment Variables

### Backend (.env)
```env
PORT=5000
OPENAI_API_KEY=your-openai-api-key
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📝 Important Notes

### File Upload Limits
- Maximum file size per image: 1MB
- Files exceeding 1MB are automatically skipped
- Supported formats: JPEG, PNG, GIF, WebP, etc.

### Work Process Management
- Work processes are tracked in the database
- Active sessions are automatically loaded from the database on page load
- Sessions can be cleared manually via the UI

### Price Management
- Price can be set during batch upload (applies to all products)
- Individual product prices can be edited on the product details page
- Price is optional and can be left empty

## 🐛 Troubleshooting

### Common Issues

1. **Upload fails with "User ID is required"**
   - Ensure a worker/user is selected before uploading
   - Check that users are loaded (wait for loading to complete)

2. **Images not displaying**
   - Check that images are uploaded to `backend/public/images/`
   - Verify image paths in the database

3. **Database connection errors**
   - Ensure SQLite database file exists at `backend/prisma/dev.db`
   - Run `npx prisma db push` to create/update schema

4. **OpenAI API errors**
   - Verify `OPENAI_API_KEY` is set correctly in backend `.env`
   - Check API key has sufficient credits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC License

## 👥 Authors

- Development Team

## 🙏 Acknowledgments

- OpenAI for Vision API
- Prisma for excellent ORM
- React and Vite communities

