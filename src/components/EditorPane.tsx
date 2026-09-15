import React, { useRef, useEffect } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { registerCppCompletions } from '../monacoConfig';
import { CompilerDiagnostic } from '../types';

interface EditorPaneProps {
  content: string;
  fileName: string;
  errorDiagnostic?: CompilerDiagnostic | null;
  onChange: (value: string) => void;
  targetLine?: number | null;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  content,
  fileName,
  errorDiagnostic,
  onChange,
  targetLine,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register beginner-friendly C++ autocomplete
    registerCppCompletions(monaco);

    // Initial focus
    editor.focus();
  };

  // Update Monaco Error Markers whenever errorDiagnostic changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();

    if (!model) return;

    if (errorDiagnostic) {
      const markers = [
        {
          startLineNumber: errorDiagnostic.line,
          startColumn: errorDiagnostic.column || 1,
          endLineNumber: errorDiagnostic.line,
          endColumn: (errorDiagnostic.column || 1) + 10,
          message: errorDiagnostic.message,
          severity: monaco.MarkerSeverity.Error,
        },
      ];
      monaco.editor.setModelMarkers(model, 'cpp-linter', markers);
    } else {
      monaco.editor.setModelMarkers(model, 'cpp-linter', []);
    }
  }, [errorDiagnostic]);

  // Jump to specific line when instructed (e.g., clicking on error)
  useEffect(() => {
    if (targetLine && editorRef.current) {
      editorRef.current.revealLineInCenter(targetLine);
      editorRef.current.setPosition({ lineNumber: targetLine, column: 1 });
      editorRef.current.focus();
    }
  }, [targetLine]);

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-900 overflow-hidden">
      {/* Visual File Header bar */}
      <div className="h-7 bg-neutral-900/90 border-b border-neutral-800/60 flex items-center justify-between px-3 text-[11px] text-neutral-400 select-none">
        <span className="font-mono text-neutral-300">{fileName}</span>
        <div className="flex items-center gap-3">
          <span>C++ (C++17/20)</span>
          <span>UTF-8</span>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="flex-1 w-full h-full overflow-hidden">
        <Editor
          height="100%"
          language="cpp"
          value={content}
          theme="vs-dark"
          onChange={(val) => onChange(val ?? '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13.5,
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            minimap: { enabled: false },
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            matchBrackets: 'always',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            padding: { top: 8, bottom: 8 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
          }}
        />
      </div>
    </div>
  );
};
