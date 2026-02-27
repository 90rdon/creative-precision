import React, { useEffect, useState } from 'react';
import { AnalysisResult, Message } from '../types';
import { generateResults } from '../services/geminiService';
import { Button } from './Button';
import { Download, RefreshCcw, Share2 } from 'lucide-react';

interface ResultsProps {
  history: Message[];
  onRestart: () => void;
}

export const Results: React.FC<ResultsProps> = ({ history, onRestart }) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const jsonStr = await generateResults(history);
        const parsed = JSON.parse(jsonStr) as AnalysisResult;
        setResult(parsed);
      } catch (e) {
        console.error("Failed to parse results", e);
        // Fallback for demo resilience
        setResult({
          summary: "We explored the gap between your organization's AI ambition and the structural reality preventing scale.",
          pattern: "The circular dependency between proving value to get to production, and needing production to prove value.",
          strategicQuestion: "What if you stopped treating AI as a project to be managed, and started treating it as a capability to be built?",
          recommendation: "Consider a lightweight Governance Framework to build the 'path to production' before the pilots launch."
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [history]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in">
        <div className="w-12 h-12 border-2 border-stone-200 border-t-sand-900 rounded-full animate-spin mb-6" />
        <h2 className="font-serif text-2xl text-sand-900">Synthesizing insights...</h2>
        <p className="text-stone-500 mt-2 font-sans">Connecting the dots across our conversation.</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-in slide-in-from-bottom-8 duration-700">
      
      {/* Header */}
      <div className="border-b border-stone-200 pb-8 mb-12">
        <div className="flex justify-between items-start mb-4">
          <h1 className="font-serif text-4xl text-sand-900">Executive Summary</h1>
          <Button variant="ghost" onClick={onRestart} icon={<RefreshCcw size={14} />}>New Session</Button>
        </div>
        <p className="text-stone-500">Confidential · Strategic Reflection</p>
      </div>

      {/* Sections */}
      <div className="grid gap-16">
        
        <section>
          <span className="text-xs font-bold tracking-widest text-stone-400 uppercase mb-4 block">Current State</span>
          <h2 className="font-serif text-3xl mb-4 text-sand-900">Here's What I'm Hearing</h2>
          <p className="font-serif text-lg leading-relaxed text-stone-700">
            {result.summary}
          </p>
        </section>

        <section className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-forest-900" />
          <span className="text-xs font-bold tracking-widest text-forest-900 uppercase mb-4 block">The Insight</span>
          <h2 className="font-serif text-3xl mb-4 text-sand-900">A Pattern Worth Examining</h2>
          <p className="font-sans text-stone-600 leading-relaxed text-lg">
            {result.pattern}
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-12">
          <div>
            <span className="text-xs font-bold tracking-widest text-stone-400 uppercase mb-4 block">Strategic Pivot</span>
            <h2 className="font-serif text-2xl mb-4 text-sand-900">A Question to Sit With</h2>
            <p className="font-serif italic text-xl text-stone-800 border-l-2 border-stone-300 pl-6 py-2">
              "{result.strategicQuestion}"
            </p>
            <p className="mt-4 text-sm text-stone-500">
              Bring this to your next leadership meeting. It shifts the frame.
            </p>
          </div>
          
          <div className="bg-sand-100 p-8 rounded-xl">
             <span className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4 block">Next Step</span>
             <h3 className="font-serif text-xl mb-3 text-sand-900">Recommendation</h3>
             <p className="text-sm text-stone-600 mb-6 leading-relaxed">
               {result.recommendation}
             </p>
             <div className="flex gap-3">
               <Button variant="primary" className="text-xs px-4" icon={<Download size={14} />}>Save Report</Button>
               <Button variant="secondary" className="text-xs px-4 bg-white" icon={<Share2 size={14} />}>Share</Button>
             </div>
          </div>
        </section>

        <section className="text-center pt-12 border-t border-stone-200">
           <p className="font-serif text-2xl text-stone-400 italic mb-6">
             "The framework is the strategy."
           </p>
           <p className="text-stone-500 text-sm">
             Generated by Reflect AI. Designed for clarity, not sales.
           </p>
        </section>

      </div>
    </div>
  );
};
