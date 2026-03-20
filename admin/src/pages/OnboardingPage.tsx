import { useState } from '@wordpress/element';
import StepWebsite from '../components/onboarding/StepWebsite';
import StepScraping from '../components/onboarding/StepScraping';
import StepSystemPrompt from '../components/onboarding/StepSystemPrompt';
import StepEmbed from '../components/onboarding/StepEmbed';

const STEPS = ['Website', 'Scrape & Train', 'System Prompt', 'Embed'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [website, setWebsite] = useState(window.jugAiConfig.siteUrl);
  const [urls, setUrls] = useState<string[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [botUuid, setBotUuid] = useState('');

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="jug-ai-onboarding">
      <div className="jug-ai-wizard-progress">
        {STEPS.map((label, i) => (
          <div key={label} className={`jug-ai-wizard-step ${i <= step ? 'active' : ''} ${i < step ? 'completed' : ''}`}>
            <span className="jug-ai-wizard-number">{i < step ? '✓' : i + 1}</span>
            <span className="jug-ai-wizard-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="jug-ai-wizard-content">
        {step === 0 && (
          <StepWebsite
            website={website}
            onWebsiteChange={setWebsite}
            onUrlsDiscovered={setUrls}
            onCompanyInfo={setCompanyInfo}
            onNext={next}
          />
        )}
        {step === 1 && (
          <StepScraping
            website={website}
            urls={urls}
            onNext={next}
            onBack={prev}
          />
        )}
        {step === 2 && (
          <StepSystemPrompt
            companyInfo={companyInfo}
            website={website}
            onBotCreated={(uuid: string) => setBotUuid(uuid)}
            onNext={next}
            onBack={prev}
          />
        )}
        {step === 3 && (
          <StepEmbed
            botUuid={botUuid}
            onBack={prev}
          />
        )}
      </div>
    </div>
  );
}
