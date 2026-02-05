# PDF Toolkit - Flask Web Application

A comprehensive web-based PDF manipulation tool built with Flask. Upload and process PDF files through a clean, professional web interface.

## Features

### 🔗 Merge PDFs

- Upload multiple PDF files
- Drag-and-drop file upload support
- Reorder files before merging using arrow buttons
- Download the merged PDF document

### ✂️ Split PDF

- Upload a single PDF file
- Three splitting modes:
  - **Individual Pages**: Split into separate files for each page
  - **Page Ranges**: Split into equal chunks (specify pages per file)
  - **Custom Ranges**: Define your own page ranges to extract
- Download all split files individually

### 📝 PDF to Editable Text

- Extract text content from PDF files
- Edit the extracted text in a built-in text editor
- Export as:
  - Plain text (.txt)
  - Word document (.docx)

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Setup Steps

1. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Flask application:**

   ```bash
   python app.py
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5001`

## Usage

### Starting the Server

```bash
python app.py
```

The application will start on `http://localhost:5001` by default.

### Configuration

You can modify the following settings in `app.py`:

- **Port**: Change the port number in the last line of `app.py`

  ```python
  app.run(debug=True, host='0.0.0.0', port=5000)
  ```

- **Max File Size**: Adjust the maximum upload file size (default: 50MB)

  ```python
  app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
  ```

- **Debug Mode**: For production, set `debug=False`

## Project Structure

```
.
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README_FLASK.md       # This file
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Application styles
│   └── js/
│       └── main.js       # Frontend JavaScript
```

## Dependencies

- **Flask**: Web framework
- **pypdf**: PDF manipulation library
- **python-docx**: DOCX document creation
- **Werkzeug**: WSGI utility library (included with Flask)

## Features in Detail

### Merge PDFs

1. Click on the "Merge PDFs" tab
2. Upload multiple PDF files (click or drag-and-drop)
3. Reorder files using the up/down arrow buttons
4. Click "Merge PDFs"
5. Download your merged document

### Split PDF

1. Click on the "Split PDF" tab
2. Upload a single PDF file
3. Choose your split mode:
   - Individual pages for separate files per page
   - Page ranges to split into equal chunks
   - Custom ranges to specify exact pages
4. Click "Split PDF"
5. Download each resulting file individually

### PDF to Editable

1. Click on the "PDF to Editable" tab
2. Upload a PDF file
3. Click "Extract Text"
4. Edit the text in the provided editor
5. Choose your export format (TXT or DOCX)
6. Click "Download"

## Session Management

The application uses Flask sessions to store:

- Uploaded files temporarily
- Processing results
- User preferences

Session data is automatically cleared when you navigate away or start a new operation.

## Security Notes

- Files are stored in memory (session) and not saved to disk permanently
- Maximum file size is limited to 50MB by default
- Only PDF files are accepted for upload
- Session data uses secure secret keys

## Deployment

### For Production Use

1. **Set a secure secret key:**

   ```python
   app.secret_key = 'your-secure-secret-key-here'
   ```

2. **Disable debug mode:**

   ```python
   app.run(debug=False)
   ```

3. **Use a production server:**
   Consider using Gunicorn or uWSGI instead of Flask's built-in server:

   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

4. **Set up a reverse proxy:**
   Use Nginx or Apache as a reverse proxy for better performance and security.

### Environment Variables

For production, consider using environment variables for configuration:

```python
import os
app.secret_key = os.environ.get('SECRET_KEY', 'default-secret-key')
```

## Troubleshooting

### Issue: "ModuleNotFoundError"

**Solution**: Make sure all dependencies are installed:

```bash
pip install -r requirements.txt
```

### Issue: "Address already in use"

**Solution**: Either stop the process using port 5000 or change the port in `app.py`

### Issue: "File too large"

**Solution**: Increase `MAX_CONTENT_LENGTH` in `app.py`

### Issue: "Invalid PDF file"

**Solution**: Ensure the uploaded file is a valid PDF document

## Browser Compatibility

Tested and working on:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance Notes

- Large PDF files (>10MB) may take longer to process
- Splitting large PDFs into many files may be memory-intensive
- Text extraction quality depends on the PDF structure

## License

This project is provided as-is for internal company use.

## Support

For issues or questions, please contact your IT department.