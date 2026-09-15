import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { TabBar } from './components/TabBar';
import { EditorPane } from './components/EditorPane';
import { OutputPane } from './components/OutputPane';
import { HelpModal } from './components/HelpModal';
import { CloseConfirmModal } from './components/CloseConfirmModal';
import { ProjectModal } from './components/ProjectModal';
import { ConflictModal } from './components/ConflictModal';
import { STARTER_FILES } from './starterFiles';
import { CppExecutionSession, validateCppCode } from './cppEngine';
import { CppFile, ExecutionStatus, CompilerDiagnostic, ProjectData } from './types';
import { 
  fetchProjectFromCloud, 
  saveProjectToCloud, 
  subscribeToProject, 
  generateProjectId,
  testFirestoreConnection
} from './firebase';
import { GripVertical } from 'lucide-react';

const STORAGE_KEY_FILES = 'simple_cpp_ide_saved_files_v1';
const STORAGE_KEY_ACTIVE = 'simple_cpp_ide_active_id_v1';
const STORAGE_KEY_PROJECT_ID = 'simple_cpp_ide_project_id';

export default function App() {
  // Unique client identifier for this tab to avoid self-conflict detection
  const clientId = useRef<string>(`client-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`).current;

  // 1. Cloud Project State
  const [projectId, setProjectId] = useState<string | null>(() => {
    try {
      // Priority 1: URL parameter ?project=ABC123
      const params = new URLSearchParams(window.location.search);
      const urlProj = params.get('project');
      if (urlProj) return urlProj.trim().toUpperCase();

      // Priority 2: Local storage
      const stored = localStorage.getItem(STORAGE_KEY_PROJECT_ID);
      if (stored) return stored.trim().toUpperCase();
    } catch {}
    return null;
  });

  const [lastCloudUpdated, setLastCloudUpdated] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [conflictProject, setConflictProject] = useState<ProjectData | null>(null);

  // 2. Files & Tabs State
  const [files, setFiles] = useState<CppFile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load files from localStorage:', e);
    }
    return STARTER_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    try {
      const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (savedActive) return savedActive;
    } catch {}
    return STARTER_FILES[0]?.id || 'starter-main';
  });

  // 3. Execution State
  const [stdout, setStdout] = useState<string>('');
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [executionTimeMs, setExecutionTimeMs] = useState<number | undefined>(undefined);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [errorDiagnostic, setErrorDiagnostic] = useState<CompilerDiagnostic | null>(null);
  const [targetEditorLine, setTargetEditorLine] = useState<number | null>(null);

  // 4. UI Modals & Split Resizing
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [fileToClose, setFileToClose] = useState<CppFile | null>(null);
  const [splitPercent, setSplitPercent] = useState<number>(55);
  const isDraggingSplitRef = useRef(false);

  // Active execution session ref
  const sessionRef = useRef<CppExecutionSession | null>(null);

  // Get active file
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];
  const hasUnsavedChanges = files.some((f) => f.isModified);

  // Verify Firestore connection on mount
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Sync Project ID in URL & localStorage
  const updateActiveProjectId = useCallback((newId: string | null) => {
    setProjectId(newId);
    if (newId) {
      try {
        localStorage.setItem(STORAGE_KEY_PROJECT_ID, newId);
        const url = new URL(window.location.href);
        url.searchParams.set('project', newId);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY_PROJECT_ID);
        const url = new URL(window.location.href);
        url.searchParams.delete('project');
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  }, []);

  // Initial cloud project load when app starts
  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    const loadInitialProject = async () => {
      try {
        const cloudData = await fetchProjectFromCloud(projectId);
        if (isMounted && cloudData && cloudData.files.length > 0) {
          setFiles(cloudData.files);
          setActiveFileId(cloudData.files[0].id);
          setLastCloudUpdated(cloudData.lastUpdated);
        }
      } catch (err) {
        console.warn('Initial project cloud fetch error:', err);
      }
    };

    loadInitialProject();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Real-time synchronization for multi-device collaboration
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeToProject(
      projectId,
      (remoteProject) => {
        // Ignore updates initiated by this browser session
        if (remoteProject.lastUpdatedBy === clientId) {
          return;
        }

        // If remote is newer than our last synced state
        if (remoteProject.lastUpdated > lastCloudUpdated) {
          // If the user has local unsaved modifications, prompt them instead of silently overwriting
          const userHasDirtyFiles = files.some((f) => f.isModified);
          if (userHasDirtyFiles) {
            setConflictProject(remoteProject);
          } else {
            // Smoothly sync remote files without interrupting
            setFiles(remoteProject.files);
            setLastCloudUpdated(remoteProject.lastUpdated);
          }
        }
      },
      (err) => {
        console.warn('Realtime subscription issue:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [projectId, lastCloudUpdated, files, clientId]);

  // Local storage persistence fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeFileId);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [files, activeFileId]);

  // Real-time syntax validation (debounced 700ms)
  useEffect(() => {
    if (!activeFile) return;

    const timer = setTimeout(() => {
      if (executionStatus === 'idle' || executionStatus === 'finished') {
        const diag = validateCppCode(activeFile.content);
        if (diag) {
          setErrorDiagnostic(diag);
        } else {
          setErrorDiagnostic(null);
        }
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [activeFile?.content, executionStatus]);

  // Handle content change in editor
  const handleContentChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId
          ? { ...f, content: newContent, isModified: true }
          : f
      )
    );
  };

  // Create new file in current project
  const handleNewFile = () => {
    let baseName = 'untitled.cpp';
    let counter = 1;

    const existingNames = new Set(files.map((f) => f.name.toLowerCase()));
    while (existingNames.has(baseName.toLowerCase())) {
      counter++;
      baseName = `untitled_${counter}.cpp`;
    }

    const newFile: CppFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: baseName,
      content: `// ============================================
// ${baseName}
// ============================================

#include <iostream>

using namespace std;

int main() {
    cout << "Hello from ${baseName}!" << endl;
    return 0;
}
`,
      isModified: true,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  // Open / Upload local file
  const handleOpenFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      let fileName = file.name;
      if (!fileName.endsWith('.cpp') && !fileName.endsWith('.h') && !fileName.endsWith('.hpp')) {
        fileName += '.cpp';
      }

      const existing = files.find((f) => f.name.toLowerCase() === fileName.toLowerCase());
      if (existing) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === existing.id ? { ...f, content, isModified: true } : f
          )
        );
        setActiveFileId(existing.id);
      } else {
        const newFile: CppFile = {
          id: `upload-${Date.now()}`,
          name: fileName,
          content,
          isModified: true,
        };
        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
      }
    };
    reader.readAsText(file);
  };

  // Cloud Save Action (Primary Save: saves files to cloud, updates lastUpdated, shows "Saved" confirmation)
  const handleSaveToCloud = useCallback(async () => {
    let targetId = projectId;

    // If no project exists yet, generate a new project ID
    if (!targetId) {
      targetId = generateProjectId();
      updateActiveProjectId(targetId);
    }

    setIsSaving(true);
    try {
      const result = await saveProjectToCloud(targetId, files, clientId);
      if (result.success) {
        setLastCloudUpdated(result.lastUpdated);
        // Clear isModified flags
        setFiles((prev) => prev.map((f) => ({ ...f, isModified: false })));
        setIsSavedRecently(true);
        setTimeout(() => {
          setIsSavedRecently(false);
        }, 2500);
      } else {
        console.error('Save failed:', result.error);
        alert(`Failed to save to cloud: ${result.error}`);
      }
    } catch (err) {
      console.error('Error saving project:', err);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, files, clientId, updateActiveProjectId]);

  // Export current file (.cpp download option kept separate from primary Save)
  const handleExportFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open Project by ID handler
  const handleOpenProject = async (targetId: string): Promise<boolean> => {
    const clean = targetId.trim().toUpperCase();
    const data = await fetchProjectFromCloud(clean);
    if (!data) return false;

    updateActiveProjectId(clean);
    setFiles(data.files.map((f) => ({ ...f, isModified: false })));
    if (data.files.length > 0) {
      setActiveFileId(data.files[0].id);
    }
    setLastCloudUpdated(data.lastUpdated);
    return true;
  };

  // Create Project handler
  const handleCreateProject = async (newId: string, fromScratch: boolean): Promise<boolean> => {
    const clean = newId.trim().toUpperCase();
    const initialFiles = fromScratch ? STARTER_FILES : files;

    const result = await saveProjectToCloud(clean, initialFiles, clientId);
    if (!result.success) return false;

    updateActiveProjectId(clean);
    setFiles(initialFiles.map((f) => ({ ...f, isModified: false })));
    if (initialFiles.length > 0) {
      setActiveFileId(initialFiles[0].id);
    }
    setLastCloudUpdated(result.lastUpdated);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2500);
    return true;
  };

  // Conflict handling actions
  const handleLoadCloudVersion = () => {
    if (conflictProject) {
      setFiles(conflictProject.files.map((f) => ({ ...f, isModified: false })));
      setLastCloudUpdated(conflictProject.lastUpdated);
      setConflictProject(null);
    }
  };

  const handleKeepMyChanges = () => {
    setConflictProject(null);
  };

  // Close tab request
  const handleRequestCloseTab = (fileId: string) => {
    const targetFile = files.find((f) => f.id === fileId);
    if (!targetFile) return;

    if (targetFile.isModified) {
      setFileToClose(targetFile);
    } else {
      executeCloseTab(fileId);
    }
  };

  const executeCloseTab = (fileId: string) => {
    if (files.length <= 1) return;

    const targetIndex = files.findIndex((f) => f.id === fileId);
    const newFiles = files.filter((f) => f.id !== fileId);
    setFiles(newFiles);

    if (fileId === activeFileId) {
      const nextIndex = Math.min(targetIndex, newFiles.length - 1);
      setActiveFileId(newFiles[nextIndex].id);
    }
    setFileToClose(null);
  };

  // Rename file
  const handleRenameFile = (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: newName, isModified: true } : f))
    );
  };

  // Reset original starter examples
  const handleResetExamples = () => {
    if (window.confirm('Reset all starter example files to their default contents?')) {
      setFiles(STARTER_FILES);
      setActiveFileId(STARTER_FILES[0].id);
      setStdout('');
      setExecutionStatus('idle');
      setErrorDiagnostic(null);
    }
  };

  // Run C++ program
  const handleRun = useCallback(() => {
    if (!activeFile) return;

    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }

    setExecutionStatus('running');
    setExitCode(null);
    setErrorDiagnostic(null);
    setExecutionTimeMs(undefined);
    setStdout(`=== Running ${activeFile.name} ===\n`);

    const session = new CppExecutionSession(activeFile.content, {
      onStdout: (chunk: string) => {
        setStdout((prev) => prev + chunk);
      },
      onWaitingInput: () => {
        setExecutionStatus('waiting_input');
      },
      onComplete: (result) => {
        setExecutionStatus(result.error ? 'error' : 'finished');
        setExitCode(result.exitCode);
        setExecutionTimeMs(result.timeMs);
        if (result.error) {
          setErrorDiagnostic(result.error);
        }
        sessionRef.current = null;
      },
      onError: (diag) => {
        setExecutionStatus('error');
        setErrorDiagnostic(diag);
      },
    });

    sessionRef.current = session;
    session.start();
  }, [activeFile]);

  // Stop C++ program
  const handleStop = () => {
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
      setExecutionStatus('finished');
      setExitCode(130);
    }
  };

  // Submit stdin input to running program
  const handleSubmitInput = (val: string) => {
    if (sessionRef.current) {
      setExecutionStatus('running');
      sessionRef.current.provideInput(val);
    }
  };

  // Keyboard shortcut: Ctrl+Enter (Run) & Ctrl+S (Save to Cloud)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveToCloud();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, handleSaveToCloud]);

  // Split-pane drag handling
  const handleMouseDownSplitter = () => {
    isDraggingSplitRef.current = true;
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplitRef.current) return;
      const totalWidth = window.innerWidth;
      const newPercent = Math.max(25, Math.min(80, (e.clientX / totalWidth) * 100));
      setSplitPercent(newPercent);
    };

    const handleMouseUp = () => {
      if (isDraggingSplitRef.current) {
        isDraggingSplitRef.current = false;
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen h-[100dvh] w-screen max-w-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* 1. Top Navigation Bar */}
      <TopBar
        currentFileName={activeFile?.name || 'code.cpp'}
        executionStatus={executionStatus}
        projectId={projectId}
        isSaving={isSaving}
        isSavedRecently={isSavedRecently}
        hasUnsavedChanges={hasUnsavedChanges}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onSaveToCloud={handleSaveToCloud}
        onRun={handleRun}
        onStop={handleStop}
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onExportFile={handleExportFile}
        onResetExamples={handleResetExamples}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. File Tabs */}
      <TabBar
        files={files}
        activeFileId={activeFileId}
        onSelectTab={(id) => setActiveFileId(id)}
        onCloseTab={handleRequestCloseTab}
        onNewTab={handleNewFile}
        onRenameFile={handleRenameFile}
      />

      {/* 3. Main Workspace: Split Pane (Editor + Output) */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side: Code Editor */}
        <div
          className="w-full md:h-full flex-1 md:flex-none overflow-hidden"
          style={{
            width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${splitPercent}%` : '100%',
            height: typeof window !== 'undefined' && window.innerWidth >= 768 ? '100%' : '56%',
          }}
        >
          {activeFile && (
            <EditorPane
              key={activeFile.id}
              fileName={activeFile.name}
              content={activeFile.content}
              errorDiagnostic={errorDiagnostic}
              onChange={handleContentChange}
              targetLine={targetEditorLine}
            />
          )}
        </div>

        {/* Resizable Divider (Visible on Desktop) */}
        <div
          onMouseDown={handleMouseDownSplitter}
          className="hidden md:flex w-1.5 hover:w-2 bg-neutral-800 hover:bg-blue-500/80 transition-colors cursor-col-resize items-center justify-center select-none shrink-0 z-10 group"
          title="Drag to resize editor and console"
        >
          <GripVertical size={10} className="text-neutral-500 group-hover:text-white" />
        </div>

        {/* Right Side: Output Terminal (Traditional Black Monospace Console) */}
        <div 
          className="w-full md:h-full flex-1 md:flex-1 border-t md:border-t-0 md:border-l border-neutral-800 overflow-hidden"
          style={{
            width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${100 - splitPercent}%` : '100%',
            height: typeof window !== 'undefined' && window.innerWidth >= 768 ? '100%' : '44%',
          }}
        >
          <OutputPane
            stdout={stdout}
            executionStatus={executionStatus}
            executionTimeMs={executionTimeMs}
            exitCode={exitCode}
            errorDiagnostic={errorDiagnostic}
            onClearOutput={() => {
              setStdout('');
              setErrorDiagnostic(null);
            }}
            onSubmitInput={handleSubmitInput}
            onJumpToLine={(line) => {
              setTargetEditorLine(line);
              setTimeout(() => setTargetEditorLine(null), 100);
            }}
            onRun={handleRun}
            onStop={handleStop}
          />
        </div>
      </main>

      {/* Project Open / Create Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        currentProjectId={projectId}
        onOpenProject={handleOpenProject}
        onCreateProject={handleCreateProject}
      />

      {/* Cloud Conflict Alert Modal */}
      <ConflictModal
        isOpen={!!conflictProject}
        onLoadCloudVersion={handleLoadCloudVersion}
        onKeepMyChanges={handleKeepMyChanges}
      />

      {/* Beginner C++ Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onInsertSnippet={(snippet) => {
          if (activeFile) {
            handleContentChange(activeFile.content + '\n\n' + snippet);
          }
        }}
      />

      {/* Close File Confirmation Modal */}
      <CloseConfirmModal
        isOpen={!!fileToClose}
        fileName={fileToClose?.name || ''}
        onConfirmClose={() => {
          if (fileToClose) executeCloseTab(fileToClose.id);
        }}
        onCancel={() => setFileToClose(null)}
        onSaveAndClose={() => {
          handleSaveToCloud();
          if (fileToClose) executeCloseTab(fileToClose.id);
        }}
      />
    </div>
  );
}
