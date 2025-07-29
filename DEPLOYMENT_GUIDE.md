# 🚀 Namecheap Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ Namecheap shared hosting account
- ✅ Domain name (or subdomain)
- ✅ cPanel access

## 📁 Files Ready for Upload

Your deployment package is ready in the `deployment/` folder with these files:

```
deployment/
├── index.php              # Main application
├── download.php           # Download handler
├── app.js                 # Frontend JavaScript
├── .htaccess             # Server configuration
├── README.md             # Documentation
├── includes/
│   ├── config.php        # Configuration
│   └── functions.php     # Core functions
├── images/
│   └── favicon.ico       # Site icon
├── uploads/              # Upload directory (755 permissions)
└── converted/            # Converted files directory (755 permissions)
```

## 🔧 Step-by-Step Deployment

### **Step 1: Access cPanel**
1. Login to your Namecheap hosting account
2. Click "Manage" next to your hosting package
3. Click "cPanel" button
4. Login to cPanel with your credentials

### **Step 2: Open File Manager**
1. In cPanel, find "Files" section
2. Click "File Manager"
3. Navigate to `public_html` directory
4. This is your website's root directory

### **Step 3: Upload Files**
1. Click "Upload" button in File Manager
2. Select all files from the `deployment/` folder
3. Upload them to `public_html`
4. **Important**: Upload files directly to `public_html`, not in a subfolder

### **Step 4: Set Permissions**
After upload, set these permissions:
1. Right-click on `uploads` folder → "Change Permissions" → Set to `755`
2. Right-click on `converted` folder → "Change Permissions" → Set to `755`
3. Right-click on `.htaccess` → "Change Permissions" → Set to `644`

### **Step 5: Configure PHP Settings**
1. In cPanel, find "Software" section
2. Click "PHP Configuration"
3. Set these values:
   - `upload_max_filesize` = `10M`
   - `post_max_size` = `10M`
   - `max_execution_time` = `300`
   - `memory_limit` = `256M`

### **Step 6: Check PHP Extensions**
1. In cPanel, find "Software" section
2. Click "PHP Extensions"
3. Ensure these extensions are enabled:
   - ✅ `gd` (GD Library)
   - ✅ `zip` (ZipArchive)
   - ✅ `imagick` (ImageMagick - if available)

## 🌐 Access Your Application

Your HEIC converter will be available at:
- **Main URL**: `https://yourdomain.com/`
- **Direct access**: `https://yourdomain.com/index.php`

## 🧪 Testing Your Deployment

### **Test 1: Basic Functionality**
1. Visit your domain
2. Check if the page loads correctly
3. Verify the design looks identical to localhost

### **Test 2: File Upload**
1. Try uploading a HEIC file
2. Check if files appear in the uploads directory
3. Verify conversion process works

### **Test 3: Download Functionality**
1. Convert a file
2. Try downloading individual files
3. Test "Download All" functionality

## 🔍 Troubleshooting

### **Common Issues & Solutions**

#### **"Upload failed"**
- Check file permissions (uploads/ should be 755)
- Verify PHP upload settings
- Check file size limits

#### **"Conversion failed"**
- Ensure ImageMagick or GD is enabled
- Check server memory limits
- Verify file permissions

#### **"Page not found"**
- Ensure files are in `public_html` (not a subfolder)
- Check `.htaccess` file is uploaded
- Verify domain DNS is pointing to hosting

#### **"Permission denied"**
- Set uploads/ and converted/ to 755 permissions
- Check file ownership
- Contact Namecheap support if needed

### **Debug Mode**
To enable debug mode, edit `includes/config.php`:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## 📞 Namecheap Support

If you encounter issues:
1. **Check cPanel error logs** in "Errors" section
2. **Contact Namecheap support** via live chat
3. **Reference this guide** when contacting support

## 🔒 Security Notes

- Files are automatically deleted after 1 hour
- Upload directories are protected from direct access
- File types are strictly validated
- No permanent file storage

## 📈 Performance Tips

- Keep files under 10MB for best performance
- Use modern browsers for optimal experience
- Monitor server resources during peak usage

## 🎯 Success Checklist

- ✅ Files uploaded to public_html
- ✅ Permissions set correctly (755 for directories)
- ✅ PHP settings configured
- ✅ Application loads without errors
- ✅ File upload works
- ✅ Conversion process functions
- ✅ Download functionality works

---

**Your HEIC to JPG converter is now live!** 🎉

Visit your domain to start converting HEIC files with the exact same beautiful design as your local version. 