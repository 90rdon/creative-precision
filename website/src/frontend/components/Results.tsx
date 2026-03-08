import React, { useEffect, useState, useRef } from 'react';
import { AnalysisResult, Message, AssessmentEvent } from '../types';
import { getSocket } from '../services/geminiService';
import { Download, RefreshCcw, Share2, ArrowRight, Linkedin, MessageCircle } from 'lucide-react';

interface ResultsProps {
  history: Message[];
  onRestart: () => void;
  sessionId?: string;
  onTrackEvent?: (event: AssessmentEvent) => void;
}

const FALLBACK_RESULT: AnalysisResult = {
  heres_what_im_hearing: "You described an organization aiming to scale AI, but encountering systemic friction. The ambition and tools are present, yet the structural realities of deployment, compliance, and process keep pulling initiatives back into pilot mode.",
  pattern_worth_examining: "The Governance Gap — your organization proves AI can work in isolated tests, but the path from proof to production requires organizational changes and a unified framework that hasn't been fully adopted.",
  question_to_sit_with: "If your AI pilots keep succeeding but aren't scaling — is the problem technological, or is your current governance framework simply not designed for the speed of AI?",
  the_close: {
    sit_with_it: "Take this question to your leadership team this week. The resulting conversation will be more revealing than any vendor pitch.",
    keep_thinking: "Follow Creative Precision on LinkedIn for ongoing strategic perspective on AI transformation and governance that scales.",
    real_conversation: "If this reflection surfaced something worth exploring further, we're happy to think alongside you. Not a pitch, not a demo — just a thinking partner. Calendar link below.",
  },
};

export const Results: React.FC<ResultsProps> = ({ history, onRestart, sessionId, onTrackEvent }) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const track = (eventType: string, eventData?: Record<string, unknown>) => {
    if (onTrackEvent && sessionId) {
      onTrackEvent({ session_id: sessionId, event_type: eventType, event_data: eventData });
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    track('results_viewed');

    const socket = getSocket();

    const fetchAnalysis = () => {
      const onResults = (data: AnalysisResult) => {
        if (data && data.heres_what_im_hearing) {
          setResult(data);
        } else {
          setResult(FALLBACK_RESULT);
        }
        setLoading(false);
        socket.off('results-synthesis', onResults);
      };

      socket.on('results-synthesis', onResults);
      socket.emit('request-results', { history, sessionId });
    };

    fetchAnalysis();

    return () => {
      socket.off('results-synthesis');
    };
  }, [history]);

  const handleShare = () => {
    track('share_clicked');
    const shareText = result
      ? `"${result.question_to_sit_with}"\n\nFrom a Reflect AI Assessment — free strategic diagnostic for AI leaders.\n${window.location.origin}/assessment.html?utm_source=viral_share`
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
      "─── HERE'S WHAT I'M HEARING ───",
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
    ].filter(Boolean).join('\\n');

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
    <div style={{ animation: 'fadeIn 0.8s ease 0s forwards', width: '100%' }}>

      {/* Header */}
      <section style={{ padding: '4rem 0', background: 'var(--linen)' }}>
        <div className="wrap" style={{ textAlign: 'center' }}>
          <p className="tag" style={{ marginBottom: '1rem' }}>Your Reflection</p>
          <h1 className="h-xl">Strategic Assessment</h1>
        </div>
      </section>

      {/* Section 1: Here's What I'm Hearing */}
      <section style={{ padding: '4rem 0', background: 'var(--cream)' }}>
        <div className="wrap">
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <p className="tag" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Here's What I'm Hearing</p>
            <div className="h-lg" style={{ fontStyle: 'italic', color: 'var(--charcoal)', gap: '1.5rem', display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
              {result.heres_what_im_hearing.split('\n').filter(Boolean).map((p, i) => (
                <p key={i} style={{ fontSize: '1.35rem', lineHeight: '1.5' }}>"{p.replace(/^[""]|[""]$/g, '')}"</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: A Pattern Worth Examining */}
      <section style={{ padding: '4rem 0', background: 'var(--linen)' }}>
        <div className="wrap">
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div style={{ position: 'relative', paddingLeft: '2rem', paddingBottom: '0.5rem' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--charcoal)', borderRadius: '4px' }} />
              <p className="tag" style={{ color: 'var(--charcoal)', marginBottom: '1.25rem' }}>A Pattern Worth Examining</p>
              <p className="body-text" style={{ maxWidth: '100%', fontSize: '1.05rem', color: 'var(--charcoal-lt)' }}>
                {result.pattern_worth_examining}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: A Question to Sit With — HERO element */}
      <section style={{ padding: '5rem 0', background: 'var(--charcoal)', color: 'var(--linen)', textAlign: 'center' }}>
        <div className="wrap">
          <p className="tag" style={{ marginBottom: '2rem', color: 'var(--stone)' }}>A Question to Sit With</p>
          <blockquote className="h-xl" style={{ fontSize: '2.1rem', maxWidth: '640px', margin: '0 auto', lineHeight: '1.3', color: 'var(--linen)' }}>
            "{result.question_to_sit_with}"
          </blockquote>
          <p className="body-text-sm" style={{ marginTop: '2.5rem', maxWidth: '100%', color: 'var(--stone)' }}>
            The answer to this question is worth more than any framework.
          </p>
        </div>
      </section>

      {/* Section 4: What Now? — Three pathways */}
      <section style={{ padding: '6rem 0 3rem', background: 'var(--cream)' }}>
        <div className="wrap">
          <p className="tag" style={{ textAlign: 'center', marginBottom: '3rem' }}>What Now?</p>

          <div className="del-grid" style={{ marginBottom: '3rem' }}>
            {/* Sit With It */}
            <div className="del-card" style={{ display: 'flex', flexDirection: 'column', background: 'var(--linen)' }}>
              <p className="h-md" style={{ marginBottom: '0.75rem' }}>Sit With It</p>
              <p className="body-text-sm" style={{ flex: 1, marginBottom: '2rem' }}>
                {result.the_close.sit_with_it}
              </p>
              <button
                onClick={handleShare}
                style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'var(--sans)' }}
              >
                <Share2 size={16} /> <span style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--charcoal)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--stone)'}>Share with your team</span>
              </button>
            </div>

            {/* Keep Thinking */}
            <div className="del-card" style={{ display: 'flex', flexDirection: 'column', background: 'var(--linen)' }}>
              <p className="h-md" style={{ marginBottom: '0.75rem' }}>Keep Thinking</p>
              <p className="body-text-sm" style={{ flex: 1, marginBottom: '2rem' }}>
                {result.the_close.keep_thinking}
              </p>
              <a
                href="https://www.linkedin.com/company/creative-precision"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('lifeline_clicked', { type: 'linkedin' })}
                style={{ color: 'var(--stone)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'var(--sans)' }}
              >
                <Linkedin size={16} /> <span style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--charcoal)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--stone)'}>Follow on LinkedIn</span>
              </a>
            </div>

            {/* A Real Conversation */}
            <div className="del-card" style={{ display: 'flex', flexDirection: 'column', background: 'var(--linen)' }}>
              <p className="h-md" style={{ marginBottom: '0.75rem' }}>A Real Conversation</p>
              <p className="body-text-sm" style={{ flex: 1, marginBottom: '2rem' }}>
                {result.the_close.real_conversation.replace(/Here's a link to my calendar:? ?\[?calendar link\]?/ig, '').replace(/\[calendar link\]/ig, '')}
              </p>
              <a
                href="https://calendly.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('lifeline_clicked', { type: 'calendar' })}
                style={{ color: 'var(--charcoal)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--sans)' }}
              >
                <MessageCircle size={16} /> <span>Book a thinking session</span> <ArrowRight size={12} style={{ opacity: 0.6 }} />
              </a>
            </div>
          </div>

          {result.template_recommendation && (
            <div style={{ maxWidth: '820px', margin: '4rem auto 0' }}>
              <div className="del-card" style={{ background: 'var(--linen)' }}>
                <p className="tag" style={{ marginBottom: '1.25rem' }}>Recommended Next Step</p>
                <p className="h-md" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {result.template_recommendation.name}
                  <span className="tier-badge badge-soon" style={{ marginBottom: 0, padding: '0.15rem 0.5rem', fontSize: '0.62rem', border: '1px solid var(--border-m)' }}>{result.template_recommendation.tier}</span>
                </p>
                <p className="body-text-sm">{result.template_recommendation.reason}</p>
              </div>
            </div>
          )}

          <p className="body-text-sm" style={{ textAlign: 'center', fontStyle: 'italic', marginTop: '3rem', maxWidth: '100%' }}>
            Not a pitch, not a demo — just a thinking partner.
          </p>

        </div>
      </section>

      {/* Footer Actions */}
      <section style={{ padding: '3rem 0', background: 'var(--linen)', borderTop: '1px solid var(--border)' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleShare}
              className="btn btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Share2 size={14} />
              Share
            </button>
            <button
              onClick={handleDownload}
              className="btn btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={14} />
              Download Brief
            </button>
            <button
              onClick={onRestart}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCcw size={14} />
              New Session
            </button>
          </div>

          <p className="tag" style={{ maxWidth: '100%', textAlign: 'center', fontSize: '0.65rem', marginTop: '0.5rem' }}>
            Confidential · Prepared by Reflect AI · Creative Precision
          </p>
        </div>
      </section>

    </div>
  );
};
