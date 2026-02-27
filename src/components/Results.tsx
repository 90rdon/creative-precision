import React, { useEffect, useState } from 'react';
import { AnalysisResult, Message, AssessmentEvent } from '../types';
import { generateResults } from '../services/geminiService';
import { Download, RefreshCcw, Share2, ArrowRight, Linkedin, MessageCircle } from 'lucide-react';

interface ResultsProps {
  history: Message[];
  onRestart: () => void;
  sessionId?: string;
  onTrackEvent?: (event: AssessmentEvent) => void;
}

const FALLBACK_RESULT: AnalysisResult = {
  heres_what_im_hearing: "You described an organization that has the ambition and the budget to make AI work — but something structural keeps pulling you back to pilot mode. The tools are there, the intent is there, but the bridge between experiment and production keeps washing out.",
  pattern_worth_examining: "The Proof-of-Concept Death Spiral — your organization proves AI can work in isolated tests, but the path from proof to production requires organizational changes nobody has been asked to own. So you prove it again. And again.",
  question_to_sit_with: "If your AI pilots keep succeeding but never scaling — is the problem really technical, or is it that nobody in your organization has the mandate to change how work actually gets done?",
  the_close: {
    sit_with_it: "Take this question to your leadership team this week. The conversation it sparks will tell you more than any consultant could.",
    keep_thinking: "Follow Creative Precision on LinkedIn for ongoing strategic perspective on AI transformation — the kind of thinking that doesn't fit in a vendor pitch.",
    real_conversation: "If this reflection surfaced something worth exploring further, we're happy to think alongside you. Not a pitch, not a demo — just a thinking partner. Calendar link below.",
  },
};

export const Results: React.FC<ResultsProps> = ({ history, onRestart, sessionId, onTrackEvent }) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  const track = (eventType: string, eventData?: Record<string, unknown>) => {
    if (onTrackEvent && sessionId) {
      onTrackEvent({ session_id: sessionId, event_type: eventType, event_data: eventData });
    }
  };

  useEffect(() => {
    track('results_viewed');

    const fetchAnalysis = async () => {
      try {
        const jsonStr = await generateResults(history);
        const parsed = JSON.parse(jsonStr) as AnalysisResult;
        if (parsed.heres_what_im_hearing && parsed.question_to_sit_with) {
          setResult(parsed);
        } else {
          setResult(FALLBACK_RESULT);
        }
      } catch (e) {
        console.error("Failed to parse results", e);
        setResult(FALLBACK_RESULT);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [history]);

  const handleShare = () => {
    track('share_clicked');
    const shareText = result
      ? `"${result.question_to_sit_with}"\n\nFrom a Reflect AI Assessment — free strategic diagnostic for AI leaders.\n${window.location.origin}${window.location.pathname}?utm_source=viral_share`
      : '';
    navigator.clipboard.writeText(shareText).then(() => {
      alert('Copied to clipboard — share it with your team.');
    });
  };

  const handleDownload = () => {
    track('pdf_downloaded');
    if (!result) return;
    const brief = [
      '═══════════════════════════════════════',
      '  YOUR STRATEGIC REFLECTION',
      '  Prepared by Reflect AI · Creative Precision',
      '  ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      '═══════════════════════════════════════',
      '',
      '─── HERE\'S WHAT I\'M HEARING ───',
      '',
      result.heres_what_im_hearing,
      '',
      '─── A PATTERN WORTH EXAMINING ───',
      '',
      result.pattern_worth_examining,
      '',
      '─── A QUESTION TO SIT WITH ───',
      '',
      `"${result.question_to_sit_with}"`,
      '',
      '─── WHAT NOW? ───',
      '',
      `Sit With It: ${result.the_close.sit_with_it}`,
      '',
      `Keep Thinking: ${result.the_close.keep_thinking}`,
      '',
      `A Real Conversation: ${result.the_close.real_conversation}`,
      '',
      result.template_recommendation ? [
        '─── RECOMMENDED NEXT STEP ───',
        '',
        `${result.template_recommendation.name} (${result.template_recommendation.tier})`,
        result.template_recommendation.reason,
      ].join('\n') : '',
      '',
      '═══════════════════════════════════════',
      '  Creative Precision · creativeprecision.co',
      '═══════════════════════════════════════',
    ].filter(Boolean).join('\n');

    const blob = new Blob([brief], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reflect_Strategic_Brief_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in">
        <div className="w-12 h-12 border-2 border-stone-200 border-t-sand-900 rounded-full animate-spin mb-6" />
        <h2 className="font-serif text-2xl text-sand-900">Synthesizing your reflection...</h2>
        <p className="text-stone-500 mt-2 font-sans text-sm">Connecting the patterns across our conversation.</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 animate-in slide-in-from-bottom-8 duration-700">

      {/* Header */}
      <div className="mb-16 text-center">
        <p className="text-xs font-sans font-medium tracking-widest text-stone-400 uppercase mb-4">Your Reflection</p>
        <h1 className="font-serif text-4xl md:text-5xl text-sand-900 leading-tight">Strategic Assessment</h1>
        <div className="w-12 h-px bg-stone-300 mx-auto mt-6" />
      </div>

      {/* Section 1: Here's What I'm Hearing */}
      <section className="mb-16">
        <p className="text-xs font-sans font-bold tracking-widest text-stone-400 uppercase mb-6">Here's What I'm Hearing</p>
        <div className="font-serif text-xl md:text-2xl leading-relaxed text-stone-700 italic space-y-4">
          {result.heres_what_im_hearing.split('\n').filter(Boolean).map((p, i) => (
            <p key={i}>"{p.replace(/^[""]|[""]$/g, '')}"</p>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-stone-200 mb-16" />

      {/* Section 2: A Pattern Worth Examining */}
      <section className="mb-16 relative pl-6">
        <div className="absolute top-0 left-0 w-1 h-full bg-sand-900 rounded-full" />
        <p className="text-xs font-sans font-bold tracking-widest text-sand-900 uppercase mb-6">A Pattern Worth Examining</p>
        <p className="font-sans text-lg leading-relaxed text-stone-600">
          {result.pattern_worth_examining}
        </p>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-stone-200 mb-16" />

      {/* Section 3: A Question to Sit With — HERO element */}
      <section className="mb-16 py-12 text-center">
        <p className="text-xs font-sans font-bold tracking-widest text-stone-400 uppercase mb-8">A Question to Sit With</p>
        <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl leading-snug text-sand-900 max-w-2xl mx-auto">
          "{result.question_to_sit_with}"
        </blockquote>
        <p className="text-stone-400 text-sm mt-8 font-sans">
          The answer to this question is worth more than any framework.
        </p>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-stone-200 mb-16" />

      {/* Section 4: What Now? — Three pathways */}
      <section className="mb-16">
        <p className="text-xs font-sans font-bold tracking-widest text-stone-400 uppercase mb-8 text-center">What Now?</p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Sit With It */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col">
            <h3 className="font-sans font-semibold text-sand-900 text-sm mb-3">Sit With It</h3>
            <p className="font-sans text-stone-500 text-sm leading-relaxed flex-1">
              {result.the_close.sit_with_it}
            </p>
            <button
              onClick={handleShare}
              className="mt-4 flex items-center gap-2 text-xs font-sans font-medium text-stone-500 hover:text-sand-900 transition-colors"
            >
              <Share2 size={14} /> Share with your team
            </button>
          </div>

          {/* Keep Thinking */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col">
            <h3 className="font-sans font-semibold text-sand-900 text-sm mb-3">Keep Thinking</h3>
            <p className="font-sans text-stone-500 text-sm leading-relaxed flex-1">
              {result.the_close.keep_thinking}
            </p>
            <a
              href="https://www.linkedin.com/company/creative-precision"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('lifeline_clicked', { type: 'linkedin' })}
              className="mt-4 flex items-center gap-2 text-xs font-sans font-medium text-stone-500 hover:text-sand-900 transition-colors"
            >
              <Linkedin size={14} /> Follow on LinkedIn
            </a>
          </div>

          {/* A Real Conversation */}
          <div className="bg-sand-100 border border-stone-200 rounded-xl p-6 flex flex-col">
            <h3 className="font-sans font-semibold text-sand-900 text-sm mb-3">A Real Conversation</h3>
            <p className="font-sans text-stone-500 text-sm leading-relaxed flex-1">
              {result.the_close.real_conversation}
            </p>
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('lifeline_clicked', { type: 'calendar' })}
              className="mt-4 flex items-center gap-2 text-xs font-sans font-medium text-sand-900 hover:text-black transition-colors"
            >
              <MessageCircle size={14} /> Book a thinking session <ArrowRight size={12} />
            </a>
          </div>
        </div>

        <p className="text-center text-stone-400 text-xs mt-6 font-sans italic">
          Not a pitch, not a demo — just a thinking partner.
        </p>
      </section>

      {/* Optional: Template Recommendation */}
      {result.template_recommendation && (
        <>
          <div className="w-full h-px bg-stone-200 mb-12" />
          <section className="mb-16 bg-stone-50 border border-stone-200 rounded-xl p-6">
            <p className="text-xs font-sans font-bold tracking-widest text-stone-400 uppercase mb-3">Recommended Next Step</p>
            <p className="font-sans font-medium text-sand-900 mb-1">
              {result.template_recommendation.name}
              <span className="text-xs text-stone-400 ml-2 font-normal">({result.template_recommendation.tier})</span>
            </p>
            <p className="font-sans text-stone-500 text-sm">{result.template_recommendation.reason}</p>
          </section>
        </>
      )}

      {/* Footer Actions */}
      <div className="border-t border-stone-200 pt-8 flex flex-col items-center gap-4">
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 text-xs font-sans font-medium tracking-wide uppercase text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-xs font-sans font-medium tracking-wide uppercase text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <Download size={14} /> Download Brief
          </button>
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-4 py-2 text-xs font-sans font-medium tracking-wide uppercase text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <RefreshCcw size={14} /> New Session
          </button>
        </div>

        <p className="text-stone-400 text-xs tracking-widest uppercase mt-4">
          Confidential · Prepared by Reflect AI · Creative Precision
        </p>
      </div>

    </div>
  );
};
