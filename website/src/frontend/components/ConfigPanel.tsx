import React, { useState } from 'react';
import { AppConfig } from '../types';
import { X, Settings } from 'lucide-react';
import { Button } from './Button';

interface ConfigPanelProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onSave, isOpen, onClose }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-serif text-2xl text-sand-900 flex items-center gap-2">
            <Settings size={24} />
            Configuration
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
              Model
            </label>
            <select 
              value={localConfig.modelName}
              onChange={(e) => setLocalConfig({...localConfig, modelName: e.target.value})}
              className="w-full p-3 bg-sand-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-sand-900"
            >
              <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Fast & Smart)</option>
              <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Deep Reasoning)</option>
              <option value="gemini-2.5-flash-lite-latest">Gemini 2.5 Flash Lite (Fastest)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
              Initial Greeting
            </label>
            <textarea 
              value={localConfig.initialGreeting}
              onChange={(e) => setLocalConfig({...localConfig, initialGreeting: e.target.value})}
              className="w-full p-3 bg-sand-50 border-none rounded-lg text-sm min-h-[80px] focus:ring-1 focus:ring-sand-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
              System Instruction (The Persona)
            </label>
            <textarea 
              value={localConfig.systemInstruction}
              onChange={(e) => setLocalConfig({...localConfig, systemInstruction: e.target.value})}
              className="w-full p-3 bg-sand-50 border-none rounded-lg text-sm font-mono text-stone-600 min-h-[300px] focus:ring-1 focus:ring-sand-900 text-xs leading-relaxed"
            />
            <p className="text-[10px] text-stone-400 mt-2">
              Define how the AI should behave, what questions to ask, and the tone to use.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-100 flex gap-4">
          <Button onClick={() => { onSave(localConfig); onClose(); }} className="w-full">
            Save Changes
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
