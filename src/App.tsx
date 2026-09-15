import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { TabBar } from './components/TabBar';
import { EditorPane } from './components/EditorPane';
import { OutputPane } from './components/OutputPane';
import { HelpModal } from './components/HelpModal';
import { CloseConfirmModal } from './components/CloseConfirmModal';
import { STARTER_FILES } from './starterFiles';
import { CppExecutionSession, validateCppCode } from './cppEngine';
import { CppFile, ExecutionStatus, CompilerDiagnostic } from './types';
import { GripVertical } from 'lucide-react';

const STORAGE_KEY_FILES = 'simple_cpp_ide_saved_files_v1';
const STORAGE_KEY_ACTIVE = 'simple_cpp_ide_active_id_v1';

export default function App() {
  // 1. Files & Tabs State
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

  // 2. Execution State
  const [stdout, setStdout] = useState<string>('');
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [executionTimeMs, setExecutionTimeMs] = useState<number | undefined>(undefined);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [errorDiagnostic, setErrorDiagnostic] = useState<CompilerDiagnostic | null>(null);
  const [targetEditorLine, setTargetEditorLine] = useState<number | null>(null);

  // 3. UI Modals & Split Resizing
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [fileToClose, setFileToClose] = useState<CppFile | null>(null);
  const [splitPercent, setSplitPercent] = useState<number>(55); // 55% editor, 45% console on desktop
  const isDraggingSplitRef = useRef(false);

  // Active execution session ref
  const sessionRef = useRef<CppExecutionSession | null>(null);

  // Get active file
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Save to localStorage when files or active tab change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeFileId);
    } catch (e) {
      console.warn('Storage quota exceeded or storage error:', e);
    }
  }, [files, activeFileId]);

  // Real-time syntax validation (debounced 700ms)
  useEffect(() => {
    if (!activeFile) return;

    const timer = setTimeout(() => {
      // Only perform background lint check if not actively executing
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

  // Create new file
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
      isModified: false,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  // Open / Upload file
  const handleOpenFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      let fileName = file.name;
      if (!fileName.endsWith('.cpp') && !fileName.endsWith('.h') && !fileName.endsWith('.hpp')) {
        fileName += '.cpp';
      }

      // Check if file already open
      const existing = files.find((f) => f.name.toLowerCase() === fileName.toLowerCase());
      if (existing) {
        // Update content and focus
        setFiles((prev) =>
          prev.map((f) =>
            f.id === existing.id ? { ...f, content, isModified: false } : f
          )
        );
        setActiveFileId(existing.id);
      } else {
        const newFile: CppFile = {
          id: `upload-${Date.now()}`,
          name: fileName,
          content,
          isModified: false,
        };
        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
      }
    };
    reader.readAsText(file);
  };

  // Save / Download current file
  const handleDownloadFile = () => {
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

    // Clear modified flag after download
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, isModified: false } : f))
    );
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
    if (files.length <= 1) return; // Keep at least one tab open

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
      prev.map((f) => (f.id === fileId ? { ...f, name: newName } : f))
    );
  };

  // Reset original examples
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

    // Terminate existing session if active
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

  // Keyboard shortcut: Ctrl+Enter (Run) & Ctrl+S (Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleDownloadFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, handleDownloadFile]);

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
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* 1. Top Navigation Bar */}
      <TopBar
        currentFileName={activeFile?.name || 'code.cpp'}
        executionStatus={executionStatus}
        onRun={handleRun}
        onStop={handleStop}
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onDownloadFile={handleDownloadFile}
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
            height: typeof window !== 'undefined' && window.innerWidth >= 768 ? '100%' : '58%',
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

        {/* Right Side: Output Terminal */}
        <div 
          className="w-full md:h-full flex-1 md:flex-1 border-t md:border-t-0 md:border-l border-neutral-800 overflow-hidden"
          style={{
            width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${100 - splitPercent}%` : '100%',
            height: typeof window !== 'undefined' && window.innerWidth >= 768 ? '100%' : '42%',
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
              // Reset trigger after tick
              setTimeout(() => setTargetEditorLine(null), 100);
            }}
          />
        </div>
      </main>

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
          handleDownloadFile();
          if (fileToClose) executeCloseTab(fileToClose.id);
        }}
      />
    </div>
  );
}
