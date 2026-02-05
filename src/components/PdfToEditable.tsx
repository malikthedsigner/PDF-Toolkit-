import { useState, useRef } from 'react';
import { Upload, FileText, Download, Loader2, FileEdit, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

type ExportFormat = 'txt' | 'docx';

export function PdfToEditable() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('txt');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const mockExtractedText = `SAMPLE DOCUMENT

This is a demonstration of extracted text from a PDF document. In a real implementation, this would contain the actual text content extracted from your uploaded PDF file.

Key Features:
• Text extraction from PDF documents
• Edit extracted content directly
• Export to multiple formats (.txt or .docx)
• Copy to clipboard functionality

Document Structure:
The text preserves basic formatting and structure from the original PDF. Paragraphs, line breaks, and special characters are maintained wherever possible.

Additional Information:
You can edit this text directly in the editor below. Any changes you make will be included in your exported document.

This is useful for:
- Converting PDFs to editable documents
- Extracting text for further processing
- Creating editable copies of read-only PDFs
- Quick text extraction and editing

Once you're satisfied with the text, you can download it in your preferred format.`;

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type === 'application/pdf') {
      setPdfFile(file);
      setIsProcessed(false);
      setExtractedText('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleExtract = async () => {
    setIsProcessing(true);
    // Simulate text extraction process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setExtractedText(mockExtractedText);
    setIsProcessing(false);
    setIsProcessed(true);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([extractedText], { 
      type: exportFormat === 'txt' ? 'text/plain' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdfFile?.name.replace('.pdf', '')}-extracted.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="p-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-600 mb-2">
            Drag and drop a PDF file here, or click to browse
          </p>
          <p className="text-slate-400 text-sm">Upload a PDF to extract editable text</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      </Card>

      {/* PDF Info and Extract */}
      {pdfFile && !isProcessed && (
        <>
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded text-red-600">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-slate-900">{pdfFile.name}</p>
                <p className="text-slate-500 text-sm">Ready to extract text content</p>
              </div>
            </div>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleExtract}
              disabled={isProcessing}
              size="lg"
              className="min-w-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <FileEdit className="mr-2 h-4 w-4" />
                  Extract Text
                </>
              )}
            </Button>
          </div>

          {!isProcessing && (
            <p className="text-center text-slate-500 text-sm">
              Text will be extracted and made editable
            </p>
          )}
        </>
      )}

      {/* Extracted Text Editor */}
      {isProcessed && extractedText && (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900">Extracted Text</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
            
            <textarea
              ref={textAreaRef}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              className="w-full h-96 p-4 border border-slate-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Extracted text will appear here..."
            />
            
            <p className="text-slate-500 text-sm mt-2">
              Edit the text above as needed before downloading
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-slate-900 mb-4">Export Options</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value="txt"
                  checked={exportFormat === 'txt'}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                />
                <span className="text-slate-700">Text File (.txt)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value="docx"
                  checked={exportFormat === 'docx'}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                />
                <span className="text-slate-700">Word Document (.docx)</span>
              </label>
            </div>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button onClick={handleDownload} size="lg" className="min-w-40">
              <Download className="mr-2 h-4 w-4" />
              Download as {exportFormat.toUpperCase()}
            </Button>
          </div>

          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              <FileEdit className="inline h-4 w-4 mr-2" />
              Text extracted successfully! Edit as needed and download when ready.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
