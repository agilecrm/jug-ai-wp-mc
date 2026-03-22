import { useState, useEffect, useRef } from '@wordpress/element';
import { useOnboarding } from '../../context/OnboardingContext';
import api from '../../api';
import Spinner from '../shared/Spinner';

const DEFAULT_PROMPT =
  "You are a helpful AI assistant for this website. Answer questions based on the website content. Be concise, friendly, and helpful.";

const DEFAULT_AGENT_PROMPT =
  "You are an intelligent AI agent for this website. You can help users complete tasks, answer questions, and provide recommendations based on the website content.";

const PROMPT_TEMPLATES = [
  {
    name: 'Default Prompt',
    prompt: "You're a chatbot named Kong, trained to interact with visitors. Your purpose is to: 1. Gather visitor details like name, phone number, or email. 2. Assess their interest in scheduling a product demo. \n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assist the visitor today.\n- Keep the conversation brief, focused on generating leads and scheduling demos.\n- Ensure responses are less than 90 words.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability.",
  },
  {
    name: 'Sales',
    prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in your products or services and qualify leads.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess the visitor's needs.\n- Keep the conversation brief, focused on identifying sales opportunities.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability.",
  },
  {
    name: 'Marketing',
    prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in current marketing campaigns, offers, and new product launches.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their interest in your marketing promotions.\n- Keep the conversation brief, focused on marketing promotions and visitor engagement.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability.",
  },
  {
    name: 'Human Resources',
    prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in job inquiries, application processes, and employee benefits.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their HR-related needs.\n- Keep the conversation brief, focused on job opportunities and HR support.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability.",
  },
  {
    name: 'Book a Demo',
    prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in scheduling a product or service demo.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their interest in booking a demo.\n- Keep the conversation brief, focused on booking demos.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability.",
  },
  {
    name: 'Services',
    prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in the services offered by your company.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their interest in your services.\n- Keep the conversation brief, focused on explaining services.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability.",
  },
  {
    name: 'Product Features',
    prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in learning more about product features.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their interest in product features.\n- Keep the conversation brief, focused on highlighting key features.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability.",
  },
  {
    name: 'Healthcare',
    prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in healthcare services, such as consultations, treatments, or wellness programs.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their healthcare needs.\n- Keep the conversation brief, focused on healthcare services.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability.",
  },
  {
    name: 'Real Estate',
    prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in buying, selling, or renting properties.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their real estate needs.\n- Keep the conversation brief, focused on property inquiries.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability.",
  },
  {
    name: 'E-commerce',
    prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in products available for purchase and guide them through the shopping process.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their shopping needs.\n- Keep the conversation brief, focused on helping them find the right products.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability.",
  },
  {
    name: 'Education',
    prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in educational programs, courses, or admissions.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their educational needs.\n- Keep the conversation brief, focused on educational offerings.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability.",
  },
  {
    name: 'Hospitality',
    prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in booking accommodations, dining reservations, or event spaces.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their hospitality needs.\n- Keep the conversation brief, focused on booking inquiries.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability.",
  },
];

export default function StepSystemPrompt() {
  const {
    companyInfo,
    editedSummary,
    websiteUrl,
    scrapedPages,
    botUuid,
    botPrompt,
    setBotPrompt,
    agentBotUuid,
    agentPrompt,
    setAgentPrompt,
    completeStep,
    setStep,
  } = useOnboarding();

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'chatbot' | 'agent'>('chatbot');
  const [isSaving, setIsSaving] = useState(false);

  const isBotCreated = !!botUuid;

  const originalPromptRef = useRef(botPrompt);
  const [lastAppliedPrompt, setLastAppliedPrompt] = useState(botPrompt);
  const hasManualEdits = botPrompt !== lastAppliedPrompt;
  const hasCustomPrompt = botPrompt !== DEFAULT_PROMPT;
  const canReset = botPrompt !== originalPromptRef.current;

  const originalAgentPromptRef = useRef(agentPrompt);
  const [lastAppliedAgentPrompt, setLastAppliedAgentPrompt] = useState(agentPrompt);
  const hasAgentManualEdits = agentPrompt !== lastAppliedAgentPrompt;
  const hasCustomAgentPrompt = agentPrompt !== DEFAULT_AGENT_PROMPT;
  const canResetAgent = agentPrompt !== originalAgentPromptRef.current;

  function resetPrompt() {
    setBotPrompt(originalPromptRef.current);
    setLastAppliedPrompt(originalPromptRef.current);
  }

  function resetAgentPrompt() {
    setAgentPrompt(originalAgentPromptRef.current);
    setLastAppliedAgentPrompt(originalAgentPromptRef.current);
  }

  function getGenerateParams() {
    return {
      company_name: companyInfo?.name || 'Unknown',
      industry: companyInfo?.industry || undefined,
      description: companyInfo?.description || undefined,
      summary: editedSummary || companyInfo?.summary || undefined,
      website_url: websiteUrl || undefined,
      scraped_pages: scrapedPages?.length ? scrapedPages : undefined,
    };
  }

  async function generatePrompt(target: 'chatbot' | 'agent' = activeTab) {
    setGenerating(true);
    setError('');
    try {
      const result = await api.post('bots/generate-prompt', getGenerateParams());
      const prompt = result.prompt || result.system_prompt || '';
      if (target === 'agent') {
        setAgentPrompt(prompt);
        setLastAppliedAgentPrompt(prompt);
      } else {
        setBotPrompt(prompt);
        setLastAppliedPrompt(prompt);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate prompt.');
      if (target === 'agent') {
        if (!agentPrompt || agentPrompt === DEFAULT_AGENT_PROMPT) {
          setAgentPrompt(PROMPT_TEMPLATES[0].prompt);
          setLastAppliedAgentPrompt(PROMPT_TEMPLATES[0].prompt);
        }
      } else {
        if (!botPrompt || botPrompt === DEFAULT_PROMPT) {
          setBotPrompt(PROMPT_TEMPLATES[0].prompt);
          setLastAppliedPrompt(PROMPT_TEMPLATES[0].prompt);
        }
      }
    } finally {
      setGenerating(false);
    }
  }

  function applyTemplate(templatePrompt: string) {
    if (activeTab === 'agent') {
      if (hasAgentManualEdits) {
        const ok = window.confirm('Your changes will be lost. Do you want to continue?');
        if (!ok) return;
      }
      setAgentPrompt(templatePrompt);
      setLastAppliedAgentPrompt(templatePrompt);
    } else {
      if (hasManualEdits) {
        const ok = window.confirm('Your changes will be lost. Do you want to continue?');
        if (!ok) return;
      }
      setBotPrompt(templatePrompt);
      setLastAppliedPrompt(templatePrompt);
    }
  }

  useEffect(() => {
    if (!botPrompt || botPrompt === DEFAULT_PROMPT) {
      generatePrompt('chatbot');
    }
    if (!agentPrompt || agentPrompt === DEFAULT_AGENT_PROMPT) {
      generatePrompt('agent');
    }
  }, []);

  async function handleContinue() {
    if (isBotCreated) {
      setIsSaving(true);
      try {
        await api.put(`bots/${botUuid}`, { prompt: botPrompt });
        if (agentBotUuid) {
          await api.put(`bots/${agentBotUuid}`, { prompt: agentPrompt });
        }
      } catch (err) {
        console.error('Failed to update bot prompt:', err);
      } finally {
        setIsSaving(false);
      }
    }
    completeStep(2);
    setStep(3);
  }

  const currentPrompt = activeTab === 'agent' ? agentPrompt : botPrompt;
  const currentCanReset = activeTab === 'agent' ? canResetAgent : canReset;
  const currentHasCustom = activeTab === 'agent' ? hasCustomAgentPrompt : hasCustomPrompt;
  const currentReset = activeTab === 'agent' ? resetAgentPrompt : resetPrompt;
  const currentOnChange = activeTab === 'agent'
    ? (val: string) => setAgentPrompt(val)
    : (val: string) => setBotPrompt(val);

  const isAgentWithDefaultPrompt =
    activeTab === 'agent' && currentPrompt === DEFAULT_AGENT_PROMPT;
  const displayedPrompt = isAgentWithDefaultPrompt ? '' : currentPrompt;

  return (
    <div className="jug-step-layout">
      <div className="jug-step-body">
        <div className="jug-step-header">
          <h2>Configure your bot's personality</h2>
          <span className="jug-step-badge">AI-powered prompts</span>
        </div>
        <p className="jug-step-subtitle">
          Customize the system prompt that guides your bot's behavior and personality.
        </p>

        <div className="jug-ai-field" style={{ marginBottom: 8 }}>
          <div className="jug-prompt-toolbar">
            <div className="jug-prompt-tabs">
              <span className="jug-prompt-tabs-label">System Prompt</span>
              <button
                type="button"
                className={`jug-prompt-tab${activeTab === 'chatbot' ? ' active' : ''}`}
                onClick={() => setActiveTab('chatbot')}
              >
                💬 Simple Chatbot
              </button>
              <button
                type="button"
                className={`jug-prompt-tab${activeTab === 'agent' ? ' active' : ''}`}
                onClick={() => setActiveTab('agent')}
              >
                ✨ Agent
              </button>
            </div>
            <div className="jug-prompt-actions">
              <button
                type="button"
                className="jug-prompt-action-link"
                onClick={currentReset}
                disabled={!currentCanReset || generating}
                title="Reset to original prompt"
              >
                ↩ Reset
              </button>
              <button
                type="button"
                className="jug-prompt-action-link"
                onClick={() => generatePrompt()}
                disabled={generating}
              >
                🔄 {currentHasCustom ? 'Regenerate' : 'Generate with AI'}
              </button>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              id="jug-prompt"
              value={displayedPrompt}
              onChange={(e) => currentOnChange((e.target as HTMLTextAreaElement).value)}
              placeholder={
                isAgentWithDefaultPrompt
                  ? 'Generate with AI or choose a template below'
                  : undefined
              }
              rows={10}
              className="jug-ai-textarea"
              disabled={generating}
              style={{ minHeight: 200 }}
            />
            {generating && (
              <div className="jug-step-generating-overlay">
                <Spinner size={24} />
                <span>Generating prompt...</span>
              </div>
            )}
          </div>
          <small className="jug-ai-muted">
            {generating
              ? "We're using your company profile to craft the perfect prompt."
              : "This prompt guides your bot's behavior and personality. Edit it to customize."}
          </small>
        </div>

        {error && <p className="jug-ai-error">{error}</p>}

        <div style={{ marginTop: 16 }}>
          <label className="jug-ai-muted" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
            Quick Prompt
          </label>
          <div className="jug-step-template-chips">
            {PROMPT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                className="jug-step-template-chip"
                onClick={() => applyTemplate(tpl.prompt)}
                disabled={generating}
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="jug-step-footer">
        <button
          type="button"
          className="jug-ai-btn-primary"
          onClick={handleContinue}
          disabled={isSaving || generating}
        >
          {isSaving ? (
            <>
              <Spinner size={14} /> Saving...
            </>
          ) : (
            'Continue →'
          )}
        </button>
      </div>
    </div>
  );
}
