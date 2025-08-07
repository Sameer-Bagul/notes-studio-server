# Notes Studio Server - Render Deployment

## 🚀 Deploying to Render

This guide helps you deploy the Notes Studio Server to Render.com.

### Prerequisites
- GitHub repository with your code
- MongoDB Atlas account (free tier available)
- Render account (free tier available)

### Step-by-Step Deployment

#### 1. Database Setup (MongoDB Atlas)
1. Create a free MongoDB Atlas account at https://www.mongodb.com/atlas
2. Create a new cluster (free tier M0)
3. Create a database user with read/write permissions
4. Get your connection string (it will look like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/notes-app?retryWrites=true&w=majority
   ```

#### 2. Deploy to Render
1. Go to https://render.com and sign up/login
2. Connect your GitHub account
3. Click "New +" → "Web Service"
4. Select this repository
5. Configure the service:

**Basic Settings:**
- **Name**: `notes-studio-server` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Advanced Settings:**
- **Health Check Path**: `/health`
- **Plan**: Free (or paid for better performance)

#### 3. Environment Variables
In the Render dashboard, add these environment variables:

**Required Variables:**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notes-app
JWT_SECRET=your-super-secure-random-string-here
```

**Optional Variables (with defaults):**
```bash
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
CORS_ORIGIN=https://your-frontend-domain.com
```

#### 4. Generate Secure JWT Secret
Use this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 5. Update CORS Origin
After deploying your frontend, update the `CORS_ORIGIN` environment variable with your frontend URL.

### 🔧 Post-Deployment

#### Health Check
Your service will be available at: `https://your-service-name.onrender.com`

Test the health endpoint: `https://your-service-name.onrender.com/health`

#### API Endpoints
All API endpoints will be available at: `https://your-service-name.onrender.com/api/`

Example endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/notes` - Get user notes
- `GET /api/folders` - Get user folders

### 🛠 Troubleshooting

#### Common Issues:

1. **Build Fails**: Check that all dependencies are in `package.json`
2. **Database Connection**: Verify MongoDB Atlas connection string and network access
3. **CORS Errors**: Update `CORS_ORIGIN` environment variable
4. **JWT Errors**: Ensure `JWT_SECRET` is set and secure

#### Logs:
- Check logs in Render dashboard under "Logs" tab
- Look for database connection confirmation
- Verify server starts on the correct port

#### Free Tier Limitations:
- Service sleeps after 15 minutes of inactivity
- 750 hours/month limit
- Cold start delays (~30 seconds)

### 🔒 Security Recommendations

1. **Strong JWT Secret**: Use a 64-character random string
2. **Database Security**: Enable IP whitelisting in MongoDB Atlas
3. **Environment Variables**: Never commit secrets to git
4. **HTTPS**: Render provides SSL certificates automatically

### 📱 Connecting Frontend

Your frontend should use this base URL:
```javascript
const API_BASE_URL = 'https://your-service-name.onrender.com/api'
```

### 🔄 Continuous Deployment

Render automatically redeploys when you push to your main branch. No additional setup required!
