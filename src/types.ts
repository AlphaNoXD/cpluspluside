export interface CppFile {
  id: string;
  name: string;
  content: string;
  isModified?: boolean;
  isStarter?: boolean;
}

export interface CompilerDiagnostic {
  line: number;
  column: number;
  message: string;
  rawMessage: string;
  severity: 'error' | 'warning';
}

export type ExecutionStatus = 'idle' | 'compiling' | 'running' | 'waiting_input' | 'finished' | 'error';

export interface ExecutionResult {
  stdout: string;
  exitCode: number;
  timeMs: number;
  error?: CompilerDiagnostic;
}
