# PDF Toolkit - Python Version

A comprehensive PDF manipulation web application built with Python and Streamlit.

## Features

### 🔗 Merge PDFs
- Upload multiple PDF files
- Reorder files using up/down arrows (similar to drag-and-drop)
- Merge into a single document
- Download the combined PDF

### ✂️ Split PDF
- Split into individual pages
- Split by equal page ranges
- Split by custom page ranges
- Download all split files

### 📝 PDF to Editable
- Extract text from PDF files
- Edit extracted text in browser
- Export as .txt or .docx format
- Copy to clipboard functionality

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup Instructions

1. **Install required packages:**
   ```bash
   pip install -r requirements.txt
   ```

   Or install individually:
   ```bash
   pip install streamlit pypdf python-docx
   ```

2. **Run the application:**
   ```bash
   streamlit run pdf_toolkit.py
   ```

3. **Access the app:**
   - The app will automatically open in your default browser
   - Default URL: http://localhost:8501

## Usage

### Merge PDFs
1. Navigate to the "Merge PDFs" tab
2. Upload multiple PDF files using the file uploader
3. Reorder files using the ↑↓ arrows (files are merged in order)
4. Click "Merge PDFs" button
5. Download the merged document

### Split PDF
1. Navigate to the "Split PDF" tab
2. Upload a single PDF file
3. Choose split mode:
   - **Individual pages**: Creates one file per page
   - **Page ranges**: Specify pages per file (e.g., 2 pages per file)
   - **Custom ranges**: Define specific page ranges to extract
4. Click "Split PDF" button
5. Download individual split files

### PDF to Editable
1. Navigate to the "PDF to Editable" tab
2. Upload a PDF file
3. Click "Extract Text" button
4. Edit the extracted text in the text area
5. Choose export format (TXT or DOCX)
6. Download the editable document

## Deployment

### Local Network Deployment
To make the app accessible to other computers on your network:

```bash
streamlit run pdf_toolkit.py --server.address 0.0.0.0 --server.port 8501
```

Then access from other computers using: `http://[your-computer-ip]:8501`

### Cloud Deployment

#### Streamlit Cloud (Free)
1. Push your code to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect your GitHub repository
4. Deploy with one click

#### Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY pdf_toolkit.py .

EXPOSE 8501

CMD ["streamlit", "run", "pdf_toolkit.py", "--server.address", "0.0.0.0"]
```

Build and run:
```bash
docker build -t pdf-toolkit .
docker run -p 8501:8501 pdf-toolkit
```

## Technical Details

### Libraries Used
- **Streamlit**: Web interface framework
- **pypdf**: PDF reading and manipulation
- **python-docx**: DOCX file creation

### Key Features Implementation
- **File reordering**: Uses session state and arrow buttons (Python alternative to drag-and-drop)
- **PDF merging**: Combines pages from multiple PDFs using pypdf PdfWriter
- **PDF splitting**: Extracts page ranges into separate PDFs
- **Text extraction**: Extracts text content from PDF pages
- **DOCX export**: Creates Word documents from extracted text

## Differences from React Version

Since Python/Streamlit doesn't support drag-and-drop reordering natively like React DnD, the implementation uses:
- **Up/Down arrow buttons** for reordering files in the merge feature
- **Session state** to maintain file order
- **Immediate rerun** when order changes to provide responsive feedback

This provides similar functionality with an intuitive interface suitable for desktop use.

## Troubleshooting

### "pypdf not found" error
```bash
pip install pypdf
```

### "python-docx not found" error (DOCX export won't work)
```bash
pip install python-docx
```

### Port already in use
```bash
streamlit run pdf_toolkit.py --server.port 8502
```

### Cannot extract text from PDF
Some PDFs (especially scanned images) don't contain extractable text. Consider using OCR tools for scanned documents.

## License

This is a professional tool for internal company use.

## Support

For issues or feature requests, contact your IT department.
