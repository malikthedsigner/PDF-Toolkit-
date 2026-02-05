import { useState, useRef } from 'react';
import { Upload, X, FileText, Download, Loader2, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface PdfFile {
  id: string;
  file: File;
  name: string;
}

interface DraggablePdfItemProps {
  pdf: PdfFile;
  index: number;
  movePdf: (dragIndex: number, hoverIndex: number) => void;
  removePdf: (id: string) => void;
  formatFileSize: (bytes: number) => string;
}

const ItemType = 'PDF_ITEM';

function DraggablePdfItem({ pdf, index, movePdf, removePdf, formatFileSize }: DraggablePdfItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      movePdf(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  preview(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div
        ref={drag}
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded text-red-600">
        <FileText className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-900 truncate">{pdf.name}</p>
        <p className="text-slate-500 text-sm">{formatFileSize(pdf.file.size)}</p>
      </div>
      <span className="text-slate-400 text-sm">#{index + 1}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => removePdf(pdf.id)}
        className="text-slate-500 hover:text-red-600"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PdfMerger() {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [isMerged, setIsMerged] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: PdfFile[] = Array.from(files)
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
      }));

    setPdfFiles(prev => [...prev, ...newFiles]);
    setIsMerged(false);
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

  const removePdf = (id: string) => {
    setPdfFiles(prev => prev.filter(pdf => pdf.id !== id));
    setIsMerged(false);
  };

  const movePdf = (dragIndex: number, hoverIndex: number) => {
    const updatedFiles = [...pdfFiles];
    const [draggedItem] = updatedFiles.splice(dragIndex, 1);
    updatedFiles.splice(hoverIndex, 0, draggedItem);
    setPdfFiles(updatedFiles);
    setIsMerged(false);
  };

  const handleMerge = async () => {
    setIsMerging(true);
    // Simulate merging process
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsMerging(false);
    setIsMerged(true);
  };

  const handleDownload = () => {
    // In a real implementation, this would download the merged PDF
    const blob = new Blob(['Merged PDF content'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged-document.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <DndProvider backend={HTML5Backend}>
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
              Drag and drop PDF files here, or click to browse
            </p>
            <p className="text-slate-400 text-sm">Only PDF files are supported</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </Card>

        {/* PDF List */}
        {pdfFiles.length > 0 && (
          <Card className="p-6">
            <h2 className="mb-4 text-slate-900">Uploaded PDFs ({pdfFiles.length})</h2>
            <div className="space-y-2">
              {pdfFiles.map((pdf, index) => (
                <DraggablePdfItem
                  key={pdf.id}
                  pdf={pdf}
                  index={index}
                  movePdf={movePdf}
                  removePdf={removePdf}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        {pdfFiles.length > 0 && (
          <div className="flex gap-4 justify-center">
            {!isMerged ? (
              <Button
                onClick={handleMerge}
                disabled={pdfFiles.length < 2 || isMerging}
                size="lg"
                className="min-w-40"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Merging...
                  </>
                ) : (
                  'Merge PDFs'
                )}
              </Button>
            ) : (
              <Button onClick={handleDownload} size="lg" className="min-w-40">
                <Download className="mr-2 h-4 w-4" />
                Download Merged PDF
              </Button>
            )}
          </div>
        )}

        {/* Info Message */}
        {pdfFiles.length === 1 && !isMerged && (
          <p className="text-center text-slate-500 text-sm">
            Add at least one more PDF to merge
          </p>
        )}

        {isMerged && (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✓ PDFs merged successfully! Click the download button to save your file.
            </p>
          </div>
        )}
      </div>
    </DndProvider>
  );
}