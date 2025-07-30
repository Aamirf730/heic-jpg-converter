# AWS Amplify Deployment Guide

## Overview
This guide will help you deploy your HEIC to JPG Converter Next.js application to AWS Amplify.

## Prerequisites
- AWS Account
- Git repository (GitHub, GitLab, Bitbucket, etc.)
- Node.js 18+ installed locally

## Step 1: Prepare Your Repository

1. **Push your code to Git repository**
   ```bash
   git add .
   git commit -m "Convert to Next.js for AWS Amplify"
   git push origin main
   ```

2. **Ensure these files are in your repository:**
   - `package.json` (with Next.js dependencies)
   - `next.config.js`
   - `tsconfig.json`
   - `amplify.yml`
   - `app/` directory (Next.js app router)
   - `public/` directory (static assets)

## Step 2: Deploy to AWS Amplify

### Option A: Deploy via AWS Amplify Console

1. **Go to AWS Amplify Console**
   - Sign in to AWS Console
   - Navigate to AWS Amplify
   - Click "New app" → "Host web app"

2. **Connect Repository**
   - Choose your Git provider (GitHub, GitLab, etc.)
   - Authorize AWS Amplify to access your repository
   - Select your repository and branch (usually `main`)

3. **Configure Build Settings**
   - Amplify will auto-detect Next.js and use the `amplify.yml` file
   - Review the build settings and click "Save and deploy"

4. **Wait for Deployment**
   - Amplify will build and deploy your application
   - You'll get a URL like: `https://main.d1234567890.amplifyapp.com`

### Option B: Deploy via AWS CLI

1. **Install AWS CLI and Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Initialize Amplify in your project**
   ```bash
   amplify init
   ```

3. **Add hosting**
   ```bash
   amplify add hosting
   ```

4. **Deploy**
   ```bash
   amplify publish
   ```

## Step 3: Configure Environment Variables (Optional)

If you need environment variables:

1. Go to your app in Amplify Console
2. Navigate to "Environment variables"
3. Add any required variables

## Step 4: Custom Domain (Optional)

1. **Add Custom Domain**
   - In Amplify Console, go to "Domain management"
   - Click "Add domain"
   - Enter your domain name
   - Follow the DNS configuration instructions

2. **SSL Certificate**
   - Amplify automatically provisions SSL certificates
   - No additional configuration needed

## Step 5: Monitor and Maintain

### Build Monitoring
- Amplify automatically rebuilds on every push to your main branch
- View build logs in the Amplify Console
- Set up notifications for build failures

### Performance Monitoring
- Use AWS CloudWatch for monitoring
- Set up alerts for errors or performance issues

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Amplify Console
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **HEIC Conversion Not Working**
   - Ensure `heic2any.min.js` is in the `public/` directory
   - Check browser console for JavaScript errors
   - Verify the library is loading correctly

3. **Static Assets Not Loading**
   - Ensure assets are in the `public/` directory
   - Check file paths in your code
   - Verify `next.config.js` configuration

### Performance Optimization

1. **Enable Caching**
   - Amplify automatically caches static assets
   - Use Next.js Image component for optimized images
   - Implement proper cache headers

2. **CDN Distribution**
   - Amplify automatically distributes content via CloudFront
   - No additional configuration needed

## Cost Optimization

- **Free Tier**: Amplify offers generous free tier
- **Pay-as-you-go**: Only pay for what you use
- **Monitoring**: Use AWS Cost Explorer to monitor usage

## Security Best Practices

1. **Environment Variables**
   - Never commit sensitive data to Git
   - Use Amplify environment variables for secrets

2. **HTTPS**
   - Amplify automatically provides SSL certificates
   - All traffic is encrypted by default

3. **Access Control**
   - Use IAM roles and policies
   - Implement proper authentication if needed

## Support

- **AWS Amplify Documentation**: https://docs.aws.amazon.com/amplify/
- **Next.js Documentation**: https://nextjs.org/docs
- **AWS Support**: Available with AWS support plans

## Migration from Render

### Key Differences
- **Build Process**: Amplify uses `amplify.yml` instead of `render.yaml`
- **Static Assets**: Use `public/` directory in Next.js
- **API Routes**: Use Next.js API routes instead of Express
- **Environment Variables**: Configure in Amplify Console

### Benefits of AWS Amplify
- **Better Performance**: Global CDN distribution
- **Automatic Scaling**: Handles traffic spikes automatically
- **Better Integration**: Native AWS services integration
- **Advanced Features**: A/B testing, preview deployments, etc. 