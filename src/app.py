"""
PDF Toolkit - Flask Web Application
Features: Merge PDFs, Split PDFs, Convert PDF to Editable Text
"""

from flask import Flask, render_template, request, session, send_file, jsonify
import io
import os
import secrets
import shutil
from typing import List, Tuple
from werkzeug.utils import secure_filename
import tempfile

# PDF libraries
from pypdf import PdfReader, PdfWriter
from docx import Document

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Create a dedicated upload folder that persists during app session
UPLOAD_FOLDER = tempfile.mkdtemp(prefix='pdf_toolkit_')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Allowed extensions
ALLOWED_EXTENSIONS = {'pdf'}


def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def format_file_size(bytes_size: int) -> str:
    """Format file size in human-readable format"""
    if bytes_size == 0:
        return "0 Bytes"
    k = 1024
    sizes = ['Bytes', 'KB', 'MB', 'GB']
    i = 0
    size = float(bytes_size)
    while size >= k and i < len(sizes) - 1:
        size /= k
        i += 1
    return f"{size:.2f} {sizes[i]}"


def merge_pdfs(pdf_bytes_list: List[bytes]) -> bytes:
    """Merge multiple PDF files into one"""
    pdf_writer = PdfWriter()
    
    for pdf_bytes in pdf_bytes_list:
        pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
        for page in pdf_reader.pages:
            pdf_writer.add_page(page)
    
    output = io.BytesIO()
    pdf_writer.write(output)
    output.seek(0)
    return output.getvalue()


def split_pdf_individual(pdf_bytes: bytes) -> List[Tuple[str, bytes]]:
    """Split PDF into individual pages"""
    pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
    split_files = []
    
    for i, page in enumerate(pdf_reader.pages):
        pdf_writer = PdfWriter()
        pdf_writer.add_page(page)
        
        output = io.BytesIO()
        pdf_writer.write(output)
        output.seek(0)
        
        filename = f"page_{i+1}.pdf"
        split_files.append((filename, output.getvalue()))
    
    return split_files


def split_pdf_ranges(pdf_bytes: bytes, pages_per_file: int) -> List[Tuple[str, bytes]]:
    """Split PDF into equal page ranges"""
    pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
    total_pages = len(pdf_reader.pages)
    split_files = []
    
    file_num = 1
    for start in range(0, total_pages, pages_per_file):
        end = min(start + pages_per_file, total_pages)
        pdf_writer = PdfWriter()
        
        for i in range(start, end):
            pdf_writer.add_page(pdf_reader.pages[i])
        
        output = io.BytesIO()
        pdf_writer.write(output)
        output.seek(0)
        
        filename = f"part_{file_num}_pages_{start+1}-{end}.pdf"
        split_files.append((filename, output.getvalue()))
        file_num += 1
    
    return split_files


def split_pdf_custom(pdf_bytes: bytes, ranges: List[Tuple[int, int]]) -> List[Tuple[str, bytes]]:
    """Split PDF by custom page ranges"""
    pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
    split_files = []
    
    for idx, (start, end) in enumerate(ranges):
        pdf_writer = PdfWriter()
        
        # Adjust for 0-based indexing
        for i in range(start - 1, min(end, len(pdf_reader.pages))):
            if i >= 0 and i < len(pdf_reader.pages):
                pdf_writer.add_page(pdf_reader.pages[i])
        
        output = io.BytesIO()
        pdf_writer.write(output)
        output.seek(0)
        
        filename = f"range_{idx+1}_pages_{start}-{end}.pdf"
        split_files.append((filename, output.getvalue()))
    
    return split_files


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text content from PDF"""
    pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    
    for page_num, page in enumerate(pdf_reader.pages):
        text += f"--- Page {page_num + 1} ---\n\n"
        text += page.extract_text()
        text += "\n\n"
    
    return text


def create_docx_from_text(text: str) -> bytes:
    """Create a DOCX document from text"""
    doc = Document()
    
    # Split text into paragraphs and add to document
    for paragraph in text.split('\n'):
        if paragraph.strip():
            doc.add_paragraph(paragraph)
    
    output = io.BytesIO()
    doc.save(output)
    output.seek(0)
    return output.getvalue()


@app.route('/')
def index():
    """Main page with tabbed interface"""
    # Initialize session variables
    if 'merge_files' not in session:
        session['merge_files'] = []
    if 'split_file' not in session:
        session['split_file'] = None
    if 'extracted_text' not in session:
        session['extracted_text'] = ""
    
    return render_template('index.html')


# ============================================
# MERGE PDF ROUTES
# ============================================

@app.route('/merge/upload', methods=['POST'])
def merge_upload():
    """Handle multiple PDF file uploads for merging"""
    if 'files' not in request.files:
        return jsonify({'error': 'No files uploaded'}), 400
    
    files = request.files.getlist('files')
    uploaded_files = []
    
    # Initialize merge session if needed
    if 'merge_files' not in session:
        session['merge_files'] = []
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_bytes = file.read()
            
            # Save to disk instead of storing in session
            unique_filename = f"{secrets.token_hex(8)}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            
            with open(filepath, 'wb') as f:
                f.write(file_bytes)
            
            # Get page count
            try:
                pdf_reader = PdfReader(io.BytesIO(file_bytes))
                page_count = len(pdf_reader.pages)
            except:
                page_count = 0
            
            uploaded_files.append({
                'name': filename,
                'size': len(file_bytes),
                'size_formatted': format_file_size(len(file_bytes)),
                'pages': page_count,
                'filepath': unique_filename  # Store filename reference instead of data
            })
    
    session['merge_files'].extend(uploaded_files)
    session.modified = True
    
    return jsonify({
        'success': True,
        'files': [{'name': f['name'], 'size': f['size_formatted'], 'pages': f['pages']} for f in uploaded_files]
    })


@app.route('/merge/reorder', methods=['POST'])
def merge_reorder():
    """Reorder files for merging"""
    data = request.get_json()
    from_idx = data.get('from')
    to_idx = data.get('to')
    
    if 'merge_files' in session and from_idx is not None and to_idx is not None:
        files = session['merge_files']
        if 0 <= from_idx < len(files) and 0 <= to_idx < len(files):
            files.insert(to_idx, files.pop(from_idx))
            session['merge_files'] = files
            session.modified = True
            return jsonify({'success': True})
    
    return jsonify({'error': 'Invalid reorder operation'}), 400


@app.route('/merge/process', methods=['POST'])
def merge_process():
    """Merge uploaded PDFs"""
    if 'merge_files' not in session or len(session['merge_files']) < 2:
        return jsonify({'error': 'Need at least 2 files to merge'}), 400
    
    try:
        # Read files from disk
        pdf_bytes_list = []
        for f in session['merge_files']:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], f['filepath'])
            with open(filepath, 'rb') as file:
                pdf_bytes_list.append(file.read())
        
        merged_pdf = merge_pdfs(pdf_bytes_list)
        
        # Save merged PDF to disk
        merged_filename = f"{secrets.token_hex(8)}_merged.pdf"
        merged_path = os.path.join(app.config['UPLOAD_FOLDER'], merged_filename)
        with open(merged_path, 'wb') as f:
            f.write(merged_pdf)
        
        session['merged_pdf_filepath'] = merged_filename
        session.modified = True
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/merge/download')
def merge_download():
    """Download merged PDF"""
    if 'merged_pdf_filepath' not in session:
        return "No merged PDF available", 404
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], session['merged_pdf_filepath'])
    
    try:
        return send_file(
            filepath,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='merged-document.pdf'
        )
    except FileNotFoundError:
        return "File not found", 404


# ============================================
# SPLIT PDF ROUTES
# ============================================

@app.route('/split/upload', methods=['POST'])
def split_upload():
    """Handle PDF file upload for splitting"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_bytes = file.read()
        
        # Save to disk
        unique_filename = f"{secrets.token_hex(8)}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        with open(filepath, 'wb') as f:
            f.write(file_bytes)
        
        # Get page count
        try:
            pdf_reader = PdfReader(io.BytesIO(file_bytes))
            page_count = len(pdf_reader.pages)
        except:
            return jsonify({'error': 'Invalid PDF file'}), 400
        
        session['split_file'] = {
            'name': filename,
            'size': len(file_bytes),
            'size_formatted': format_file_size(len(file_bytes)),
            'pages': page_count,
            'filepath': unique_filename
        }
        session.modified = True
        
        return jsonify({
            'success': True,
            'name': filename,
            'size': format_file_size(len(file_bytes)),
            'pages': page_count
        })
    
    return jsonify({'error': 'Invalid file'}), 400


@app.route('/split/process', methods=['POST'])
def split_process():
    """Split PDF based on selected mode"""
    if 'split_file' not in session:
        return jsonify({'error': 'No file uploaded'}), 400
    
    data = request.get_json()
    mode = data.get('mode', 'individual')
    
    try:
        # Read file from disk
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], session['split_file']['filepath'])
        with open(filepath, 'rb') as f:
            pdf_bytes = f.read()
        
        if mode == 'individual':
            split_files = split_pdf_individual(pdf_bytes)
        elif mode == 'ranges':
            pages_per_file = int(data.get('pages_per_file', 2))
            split_files = split_pdf_ranges(pdf_bytes, pages_per_file)
        elif mode == 'custom':
            ranges = [(r['start'], r['end']) for r in data.get('ranges', [])]
            if not ranges:
                return jsonify({'error': 'No ranges specified'}), 400
            split_files = split_pdf_custom(pdf_bytes, ranges)
        else:
            return jsonify({'error': 'Invalid split mode'}), 400
        
        # Save split files to disk
        session['split_files'] = []
        for name, file_data in split_files:
            unique_filename = f"{secrets.token_hex(8)}_{name}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            with open(filepath, 'wb') as f:
                f.write(file_data)
            session['split_files'].append({'name': name, 'filepath': unique_filename})
        
        session.modified = True
        
        return jsonify({
            'success': True,
            'files': [f['name'] for f in session['split_files']]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/split/download/<int:file_index>')
def split_download(file_index):
    """Download a specific split PDF file"""
    if 'split_files' not in session or file_index >= len(session['split_files']):
        return "File not found", 404
    
    split_file = session['split_files'][file_index]
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], split_file['filepath'])
    
    try:
        return send_file(
            filepath,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=split_file['name']
        )
    except FileNotFoundError:
        return "File not found", 404


# ============================================
# PDF TO EDITABLE ROUTES
# ============================================

@app.route('/convert/upload', methods=['POST'])
def convert_upload():
    """Handle PDF file upload for text extraction"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_bytes = file.read()
        
        # Save to disk
        unique_filename = f"{secrets.token_hex(8)}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        with open(filepath, 'wb') as f:
            f.write(file_bytes)
        
        session['convert_file'] = {
            'name': filename,
            'size': len(file_bytes),
            'size_formatted': format_file_size(len(file_bytes)),
            'filepath': unique_filename
        }
        session.modified = True
        
        return jsonify({
            'success': True,
            'name': filename,
            'size': format_file_size(len(file_bytes))
        })
    
    return jsonify({'error': 'Invalid file'}), 400


@app.route('/convert/extract', methods=['POST'])
def convert_extract():
    """Extract text from uploaded PDF"""
    if 'convert_file' not in session:
        return jsonify({'error': 'No file uploaded'}), 400
    
    try:
        # Read file from disk
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], session['convert_file']['filepath'])
        with open(filepath, 'rb') as f:
            pdf_bytes = f.read()
        
        extracted_text = extract_text_from_pdf(pdf_bytes)
        
        session['extracted_text'] = extracted_text
        session.modified = True
        
        return jsonify({
            'success': True,
            'text': extracted_text
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/convert/download/<format>')
def convert_download(format):
    """Download extracted text as TXT or DOCX"""
    if 'extracted_text' not in session or not session['extracted_text']:
        return "No text available", 404
    
    text = session.get('edited_text', session['extracted_text'])
    filename = session.get('convert_file', {}).get('name', 'document').replace('.pdf', '')
    
    if format == 'txt':
        return send_file(
            io.BytesIO(text.encode('utf-8')),
            mimetype='text/plain',
            as_attachment=True,
            download_name=f'{filename}-extracted.txt'
        )
    elif format == 'docx':
        try:
            docx_bytes = create_docx_from_text(text)
            return send_file(
                io.BytesIO(docx_bytes),
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                as_attachment=True,
                download_name=f'{filename}-extracted.docx'
            )
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return "Invalid format", 400


@app.route('/convert/update-text', methods=['POST'])
def convert_update_text():
    """Update edited text in session"""
    data = request.get_json()
    text = data.get('text', '')
    
    session['edited_text'] = text
    session.modified = True
    
    return jsonify({'success': True})


# ============================================
# CLEAR SESSION ROUTES
# ============================================

@app.route('/clear/<section>', methods=['POST'])
def clear_section(section):
    """Clear session data for a specific section"""
    if section == 'merge':
        session.pop('merge_files', None)
        session.pop('merged_pdf', None)
    elif section == 'split':
        session.pop('split_file', None)
        session.pop('split_files', None)
    elif section == 'convert':
        session.pop('convert_file', None)
        session.pop('extracted_text', None)
        session.pop('edited_text', None)
    
    session.modified = True
    return jsonify({'success': True})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
