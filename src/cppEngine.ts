import JSCPP from 'JSCPP';
import { CompilerDiagnostic, ExecutionResult } from './types';

// Ensure standard includes exist in JSCPP
try {
  if (JSCPP && JSCPP.includes) {
    if (!JSCPP.includes['string']) {
      JSCPP.includes['string'] = { load() {} };
    }
    if (!JSCPP.includes['vector']) {
      JSCPP.includes['vector'] = { load() {} };
    }
  }
} catch {
  // Ignored in SSR or test
}

/**
 * Preprocesses beginner C++ code so common student patterns like:
 * - string name;
 * - string greeting = "hello";
 * - std::cout, std::cin, std::endl
 * work seamlessly without cryptic parser failures.
 */
export function preprocessCppCode(source: string): { code: string; lineMap: number[] } {
  const lines = source.split('\n');
  const transformedLines: string[] = [];
  const lineMap: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Normalize std:: namespace prefixes if student writes std::cout or std::cin
    line = line.replace(/\bstd::cout\b/g, 'cout');
    line = line.replace(/\bstd::cin\b/g, 'cin');
    line = line.replace(/\bstd::endl\b/g, 'endl');
    line = line.replace(/\bstd::string\b/g, 'string');
    line = line.replace(/\bstd::vector\b/g, 'vector');

    // Handle beginner string declarations:
    // 1) string name; -> char name[256];
    line = line.replace(/\bstring\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;/g, 'char $1[256];');
    // 2) string name = "text"; -> char name[] = "text";
    line = line.replace(/\bstring\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(".*?");/g, 'char $1[] = $2;');

    transformedLines.push(line);
    lineMap.push(i + 1);
  }

  return {
    code: transformedLines.join('\n'),
    lineMap,
  };
}

/**
 * Parses raw error strings into beginner-friendly structured diagnostics.
 */
export function parseCompilerError(err: unknown, originalSource: string): CompilerDiagnostic {
  const raw = err instanceof Error ? err.message : String(err);
  let line = 1;
  let column = 1;

  // Match pattern: line 5 (column 10)
  const lineColMatch = raw.match(/line\s+(\d+)\s+\(column\s+(\d+)\)/i);
  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10);
    column = parseInt(lineColMatch[2], 10);
  } else {
    // Match pattern: 5:10
    const shortMatch = raw.match(/(\d+):(\d+)/);
    if (shortMatch) {
      line = parseInt(shortMatch[1], 10);
      column = parseInt(shortMatch[2], 10);
    }
  }

  const lines = originalSource.split('\n');
  const targetLineText = lines[line - 1] || '';

  // Generate beginner-friendly explanation
  let friendly = '';
  if (raw.includes('Expected') && raw.includes('";"')) {
    friendly = `Missing semicolon ';' before or on this line. Check if you forgot ';' at the end of line ${Math.max(1, line - 1)} or line ${line}.`;
  } else if (raw.includes('Expected') && raw.includes('end of input')) {
    friendly = `Unexpected end of file. Check for a missing closing brace '}' or parenthesis ')'.`;
  } else if (raw.includes('type') && raw.includes('is not defined')) {
    const typeMatch = raw.match(/type\s+([a-zA-Z0-9_]+)\s+is not defined/);
    const typeName = typeMatch ? typeMatch[1] : 'unknown';
    friendly = `Type '${typeName}' is not recognized. Did you spell it correctly? (e.g., int, float, double, char, bool, string)`;
  } else if (raw.includes('cannot find library')) {
    const libMatch = raw.match(/cannot find library:\s*(\S+)/);
    friendly = `Header '${libMatch ? libMatch[1] : ''}' is not available. Try using <iostream>, <cmath>, or <string>.`;
  } else if (raw.includes('Time limit exceeded')) {
    friendly = `Infinite loop detected! Your program ran longer than 5 seconds without finishing. Check your 'while' or 'for' loop condition.`;
  } else if (raw.includes('target string buffer is') && raw.includes('too short')) {
    friendly = `The entered text is longer than the storage buffer.`;
  } else if (raw.includes('not defined')) {
    friendly = `A variable or function used here hasn't been defined yet. Make sure you declare variables before using them.`;
  } else {
    friendly = raw.replace(/^ERROR:\s*/i, '').replace(/^Parsing Failure:\s*/i, '').trim();
    if (friendly.length > 180) {
      friendly = friendly.slice(0, 180) + '...';
    }
  }

  return {
    line,
    column,
    message: friendly,
    rawMessage: raw,
    severity: 'error',
  };
}

/**
 * Validates C++ source code quickly and returns any compiler diagnostics.
 */
export function validateCppCode(source: string): CompilerDiagnostic | null {
  if (!source.trim()) return null;
  const { code } = preprocessCppCode(source);

  try {
    // Test compilation pass in debug mode without executing steps
    JSCPP.run(code, '', {
      debug: true,
      stdio: { write: () => {} },
    });
    return null;
  } catch (err) {
    return parseCompilerError(err, source);
  }
}

/**
 * Active execution manager for interactive execution with `cin` support
 */
export class CppExecutionSession {
  private isCancelled = false;
  private debuggerInstance: any = null;
  private accumulatedStdout = '';
  private startTime = 0;
  private onStdoutCallback: (chunk: string) => void;
  private onWaitingInputCallback: (promptHint?: string) => void;
  private onCompleteCallback: (result: ExecutionResult) => void;
  private onErrorCallback: (diagnostic: CompilerDiagnostic) => void;
  private originalSource: string;
  private stepTimer: any = null;

  constructor(
    source: string,
    callbacks: {
      onStdout: (chunk: string) => void;
      onWaitingInput: (promptHint?: string) => void;
      onComplete: (result: ExecutionResult) => void;
      onError: (diagnostic: CompilerDiagnostic) => void;
    }
  ) {
    this.originalSource = source;
    this.onStdoutCallback = callbacks.onStdout;
    this.onWaitingInputCallback = callbacks.onWaitingInput;
    this.onCompleteCallback = callbacks.onComplete;
    this.onErrorCallback = callbacks.onError;
  }

  public start() {
    this.isCancelled = false;
    this.accumulatedStdout = '';
    this.startTime = Date.now();

    const { code } = preprocessCppCode(this.originalSource);

    try {
      this.debuggerInstance = JSCPP.run(code, '', {
        debug: true,
        maxTimeout: 8000,
        stdio: {
          write: (s: string) => {
            this.accumulatedStdout += s;
            this.onStdoutCallback(s);
          },
        },
      });

      this.step();
    } catch (err) {
      const diag = parseCompilerError(err, this.originalSource);
      this.onErrorCallback(diag);
      this.onCompleteCallback({
        stdout: this.accumulatedStdout,
        exitCode: 1,
        timeMs: Date.now() - this.startTime,
        error: diag,
      });
    }
  }

  private step() {
    if (this.isCancelled || !this.debuggerInstance) return;

    const dbg = this.debuggerInstance;
    const maxStepsPerBatch = 500;
    let steps = 0;

    try {
      while (!dbg.done && steps < maxStepsPerBatch) {
        if (this.isCancelled) return;

        // Check if current or upcoming statement needs cin
        const cinVar = dbg.rt?.scope?.[0]?.variables?.['cin'];
        const cinBuf = cinVar ? cinVar.v.buf : '';
        const line = dbg.nextLine?.();

        // If line contains cin and input buffer is exhausted:
        if (line && line.includes('cin') && (!cinBuf || cinBuf.trim().length === 0)) {
          // Pause execution and wait for user input from console UI
          this.onWaitingInputCallback();
          return;
        }

        const res = dbg.continue();
        steps++;

        if (res !== false) {
          // Execution finished
          const exitCode = typeof res?.v === 'number' ? res.v : 0;
          const ensureNewline = this.accumulatedStdout.endsWith('\n') ? '' : '\n';
          const finishBanner = `${ensureNewline}=== Program finished ===\n`;
          this.accumulatedStdout += finishBanner;
          this.onStdoutCallback(finishBanner);
          this.onCompleteCallback({
            stdout: this.accumulatedStdout,
            exitCode,
            timeMs: Date.now() - this.startTime,
          });
          return;
        }
      }

      if (dbg.done) {
        const ensureNewline = this.accumulatedStdout.endsWith('\n') ? '' : '\n';
        const finishBanner = `${ensureNewline}=== Program finished ===\n`;
        this.accumulatedStdout += finishBanner;
        this.onStdoutCallback(finishBanner);
        this.onCompleteCallback({
          stdout: this.accumulatedStdout,
          exitCode: 0,
          timeMs: Date.now() - this.startTime,
        });
        return;
      }

      // Check timeout guard (5 seconds total runtime)
      if (Date.now() - this.startTime > 5000) {
        throw new Error('Time limit exceeded (possible infinite loop).');
      }

      // Yield to browser event loop to prevent UI freezing
      this.stepTimer = setTimeout(() => this.step(), 0);
    } catch (err) {
      const diag = parseCompilerError(err, this.originalSource);
      this.onErrorCallback(diag);
      this.onCompleteCallback({
        stdout: this.accumulatedStdout,
        exitCode: 1,
        timeMs: Date.now() - this.startTime,
        error: diag,
      });
    }
  }

  public provideInput(value: string) {
    if (this.isCancelled || !this.debuggerInstance) return;

    const formattedInput = value.endsWith('\n') ? value : value + '\n';
    this.accumulatedStdout += formattedInput;
    this.onStdoutCallback(formattedInput);

    const cinVar = this.debuggerInstance.rt?.scope?.[0]?.variables?.['cin'];
    if (cinVar) {
      cinVar.v.buf = (cinVar.v.buf || '') + formattedInput;
    }

    // Resume stepping
    this.step();
  }

  public stop() {
    this.isCancelled = true;
    if (this.stepTimer) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
    const ensureNewline = this.accumulatedStdout.endsWith('\n') ? '' : '\n';
    const stopBanner = `${ensureNewline}=== Program stopped ===\n`;
    this.accumulatedStdout += stopBanner;
    this.onStdoutCallback(stopBanner);
    this.onCompleteCallback({
      stdout: this.accumulatedStdout,
      exitCode: 130,
      timeMs: Date.now() - this.startTime,
    });
  }
}
