import React, { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { ExecutionStatus, CompilerDiagnostic } from '../types';

interface OutputPaneProps {
  stdout: string;
  executionStatus: ExecutionStatus;
  executionTimeMs?: number;
  exitCode?: number | null;
  errorDiagnostic?: CompilerDiagnostic | null;
  onClearOutput: () => void;
  onSubmitInput: (value: string) => void;
  onJumpToLine: (line: number) => void;
}

export const OutputPane: React.FC<OutputPaneProps> = ({
  stdout,
  executionStatus,
  errorDiagnostic,
  onClearOutput,
  onSubmitInput,
  onJumpToLine,
}) => {
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isWaitingInput = executionStatus === 'waiting_input';

  // Automatically focus input when waiting for cin
  useEffect(() => {
    if (isWaitingInput) {
      inputRef.current?.focus();
    } else {
      setCurrentInput('');
    }
  }, [isWaitingInput]);

  // Keep terminal scrolled to bottom when stdout or input changes
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [stdout, currentInput, isWaitingInput]);

  // Clicking anywhere in the terminal directs focus to the cin input if active
  const handleTerminalClick = () => {
    if (isWaitingInput) {
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = currentInput;
      setCurrentInput('');
      onSubmitInput(val);
    }
  };

  return (
    <div 
      ref={containerRef}
      onClick={handleTerminalClick}
      className="w-full h-full flex flex-col bg-black text-neutral-200 font-mono text-xs select-text overflow-hidden cursor-text"
    >
      {/* Console Header Bar */}
      <div className="h-8 bg-neutral-900 border-b border-neutral-800/80 flex items-center justify-between px-3 text-neutral-300 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-300 tracking-wider text-[11px] uppercase">
            CONSOLE
          </span>
          {executionStatus === 'running' && (
            <span className="text-[10px] text-emerald-400 font-medium">
              [Running]
            </span>
          )}
        </div>

        <button
          id="clear-output-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClearOutput();
          }}
          title="Clear console"
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Trash2 size={11} />
          <span>Clear</span>
        </button>
      </div>

      {/* Terminal Screen (Traditional Black Monospace C++ Console) */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-[13px] leading-relaxed text-neutral-100">
        {!stdout && !errorDiagnostic && executionStatus === 'idle' && (
          <div className="text-neutral-400 text-xs py-1 select-none">
            Ready. Click <span className="text-emerald-400 font-semibold">Run ▶</span> to execute C++ code.
          </div>
        )}

        {/* Stdout and Inline Cursor for cin */}
        <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-neutral-100 select-text inline">
          {stdout}
          {isWaitingInput && (
            <span className="inline text-white">
              {currentInput}
              <span className="inline-block w-2 h-4 bg-neutral-200 animate-pulse ml-0.5 align-middle select-none" />
            </span>
          )}
        </pre>

        {/* Hidden input field capturing keystrokes for cin */}
        {isWaitingInput && (
          <input
            ref={inputRef}
            id="console-cin-input"
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="opacity-0 w-0 h-0 absolute pointer-events-none"
            autoFocus
          />
        )}

        {/* Error Output in standard terminal style */}
        {errorDiagnostic && (
          <div className="mt-3 pt-2 border-t border-rose-900/60 text-rose-300 font-mono text-xs">
            <div className="flex items-center justify-between text-rose-400 font-bold">
              <span>=== COMPILER ERROR (line {errorDiagnostic.line}) ===</span>
              {errorDiagnostic.line > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onJumpToLine(errorDiagnostic.line);
                  }}
                  className="px-2 py-0.5 rounded bg-rose-900/40 hover:bg-rose-800 text-rose-200 text-[11px] border border-rose-700/60 cursor-pointer"
                >
                  Jump to line {errorDiagnostic.line} →
                </button>
              )}
            </div>
            <p className="mt-1 text-rose-200 font-sans">{errorDiagnostic.message}</p>
            <pre className="mt-1 text-[11px] text-rose-400/80 whitespace-pre-wrap">{errorDiagnostic.rawMessage}</pre>
          </div>
        )}

        <div ref={terminalBottomRef} />
      </div>
    </div>
  );
};
