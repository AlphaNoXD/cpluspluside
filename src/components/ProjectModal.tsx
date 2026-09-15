import React, { useState } from 'react';
import { Cloud, Plus, FolderOpen, Copy, Check, X, AlertCircle } from 'lucide-react';
import { generateProjectId } from '../firebase';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId: string | null;
  onOpenProject: (projectId: string) => Promise<boolean>;
  onCreateProject: (projectId: string, fromScratch: boolean) => Promise<boolean>;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  currentProjectId,
  onOpenProject,
  onCreateProject,
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'create'>('open');
  const [inputProjectId, setInputProjectId] = useState('');
  const [newProjectId, setNewProjectId] = useState(() => generateProjectId());
  const [useCurrentTabs, setUseCurrentTabs] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputProjectId.trim().toUpperCase();
    if (!clean) {
      setErrorMessage('Please enter a Project ID');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const ok = await onOpenProject(clean);
      if (ok) {
        onClose();
      } else {
        setErrorMessage(`Project "${clean}" was not found. Please check the ID or create a new project.`);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error opening project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newProjectId.trim().toUpperCase();
    if (!clean) {
      setErrorMessage('Project ID cannot be empty');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const ok = await onCreateProject(clean, !useCurrentTabs);
      if (ok) {
        onClose();
      } else {
        setErrorMessage('Failed to create project. Please try again.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error creating project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCurrentId = () => {
    if (!currentProjectId) return;
    navigator.clipboard.writeText(currentProjectId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-neutral-100">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud size={18} className="text-blue-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Cloud Project Sharing
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Project Info if already open */}
        {currentProjectId && (
          <div className="px-5 py-3 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Current Project:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                {currentProjectId}
              </span>
              <button
                onClick={handleCopyCurrentId}
                title="Copy Project ID for classmates"
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors text-[11px]"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1.5 m-4 mb-2 bg-neutral-950 rounded-lg border border-neutral-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveTab('open');
              setErrorMessage(null);
            }}
            className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'open'
                ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FolderOpen size={14} />
            <span>Open Project</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setNewProjectId(generateProjectId());
              setErrorMessage(null);
            }}
            className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus size={14} />
            <span>Create Project</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="px-5 pb-5 pt-2">
          {errorMessage && (
            <div className="mb-3 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'open' ? (
            <form onSubmit={handleOpen} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Enter Project ID:
                </label>
                <input
                  type="text"
                  value={inputProjectId}
                  onChange={(e) => setInputProjectId(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  maxLength={12}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3.5 py-2.5 font-mono text-sm tracking-widest uppercase text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 text-center"
                  autoFocus
                />
                <p className="mt-1.5 text-[11px] text-neutral-400">
                  Ask your classmate for their Project ID to open their files and collaborate.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !inputProjectId.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isLoading ? 'Opening...' : 'Open Project'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Generated Project ID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value.toUpperCase())}
                    maxLength={12}
                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3.5 py-2 font-mono text-base font-bold tracking-widest uppercase text-emerald-400 text-center focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewProjectId(generateProjectId())}
                    className="px-3 py-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 cursor-pointer"
                  >
                    Randomize
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-400">
                  Share this unique code with classmates so they can view and collaborate on the same files.
                </p>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useCurrentTabs}
                    onChange={(e) => setUseCurrentTabs(e.target.checked)}
                    className="rounded border-neutral-700 text-blue-600 focus:ring-0 bg-neutral-950"
                  />
                  <span>Save my currently edited code into this new project</span>
                </label>
                {!useCurrentTabs && (
                  <p className="ml-5 mt-0.5 text-[11px] text-neutral-400">
                    Will initialize with default starter files (main.cpp, variables.cpp, calculator.cpp, etc.)
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isLoading ? 'Creating...' : 'Create & Open'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
