# 🚀 AWS Amplify Deployment Guide - HEIC to JPG Converter

## **Overview**
This guide will help you deploy your Node.js HEIC to JPG converter on AWS Amplify. The application uses a modern serverless architecture with Lambda functions for image processing.

## **📋 Prerequisites**
- AWS Account
- Node.js 18+ installed locally
- AWS CLI installed and configured
- Git repository (GitHub, GitLab, or Bitbucket)

## **🏗️ Architecture**
- **Frontend**: Static HTML/CSS/JS (hosted on Amplify)
- **Backend**: Express.js server with Lambda functions
- **Storage**: S3 buckets for file storage
- **Image Processing**: heic-convert library for HEIC conversion

## **📁 Project Structure**
```
heic-to-jpg-nodejs/
├── public/                 # Static files (served by Amplify)
│   ├── index.html         # Main application
│   ├── app.js             # Frontend JavaScript
│   └── images/            # Images and icons
├── server.js              # Express server
├── package.json           # Dependencies
├── amplify.yml            # Amplify build configuration
└── README.md              # This file
```

## **🚀 Deployment Steps**

### **Step 1: Prepare Your Repository**

1. **Create a new Git repository** (GitHub, GitLab, or Bitbucket)
2. **Upload all files** to your repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: HEIC to JPG Converter"
   git remote add origin <your-repository-url>
   git push -u origin main
   ```

### **Step 2: Set Up AWS Amplify**

1. **Login to AWS Console**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Sign in with your AWS account

2. **Create New App**
   - Click "New app" → "Host web app"
   - Choose your Git provider (GitHub, GitLab, Bitbucket)
   - Connect your repository
   - Select the repository containing your HEIC converter

3. **Configure Build Settings**
   - **Build settings**: Use the existing `amplify.yml` file
   - **Environment variables**: None required for basic setup
   - Click "Save and deploy"

### **Step 3: Configure Environment Variables (Optional)**

If you need to customize settings, add these environment variables in Amplify:

1. **Go to App settings** → **Environment variables**
2. **Add variables**:
   ```
   NODE_ENV=production
   PORT=8080
   MAX_FILE_SIZE=10485760
   ```

### **Step 4: Set Up S3 Storage (Recommended)**

For better file management, set up S3 buckets:

1. **Create S3 Buckets**:
   - Go to [S3 Console](https://console.aws.amazon.com/s3/)
   - Create bucket: `your-app-uploads`
   - Create bucket: `your-app-converted`

2. **Configure CORS** for upload bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "POST", "PUT"],
       "AllowedOrigins": ["https://your-app.amplifyapp.com"],
       "ExposeHeaders": []
     }
   ]
   ```

3. **Update server.js** to use S3 (optional enhancement)

### **Step 5: Custom Domain (Optional)**

1. **Add custom domain**:
   - Go to App settings → **Domain management**
   - Click "Add domain"
   - Enter your domain name
   - Follow DNS configuration instructions

2. **SSL Certificate**:
   - Amplify automatically provisions SSL certificates
   - No additional configuration needed

## **🔧 Configuration Files**

### **amplify.yml** (Build Configuration)
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: public
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### **package.json** (Dependencies)
```json
{
  "name": "heic-to-jpg-converter",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "build": "echo 'Build completed'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "heic-convert": "^2.1.0",
    "sharp": "^0.32.6",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "uuid": "^9.0.1",
    "fs-extra": "^11.1.1"
  }
}
```

## **🌐 Application URLs**

After deployment, your app will be available at:
- **Amplify URL**: `https://main.xxxxxxxx.amplifyapp.com`
- **Custom Domain**: `https://yourdomain.com` (if configured)

## **🔍 Testing Your Deployment**

1. **Upload HEIC files** to test conversion
2. **Check file processing** and download functionality
3. **Verify SEO features** are working
4. **Test mobile responsiveness**

## **📊 Monitoring and Analytics**

### **Amplify Analytics**
1. **Enable Analytics** in Amplify Console
2. **Track user engagement** and conversion rates
3. **Monitor performance** metrics

### **CloudWatch Logs**
1. **View application logs** in CloudWatch
2. **Monitor errors** and performance issues
3. **Set up alerts** for critical issues

## **🔒 Security Considerations**

### **File Upload Security**
- ✅ File type validation (HEIC/HEIF only)
- ✅ File size limits (10MB max)
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Automatic file cleanup

### **CORS Configuration**
- ✅ Configured for your domain only
- ✅ Secure headers with Helmet.js
- ✅ HTTPS enforcement

## **💰 Cost Optimization**

### **Amplify Pricing**
- **Free tier**: 1,000 build minutes/month
- **Build minutes**: $0.01 per minute
- **Bandwidth**: $0.15 per GB

### **Cost Reduction Tips**
1. **Optimize build times** by caching node_modules
2. **Use CDN** for static assets
3. **Implement file compression**
4. **Monitor usage** in AWS Cost Explorer

## **🚀 Performance Optimization**

### **Build Optimization**
- **Caching**: Enable node_modules caching
- **Parallel builds**: Use multiple build environments
- **Build timeouts**: Set appropriate timeouts

### **Runtime Optimization**
- **Image compression**: Optimize converted images
- **CDN**: Use CloudFront for global distribution
- **Caching**: Implement browser caching

## **🔧 Troubleshooting**

### **Common Issues**

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Review build logs in Amplify Console

2. **File Upload Issues**
   - Verify CORS configuration
   - Check file size limits
   - Ensure proper file type validation

3. **Conversion Failures**
   - Check heic-convert library installation
   - Verify file permissions
   - Review server logs

### **Debug Commands**
```bash
# Check Node.js version
node --version

# Install dependencies
npm install

# Test locally
npm start

# Check build logs
amplify console
```

## **📈 Scaling Considerations**

### **Traffic Scaling**
- **Automatic scaling** with Amplify
- **Global CDN** distribution
- **Load balancing** for high traffic

### **Storage Scaling**
- **S3 integration** for large files
- **Database integration** for file tracking
- **Redis caching** for session management

## **🔄 Continuous Deployment**

### **Automatic Deployments**
- **Git integration** for automatic builds
- **Branch deployments** for testing
- **Preview deployments** for pull requests

### **Environment Management**
- **Production environment** for live app
- **Staging environment** for testing
- **Development environment** for development

## **📞 Support Resources**

- **AWS Amplify Documentation**: https://docs.aws.amazon.com/amplify/
- **AWS Support**: Available with AWS Support plans
- **Community Forums**: AWS Amplify community
- **GitHub Issues**: Report bugs and feature requests

## **🎉 Success Checklist**

- ✅ Repository connected to Amplify
- ✅ Build completed successfully
- ✅ Application accessible via URL
- ✅ File upload working
- ✅ HEIC conversion functional
- ✅ Download functionality working
- ✅ Mobile responsiveness verified
- ✅ SEO features implemented
- ✅ Custom domain configured (optional)
- ✅ SSL certificate active
- ✅ Monitoring set up

---

**🎯 Your HEIC to JPG converter is now live on AWS Amplify!**

The application is fully functional with:
- **Modern serverless architecture**
- **Automatic scaling**
- **Global CDN distribution**
- **SSL security**
- **SEO optimization**
- **Mobile responsiveness**

Visit your Amplify URL to start converting HEIC files to JPG! 