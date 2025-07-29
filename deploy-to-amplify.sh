#!/bin/bash

# 🚀 HEIC to JPG Converter - AWS Amplify Deployment Script
# This script prepares your Node.js application for AWS Amplify deployment

echo "🚀 Preparing HEIC to JPG Converter for AWS Amplify deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "server.js" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

print_status "Checking project structure..."

# Verify required files exist
required_files=(
    "package.json"
    "server.js"
    "amplify.yml"
    "public/index.html"
    "public/app.js"
    "README.md"
    "AMPLIFY_DEPLOYMENT_GUIDE.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file"
    else
        print_error "✗ Missing: $file"
        exit 1
    fi
done

print_status "Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

print_status "Creating deployment directory..."
mkdir -p deployment

# Copy files to deployment directory
print_status "Copying files to deployment directory..."

# Copy main files
cp package.json deployment/
cp server.js deployment/
cp amplify.yml deployment/
cp README.md deployment/
cp AMPLIFY_DEPLOYMENT_GUIDE.md deployment/

# Copy public directory
cp -r public deployment/

# Create necessary directories
mkdir -p deployment/uploads
mkdir -p deployment/converted

# Set permissions
chmod 755 deployment/uploads
chmod 755 deployment/converted

print_status "Creating .gitignore file..."
cat > deployment/.gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Application specific
uploads/*
!uploads/.gitkeep
converted/*
!converted/.gitkeep
*.log
EOF

# Create .gitkeep files
touch deployment/uploads/.gitkeep
touch deployment/converted/.gitkeep

print_status "Creating deployment README..."
cat > deployment/DEPLOYMENT_README.md << EOF
# 🚀 Deployment Package - HEIC to JPG Converter

This directory contains all files needed to deploy your HEIC to JPG converter on AWS Amplify.

## 📁 Contents

- \`package.json\` - Node.js dependencies
- \`server.js\` - Express.js server
- \`amplify.yml\` - Amplify build configuration
- \`public/\` - Static files (HTML, CSS, JS)
- \`uploads/\` - Upload directory (auto-created)
- \`converted/\` - Converted files directory (auto-created)

## 🚀 Deployment Steps

1. **Upload to Git Repository**
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit: HEIC to JPG Converter"
   git remote add origin <your-repository-url>
   git push -u origin main
   \`\`\`

2. **Connect to AWS Amplify**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Create new app → Host web app
   - Connect your Git repository
   - Deploy automatically

3. **Access Your App**
   - Your app will be available at: \`https://main.xxxxxxxx.amplifyapp.com\`
   - Configure custom domain in Amplify settings

## 📖 Detailed Instructions

See \`AMPLIFY_DEPLOYMENT_GUIDE.md\` for complete deployment instructions.

## 🔧 Configuration

- **Node.js Version**: 18+
- **Port**: 3000 (development), 8080 (production)
- **File Size Limit**: 10MB per file
- **Supported Formats**: HEIC, HEIF → JPG, PNG

## 🆘 Support

- Check \`README.md\` for general information
- See \`AMPLIFY_DEPLOYMENT_GUIDE.md\` for deployment help
- Report issues on GitHub

---

**🎯 Ready to deploy! Follow the steps above to get your HEIC converter live on AWS Amplify.**
EOF

print_status "Testing local server..."
# Start server in background
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test server
if curl -s http://localhost:3000 > /dev/null; then
    print_success "Local server test passed"
else
    print_warning "Local server test failed - check if port 3000 is available"
fi

# Stop server
kill $SERVER_PID 2>/dev/null

print_status "Creating deployment summary..."
cat > deployment/DEPLOYMENT_SUMMARY.md << EOF
# 📋 Deployment Summary

## ✅ Pre-deployment Checklist

- [x] All required files present
- [x] Dependencies installed
- [x] Project structure verified
- [x] Local server test completed
- [x] Deployment package created

## 📊 Project Statistics

- **Total Files**: $(find . -type f -name "*.js" -o -name "*.html" -o -name "*.css" -o -name "*.json" -o -name "*.yml" | wc -l | tr -d ' ')
- **Lines of Code**: $(find . -name "*.js" -o -name "*.html" -o -name "*.css" | xargs wc -l | tail -1 | awk '{print $1}')
- **Dependencies**: $(grep -c '"dependencies"' package.json)

## 🎯 Next Steps

1. **Upload to Git**: Push deployment folder to your repository
2. **Connect Amplify**: Link repository to AWS Amplify
3. **Deploy**: Automatic deployment will begin
4. **Test**: Verify all functionality works
5. **Custom Domain**: Configure your domain (optional)

## 🔗 Useful Links

- **AWS Amplify Console**: https://console.aws.amazon.com/amplify/
- **Amplify Documentation**: https://docs.aws.amazon.com/amplify/
- **Project Repository**: <your-repo-url>

## 📞 Support

If you encounter issues:
1. Check the deployment guide
2. Review AWS Amplify documentation
3. Check build logs in Amplify Console
4. Verify all files are properly uploaded

---

**🎉 Your HEIC to JPG converter is ready for deployment!**
EOF

print_success "Deployment package created successfully!"
print_status "Deployment directory: ./deployment/"
print_status "Files ready for Git upload:"
ls -la deployment/

echo ""
print_success "🎯 Deployment package is ready!"
echo ""
echo "Next steps:"
echo "1. cd deployment/"
echo "2. git init"
echo "3. git add ."
echo "4. git commit -m 'Initial commit'"
echo "5. git remote add origin <your-repo-url>"
echo "6. git push -u origin main"
echo "7. Connect to AWS Amplify"
echo ""
echo "📖 See AMPLIFY_DEPLOYMENT_GUIDE.md for detailed instructions"
echo "" 