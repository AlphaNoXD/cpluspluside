import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Trash2, 
  CornerDownLeft, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  ArrowRightCircle
} from 'lucide-react';
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
  executionTimeMs,
  exitCode,
  errorDiagnostic,
  onClearOutput,
  onSubmitInput,
  onJumpToLine,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  const isWaitingInput = executionStatus === 'waiting_input';

  // Auto-focus the input box when waiting for input
  useEffect(() => {
    if (isWaitingInput) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isWaitingInput]);

  // Scroll to bottom when output or input status changes
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [stdout, isWaitingInput, errorDiagnostic]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isWaitingInput) return;
    const val = inputValue;
    setInputValue('');
    onSubmitInput(val);
  };

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 border-neutral-800 font-mono text-xs select-text overflow-hidden">
      {/* Console Header Bar */}
      <div className="h-8 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-3 text-neutral-300 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-emerald-400" />
          <span className="font-semibold text-neutral-200 tracking-wider text-[11px] uppercase">
            Output Console
          </span>

          {/* Execution Status Badge */}
          {executionStatus === 'running' && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 border border-blue-700/50">
              <Loader2 size={10} className="animate-spin" />
              Running...
            </span>
          )}
          {executionStatus === 'waiting_input' && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/50 animate-pulse">
              <CornerDownLeft size={10} />
              Waiting for cin input...
            </span>
          )}
          {executionStatus === 'finished' && exitCode !== undefined && (
            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
              exitCode === 0 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' 
                : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
            }`}>
              <CheckCircle2 size={10} />
              Exit code {exitCode}
            </span>
          )}
          {executionStatus === 'error' && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800/60">
              <AlertCircle size={10} />
              Compilation Failed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {executionTimeMs !== undefined && executionTimeMs > 0 && (
            <span className="text-[10px] text-neutral-400 flex items-center gap-1 mr-1">
              <Clock size={11} />
              {executionTimeMs}ms
            </span>
          )}

          <button
            id="clear-output-btn"
            onClick={onClearOutput}
            title="Clear output console"
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
            <span className="hidden sm:inline">Clear Output</span>
          </button>
        </div>
      </div>

      {/* Terminal Content Screen */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-[13px] leading-relaxed text-neutral-100 space-y-2">
        {/* Welcome / Empty state prompt */}
        {!stdout && !errorDiagnostic && executionStatus === 'idle' && (
          <div className="text-neutral-400 text-xs py-2 select-none">
            <p>Ready. Click <span className="text-emerald-400 font-semibold">Run ▶</span> to compile and execute the active file in your browser.</p>
            <p className="mt-1 text-[11px] text-neutral-400">Everything runs client-side with full support for <code className="text-blue-300">cout</code>, <code className="text-blue-300">cin</code>, variables, loops, conditions, and functions.</p>
          </div>
        )}

        {/* Stdout Output Stream */}
        {stdout && (
          <pre className="whitespace-pre-wrap break-words font-mono text-neutral-100">
            {stdout}
          </pre>
        )}

        {/* Interactive In-Console Input Box (Appears when cin is requested) */}
        {isWaitingInput && (
          <form
            onSubmit={handleSubmit}
            className="my-2 p-2.5 rounded-lg bg-neutral-900 border border-amber-500/40 shadow-lg flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between text-[11px] text-amber-300 font-sans font-medium">
              <span className="flex items-center gap-1">
                <CornerDownLeft size={12} />
                Program is waiting for your input (cin):
              </span>
              <span className="text-neutral-400 text-[10px]">Press Enter to send</span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <input
                ref={inputRef}
                id="console-cin-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your input here (e.g. Ben)..."
                className="flex-1 bg-neutral-950 text-neutral-100 px-3 py-1.5 rounded border border-neutral-700 focus:border-amber-400 focus:outline-none font-mono text-xs shadow-inner"
              />
              <button
                type="submit"
                id="console-cin-submit-btn"
                className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-sans font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Submit</span>
                <ArrowRightCircle size={13} />
              </button>
            </div>
          </form>
        )}

        {/* Compiler / Runtime Error Display Card */}
        {errorDiagnostic && (
          <div className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300 text-xs tracking-wide">
                    COMPILER ERROR
                  </span>
                  {errorDiagnostic.line > 0 && (
                    <button
                      onClick={() => onJumpToLine(errorDiagnostic.line)}
                      title="Click to jump to this line in editor"
                      className="px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 text-[11px] border border-rose-700/60 transition-colors cursor-pointer font-semibold"
                    >
                      Line {errorDiagnostic.line} →
                    </button>
                  )}
                </div>

                <div className="mt-1.5 text-xs text-rose-100 font-sans">
                  <strong>Explanation for Beginners:</strong>
                  <p className="mt-0.5">{errorDiagnostic.message}</p>
                </div>

                {/* Raw Compiler Message */}
                <div className="mt-2 pt-2 border-t border-rose-900/60 font-mono text-[11px] text-rose-300/80 whitespace-pre-wrap break-all">
                  {errorDiagnostic.rawMessage}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={terminalBottomRef} />
      </div>
    </div>
  );
};
