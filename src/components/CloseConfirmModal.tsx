import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface CloseConfirmModalProps {
  isOpen: boolean;
  fileName: string;
  onConfirmClose: () => void;
  onCancel: () => void;
  onSaveAndClose?: () => void;
}

export const CloseConfirmModal: React.FC<CloseConfirmModalProps> = ({
  isOpen,
  fileName,
  onConfirmClose,
  onCancel,
  onSaveAndClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-5 select-none">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Unsaved Changes in "{fileName}"
            </h3>
            <p className="mt-1 text-xs text-neutral-300 leading-relaxed">
              You have unsaved edits in this file. Closing it will discard your recent changes. Are you sure you want to close it?
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 text-xs font-semibold">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
          >
            Keep Editing
          </button>
          {onSaveAndClose && (
            <button
              onClick={onSaveAndClose}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
            >
              Download & Close
            </button>
          )}
          <button
            onClick={onConfirmClose}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
          >
            Discard Changes & Close
          </button>
        </div>
      </div>
    </div>
  );
};
