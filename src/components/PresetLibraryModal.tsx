import React from 'react';
import { PRESETS, CADPreset } from '../cad/presets';
import { X, Layers, Box, Cpu, ArrowRight } from 'lucide-react';

interface PresetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: CADPreset) => void;
}

export const PresetLibraryModal: React.FC<PresetLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-subtle/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan/20 text-cyan">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Parametric CAD Preset Library</h3>
              <p className="text-xs text-slate-400">Load ready-to-customize engineering models</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-subtle rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Cards List */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
          {PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
              className="group p-4 rounded-xl bg-surface-subtle/70 hover:bg-surface-subtle border border-surface-border hover:border-cyan/50 cursor-pointer transition-all flex flex-col justify-between shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/10 text-cyan font-semibold">
                    {preset.category}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan transition-colors">
                  {preset.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {preset.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border/50 flex items-center justify-between text-xs text-slate-400 group-hover:text-white">
                <span>Load Template</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
