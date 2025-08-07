# 🏗️ API Architecture Guide - Personal Notes Backend

## 📊 **Backend Status: ✅ PRODUCTION READY**

This comprehensive guide covers the complete API architecture, endpoints, payloads, authentication, and data structures for the Personal Notes Taking Application backend.

---

## 🌐 **Base Configuration**

### **Server Details**
- **Base URL**: `http://localhost:5000`
- **API Prefix**: `/api`
- **Protocol**: HTTP/HTTPS
- **Content-Type**: `application/json`

### **Authentication**
- **Type**: JWT (JSON Web Tokens)
- **Header**: `Authorization: Bearer <token>`
- **Token Expiry**: 7 days (configurable)
- **Refresh**: Manual re-login required

---

## 🔐 **Authentication & Authorization**

### **Request Headers**
```http
Content-Type: application/json
Authorization: Bearer <jwt-token>  // For protected routes
```

### **Response Format**
All APIs follow consistent response structure:

#### **Success Response**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

#### **Error Response**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

---

# 🔑 **AUTHENTICATION ENDPOINTS**

## 1. **User Registration**

### **Endpoint**
```http
POST /api/auth/register
```

### **Payload**
```json
{
  "name": "string",        // Required, 2-50 characters
  "email": "string",       // Required, valid email format
  "password": "string"     // Required, minimum 6 characters
}
```

### **Validation Rules**
- **name**: 2-50 characters, required
- **email**: Valid email format, unique, required
- **password**: Minimum 6 characters, required

### **Success Response**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "preferences": {
        "theme": "light",
        "defaultView": "grid",
        "autoSave": true
      },
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 2. **User Login**

### **Endpoint**
```http
POST /api/auth/login
```

### **Payload**
```json
{
  "email": "string",       // Required, registered email
  "password": "string"     // Required, user password
}
```

### **Success Response**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "preferences": {
        "theme": "light",
        "defaultView": "grid",
        "autoSave": true
      },
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 3. **Get User Profile**

### **Endpoint**
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### **No Payload Required**

### **Success Response**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "preferences": {
        "theme": "dark",
        "defaultView": "list",
        "autoSave": false
      },
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 4. **Update User Profile**

### **Endpoint**
```http
PUT /api/auth/me
Authorization: Bearer <token>
```

### **Payload**
```json
{
  "name": "string",        // Optional, 2-50 characters
  "preferences": {         // Optional
    "theme": "light|dark",           // Optional
    "defaultView": "grid|list",      // Optional
    "autoSave": true|false          // Optional
  }
}
```

### **Success Response**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Smith",
      "email": "john@example.com",
      "preferences": {
        "theme": "dark",
        "defaultView": "grid",
        "autoSave": true
      },
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 5. **Change Password**

### **Endpoint**
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
```

### **Payload**
```json
{
  "currentPassword": "string",     // Required, current password
  "newPassword": "string"          // Required, minimum 6 characters
}
```

### **Success Response**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {}
}
```

---

## 6. **Delete Account**

### **Endpoint**
```http
DELETE /api/auth/me
Authorization: Bearer <token>
```

### **No Payload Required**

### **Success Response**
```json
{
  "success": true,
  "message": "Account deleted successfully",
  "data": {}
}
```

---

# 📝 **NOTES ENDPOINTS**

## 1. **Get All Notes**

### **Endpoint**
```http
GET /api/notes?page=1&limit=10&search=keyword&folderId=123&tags=tag1,tag2&sortBy=updatedAt&sortOrder=desc&isPinned=true&isArchived=false
Authorization: Bearer <token>
```

### **Query Parameters**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `limit` | number | Items per page (max 100) | 10 |
| `search` | string | Search in title/content | - |
| `folderId` | string | Filter by folder ID | - |
| `tags` | string | Comma-separated tags | - |
| `sortBy` | string | Sort field | updatedAt |
| `sortOrder` | string | asc/desc | desc |
| `isPinned` | boolean | Filter pinned notes | - |
| `isArchived` | boolean | Filter archived notes | - |

### **Success Response**
```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "Meeting Notes",
        "content": "Discussion points...",
        "content_html": "<p>Discussion points...</p>",
        "slug": "meeting-notes",
        "tags": ["work", "meeting"],
        "folderId": "507f1f77bcf86cd799439012",
        "isPinned": false,
        "isArchived": false,
        "order": 1,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 45,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 2. **Search Notes**

### **Endpoint**
```http
GET /api/notes/search?query=keyword&tags=tag1,tag2&folderId=123
Authorization: Bearer <token>
```

### **Query Parameters**
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `query` | string | Search text | Yes |
| `tags` | string | Filter by tags | No |
| `folderId` | string | Filter by folder | No |

### **Success Response**
Same as Get All Notes response with filtered results.

---

## 3. **Get Single Note**

### **Endpoint**
```http
GET /api/notes/:id
Authorization: Bearer <token>
```

### **Success Response**
```json
{
  "success": true,
  "data": {
    "note": {
      "id": "507f1f77bcf86cd799439011",
      "title": "My Important Note",
      "content": "This is the note content...",
      "content_html": "<p>This is the note content...</p>",
      "slug": "my-important-note",
      "tags": ["important", "personal"],
      "folderId": "507f1f77bcf86cd799439012",
      "isPinned": true,
      "isArchived": false,
      "order": 1,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T12:00:00.000Z"
    }
  }
}
```

---

## 4. **Create Note**

### **Endpoint**
```http
POST /api/notes
Authorization: Bearer <token>
```

### **Payload**
```json
{
  "title": "string",               // Required, 1-200 characters
  "content": "string",             // Required
  "content_html": "string",        // Optional, HTML version
  "folderId": "string",            // Optional, folder ID
  "tags": ["string"],              // Optional, array of strings
  "isPinned": false,               // Optional, default false
  "isArchived": false,             // Optional, default false
  "order": 1                       // Optional, auto-generated
}
```

### **Validation Rules**
- **title**: 1-200 characters, required
- **content**: Required, any length
- **folderId**: Must exist and belong to user
- **tags**: Array of strings, each 1-50 characters

### **Success Response**
```json
{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "note": {
      "id": "507f1f77bcf86cd799439011",
      "title": "New Note",
      "content": "Note content here",
      "slug": "new-note",
      "tags": ["personal"],
      "folderId": null,
      "isPinned": false,
      "isArchived": false,
      "order": 1,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 5. **Update Note**

### **Endpoint**
```http
PUT /api/notes/:id
Authorization: Bearer <token>
```

### **Payload**
```json
{
  "title": "string",               // Optional
  "content": "string",             // Optional
  "content_html": "string",        // Optional
  "folderId": "string",            // Optional
  "tags": ["string"],              // Optional
  "isPinned": true,                // Optional
  "isArchived": false,             // Optional
  "order": 2                       // Optional
}
```

### **Success Response**
Same as Create Note response with updated data.

---

## 6. **Delete Note**

### **Endpoint**
```http
DELETE /api/notes/:id
Authorization: Bearer <token>
```

### **Success Response**
```json
{
  "success": true,
  "message": "Note deleted successfully",
  "data": {
    "deletedNoteId": "507f1f77bcf86cd799439011"
  }
}
```

---

## 7. **Bulk Operations**

### **Endpoint**
```http
POST /api/notes/bulk
Authorization: Bearer <token>
```

### **Payload**
```json
{
  "action": "archive|unarchive|pin|unpin|delete|move",  // Required
  "noteIds": ["string"],                                // Required, array of note IDs
  "folderId": "string"                                  // Required for 'move' action
}
```

### **Available Actions**
- `archive`: Archive selected notes
- `unarchive`: Unarchive selected notes  
- `pin`: Pin selected notes
- `unpin`: Unpin selected notes
- `delete`: Delete selected notes
- `move`: Move notes to specified folder

### **Success Response**
```json
{
  "success": true,
  "message": "Bulk archive completed successfully",
  "data": {
    "modifiedCount": 5
  }
}
```

---

# 📁 **FOLDERS ENDPOINTS**

## 1. **Get All Folders**

### **Endpoint**
```http
GET /api/folders?includeNoteCount=true
Authorization: Bearer <token>
```

### **Query Parameters**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `includeNoteCount` | string | Include note counts | false |

### **Success Response**
```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "_id": "root",
        "name": "All Notes",
        "slug": "root",
        "color": "#6366f1",
        "order": -1,
        "userId": "507f1f77bcf86cd799439010",
        "noteCount": 15,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Work",
        "slug": "work",
        "description": "Work related notes",
        "color": "#ef4444",
        "order": 1,
        "userId": "507f1f77bcf86cd799439010",
        "noteCount": 8,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## 2. **Get Single Folder**

### **Endpoint**
```http
GET /api/folders/:id?includeNotes=true
Authorization: Bearer <token>
```

### **Query Parameters**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `includeNotes` | string | Include folder notes | false |

### **Success Response**
```json
{
  "success": true,
  "data": {
    "folder": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Work",
      "slug": "work",
      "description": "Work related notes",
      "color": "#ef4444",
      "order": 1,
      "userId": "507f1f77bcf86cd799439010",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "notes": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "Meeting Notes",
        "content": "Discussion points...",
        "isPinned": false,
        "updatedAt": "2025-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

---

## 3. **Create Folder**

### **Endpoint**
```http
POST /api/folders
Authorization: Bearer <token>
```

### **Payload**
```json
{
  "name": "string",           // Required, 1-100 characters
  "description": "string",    // Optional, max 500 characters
  "color": "#hexcode",        // Optional, default #6366f1
  "order": 1                  // Optional, auto-generated
}
```

### **Validation Rules**
- **name**: 1-100 characters, required
- **description**: Max 500 characters, optional
- **color**: Valid hex color code, optional
- **order**: Positive integer, optional

### **Success Response**
```json
{
  "success": true,
  "message": "Folder created successfully",
  "data": {
    "folder": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Personal",
      "slug": "personal",
      "description": "Personal notes and thoughts",
      "color": "#10b981",
      "order": 2,
      "userId": "507f1f77bcf86cd799439010",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 4. **Update Folder**

### **Endpoint**
```http
PUT /api/folders/:id
Authorization: Bearer <token>
```

### **Payload**
```json
{
  "name": "string",           // Optional
  "description": "string",    // Optional
  "color": "#hexcode",        // Optional
  "order": 1                  // Optional
}
```

### **Success Response**
Same as Create Folder response with updated data.

---

## 5. **Delete Folder**

### **Endpoint**
```http
DELETE /api/folders/:id?moveNotesToFolder=root
Authorization: Bearer <token>
```

### **Query Parameters**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `moveNotesToFolder` | string | Target folder ID or "root" | root |

### **Success Response**
```json
{
  "success": true,
  "message": "Folder deleted successfully",
  "data": {
    "deletedFolder": "507f1f77bcf86cd799439012",
    "movedNotesCount": 5
  }
}
```

---

## 6. **Reorder Folders**

### **Endpoint**
```http
PUT /api/folders/reorder
Authorization: Bearer <token>
```

### **Payload**
```json
{
  "folderOrders": [
    {
      "folderId": "507f1f77bcf86cd799439012",
      "order": 1
    },
    {
      "folderId": "507f1f77bcf86cd799439013", 
      "order": 2
    }
  ]
}
```

### **Success Response**
```json
{
  "success": true,
  "message": "Folders reordered successfully",
  "data": {
    "folders": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Work",
        "order": 1
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Personal", 
        "order": 2
      }
    ],
    "updatedCount": 2
  }
}
```

---

## 7. **Get Folder Statistics**

### **Endpoint**
```http
GET /api/folders/:id/stats
Authorization: Bearer <token>
```

### **Success Response**
```json
{
  "success": true,
  "data": {
    "stats": {
      "folder": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Work",
        "color": "#ef4444"
      },
      "notes": {
        "total": 15,
        "pinned": 3,
        "archived": 2,
        "recent": 5,
        "active": 13
      },
      "tags": [
        {
          "name": "meeting",
          "count": 8
        },
        {
          "name": "project",
          "count": 5
        }
      ]
    }
  }
}
```

---

# 🛡️ **Error Handling**

## **HTTP Status Codes**
- **200**: OK - Successful GET, PUT
- **201**: Created - Successful POST
- **204**: No Content - Successful DELETE
- **400**: Bad Request - Validation errors
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Access denied
- **404**: Not Found - Resource not found
- **409**: Conflict - Duplicate resource
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server error

## **Common Error Responses**

### **Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "field": "email",
    "message": "Please provide a valid email address"
  }
}
```

### **Authentication Error (401)**
```json
{
  "success": false,
  "message": "Access denied. No token provided.",
  "error": "Authentication required"
}
```

### **Not Found Error (404)**
```json
{
  "success": false,
  "message": "Note not found",
  "error": "The requested note does not exist or you don't have access to it"
}
```

### **Rate Limit Error (429)**
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later.",
  "error": "Rate limit exceeded"
}
```

---

# 🔧 **Development & Testing**

## **Health Check Endpoint**
```http
GET /health
```

### **Response**
```json
{
  "success": true,
  "message": "Server is running!",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## **Testing with cURL**

### **Register User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "password": "password123"
  }'
```

### **Create Note**
```bash
curl -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "My First Note",
    "content": "This is my first note content",
    "tags": ["test", "first"]
  }'
```

## **Postman Collection Variables**
```json
{
  "baseUrl": "http://localhost:5000",
  "authToken": "{{token}}",
  "userId": "{{userId}}"
}
```

---

# 📋 **Data Models & Schemas**

## **User Model**
```typescript
interface IUser {
  _id: ObjectId
  email: string
  password: string  // Hashed with bcryptjs
  name: string
  avatar?: string
  preferences: {
    theme: 'light' | 'dark'
    defaultView: 'grid' | 'list'
    autoSave: boolean
  }
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

## **Note Model**
```typescript
interface INote {
  _id: ObjectId
  userId: ObjectId
  folderId?: ObjectId
  title: string
  content: string
  content_html?: string
  slug: string
  tags: string[]
  order: number
  isPinned: boolean
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}
```

## **Folder Model**
```typescript
interface IFolder {
  _id: ObjectId
  userId: ObjectId
  name: string
  slug: string
  description?: string
  color: string
  order: number
  createdAt: Date
  updatedAt: Date
}
```

---

# ⚡ **Performance & Optimization**

## **Database Indexes**
- Users: `email` (unique)
- Notes: `userId`, `folderId`, `tags`, `title + content` (text search)
- Folders: `userId + slug` (compound, unique)

## **Rate Limiting**
- **Window**: 15 minutes
- **Requests**: 100 per IP
- **Configurable** via environment variables

## **Response Optimization**
- **Compression**: Gzip enabled
- **Pagination**: Default 10, max 100 items
- **Field Selection**: Lean queries exclude unnecessary fields
- **Caching Headers**: Set for static assets

---

# 🔒 **Security Features**

## **Authentication Security**
- JWT tokens with secure secrets
- Password hashing with bcryptjs (12 rounds)
- Token expiration (7 days default)
- Secure HTTP headers (Helmet.js)

## **Input Validation**
- Joi schema validation for all inputs
- SQL injection prevention (Mongoose ODM)
- XSS protection via sanitization
- Request size limits (10MB)

## **API Security**
- CORS configuration
- Rate limiting per IP
- Error message sanitization
- No sensitive data in responses

---

# 🚀 **Deployment Checklist**

## **Environment Variables**
- [ ] `MONGODB_URI` - Production database
- [ ] `JWT_SECRET` - Strong secret key  
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN` - Frontend domain
- [ ] Rate limiting configuration

## **Production Optimizations**
- [ ] Enable response compression
- [ ] Configure proper logging
- [ ] Set up health monitoring
- [ ] Configure reverse proxy (nginx)
- [ ] Enable HTTPS certificates

---

## 📞 **API Support**

For API support and questions:
- Check error response messages
- Review validation requirements
- Verify authentication tokens
- Check rate limiting status
- Review this documentation

**Server Status**: ✅ Production Ready  
**Documentation**: ✅ Complete  
**Authentication**: ✅ JWT Secure  
**Database**: ✅ MongoDB Atlas Connected

---

*Last Updated: August 5, 2025 | Version: 1.0.0*
