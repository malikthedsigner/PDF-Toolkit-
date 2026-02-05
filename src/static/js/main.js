// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.dataset.tab;
        
        // Remove active class from all tabs and buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// Loading overlay functions
function showLoading(text = 'Processing...') {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// Show error message
function showError(message) {
    alert('Error: ' + message);
}

// ============================================
// MERGE PDFs
// ============================================

let mergeFiles = [];

// Helper function to handle file upload with progress
async function uploadFilesWithProgress(files, endpoint, progressElementId, isMultiple = false) {
    const formData = new FormData();
    
    // Determine field name based on isMultiple parameter
    const fieldName = isMultiple ? 'files' : 'file';
    files.forEach(file => formData.append(fieldName, file));
    
    // Show progress bar
    const progressDiv = document.getElementById(progressElementId);
    const progressFill = document.getElementById(progressElementId.replace('progress', 'progress-fill'));
    const progressPercent = document.getElementById(progressElementId.replace('progress', 'progress-percent'));
    
    progressDiv.style.display = 'block';
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';
    
    // Simulate progress for better UX - start at 10%
    let simulatedProgress = 10;
    const simulationInterval = setInterval(() => {
        if (simulatedProgress < 90) {
            simulatedProgress += Math.random() * 30;
            if (simulatedProgress > 90) simulatedProgress = 90;
            progressFill.style.width = simulatedProgress + '%';
            progressPercent.textContent = Math.round(simulatedProgress) + '%';
        }
    }, 200);
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track actual upload progress
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = Math.max(simulatedProgress, Math.round((e.loaded / e.total) * 100));
                progressFill.style.width = percentComplete + '%';
                progressPercent.textContent = percentComplete + '%';
            }
        });
        
        xhr.addEventListener('load', () => {
            clearInterval(simulationInterval);
            
            // Animate to 100%
            progressFill.style.width = '100%';
            progressPercent.textContent = '100%';
            
            // Keep progress bar visible for a moment
            setTimeout(() => {
                progressDiv.style.display = 'none';
            }, 500);
            
            if (xhr.status === 200 || xhr.status === 201) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (e) {
                    reject(new Error('Invalid response format'));
                }
            } else {
                const errorMsg = xhr.responseText ? JSON.parse(xhr.responseText).error : 'Upload failed';
                reject(new Error(errorMsg));
            }
        });
        
        xhr.addEventListener('error', () => {
            clearInterval(simulationInterval);
            progressDiv.style.display = 'none';
            reject(new Error('Network error during upload'));
        });
        
        xhr.addEventListener('abort', () => {
            clearInterval(simulationInterval);
            progressDiv.style.display = 'none';
            reject(new Error('Upload cancelled'));
        });
        
        xhr.open('POST', endpoint);
        xhr.send(formData);
    });
}

document.getElementById('merge-file-input').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    showLoading('Processing files...');
    
    try {
        const data = await uploadFilesWithProgress(files, '/merge/upload', 'merge-progress', true);

        if (data.success) {
            // Append new files if some already exist, otherwise set
            if (mergeFiles && mergeFiles.length) {
                mergeFiles = mergeFiles.concat(data.files);
            } else {
                mergeFiles = data.files;
            }
            renderMergeFiles();
            document.getElementById('merge-files-container').style.display = 'block';
            document.getElementById('merge-upload-area').style.display = 'none';
            // Reset input so same file(s) can be selected again if needed
            document.getElementById('merge-file-input').value = '';
        } else {
            showError(data.error || 'Failed to upload files');
        }
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

// Trigger file picker to add more files
function addMoreMergeFiles() {
    document.getElementById('merge-file-input').click();
}

function renderMergeFiles() {
    const list = document.getElementById('merge-files-list');
    const count = document.getElementById('merge-file-count');
    
    count.textContent = mergeFiles.length;
    list.innerHTML = '';
    
    mergeFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <div class="file-number">${index + 1}</div>
            <div class="file-details">
                <div class="file-name">📄 ${file.name}</div>
                <div class="file-meta">${file.size} • ${file.pages} pages</div>
            </div>
            <div class="file-controls">
                <button class="btn-icon" onclick="moveFile(${index}, ${index - 1})" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button class="btn-icon" onclick="moveFile(${index}, ${index + 1})" ${index === mergeFiles.length - 1 ? 'disabled' : ''}>↓</button>
            </div>
        `;
        list.appendChild(item);
    });
    
    // Hide merge result when files change
    document.getElementById('merge-result').style.display = 'none';
}

async function moveFile(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= mergeFiles.length) return;
    
    try {
        const response = await fetch('/merge/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: fromIndex, to: toIndex })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Swap in local array
            [mergeFiles[fromIndex], mergeFiles[toIndex]] = [mergeFiles[toIndex], mergeFiles[fromIndex]];
            renderMergeFiles();
        }
    } catch (error) {
        showError('Failed to reorder files');
    }
}

async function mergePDFs() {
    if (mergeFiles.length < 2) {
        showError('Need at least 2 files to merge');
        return;
    }
    
    showLoading('Merging PDFs...');
    
    try {
        const response = await fetch('/merge/process', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('merge-result').style.display = 'block';
        } else {
            showError(data.error || 'Failed to merge PDFs');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        hideLoading();
    }
}

function downloadMerged() {
    window.location.href = '/merge/download';
}

function clearMergeFiles() {
    mergeFiles = [];
    document.getElementById('merge-files-container').style.display = 'none';
    document.getElementById('merge-upload-area').style.display = 'block';
    document.getElementById('merge-file-input').value = '';
    
    fetch('/clear/merge', { method: 'POST' });
}

// ============================================
// SPLIT PDF
// ============================================

let splitFileInfo = null;
let customRanges = [{ start: 1, end: 1 }];

document.getElementById('split-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    showLoading('Processing file...');
    
    try {
        const data = await uploadFilesWithProgress([file], '/split/upload', 'split-progress', false);
        
        if (data.success) {
            splitFileInfo = data;
            document.getElementById('split-container').style.display = 'block';
            document.getElementById('split-upload-area').style.display = 'none';
            
            document.getElementById('split-file-info').innerHTML = `
                <h4>📄 ${data.name}</h4>
                <p>${data.pages} pages • ${data.size}</p>
            `;
            
            // Reset and update split options
            updateSplitMode();
            document.getElementById('split-result').style.display = 'none';
        } else {
            showError(data.error || 'Failed to upload file');
        }
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

// Split mode radio buttons
document.querySelectorAll('input[name="split-mode"]').forEach(radio => {
    radio.addEventListener('change', updateSplitMode);
});

document.getElementById('pages-per-file').addEventListener('input', updateSplitMode);

function updateSplitMode() {
    const mode = document.querySelector('input[name="split-mode"]:checked').value;
    const infoDiv = document.getElementById('split-mode-info');
    const rangesInput = document.getElementById('ranges-input');
    const customRangesDiv = document.getElementById('custom-ranges');
    
    rangesInput.style.display = 'none';
    customRangesDiv.style.display = 'none';
    
    if (!splitFileInfo) return;
    
    if (mode === 'individual') {
        infoDiv.textContent = `Each page will be saved as a separate PDF file (${splitFileInfo.pages} files)`;
    } else if (mode === 'ranges') {
        rangesInput.style.display = 'block';
        const pagesPerFile = parseInt(document.getElementById('pages-per-file').value) || 2;
        const numFiles = Math.ceil(splitFileInfo.pages / pagesPerFile);
        infoDiv.textContent = `Will create ${numFiles} files with ${pagesPerFile} pages each`;
    } else if (mode === 'custom') {
        customRangesDiv.style.display = 'block';
        infoDiv.textContent = 'Specify page ranges to extract:';
        renderCustomRanges();
    }
}

function renderCustomRanges() {
    const list = document.getElementById('custom-ranges-list');
    list.innerHTML = '';
    
    customRanges.forEach((range, index) => {
        const item = document.createElement('div');
        item.className = 'custom-range-item';
        item.innerHTML = `
            <label>Range ${index + 1}:</label>
            <input type="number" min="1" max="${splitFileInfo.pages}" value="${range.start}" 
                   onchange="updateCustomRange(${index}, 'start', this.value)">
            <span>to</span>
            <input type="number" min="1" max="${splitFileInfo.pages}" value="${range.end}" 
                   onchange="updateCustomRange(${index}, 'end', this.value)">
            ${customRanges.length > 1 ? `<button class="btn-secondary" onclick="removeCustomRange(${index})">Remove</button>` : ''}
        `;
        list.appendChild(item);
    });
}

function updateCustomRange(index, field, value) {
    customRanges[index][field] = parseInt(value);
}

function addCustomRange() {
    const lastEnd = customRanges.length > 0 ? customRanges[customRanges.length - 1].end : 0;
    const newStart = Math.min(lastEnd + 1, splitFileInfo.pages);
    customRanges.push({ start: newStart, end: newStart });
    renderCustomRanges();
}

function removeCustomRange(index) {
    if (customRanges.length > 1) {
        customRanges.splice(index, 1);
        renderCustomRanges();
    }
}

async function splitPDF() {
    const mode = document.querySelector('input[name="split-mode"]:checked').value;
    
    showLoading('Splitting PDF...');
    
    const payload = { mode };
    
    if (mode === 'ranges') {
        payload.pages_per_file = parseInt(document.getElementById('pages-per-file').value);
    } else if (mode === 'custom') {
        payload.ranges = customRanges;
    }
    
    try {
        const response = await fetch('/split/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.success) {
            const resultDiv = document.getElementById('split-result');
            const filesList = document.getElementById('split-files-list');
            
            filesList.innerHTML = '';
            data.files.forEach((filename, index) => {
                const btn = document.createElement('a');
                btn.href = `/split/download/${index}`;
                btn.className = 'btn-download';
                btn.textContent = `📥 ${filename}`;
                filesList.appendChild(btn);
            });
            
            resultDiv.style.display = 'block';
        } else {
            showError(data.error || 'Failed to split PDF');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ============================================
// PDF TO EDITABLE
// ============================================

let convertFileInfo = null;

document.getElementById('convert-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    showLoading('Processing file...');
    
    try {
        const data = await uploadFilesWithProgress([file], '/convert/upload', 'convert-progress', false);
        
        if (data.success) {
            convertFileInfo = data;
            document.getElementById('convert-container').style.display = 'block';
            document.getElementById('convert-upload-area').style.display = 'none';
            
            document.getElementById('convert-file-info').innerHTML = `
                <h4>📄 ${data.name}</h4>
                <p>${data.size}</p>
            `;
            
            document.getElementById('convert-extract-section').style.display = 'block';
            document.getElementById('convert-editor').style.display = 'none';
        } else {
            showError(data.error || 'Failed to upload file');
        }
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

async function extractText() {
    showLoading('Extracting text from PDF...');
    
    try {
        const response = await fetch('/convert/extract', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('extracted-text').value = data.text;
            document.getElementById('convert-extract-section').style.display = 'none';
            document.getElementById('convert-editor').style.display = 'block';
        } else {
            showError(data.error || 'Failed to extract text');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Update text in session when user edits
let textUpdateTimeout;
document.getElementById('extracted-text').addEventListener('input', (e) => {
    clearTimeout(textUpdateTimeout);
    textUpdateTimeout = setTimeout(async () => {
        try {
            await fetch('/convert/update-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: e.target.value })
            });
        } catch (error) {
            console.error('Failed to update text:', error);
        }
    }, 1000);
});

function downloadConverted() {
    const format = document.querySelector('input[name="export-format"]:checked').value;
    window.location.href = `/convert/download/${format}`;
}

// Drag and drop for all upload areas
['merge', 'split', 'convert'].forEach(section => {
    const uploadArea = document.getElementById(`${section}-upload-area`);
    const fileInput = document.getElementById(`${section}-file-input`);
    
    if (!uploadArea || !fileInput) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.style.borderColor = '#3b82f6';
            uploadArea.style.background = '#eff6ff';
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.style.borderColor = '#cbd5e1';
            uploadArea.style.background = '#f8fafc';
        });
    });
    
    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        fileInput.files = files;
        fileInput.dispatchEvent(new Event('change'));
    });
});
