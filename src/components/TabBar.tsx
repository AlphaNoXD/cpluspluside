import React, { useState } from 'react';
import { Plus, X, FileCode, Check } from 'lucide-react';
import { CppFile } from '../types';

interface TabBarProps {
  files: CppFile[];
  activeFileId: string;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onNewTab: () => void;
  onRenameFile: (fileId: string, newName: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  files,
  activeFileId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onRenameFile,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartRename = (file: CppFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(file.id);
    setEditingName(file.name);
  };

  const handleSaveRename = (fileId: string) => {
    let finalName = editingName.trim();
    if (!finalName) {
      setEditingId(null);
      return;
    }
    if (!finalName.endsWith('.cpp') && !finalName.endsWith('.h') && !finalName.endsWith('.hpp')) {
      finalName += '.cpp';
    }
    onRenameFile(fileId, finalName);
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, fileId: string) => {
    if (e.key === 'Enter') {
      handleSaveRename(fileId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div className="h-10 bg-neutral-950 border-b border-neutral-800/80 flex items-center px-2 gap-1 overflow-x-auto no-scrollbar shrink-0 select-none">
      <div className="flex items-center gap-1 min-w-max">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = file.id === editingId;

          return (
            <div
              key={file.id}
              id={`tab-${file.id}`}
              onClick={() => onSelectTab(file.id)}
              onDoubleClick={(e) => handleStartRename(file, e)}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t-md transition-all cursor-pointer border-t-2 ${
                isActive
                  ? 'bg-neutral-900 text-neutral-100 border-blue-500 font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 border-transparent'
              }`}
              title={`${file.name}${file.isModified ? ' (unsaved changes)' : ''} - Double click to rename`}
            >
              <FileCode
                size={13}
                className={isActive ? 'text-blue-400' : 'text-neutral-500 group-hover:text-neutral-400'}
              />

              {isEditing ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, file.id)}
                    onBlur={() => handleSaveRename(file.id)}
                    autoFocus
                    className="bg-neutral-800 text-neutral-100 text-xs px-1 py-0.5 rounded border border-blue-500 focus:outline-none w-28"
                  />
                  <button
                    onClick={() => handleSaveRename(file.id)}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                  >
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <span className="truncate max-w-[140px] select-none">
                  {file.name}
                </span>
              )}

              {/* Unsaved indicator dot */}
              {file.isModified && !isEditing && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 ml-0.5"
                  title="Unsaved edits"
                />
              )}

              {/* Close 'x' button */}
              {files.length > 1 && (
                <button
                  id={`close-tab-${file.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(file.id);
                  }}
                  title="Close tab"
                  className={`p-0.5 rounded-sm hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors ml-1 cursor-pointer ${
                    isActive ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}

        {/* New File '+' button */}
        <button
          id="tab-new-file-plus-btn"
          onClick={onNewTab}
          title="Create a new file (+)"
          className="flex items-center justify-center w-7 h-7 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 transition-colors cursor-pointer ml-0.5"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
};
