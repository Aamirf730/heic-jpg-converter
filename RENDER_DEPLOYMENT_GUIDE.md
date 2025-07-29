# Deploy HEIC to JPG Converter on Render

This guide will help you deploy the Node.js HEIC to JPG converter on Render.

## Prerequisites

- A GitHub account
- A Render account (free tier available)
- The repository: `https://github.com/Aamirf730/heic-jpg-converter`

## Step-by-Step Deployment

### 1. Sign up for Render

1. Go to [render.com](https://render.com)
2. Click "Get Started" or "Sign Up"
3. Choose "Continue with GitHub" for easy repository connection
4. Complete the signup process

### 2. Create a New Web Service

1. In your Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub account if not already connected
4. Find and select the repository: `Aamirf730/heic-jpg-converter`

### 3. Configure the Web Service

Use these settings:

- **Name**: `heic-to-jpg-converter` (or any name you prefer)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (for testing) or Paid (for production)

### 4. Environment Variables (Optional)

You can add these environment variables if needed:

- `NODE_ENV`: `production`
- `PORT`: `10000` (Render will set this automatically)

### 5. Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Start the application (`npm start`)
   - Provide you with a URL

### 6. Access Your Application

Once deployment is complete, you'll get a URL like:
`https://your-app-name.onrender.com`

## Configuration Files

The repository includes:

- `render.yaml`: Render deployment configuration
- `package.json`: Node.js dependencies and scripts
- `server.js`: Express.js server
- `public/`: Static files (HTML, CSS, JS)

## Features

Your deployed application will have:

- ✅ HEIC/HEIF file upload
- ✅ Server-side conversion to JPG/PNG/WebP
- ✅ Individual file downloads
- ✅ Batch download (ZIP)
- ✅ Modern, responsive UI
- ✅ Security features (CSP, rate limiting)
- ✅ Error handling

## Troubleshooting

### Common Issues

1. **Build Fails**: Check that all dependencies are in `package.json`
2. **App Won't Start**: Verify the start command is `npm start`
3. **File Upload Issues**: Check file size limits (10MB per file)
4. **Conversion Errors**: Ensure HEIC files are valid

### Logs

- View logs in the Render dashboard under your service
- Check "Logs" tab for build and runtime errors

## Free Tier Limitations

- 750 hours per month
- Sleeps after 15 minutes of inactivity
- 512MB RAM
- Shared CPU

## Production Considerations

For production use:

1. **Upgrade to Paid Plan**: Better performance, no sleep
2. **Custom Domain**: Add your own domain
3. **SSL Certificate**: Automatically provided by Render
4. **Environment Variables**: Store sensitive data securely

## Support

If you encounter issues:

1. Check the Render logs
2. Verify your repository is up to date
3. Test locally first: `npm install && npm start`
4. Contact Render support if needed

## Repository Structure

```
heic-jpg-converter/
├── server.js              # Express.js server
├── package.json           # Dependencies
├── render.yaml           # Render configuration
├── public/               # Static files
│   ├── index.html        # Main page
│   ├── app.js           # Frontend JavaScript
│   └── styles.css       # Custom styles
├── uploads/              # Temporary uploads
└── converted/            # Converted files
```

Your Node.js HEIC to JPG converter is now ready for deployment on Render! 