import { createContext, useContext, useState, useCallback } from '@wordpress/element';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface CompanyInfo {
  name: string;
  description: string;
  industry: string;
  summary: string;
}

interface ScrapedPage {
  url: string;
  title: string;
}

interface OnboardingState {
  websiteUrl: string;
  companyInfo: CompanyInfo | null;
  editedSummary: string;
  discoveredUrls: string[];
  fingerprint: string;
  siteUuid: string;
  scrapedPages: ScrapedPage[];
  scrapedUrls: string[];
  botUuid: string;
  botPrompt: string;
  agentBotUuid: string;
  agentPrompt: string;
  step: number;
  completedSteps: Set<number>;

  setWebsiteUrl: (url: string) => void;
  setCompanyInfo: (info: CompanyInfo) => void;
  setEditedSummary: (summary: string) => void;
  setDiscoveredUrls: (urls: string[]) => void;
  addScrapedPage: (page: ScrapedPage) => void;
  setScrapedUrls: (urls: string[]) => void;
  setBotUuid: (uuid: string) => void;
  setBotPrompt: (prompt: string) => void;
  setAgentBotUuid: (uuid: string) => void;
  setAgentPrompt: (prompt: string) => void;
  setStep: (step: number) => void;
  completeStep: (step: number) => void;
  close: () => void;
  onAuthRequired: () => void;
}

const OnboardingContext = createContext<OnboardingState | null>(null);

interface ProviderProps {
  initialUrl?: string;
  onClose: () => void;
  onAuthRequired: () => void;
  children: React.ReactNode;
}

export function OnboardingProvider({ initialUrl, onClose, onAuthRequired, children }: ProviderProps) {
  const [websiteUrl, setWebsiteUrl] = useState(initialUrl || '');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [editedSummary, setEditedSummary] = useState('');
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
  const [fingerprint] = useState(generateId);
  const [siteUuid] = useState(generateId);
  const [scrapedPages, setScrapedPages] = useState<ScrapedPage[]>([]);
  const [scrapedUrls, setScrapedUrls] = useState<string[]>([]);
  const [botUuid, setBotUuid] = useState('');
  const [botPrompt, setBotPrompt] = useState('');
  const [agentBotUuid, setAgentBotUuid] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const addScrapedPage = useCallback((page: ScrapedPage) => {
    setScrapedPages((prev) => [...prev, page]);
  }, []);

  const completeStep = useCallback((stepNum: number) => {
    setCompletedSteps((prev) => new Set([...prev, stepNum]));
  }, []);

  const handleSetCompanyInfo = useCallback((info: CompanyInfo) => {
    setCompanyInfo(info);
    setEditedSummary(info.summary || '');
  }, []);

  const value: OnboardingState = {
    websiteUrl,
    companyInfo,
    editedSummary,
    discoveredUrls,
    fingerprint,
    siteUuid,
    scrapedPages,
    scrapedUrls,
    botUuid,
    botPrompt,
    agentBotUuid,
    agentPrompt,
    step,
    completedSteps,
    setWebsiteUrl,
    setCompanyInfo: handleSetCompanyInfo,
    setEditedSummary,
    setDiscoveredUrls,
    addScrapedPage,
    setScrapedUrls,
    setBotUuid,
    setBotPrompt,
    setAgentBotUuid,
    setAgentPrompt,
    setStep,
    completeStep,
    close: onClose,
    onAuthRequired,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingState {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return ctx;
}
