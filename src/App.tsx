import { useState } from 'react';
import { PdfMerger } from './components/PdfMerger';
import { PdfSplitter } from './components/PdfSplitter';
import { PdfToEditable } from './components/PdfToEditable';
import { Combine, Scissors, FileEdit } from 'lucide-react';

type TabType = 'merge' | 'split' | 'convert';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('merge');

  const tabs = [
    { id: 'merge' as TabType, label: 'Merge PDFs', icon: Combine },
    { id: 'split' as TabType, label: 'Split PDF', icon: Scissors },
    { id: 'convert' as TabType, label: 'PDF to Editable', icon: FileEdit },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-slate-900 mb-2">PDF Toolkit</h1>
            <p className="text-slate-600">Merge, split, and convert your PDF documents</p>
          </header>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-white p-2 rounded-lg shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'merge' && <PdfMerger />}
          {activeTab === 'split' && <PdfSplitter />}
          {activeTab === 'convert' && <PdfToEditable />}
        </div>
      </div>
    </div>
  );
}