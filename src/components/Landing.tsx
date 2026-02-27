import React from 'react';
import { Button } from './Button';
import { ArrowRight } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6 max-w-4xl mx-auto animate-in fade-in duration-1000">
      <div className="mb-8 p-3 rounded-full bg-white border border-stone-200 shadow-sm">
        <span className="text-xs font-medium uppercase tracking-widest text-stone-500 px-2">Executive Assessment</span>
      </div>
      
      <h1 className="font-serif text-5xl md:text-7xl text-sand-900 mb-8 leading-[1.1] tracking-tight">
        The framework between <br />
        <span className="italic text-stone-600">investment</span> and <span className="italic text-stone-600">value</span>.
      </h1>
      
      <p className="font-sans text-lg md:text-xl text-stone-600 max-w-2xl leading-relaxed mb-12">
        This isn't a sales tool. There's no pitch at the end. 
        This is a space for honest self-reflection — a thought partner that asks the questions most people around you won't.
      </p>

      <Button onClick={onStart} icon={<ArrowRight size={16} />}>
        Begin Reflection
      </Button>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-stone-200 pt-8 w-full">
        <div>
          <h3 className="font-serif text-lg mb-2 text-sand-900">Clarify Ambition</h3>
          <p className="text-sm text-stone-500 leading-relaxed">Articulate the human purpose behind your technical initiatives.</p>
        </div>
        <div>
          <h3 className="font-serif text-lg mb-2 text-sand-900">Identify Friction</h3>
          <p className="text-sm text-stone-500 leading-relaxed">Pinpoint whether your blockers are structural, cultural, or technical.</p>
        </div>
        <div>
          <h3 className="font-serif text-lg mb-2 text-sand-900">Strategic Alignment</h3>
          <p className="text-sm text-stone-500 leading-relaxed">Bridge the gap between pilot success and production value.</p>
        </div>
      </div>
    </div>
  );
};
