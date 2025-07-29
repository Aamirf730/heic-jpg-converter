# AWS Amplify Deployment Guide

This guide will walk you through deploying your HEIC to JPG Converter to AWS Amplify using GitHub.

## Prerequisites

- GitHub account
- AWS account
- Your project code (already prepared)

## Step 1: Create GitHub Repository

1. **Go to GitHub.com** and sign in
2. **Create a new repository**:
   - Click the "+" icon → "New repository"
   - Name: `heic-to-jpg-converter`
   - Description: `HEIC to JPG Converter - Privacy-focused online converter`
   - Make it **Public** (for free Amplify hosting)
   - Don't initialize with README (we already have one)

3. **Push your code to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/heic-to-jpg-converter.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to AWS Amplify

### Option A: Using AWS Amplify Console (Recommended)

1. **Go to AWS Amplify Console**:
   - Visit: https://console.aws.amazon.com/amplify/
   - Sign in to your AWS account

2. **Create New App**:
   - Click "New app" → "Host web app"
   - Choose "GitHub" as your repository source
   - Click "Continue"

3. **Connect to GitHub**:
   - Click "Connect to GitHub"
   - Authorize AWS Amplify to access your GitHub account
   - Select your repository: `heic-to-jpg-converter`
   - Click "Next"

4. **Configure Build Settings**:
   - **Branch**: `main`
   - **Build settings**: Amplify will auto-detect Node.js
   - **Build commands**: Leave as default (Amplify will use our `amplify.yml`)
   - Click "Next"

5. **Review and Deploy**:
   - Review your settings
   - Click "Save and deploy"

### Option B: Using Amplify CLI (Alternative)

If you prefer using CLI:

1. **Install Amplify CLI**:
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Configure Amplify**:
   ```bash
   amplify configure
   ```

3. **Initialize Amplify**:
   ```bash
   amplify init
   ```

4. **Add Hosting**:
   ```bash
   amplify add hosting
   ```

5. **Deploy**:
   ```bash
   amplify publish
   ```

## Step 3: Configure Environment Variables

1. **Go to your Amplify app** in the console
2. **Navigate to Environment variables**:
   - App settings → Environment variables
3. **Add these variables**:
   ```
   NODE_ENV = production
   PORT = 8080
   ```

## Step 4: Custom Domain (Optional)

1. **In Amplify Console**:
   - Go to "Domain management"
   - Click "Add domain"
   - Enter your domain name
   - Follow the DNS configuration instructions

## Step 5: Monitor and Test

1. **Check Build Status**:
   - Monitor the build process in Amplify Console
   - Check for any build errors

2. **Test Your Application**:
   - Visit your Amplify URL: `https://main.xxxxxxxx.amplifyapp.com`
   - Test file upload and conversion
   - Verify all features work correctly

## Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check build logs in Amplify Console
   - Ensure all dependencies are in `package.json`
   - Verify `amplify.yml` configuration

2. **File Upload Issues**:
   - Check file size limits
   - Verify file type restrictions
   - Check server logs

3. **Conversion Fails**:
   - Ensure `heic-convert` dependency is installed
   - Check server environment

### Build Configuration

The `amplify.yml` file is already configured for optimal deployment:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm start
  artifacts:
    baseDirectory: /
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## Cost Optimization

### AWS Amplify Pricing (Free Tier)

- **Build minutes**: 1,000 minutes/month free
- **Bandwidth**: 15 GB/month free
- **Storage**: 5 GB free

### Cost Reduction Tips

1. **Optimize build times**:
   - Use `.gitignore` to exclude unnecessary files
   - Cache `node_modules` in build

2. **Reduce bandwidth**:
   - Compress images and assets
   - Use CDN for static files

3. **Monitor usage**:
   - Set up billing alerts
   - Monitor usage in AWS Console

## Security Best Practices

1. **Environment Variables**:
   - Never commit sensitive data
   - Use Amplify environment variables

2. **File Upload Security**:
   - Validate file types
   - Set size limits
   - Implement rate limiting

3. **HTTPS**:
   - Amplify provides free SSL certificates
   - Always use HTTPS in production

## Performance Optimization

1. **CDN**:
   - Amplify automatically uses CloudFront CDN
   - Global content delivery

2. **Caching**:
   - Static assets are cached
   - API responses can be cached

3. **Compression**:
   - Enable gzip compression
   - Optimize image sizes

## Monitoring and Analytics

1. **AWS CloudWatch**:
   - Monitor application logs
   - Set up alarms for errors

2. **Amplify Analytics** (Optional):
   - Track user engagement
   - Monitor performance

## Support and Resources

- **AWS Amplify Documentation**: https://docs.amplify.aws/
- **GitHub Issues**: Report bugs in your repository
- **AWS Support**: Available with AWS Support plans

## Next Steps

After successful deployment:

1. **Test thoroughly** on different devices
2. **Set up monitoring** and alerts
3. **Configure custom domain** (optional)
4. **Set up CI/CD** for automatic deployments
5. **Monitor costs** and optimize

---

**🎉 Congratulations! Your HEIC to JPG Converter is now live on AWS Amplify!**

Your app will be available at: `https://main.xxxxxxxx.amplifyapp.com` 