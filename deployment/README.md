# HEIC to JPG Converter - PHP Version

A modern, privacy-focused HEIC to JPG converter built with PHP. This application converts HEIC/HEIF image files to JPG or PNG format with server-side processing.

## Features

- **Server-side Processing**: Secure file conversion on the server
- **Multiple Formats**: Convert HEIC to JPG or PNG
- **Batch Processing**: Convert multiple files at once
- **EXIF Stripping**: Optional metadata removal for privacy
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Drag & Drop**: Intuitive file upload interface
- **Progress Tracking**: Real-time conversion status
- **Security**: File validation and secure processing

## Requirements

### Server Requirements
- **PHP**: 7.4 or higher
- **ImageMagick**: With HEIC support (recommended)
- **GD Library**: PHP extension (fallback)
- **ZipArchive**: PHP extension for batch downloads
- **File Upload**: Enabled in PHP configuration

### Optional Tools
- **heif-convert**: Command-line HEIC converter
- **ImageMagick**: Command-line version

## Installation

### 1. Upload Files
Upload all files to your web server directory.

### 2. Set Permissions
```bash
chmod 755 uploads/
chmod 755 converted/
chmod 644 .htaccess
```

### 3. Configure PHP
Ensure your `php.ini` has these settings:
```ini
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
memory_limit = 256M
```

### 4. Verify HEIC Support
The application will automatically detect available conversion methods:
- ImageMagick PHP extension
- GD library
- Command-line tools (heif-convert, magick)

## File Structure

```
/
├── index.php              # Main application file
├── download.php           # File download handler
├── app.js                 # Frontend JavaScript
├── .htaccess             # Apache configuration
├── README.md             # This file
├── includes/
│   ├── config.php        # Configuration settings
│   └── functions.php     # Core functions
├── uploads/              # Temporary upload directory
├── converted/            # Processed files directory
└── images/
    └── favicon.ico       # Site favicon
```

## Configuration

### Main Settings (`includes/config.php`)
- `MAX_FILE_SIZE`: Maximum file size (default: 10MB)
- `ALLOWED_EXTENSIONS`: Allowed file types
- `DEFAULT_QUALITY`: JPEG quality (default: 90)
- `SESSION_TIMEOUT`: Session timeout (default: 1 hour)

### Security Features
- File type validation
- File size limits
- Secure file handling
- Automatic cleanup of old files
- Protected directories

## Usage

1. **Upload Files**: Drag and drop HEIC files or click to browse
2. **Select Format**: Choose JPG or PNG output format
3. **Configure Options**: Enable/disable EXIF stripping
4. **Convert**: Files are automatically processed
5. **Download**: Download individual files or all at once

## Deployment on Namecheap Shared Hosting

### 1. Upload via cPanel File Manager
- Upload all files to your `public_html` directory
- Ensure proper file permissions

### 2. Check PHP Extensions
In cPanel, verify these PHP extensions are enabled:
- `imagick` (ImageMagick)
- `gd` (GD Library)
- `zip` (ZipArchive)

### 3. Configure PHP Settings
In cPanel PHP Configuration:
- Set `upload_max_filesize` to 10M
- Set `post_max_size` to 10M
- Set `max_execution_time` to 300

### 4. Test Installation
- Visit your domain
- Try uploading a HEIC file
- Verify conversion works

## Troubleshooting

### Common Issues

**"No conversion methods available"**
- Install ImageMagick with HEIC support
- Enable GD library in PHP
- Check server logs for errors

**"Upload failed"**
- Check file size limits
- Verify upload directory permissions
- Check PHP upload settings

**"Conversion failed"**
- Ensure HEIC support is installed
- Check server memory limits
- Verify file permissions

### Debug Mode
Enable debug mode by setting in `includes/config.php`:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## Security Considerations

- Files are automatically deleted after session timeout
- Upload directories are protected from direct access
- File types are strictly validated
- No permanent file storage
- Secure session handling

## Performance Optimization

- Automatic cleanup of old files
- Efficient image processing
- Optimized file handling
- Caching headers for static assets

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify server requirements
3. Check PHP error logs
4. Test with different file types

## Changelog

### Version 1.0.0
- Initial PHP conversion
- Server-side HEIC processing
- Modern UI with Tailwind CSS
- Batch file processing
- Security improvements
