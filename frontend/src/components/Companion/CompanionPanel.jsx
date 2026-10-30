import { CircleOff, ScanText, Sparkles } from 'lucide-react';
import './CompanionPanel.css';

const directions = [
  ['01', 'Forward motion', 'Continue the scene’s immediate thread.'],
  ['02', 'A new pressure', 'Introduce a revealing interruption.'],
  ['03', 'Look inward', 'Deepen the mood or central idea.'],
];

function CompanionPanel() {
  return (
    <aside className="companion-panel" aria-label="AI writing companion">
      <header className="companion-header">
        <span className="window-label">
          <Sparkles size={14} strokeWidth={1.7} aria-hidden="true" />
          Companion
        </span>
        <span className="offline-badge">
          <CircleOff size={11} aria-hidden="true" />
          Not connected
        </span>
      </header>

      <div className="companion-scroll-area">
        <section className="companion-intro">
          <p className="eyebrow">A second pair of eyes</p>
          <h2>Illuminate what is already here.</h2>
          <p>
            Project analysis and continuation ideas will appear beside your draft without changing
            your words.
          </p>
        </section>

        <section className="companion-section" aria-labelledby="analysis-heading">
          <div className="section-heading">
            <span>
              <ScanText size={14} aria-hidden="true" />
              <strong id="analysis-heading">Draft analysis</strong>
            </span>
            <small>Pending</small>
          </div>
          <dl className="analysis-placeholder">
            <div>
              <dt>Tone</dt>
              <dd>Waiting for a closer read</dd>
            </div>
            <div>
              <dt>Themes</dt>
              <dd>Patterns will surface here</dd>
            </div>
            <div>
              <dt>Open threads</dt>
              <dd>Unresolved ideas will be noted</dd>
            </div>
          </dl>
        </section>

        <section className="companion-section" aria-labelledby="directions-heading">
          <div className="section-heading">
            <span>
              <Sparkles size={14} aria-hidden="true" />
              <strong id="directions-heading">Possible directions</strong>
            </span>
            <small>3 paths</small>
          </div>
          <ol className="direction-list">
            {directions.map(([number, title, description]) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="companion-footer">
        <CircleOff size={13} aria-hidden="true" />
        <span>
          AI is not connected yet.
          <small>Analysis and suggestions are placeholders.</small>
        </span>
      </footer>
    </aside>
  );
}

export default CompanionPanel;
