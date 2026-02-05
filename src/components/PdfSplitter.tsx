import { useState, useRef } from 'react';
import { Upload, FileText, Download, Loader2, Scissors, FileCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

type SplitMode = 'individual' | 'ranges' | 'custom';

interface SplitRange {
  id: string;
  start: number;
  end: number;
}

export function PdfSplitter() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(10); // Mock page count
  const [splitMode, setSplitMode] = useState<SplitMode>('individual');
  const [customRanges, setCustomRanges] = useState<SplitRange[]>([
    { id: '1', start: 1, end: 1 }
  ]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type === 'application/pdf') {
      setPdfFile(file);
      setIsSplit(false);
      // In a real implementation, we'd extract the actual page count
      setPageCount(Math.floor(Math.random() * 20) + 5);
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

  const addRange = () => {
    const lastRange = customRanges[customRanges.length - 1];
    const newStart = lastRange ? lastRange.end + 1 : 1;
    setCustomRanges([
      ...customRanges,
      { id: Math.random().toString(36).substr(2, 9), start: newStart, end: newStart }
    ]);
  };

  const updateRange = (id: string, field: 'start' | 'end', value: number) => {
    setCustomRanges(customRanges.map(range =>
      range.id === id ? { ...range, [field]: Math.max(1, Math.min(pageCount, value)) } : range
    ));
  };

  const removeRange = (id: string) => {
    if (customRanges.length > 1) {
      setCustomRanges(customRanges.filter(range => range.id !== id));
    }
  };

  const handleSplit = async () => {
    setIsSplitting(true);
    // Simulate splitting process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSplitting(false);
    setIsSplit(true);
  };

  const handleDownloadSplitFiles = () => {
    // In a real implementation, this would create and download the split PDFs
    let fileCount = 0;
    
    if (splitMode === 'individual') {
      fileCount = pageCount;
    } else if (splitMode === 'ranges') {
      const rangeSize = parseInt((document.getElementById('rangeSize') as HTMLInputElement)?.value || '2');
      fileCount = Math.ceil(pageCount / rangeSize);
    } else {
      fileCount = customRanges.length;
    }

    // Mock download
    for (let i = 0; i < fileCount; i++) {
      setTimeout(() => {
        const blob = new Blob(['Split PDF content'], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pdfFile?.name.replace('.pdf', '')}-part${i + 1}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }, i * 200);
    }
  };

  const getSplitDescription = () => {
    if (splitMode === 'individual') {
      return `Split into ${pageCount} separate files (one per page)`;
    } else if (splitMode === 'ranges') {
      const rangeSize = parseInt((document.getElementById('rangeSize') as HTMLInputElement)?.value || '2');
      return `Split into ${Math.ceil(pageCount / rangeSize)} files (${rangeSize} pages each)`;
    } else {
      return `Split into ${customRanges.length} custom files`;
    }
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
          <p className="text-slate-400 text-sm">Upload a single PDF to split</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      </Card>

      {/* PDF Info and Split Options */}
      {pdfFile && (
        <>
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded text-red-600">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-slate-900">{pdfFile.name}</p>
                <p className="text-slate-500 text-sm">{pageCount} pages</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-slate-900 mb-4">Split Options</h3>
              
              <div className="space-y-4">
                {/* Individual Pages Option */}
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{ borderColor: splitMode === 'individual' ? 'rgb(59 130 246)' : 'rgb(226 232 240)' }}
                >
                  <input
                    type="radio"
                    name="splitMode"
                    value="individual"
                    checked={splitMode === 'individual'}
                    onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-slate-900">Split into individual pages</div>
                    <div className="text-slate-500 text-sm">Each page will be saved as a separate PDF file</div>
                  </div>
                </label>

                {/* Equal Ranges Option */}
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{ borderColor: splitMode === 'ranges' ? 'rgb(59 130 246)' : 'rgb(226 232 240)' }}
                >
                  <input
                    type="radio"
                    name="splitMode"
                    value="ranges"
                    checked={splitMode === 'ranges'}
                    onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-slate-900">Split by page ranges</div>
                    <div className="text-slate-500 text-sm mb-3">Divide into equal sections</div>
                    {splitMode === 'ranges' && (
                      <div className="flex items-center gap-2">
                        <label className="text-slate-600 text-sm">Pages per file:</label>
                        <input
                          id="rangeSize"
                          type="number"
                          min="1"
                          max={pageCount}
                          defaultValue="2"
                          className="w-20 px-3 py-1 border border-slate-300 rounded text-sm"
                        />
                      </div>
                    )}
                  </div>
                </label>

                {/* Custom Ranges Option */}
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{ borderColor: splitMode === 'custom' ? 'rgb(59 130 246)' : 'rgb(226 232 240)' }}
                >
                  <input
                    type="radio"
                    name="splitMode"
                    value="custom"
                    checked={splitMode === 'custom'}
                    onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-slate-900 mb-1">Custom page ranges</div>
                    <div className="text-slate-500 text-sm mb-3">Specify exactly which pages to extract</div>
                    {splitMode === 'custom' && (
                      <div className="space-y-2">
                        {customRanges.map((range, index) => (
                          <div key={range.id} className="flex items-center gap-2">
                            <span className="text-slate-600 text-sm w-16">Range {index + 1}:</span>
                            <input
                              type="number"
                              min="1"
                              max={pageCount}
                              value={range.start}
                              onChange={(e) => updateRange(range.id, 'start', parseInt(e.target.value) || 1)}
                              className="w-20 px-3 py-1 border border-slate-300 rounded text-sm"
                            />
                            <span className="text-slate-600">to</span>
                            <input
                              type="number"
                              min="1"
                              max={pageCount}
                              value={range.end}
                              onChange={(e) => updateRange(range.id, 'end', parseInt(e.target.value) || 1)}
                              className="w-20 px-3 py-1 border border-slate-300 rounded text-sm"
                            />
                            {customRanges.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRange(range.id)}
                                className="text-slate-500 hover:text-red-600"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addRange}
                          className="mt-2"
                        >
                          + Add Range
                        </Button>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {!isSplit ? (
              <Button
                onClick={handleSplit}
                disabled={isSplitting}
                size="lg"
                className="min-w-40"
              >
                {isSplitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Splitting...
                  </>
                ) : (
                  <>
                    <Scissors className="mr-2 h-4 w-4" />
                    Split PDF
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleDownloadSplitFiles} size="lg" className="min-w-40">
                <Download className="mr-2 h-4 w-4" />
                Download All Files
              </Button>
            )}
          </div>

          {/* Info Message */}
          {!isSplit && (
            <p className="text-center text-slate-500 text-sm">
              {getSplitDescription()}
            </p>
          )}

          {isSplit && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                <FileCheck className="inline h-4 w-4 mr-2" />
                PDF split successfully! Click the download button to save your files.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
