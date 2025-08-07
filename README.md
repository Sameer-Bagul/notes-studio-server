# Personal Notes Taking App - Backend Server

A robust Node.js/Express.js backend server for a personal notes management application with authentication, folder organization, and full CRUD operations.

## 🚀 Features

### Core Functionality
- **User Authentication** - JWT-based authentication with secure password hashing
- **Notes Management** - Full CRUD operations for notes with rich text support
- **Folder Organization** - Hierarchical folder structure for organizing notes
- **Search & Filter** - Full-text search across notes with advanced filtering
- **Bulk Operations** - Batch operations for notes (archive, delete, move)
- **User Preferences** - Customizable user settings and preferences

### Security & Performance
- **Security Headers** - Helmet.js for security headers
- **Rate Limiting** - Configurable rate limiting to prevent abuse
- **CORS Protection** - Cross-origin resource sharing configuration
- **Input Validation** - Comprehensive request validation
- **Error Handling** - Centralized error handling with detailed logging
- **Data Compression** - Response compression for better performance

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: Express Validator
- **Development**: Nodemon, ts-node

## 📁 Project Structure

```
server/
├── src/
│   ├── middleware/          # Custom middleware
│   │   ├── auth.ts         # JWT authentication middleware
│   │   ├── errorHandler.ts # Error handling middleware
│   │   └── validation.ts   # Request validation middleware
│   ├── models/             # Database models
│   │   ├── User.ts         # User model with authentication
│   │   ├── Note.ts         # Note model with full-text search
│   │   └── Folder.ts       # Folder model for organization
│   ├── routes/             # API route handlers
│   │   ├── auth.ts         # Authentication routes
│   │   ├── notes.ts        # Notes CRUD routes
│   │   └── folders.ts      # Folder management routes
│   ├── types/              # TypeScript type definitions
│   │   ├── index.ts        # Main type definitions
│   │   └── express.ts      # Express type extensions
│   ├── utils/              # Utility functions
│   │   ├── validation.ts   # Validation schemas
│   │   ├── responseHelper.ts # API response helpers
│   │   └── slugify.ts      # URL slug generation
│   ├── app.ts              # Express app configuration
│   └── server.ts           # Server entry point
├── dist/                   # Compiled JavaScript (generated)
├── uploads/                # File upload directory
├── .env                    # Environment variables
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the server root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/notes-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 4. Start the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

## � Deployment

### Deploy to Render (Recommended)

1. **Quick Setup**: Follow the step-by-step guide in [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md)

2. **Detailed Guide**: See [`RENDER_DEPLOYMENT.md`](./RENDER_DEPLOYMENT.md) for comprehensive instructions

3. **One-Click Deploy**: Use the `render.yaml` configuration file for infrastructure-as-code deployment

**Prerequisites:**
- MongoDB Atlas account (free tier available)
- GitHub repository
- Render account (free tier available)

**Environment Variables Required:**
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secure random string (64 characters)
- `NODE_ENV=production`
- `CORS_ORIGIN` - Your frontend URL

### Other Deployment Options

- **Docker**: Use the included `Dockerfile` for containerized deployment
- **Heroku, Railway, Fly.io**: Compatible with most Node.js hosting platforms
- **VPS**: Can be deployed on any server with Node.js and PM2

## �📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get User Profile
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

#### Update Profile
```http
PUT /api/auth/me
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "John Smith",
  "preferences": {
    "theme": "dark",
    "defaultView": "grid"
  }
}
```

### Notes Endpoints

#### Get All Notes
```http
GET /api/notes?page=1&limit=10&search=keyword&folderId=123
Authorization: Bearer <jwt-token>
```

#### Create Note
```http
POST /api/notes
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "My Note",
  "content": "Note content here",
  "folderId": "folder-id-optional",
  "tags": ["tag1", "tag2"]
}
```

#### Update Note
```http
PUT /api/notes/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Updated Note",
  "content": "Updated content",
  "isPinned": true
}
```

#### Delete Note
```http
DELETE /api/notes/:id
Authorization: Bearer <jwt-token>
```

#### Search Notes
```http
GET /api/notes/search?query=keyword&tags=tag1,tag2
Authorization: Bearer <jwt-token>
```

#### Bulk Operations
```http
POST /api/notes/bulk
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "action": "archive",
  "noteIds": ["id1", "id2", "id3"]
}
```

### Folders Endpoints

#### Get All Folders
```http
GET /api/folders?includeNoteCount=true
Authorization: Bearer <jwt-token>
```

#### Create Folder
```http
POST /api/folders
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Work Notes",
  "color": "#ff6b6b",
  "description": "Work related notes"
}
```

#### Update Folder
```http
PUT /api/folders/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Updated Folder",
  "color": "#4ecdc4"
}
```

#### Delete Folder
```http
DELETE /api/folders/:id?moveNotesToFolder=root
Authorization: Bearer <jwt-token>
```

#### Reorder Folders
```http
PUT /api/folders/reorder
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "folderOrders": [
    {"folderId": "id1", "order": 1},
    {"folderId": "id2", "order": 2}
  ]
}
```

#### Get Folder Statistics
```http
GET /api/folders/:id/stats
Authorization: Bearer <jwt-token>
```

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens expire in 7 days by default (configurable via `JWT_EXPIRES_IN`).

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## 🚦 Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Window**: 15 minutes (configurable)
- **Max Requests**: 100 per IP per window (configurable)

## 🛡 Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin protection
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Request payload validation
- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication tokens
- **Environment Variables**: Sensitive data protection

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests (if configured)

# Database
npm run seed         # Seed database with sample data (if available)
```

## 🌍 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5000 | No |
| `NODE_ENV` | Environment | development | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d | No |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 | No |
| `RATE_LIMIT_WINDOW` | Rate limit window (minutes) | 15 | No |
| `RATE_LIMIT_MAX` | Max requests per window | 100 | No |

## 🐛 Common Issues & Solutions

### MongoDB Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas
- Check your connection string format
- Verify database user permissions

### CORS Errors
- Update `CORS_ORIGIN` in your `.env` file
- Ensure frontend URL matches the CORS origin

### JWT Token Issues
- Check if JWT_SECRET is set in environment
- Verify token format in Authorization header
- Ensure token hasn't expired

### Mongoose Index Warning
```
Warning: Duplicate schema index on {"email":1} found
```
This is a non-critical warning. The application works fine, but you can fix it by removing duplicate index definitions in the User model.

## 📝 Development Notes

### Database Indexes
The application creates the following indexes for optimal performance:
- User: email (unique)
- Note: userId, folderId, tags, full-text search
- Folder: userId, slug (unique per user)

### File Uploads
Static files are served from the `/uploads` directory and accessible via `/uploads/*` routes.

### Logging
The server uses Morgan for HTTP request logging:
- Development: `dev` format
- Production: `combined` format

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Check server logs for detailed error information
4. Create an issue in the repository

---

**Server Status**: ✅ Running on port 5000  
**Database**: ✅ Connected to MongoDB Atlas  
**Health Check**: http://localhost:5000/health
