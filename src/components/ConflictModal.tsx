import React from 'react';
import { AlertTriangle, CloudDownload, Save } from 'lucide-react';

interface ConflictModalProps {
  isOpen: boolean;
  onLoadCloudVersion: () => void;
  onKeepMyChanges: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onLoadCloudVersion,
  onKeepMyChanges,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-amber-500/50 rounded-xl shadow-2xl overflow-hidden flex flex-col text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-amber-950/40 border-b border-amber-900/60 flex items-center gap-2.5">
          <AlertTriangle size={20} className="text-amber-400 shrink-0" />
          <h2 className="text-sm font-semibold text-amber-200">
            Cloud Version Updated
          </h2>
        </div>

        <div className="p-5 text-xs text-neutral-300 space-y-3">
          <p className="font-medium text-neutral-200 text-sm">
            This project was changed on another device.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            Another classmate or device saved newer changes to this project while you were editing. Would you like to load their updated code or keep your local changes?
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={onLoadCloudVersion}
              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <CloudDownload size={15} />
              <span>Load Cloud Version</span>
            </button>
            <button
              onClick={onKeepMyChanges}
              className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-neutral-700"
            >
              <Save size={15} />
              <span>Keep My Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
