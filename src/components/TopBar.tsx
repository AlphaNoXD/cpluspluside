import React, { useRef } from 'react';
import { 
  Play, 
  Square, 
  FilePlus, 
  FolderOpen, 
  Download, 
  RotateCcw, 
  HelpCircle,
  Code2
} from 'lucide-react';
import { ExecutionStatus } from '../types';

interface TopBarProps {
  currentFileName: string;
  executionStatus: ExecutionStatus;
  onRun: () => void;
  onStop: () => void;
  onNewFile: () => void;
  onOpenFile: (file: File) => void;
  onDownloadFile: () => void;
  onResetExamples: () => void;
  onOpenHelp: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentFileName,
  executionStatus,
  onRun,
  onStop,
  onNewFile,
  onOpenFile,
  onDownloadFile,
  onResetExamples,
  onOpenHelp,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenFile(file);
    }
    // Reset value so uploading the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isRunning = executionStatus === 'running' || executionStatus === 'waiting_input' || executionStatus === 'compiling';

  return (
    <header className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-3 sm:px-4 text-neutral-200 select-none shrink-0 z-10">
      {/* Left section: App Brand & Quick Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
            <Code2 size={18} />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              Simple C++ IDE
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-semibold bg-neutral-800 text-neutral-400 rounded border border-neutral-700/60">
                Web
              </span>
            </h1>
          </div>
        </div>

        <div className="h-5 w-px bg-neutral-800 mx-1 hidden sm:block" />

        {/* Action Buttons: New, Open, Download */}
        <div className="flex items-center gap-1">
          <button
            id="topbar-new-file-btn"
            onClick={onNewFile}
            title="Create a new C++ file"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 transition-colors cursor-pointer"
          >
            <FilePlus size={14} className="text-neutral-400" />
            <span className="hidden md:inline">New File</span>
          </button>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".cpp,.h,.hpp,.c,.txt"
            className="hidden"
          />

          <button
            id="topbar-open-file-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Open/Upload a .cpp file from your computer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 transition-colors cursor-pointer"
          >
            <FolderOpen size={14} className="text-neutral-400" />
            <span className="hidden md:inline">Open File</span>
          </button>

          <button
            id="topbar-save-file-btn"
            onClick={onDownloadFile}
            title={`Download ${currentFileName} to your computer`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 transition-colors cursor-pointer"
          >
            <Download size={14} className="text-neutral-400" />
            <span className="hidden md:inline">Save / Download</span>
          </button>
        </div>
      </div>

      {/* Center / Right section: Run Button & Help */}
      <div className="flex items-center gap-2">
        {/* Run / Stop Primary Button */}
        {isRunning ? (
          <button
            id="topbar-stop-btn"
            onClick={onStop}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all cursor-pointer animate-pulse"
          >
            <Square size={13} fill="currentColor" />
            <span>Stop Program</span>
          </button>
        ) : (
          <button
            id="topbar-run-btn"
            onClick={onRun}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Play size={13} fill="currentColor" />
            <span>Run ▶</span>
          </button>
        )}

        <div className="h-5 w-px bg-neutral-800 mx-0.5 hidden sm:block" />

        {/* Reset Starter Files */}
        <button
          id="topbar-reset-btn"
          onClick={onResetExamples}
          title="Restore original beginner example files"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          <span className="hidden lg:inline">Reset Examples</span>
        </button>

        {/* C++ Beginner Help */}
        <button
          id="topbar-help-btn"
          onClick={onOpenHelp}
          title="Open beginner C++ cheat sheet"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-neutral-800/80 hover:bg-neutral-700 text-blue-300 border border-blue-500/20 transition-colors cursor-pointer"
        >
          <HelpCircle size={14} className="text-blue-400" />
          <span>C++ Help</span>
        </button>
      </div>
    </header>
  );
};
