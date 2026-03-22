import { useEffect } from '@wordpress/element';
import { OnboardingProvider, useOnboarding } from '../../context/OnboardingContext';
import StepWebsite from './StepWebsite';
import StepScraping from './StepScraping';
import StepSystemPrompt from './StepSystemPrompt';
import StepBotPreview from './StepBotPreview';
import StepEmbed from './StepEmbed';

const STEPS = [
  { label: 'Website', description: 'Analyze your site' },
  { label: 'Scraping', description: 'Crawl & index pages' },
  { label: 'System Prompt', description: 'Configure AI behavior' },
  { label: 'Preview', description: 'Test your bot' },
  { label: 'Embed', description: 'Add to your site' },
];

function StepContent() {
  const { step } = useOnboarding();

  switch (step) {
    case 0: return <StepWebsite />;
    case 1: return <StepScraping />;
    case 2: return <StepSystemPrompt />;
    case 3: return <StepBotPreview />;
    case 4: return <StepEmbed />;
    default: return <StepWebsite />;
  }
}

function NavSidebar() {
  const { step, completedSteps, setStep } = useOnboarding();
  const progress = (completedSteps.size / STEPS.length) * 100;

  return (
    <nav className="jug-onboarding-nav">
      <div className="jug-onboarding-nav-title">SETUP</div>
      <div className="jug-onboarding-nav-divider" />

      {STEPS.map((s, i) => {
        const isActive = step === i;
        const isCompleted = completedSteps.has(i);
        const isDisabled = !isCompleted && i > step;

        const className = [
          'jug-onboarding-step-item',
          isActive && 'active',
          isCompleted && 'completed',
          isDisabled && 'disabled',
        ].filter(Boolean).join(' ');

        return (
          <button
            key={i}
            type="button"
            className={className}
            disabled={isDisabled}
            onClick={() => !isDisabled && setStep(i)}
          >
            <span className="jug-onboarding-step-circle">
              {isCompleted ? '✓' : i + 1}
            </span>
            <span className="jug-onboarding-step-info">
              <strong>{s.label}</strong>
              <small>{s.description}</small>
            </span>
          </button>
        );
      })}

      <div className="jug-onboarding-progress-bar">
        <div className="jug-onboarding-progress-track">
          <div
            className="jug-onboarding-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="jug-onboarding-progress-label">
          {completedSteps.size} of {STEPS.length} complete
        </span>
      </div>
    </nav>
  );
}

function ModalInner({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="jug-onboarding-overlay" onClick={onClose}>
      <div className="jug-onboarding-modal" onClick={(e) => e.stopPropagation()}>
        <NavSidebar />
        <div className="jug-onboarding-content">
          <StepContent />
        </div>
      </div>
    </div>
  );
}

interface Props {
  initialUrl?: string;
  onClose: () => void;
  onAuthRequired: () => void;
}

export default function OnboardingModal({ initialUrl, onClose, onAuthRequired }: Props) {
  return (
    <OnboardingProvider
      initialUrl={initialUrl}
      onClose={onClose}
      onAuthRequired={onAuthRequired}
    >
      <ModalInner onClose={onClose} />
    </OnboardingProvider>
  );
}
