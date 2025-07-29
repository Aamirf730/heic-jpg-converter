#!/bin/bash

# Deployment script for Namecheap hosting

echo "🚀 Preparing files for Namecheap deployment..."

# Create deployment directory
mkdir -p deployment

# Copy essential files
cp index.php deployment/
cp download.php deployment/
cp app.js deployment/
cp .htaccess deployment/
cp README.md deployment/

# Copy directories
cp -r includes deployment/
cp -r images deployment/

# Create empty directories (will be created by PHP)
mkdir -p deployment/uploads
mkdir -p deployment/converted

# Set proper permissions for directories
chmod 755 deployment/uploads
chmod 755 deployment/converted

# Create a simple test file to verify uploads work
echo "<?php echo 'Upload directory is writable'; ?>" > deployment/uploads/test.php

echo "✅ Deployment package created in 'deployment' folder"
echo ""
echo "📁 Files to upload to Namecheap:"
echo "   - All files from the 'deployment' folder"
echo "   - Upload to your public_html directory"
echo ""
echo "🔧 Next steps:"
echo "   1. Login to Namecheap cPanel"
echo "   2. Open File Manager"
echo "   3. Navigate to public_html"
echo "   4. Upload all files from deployment folder"
echo "   5. Set permissions: uploads/ and converted/ to 755"
echo ""
echo "🌐 Your site will be available at:"
echo "   https://yourdomain.com/" 