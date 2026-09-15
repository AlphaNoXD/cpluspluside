import React, { useRef, useState } from 'react';
import { 
  Play, 
  Square, 
  FilePlus, 
  FolderOpen, 
  Download, 
  RotateCcw, 
  HelpCircle,
  Code2,
  Cloud,
  Save,
  Check,
  Copy,
  ChevronDown
} from 'lucide-react';
import { ExecutionStatus } from '../types';

interface TopBarProps {
  currentFileName: string;
  executionStatus: ExecutionStatus;
  projectId: string | null;
  isSaving: boolean;
  isSavedRecently: boolean;
  hasUnsavedChanges: boolean;
  onOpenProjectModal: () => void;
  onSaveToCloud: () => void;
  onRun: () => void;
  onStop: () => void;
  onNewFile: () => void;
  onOpenFile: (file: File) => void;
  onExportFile: () => void;
  onResetExamples: () => void;
  onOpenHelp: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentFileName,
  executionStatus,
  projectId,
  isSaving,
  isSavedRecently,
  hasUnsavedChanges,
  onOpenProjectModal,
  onSaveToCloud,
  onRun,
  onStop,
  onNewFile,
  onOpenFile,
  onExportFile,
  onResetExamples,
  onOpenHelp,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyProjectId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId) return;
    navigator.clipboard.writeText(projectId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isRunning = executionStatus === 'running' || executionStatus === 'waiting_input' || executionStatus === 'compiling';

  return (
    <header className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-3 sm:px-4 text-neutral-200 select-none shrink-0 z-20">
      {/* Left section: App Brand & Shared Project Badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold shrink-0">
            <Code2 size={18} />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-sm font-bold text-white tracking-tight">
              Simple C++ IDE
            </h1>
          </div>
        </div>

        <div className="h-5 w-px bg-neutral-800 mx-0.5 hidden sm:block" />

        {/* Project ID Indicator & Switcher */}
        {projectId ? (
          <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
            <Cloud size={13} className="text-emerald-400 shrink-0" />
            <span className="text-[11px] text-neutral-400 hidden md:inline">Project:</span>
            <button
              onClick={handleCopyProjectId}
              title="Click to copy Project ID for classmates"
              className="font-mono text-xs font-bold text-emerald-400 tracking-wider hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{projectId}</span>
              {copiedId ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={11} className="text-neutral-500 hover:text-neutral-300" />
              )}
            </button>
            <button
              onClick={onOpenProjectModal}
              title="Switch or open another project"
              className="ml-1 text-[10px] text-neutral-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              id="topbar-open-project-btn"
              onClick={onOpenProjectModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 transition-colors cursor-pointer"
            >
              <Cloud size={14} className="text-blue-400" />
              <span>Open / Create Project</span>
            </button>
          </div>
        )}

        {/* Cloud Save Button (Primary Action - saves files to cloud, never downloads) */}
        <div className="flex items-center gap-1.5">
          <button
            id="topbar-cloud-save-btn"
            onClick={onSaveToCloud}
            disabled={isSaving}
            title={projectId ? `Save changes to cloud project ${projectId}` : 'Save project to cloud'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer shadow-sm ${
              isSavedRecently
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                : hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60'
            }`}
          >
            {isSaving ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSavedRecently ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Save size={14} />
            )}
            <span>
              {isSaving ? 'Saving...' : isSavedRecently ? 'Saved' : 'Save'}
            </span>
          </button>
        </div>

        {/* File actions dropdown (New file, Open local file, Export .cpp) */}
        <div className="relative">
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/60 transition-colors cursor-pointer"
          >
            <span>Files</span>
            <ChevronDown size={12} className="text-neutral-400" />
          </button>

          {showFileMenu && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowFileMenu(false)} 
              />
              <div className="absolute left-0 mt-1 w-48 bg-neutral-900 border border-neutral-700/80 rounded-lg shadow-xl py-1 text-xs text-neutral-200 z-40">
                <button
                  onClick={() => {
                    setShowFileMenu(false);
                    onNewFile();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                >
                  <FilePlus size={13} className="text-neutral-400" />
                  <span>New File</span>
                </button>

                <button
                  onClick={() => {
                    setShowFileMenu(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                >
                  <FolderOpen size={13} className="text-neutral-400" />
                  <span>Import Local .cpp File</span>
                </button>

                <div className="my-1 border-t border-neutral-800" />

                <button
                  onClick={() => {
                    setShowFileMenu(false);
                    onExportFile();
                  }}
                  title={`Export ${currentFileName} to your computer`}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center gap-2 cursor-pointer text-neutral-300"
                >
                  <Download size={13} className="text-neutral-400" />
                  <span>Export {currentFileName}</span>
                </button>
              </div>
            </>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".cpp,.h,.hpp,.c,.txt"
            className="hidden"
          />
        </div>
      </div>

      {/* Right section: Run / Stop & Utilities */}
      <div className="flex items-center gap-2">
        {/* Run / Stop Button */}
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

        {/* Reset Examples */}
        <button
          id="topbar-reset-btn"
          onClick={onResetExamples}
          title="Restore original beginner example files"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          <span className="hidden lg:inline">Reset Examples</span>
        </button>

        {/* Help */}
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
