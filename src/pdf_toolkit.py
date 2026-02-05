"""
PDF Toolkit - A comprehensive PDF manipulation tool
Features: Merge PDFs, Split PDFs, Convert PDF to Editable Text
"""

import streamlit as st
import io
from pathlib import Path
from typing import List, Tuple
import tempfile
import os

# Try to import PDF libraries with helpful error messages
try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    st.error("Please install pypdf: pip install pypdf")
    st.stop()

try:
    from docx import Document
except ImportError:
    st.warning("For .docx export, install python-docx: pip install python-docx")


# Page configuration
st.set_page_config(
    page_title="PDF Toolkit",
    page_icon="📄",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# Custom CSS for professional styling
st.markdown("""
<style>
    .main-header {
        text-align: center;
        padding: 1rem 0 2rem 0;
    }
    .main-header h1 {
        color: #0f172a;
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
    }
    .main-header p {
        color: #64748b;
        font-size: 1rem;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 0.5rem;
        background-color: white;
        padding: 0.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stTabs [data-baseweb="tab"] {
        height: 3rem;
        background-color: transparent;
        border-radius: 0.375rem;
        color: #64748b;
        font-weight: 500;
    }
    .stTabs [aria-selected="true"] {
        background-color: #3b82f6;
        color: white;
    }
    .upload-box {
        border: 2px dashed #cbd5e1;
        border-radius: 0.5rem;
        padding: 3rem 2rem;
        text-align: center;
        background-color: #f8fafc;
        transition: all 0.3s;
    }
    .upload-box:hover {
        border-color: #94a3b8;
        background-color: #f1f5f9;
    }
    .file-item {
        background-color: #f8fafc;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .success-message {
        background-color: #dcfce7;
        border: 1px solid #86efac;
        color: #166534;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
    }
    .info-message {
        background-color: #dbeafe;
        border: 1px solid #93c5fd;
        color: #1e40af;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
    }
    div[data-testid="stFileUploadDropzone"] {
        border: 2px dashed #cbd5e1;
        background-color: #f8fafc;
        border-radius: 0.5rem;
    }
    div[data-testid="stFileUploadDropzone"]:hover {
        border-color: #3b82f6;
        background-color: #eff6ff;
    }
</style>
""", unsafe_allow_html=True)


# Initialize session state
if 'merged_pdf' not in st.session_state:
    st.session_state.merged_pdf = None
if 'split_files' not in st.session_state:
    st.session_state.split_files = []
if 'extracted_text' not in st.session_state:
    st.session_state.extracted_text = ""


def format_file_size(bytes: int) -> str:
    """Format file size in human-readable format"""
    if bytes == 0:
        return "0 Bytes"
    k = 1024
    sizes = ['Bytes', 'KB', 'MB', 'GB']
    i = 0
    size = float(bytes)
    while size >= k and i < len(sizes) - 1:
        size /= k
        i += 1
    return f"{size:.2f} {sizes[i]}"


def merge_pdfs(pdf_files: List) -> bytes:
    """Merge multiple PDF files into one"""
    pdf_writer = PdfWriter()
    
    for pdf_file in pdf_files:
        pdf_reader = PdfReader(pdf_file)
        for page in pdf_reader.pages:
            pdf_writer.add_page(page)
    
    output = io.BytesIO()
    pdf_writer.write(output)
    output.seek(0)
    return output.getvalue()


def split_pdf_individual(pdf_file) -> List[Tuple[str, bytes]]:
    """Split PDF into individual pages"""
    pdf_reader = PdfReader(pdf_file)
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


def split_pdf_ranges(pdf_file, pages_per_file: int) -> List[Tuple[str, bytes]]:
    """Split PDF into equal page ranges"""
    pdf_reader = PdfReader(pdf_file)
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


def split_pdf_custom(pdf_file, ranges: List[Tuple[int, int]]) -> List[Tuple[str, bytes]]:
    """Split PDF by custom page ranges"""
    pdf_reader = PdfReader(pdf_file)
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


def extract_text_from_pdf(pdf_file) -> str:
    """Extract text content from PDF"""
    pdf_reader = PdfReader(pdf_file)
    text = ""
    
    for page_num, page in enumerate(pdf_reader.pages):
        text += f"--- Page {page_num + 1} ---\n\n"
        text += page.extract_text()
        text += "\n\n"
    
    return text


def create_docx_from_text(text: str) -> bytes:
    """Create a DOCX document from text"""
    try:
        doc = Document()
        
        # Split text into paragraphs and add to document
        for paragraph in text.split('\n'):
            if paragraph.strip():
                doc.add_paragraph(paragraph)
        
        output = io.BytesIO()
        doc.save(output)
        output.seek(0)
        return output.getvalue()
    except:
        st.error("python-docx not installed. Please run: pip install python-docx")
        return None


# Header
st.markdown("""
<div class="main-header">
    <h1>📄 PDF Toolkit</h1>
    <p>Merge, split, and convert your PDF documents</p>
</div>
""", unsafe_allow_html=True)

# Create tabs
tab1, tab2, tab3 = st.tabs(["🔗 Merge PDFs", "✂️ Split PDF", "📝 PDF to Editable"])


# ============================================
# TAB 1: MERGE PDFs
# ============================================
with tab1:
    st.markdown("### Upload PDFs to Merge")
    
    uploaded_files = st.file_uploader(
        "Drag and drop PDF files here, or click to browse",
        type=['pdf'],
        accept_multiple_files=True,
        key="merge_uploader",
        help="Select multiple PDF files to merge into one document"
    )
    
    if uploaded_files:
        st.markdown(f"### Uploaded PDFs ({len(uploaded_files)})")
        
        # Display uploaded files with reordering capability
        st.info("💡 Use the arrows below to reorder files before merging")
        
        # Store file order in session state
        if 'file_order' not in st.session_state or len(st.session_state.file_order) != len(uploaded_files):
            st.session_state.file_order = list(range(len(uploaded_files)))
        
        # Display files with reorder buttons
        for idx, file_idx in enumerate(st.session_state.file_order):
            file = uploaded_files[file_idx]
            col1, col2, col3, col4 = st.columns([0.5, 3, 1, 0.5])
            
            with col1:
                st.markdown(f"**#{idx + 1}**")
            
            with col2:
                st.markdown(f"📄 **{file.name}**")
                st.caption(f"{format_file_size(file.size)}")
            
            with col3:
                # Reorder buttons
                col_up, col_down = st.columns(2)
                with col_up:
                    if idx > 0:
                        if st.button("↑", key=f"up_{idx}"):
                            # Swap with previous
                            st.session_state.file_order[idx], st.session_state.file_order[idx-1] = \
                                st.session_state.file_order[idx-1], st.session_state.file_order[idx]
                            st.rerun()
                
                with col_down:
                    if idx < len(uploaded_files) - 1:
                        if st.button("↓", key=f"down_{idx}"):
                            # Swap with next
                            st.session_state.file_order[idx], st.session_state.file_order[idx+1] = \
                                st.session_state.file_order[idx+1], st.session_state.file_order[idx]
                            st.rerun()
        
        st.markdown("---")
        
        # Reorder files based on current order
        ordered_files = [uploaded_files[i] for i in st.session_state.file_order]
        
        # Merge button
        if len(ordered_files) >= 2:
            col1, col2, col3 = st.columns([1, 1, 1])
            with col2:
                if st.button("🔗 Merge PDFs", type="primary", use_container_width=True):
                    with st.spinner("Merging PDFs..."):
                        try:
                            # Reset file pointers
                            for f in ordered_files:
                                f.seek(0)
                            
                            merged_pdf = merge_pdfs(ordered_files)
                            st.session_state.merged_pdf = merged_pdf
                            st.success("✓ PDFs merged successfully!")
                        except Exception as e:
                            st.error(f"Error merging PDFs: {str(e)}")
        else:
            st.warning("⚠️ Add at least 2 PDF files to merge")
        
        # Download button
        if st.session_state.merged_pdf:
            st.markdown('<div class="success-message">✓ PDFs merged successfully! Click the download button to save your file.</div>', unsafe_allow_html=True)
            
            col1, col2, col3 = st.columns([1, 1, 1])
            with col2:
                st.download_button(
                    label="📥 Download Merged PDF",
                    data=st.session_state.merged_pdf,
                    file_name="merged-document.pdf",
                    mime="application/pdf",
                    type="primary",
                    use_container_width=True
                )


# ============================================
# TAB 2: SPLIT PDF
# ============================================
with tab2:
    st.markdown("### Upload PDF to Split")
    
    uploaded_file = st.file_uploader(
        "Drag and drop a PDF file here, or click to browse",
        type=['pdf'],
        key="split_uploader",
        help="Upload a single PDF to split into multiple files"
    )
    
    if uploaded_file:
        # Get page count
        uploaded_file.seek(0)
        pdf_reader = PdfReader(uploaded_file)
        page_count = len(pdf_reader.pages)
        
        st.markdown(f"### 📄 {uploaded_file.name}")
        st.caption(f"{page_count} pages • {format_file_size(uploaded_file.size)}")
        
        st.markdown("---")
        st.markdown("### Split Options")
        
        split_mode = st.radio(
            "Choose how to split the PDF:",
            ["individual", "ranges", "custom"],
            format_func=lambda x: {
                "individual": "Split into individual pages",
                "ranges": "Split by page ranges",
                "custom": "Custom page ranges"
            }[x]
        )
        
        if split_mode == "individual":
            st.info(f"Each page will be saved as a separate PDF file ({page_count} files)")
        
        elif split_mode == "ranges":
            pages_per_file = st.number_input(
                "Pages per file:",
                min_value=1,
                max_value=page_count,
                value=min(2, page_count),
                step=1
            )
            num_files = -(-page_count // pages_per_file)  # Ceiling division
            st.info(f"Will create {num_files} files with {pages_per_file} pages each")
        
        elif split_mode == "custom":
            st.markdown("Specify page ranges to extract:")
            
            if 'custom_ranges' not in st.session_state:
                st.session_state.custom_ranges = [(1, 1)]
            
            # Display range inputs
            ranges_to_remove = []
            for idx, (start, end) in enumerate(st.session_state.custom_ranges):
                col1, col2, col3, col4, col5 = st.columns([1.5, 1.5, 0.3, 1.5, 1])
                
                with col1:
                    st.markdown(f"**Range {idx + 1}:**")
                
                with col2:
                    new_start = st.number_input(
                        "From",
                        min_value=1,
                        max_value=page_count,
                        value=start,
                        key=f"start_{idx}",
                        label_visibility="collapsed"
                    )
                
                with col3:
                    st.markdown("**to**")
                
                with col4:
                    new_end = st.number_input(
                        "To",
                        min_value=1,
                        max_value=page_count,
                        value=end,
                        key=f"end_{idx}",
                        label_visibility="collapsed"
                    )
                
                with col5:
                    if len(st.session_state.custom_ranges) > 1:
                        if st.button("Remove", key=f"remove_{idx}"):
                            ranges_to_remove.append(idx)
                
                # Update the range
                st.session_state.custom_ranges[idx] = (new_start, new_end)
            
            # Remove marked ranges
            for idx in sorted(ranges_to_remove, reverse=True):
                st.session_state.custom_ranges.pop(idx)
            
            # Add range button
            if st.button("+ Add Range"):
                last_end = st.session_state.custom_ranges[-1][1] if st.session_state.custom_ranges else 0
                new_start = min(last_end + 1, page_count)
                st.session_state.custom_ranges.append((new_start, new_start))
                st.rerun()
        
        st.markdown("---")
        
        # Split button
        col1, col2, col3 = st.columns([1, 1, 1])
        with col2:
            if st.button("✂️ Split PDF", type="primary", use_container_width=True):
                with st.spinner("Splitting PDF..."):
                    try:
                        uploaded_file.seek(0)
                        
                        if split_mode == "individual":
                            split_files = split_pdf_individual(uploaded_file)
                        elif split_mode == "ranges":
                            split_files = split_pdf_ranges(uploaded_file, pages_per_file)
                        else:  # custom
                            split_files = split_pdf_custom(uploaded_file, st.session_state.custom_ranges)
                        
                        st.session_state.split_files = split_files
                        st.success(f"✓ PDF split into {len(split_files)} files successfully!")
                    except Exception as e:
                        st.error(f"Error splitting PDF: {str(e)}")
        
        # Download split files
        if st.session_state.split_files:
            st.markdown('<div class="success-message">✓ PDF split successfully! Download your files below.</div>', unsafe_allow_html=True)
            
            st.markdown("### Download Split Files")
            for filename, file_data in st.session_state.split_files:
                st.download_button(
                    label=f"📥 {filename}",
                    data=file_data,
                    file_name=filename,
                    mime="application/pdf",
                    key=f"download_{filename}"
                )


# ============================================
# TAB 3: PDF TO EDITABLE
# ============================================
with tab3:
    st.markdown("### Upload PDF to Extract Text")
    
    uploaded_file = st.file_uploader(
        "Drag and drop a PDF file here, or click to browse",
        type=['pdf'],
        key="convert_uploader",
        help="Upload a PDF to extract editable text"
    )
    
    if uploaded_file:
        st.markdown(f"### 📄 {uploaded_file.name}")
        st.caption(f"{format_file_size(uploaded_file.size)}")
        
        st.markdown("---")
        
        # Extract button
        if not st.session_state.extracted_text:
            col1, col2, col3 = st.columns([1, 1, 1])
            with col2:
                if st.button("📝 Extract Text", type="primary", use_container_width=True):
                    with st.spinner("Extracting text from PDF..."):
                        try:
                            uploaded_file.seek(0)
                            extracted_text = extract_text_from_pdf(uploaded_file)
                            st.session_state.extracted_text = extracted_text
                            st.rerun()
                        except Exception as e:
                            st.error(f"Error extracting text: {str(e)}")
            
            st.info("Text will be extracted and made editable")
        
        # Show extracted text editor
        if st.session_state.extracted_text:
            st.markdown('<div class="info-message">📝 Text extracted successfully! Edit as needed and download when ready.</div>', unsafe_allow_html=True)
            
            st.markdown("### Extracted Text")
            
            col1, col2 = st.columns([3, 1])
            with col2:
                if st.button("📋 Copy to Clipboard"):
                    st.info("Text copied! (Use your browser's copy function)")
            
            # Editable text area
            edited_text = st.text_area(
                "Edit the text below as needed:",
                value=st.session_state.extracted_text,
                height=400,
                label_visibility="collapsed"
            )
            st.session_state.extracted_text = edited_text
            
            st.caption("Edit the text above as needed before downloading")
            
            st.markdown("---")
            
            # Export options
            st.markdown("### Export Options")
            export_format = st.radio(
                "Choose export format:",
                ["txt", "docx"],
                format_func=lambda x: {
                    "txt": "Text File (.txt)",
                    "docx": "Word Document (.docx)"
                }[x],
                horizontal=True
            )
            
            st.markdown("---")
            
            # Download button
            col1, col2, col3 = st.columns([1, 1, 1])
            with col2:
                if export_format == "txt":
                    st.download_button(
                        label=f"📥 Download as TXT",
                        data=edited_text.encode('utf-8'),
                        file_name=f"{uploaded_file.name.replace('.pdf', '')}-extracted.txt",
                        mime="text/plain",
                        type="primary",
                        use_container_width=True
                    )
                else:
                    docx_data = create_docx_from_text(edited_text)
                    if docx_data:
                        st.download_button(
                            label=f"📥 Download as DOCX",
                            data=docx_data,
                            file_name=f"{uploaded_file.name.replace('.pdf', '')}-extracted.docx",
                            mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            type="primary",
                            use_container_width=True
                        )


# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #64748b; padding: 2rem 0;">
    <p>PDF Toolkit • Professional PDF Manipulation Tool</p>
</div>
""", unsafe_allow_html=True)
