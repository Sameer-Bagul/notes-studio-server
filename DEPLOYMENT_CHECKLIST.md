# 🚀 Render Deployment Checklist

## Pre-Deployment Setup

### ✅ 1. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account (free)
- [ ] Create a new cluster (M0 free tier)
- [ ] Create database user with read/write permissions
- [ ] Configure network access (allow all IPs: 0.0.0.0/0 for Render)
- [ ] Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/notes-app`

### ✅ 2. Generate JWT Secret
Run this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output - you'll need it for Render.

### ✅ 3. Push Code to GitHub
- [ ] Commit all changes
- [ ] Push to GitHub repository

## Render Deployment Steps

### ✅ 4. Create Render Web Service
1. Go to [render.com](https://render.com) and login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select this repository (`notes-studio-server`)

### ✅ 5. Configure Service Settings
- **Name**: `notes-studio-server` (or preferred name)
- **Environment**: `Node`
- **Region**: Select closest to your users
- **Branch**: `main`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: `Free` (or paid for better performance)

### ✅ 6. Advanced Settings
- **Health Check Path**: `/health`
- **Auto-Deploy**: `Yes` (deploys on git push)

### ✅ 7. Environment Variables
Add these in the Render dashboard under "Environment":

**Required:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notes-app
JWT_SECRET=your-64-character-secret-from-step-2
```

**Optional (with good defaults):**
```
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
PORT=10000
```

**Frontend Connection (update after frontend deployment):**
```
CORS_ORIGIN=https://your-frontend-app.onrender.com
```

### ✅ 8. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Check deployment logs for any errors

## Post-Deployment Verification

### ✅ 9. Test Your API
Your API will be available at: `https://your-service-name.onrender.com`

Test these endpoints:
- [ ] `GET https://your-service-name.onrender.com/health` → Should return 200
- [ ] `POST https://your-service-name.onrender.com/api/auth/register` → Test user registration
- [ ] `POST https://your-service-name.onrender.com/api/auth/login` → Test user login

### ✅ 10. Update Frontend
Update your frontend's API base URL to:
```javascript
const API_BASE_URL = 'https://your-service-name.onrender.com/api'
```

## Troubleshooting

### Common Issues:
1. **Build fails**: Check package.json dependencies
2. **Database connection fails**: Verify MongoDB Atlas connection string and network access
3. **CORS errors**: Update CORS_ORIGIN environment variable
4. **Service doesn't start**: Check logs in Render dashboard

### Free Tier Notes:
- Service sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- 750 hours/month limit (enough for development)

## 🎉 Success!
Your API is now live and ready to be used by your frontend application!

**Next Steps:**
- Deploy your frontend to Render/Vercel/Netlify
- Update CORS_ORIGIN with your frontend URL
- Consider upgrading to paid plan for production use
