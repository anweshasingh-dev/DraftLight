import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Cpu,
  ListTodo,
  ScanText,
  Sparkles,
  X,
} from 'lucide-react';
import * as projectApi from '../../services/projectApi';
import './CompanionPanel.css';

function CompanionPanel({
  project,
  isProjectSaved = true,
  analyzeProject = projectApi.analyzeProject,
}) {
  const [status, setStatus] = useState('idle');
  const [analysis, setAnalysis] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [analyzedRevision, setAnalyzedRevision] = useState(null);
  const requestRef = useRef(null);
  const hasMeaningfulContent = /[\p{L}\p{N}]/u.test(project.content);
  const isStale = analysis !== null && analyzedRevision !== project.updated_at;

  useEffect(
    () => () => {
      requestRef.current?.controller.abort();
    },
    [],
  );

  async function handleAnalyze() {
    if (!hasMeaningfulContent || !isProjectSaved || status === 'loading') return;

    const controller = new AbortController();
    const requestToken = Symbol('analysis-request');
    requestRef.current = { controller, token: requestToken };
    setStatus('loading');
    setErrorMessage('');

    try {
      const result = await analyzeProject(project.id, { signal: controller.signal });
      if (requestRef.current?.token !== requestToken) return;
      setAnalysis(result);
      setAnalyzedRevision(project.updated_at);
      setStatus('success');
    } catch (error) {
      if (requestRef.current?.token !== requestToken) return;
      if (controller.signal.aborted) {
        setStatus(analysis ? 'success' : 'idle');
      } else {
        setErrorMessage(error.message);
        setStatus('error');
      }
    } finally {
      if (requestRef.current?.token === requestToken) requestRef.current = null;
    }
  }

  function cancelAnalysis() {
    const activeRequest = requestRef.current;
    requestRef.current = null;
    activeRequest?.controller.abort();
    setStatus(analysis ? 'success' : 'idle');
  }

  return (
    <aside className="companion-panel" aria-label="Local AI continuation companion">
      <header className="companion-header">
        <span className="window-label">
          <Sparkles size={14} strokeWidth={1.7} aria-hidden="true" />
          Companion
        </span>
        <span className="local-badge">
          <Cpu size={11} aria-hidden="true" />
          Local AI
        </span>
      </header>

      <div className="companion-scroll-area">
        <section className="companion-intro">
          <p className="eyebrow">A second pair of eyes</p>
          <h2>Find the thread again.</h2>
          <p>
            Draftlight asks your local Ollama model for guidance and keeps the result separate from
            your project.
          </p>

          {status === 'loading' ? (
            <div className="analysis-loading" role="status" aria-live="polite">
              <span className="dither-line" aria-hidden="true">░▒▓█▓▒░</span>
              <strong>Reading your project…</strong>
              <small>Local models can take a little while.</small>
              <button type="button" className="secondary-action" onClick={cancelAnalysis}>
                <X size={13} aria-hidden="true" />
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="analysis-action"
              onClick={handleAnalyze}
              disabled={!hasMeaningfulContent || !isProjectSaved}
            >
              <Sparkles size={14} aria-hidden="true" />
              {analysis ? 'Analyze again' : 'Analyze my project'}
            </button>
          )}

          {!hasMeaningfulContent && (
            <p className="analysis-hint">Add some project context before requesting an analysis.</p>
          )}
          {hasMeaningfulContent && !isProjectSaved && (
            <p className="analysis-hint">
              Waiting for your latest edits to finish saving before analysis.
            </p>
          )}
          {isStale && status !== 'loading' && (
            <p className="analysis-hint">
              Your project changed after this analysis. Analyze again for a fresh view.
            </p>
          )}
        </section>

        {status === 'error' && (
          <section className="analysis-error" role="alert">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              <strong>Analysis did not finish</strong>
              <p>{errorMessage}</p>
              <button type="button" className="secondary-action" onClick={handleAnalyze}>
                Try again
              </button>
            </div>
          </section>
        )}

        {analysis ? (
          <>
            <section className="companion-section" aria-labelledby="left-off-heading">
              <div className="section-heading">
                <span>
                  <ScanText size={14} aria-hidden="true" />
                  <h3 id="left-off-heading">Where you left off</h3>
                </span>
              </div>
              <p className="analysis-summary">{analysis.where_you_left_off}</p>
            </section>

            <section className="companion-section" aria-labelledby="unfinished-heading">
              <div className="section-heading">
                <span>
                  <ListTodo size={14} aria-hidden="true" />
                  <h3 id="unfinished-heading">What&apos;s unfinished</h3>
                </span>
                <small>{analysis.unfinished.length} notes</small>
              </div>
              <ul className="unfinished-list">
                {analysis.unfinished.map((item, index) => (
                  <li key={`${index}-${item}`}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="companion-section" aria-labelledby="directions-heading">
              <div className="section-heading">
                <span>
                  <Sparkles size={14} aria-hidden="true" />
                  <h3 id="directions-heading">What you could do next</h3>
                </span>
                <small>3 paths</small>
              </div>
              <ol className="direction-list">
                {analysis.next_steps.map((step, index) => (
                  <li key={`${index}-${step.title}`}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.description}</p>
                      <small>{step.action}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </>
        ) : status !== 'error' && status !== 'loading' ? (
          <section className="companion-empty-state">
            <ScanText size={20} strokeWidth={1.4} aria-hidden="true" />
            <strong>Ready when you are</strong>
            <p>Your summary, unfinished threads, and three practical next steps will appear here.</p>
          </section>
        ) : null}
      </div>

      <footer className="companion-footer">
        <Ban size={13} aria-hidden="true" />
        <span>
          Suggestions never change your project.
          <small>Inference uses the configured local Ollama service.</small>
        </span>
      </footer>
    </aside>
  );
}

export default CompanionPanel;
