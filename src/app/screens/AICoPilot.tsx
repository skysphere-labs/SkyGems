import { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { motion } from 'motion/react';
import { postCopilotMessage } from '../services/skygemsApi';

interface Message {
  id: number;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const exampleCommands = [
  'Make this more vintage',
  'Add more diamonds',
  'Make the pendant larger',
  'Reduce gold weight',
  'Change to emerald stones',
  'Simplify the design',
];

const initialMessages: Message[] = [
  {
    id: 1,
    type: 'ai',
    text: "Hi! I'm your AI Co-Pilot. I can help you modify your jewelry design. Tell me what changes you'd like to make!",
    timestamp: new Date(Date.now() - 60000),
  },
];

export function AICoPilot() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentDesignVersion, setCurrentDesignVersion] = useState(1);

  const handleSend = async () => {
    if (!input.trim() || processing) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      text: input,
      timestamp: new Date(),
    };

    const userText = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setProcessing(true);

    try {
      const result = await postCopilotMessage('dsn_placeholder', userText);
      setMessages((prev) => [...prev, {
        id: prev.length + 1,
        type: 'ai',
        text: result.response,
        timestamp: new Date(),
      }]);
      setCurrentDesignVersion((v) => v + 1);
    } catch {
      setMessages((prev) => [...prev, {
        id: prev.length + 1,
        type: 'ai',
        text: `I've noted your request: "${userText}". This will be applied when connected to a design. What else would you like to adjust?`,
        timestamp: new Date(),
      }]);
    } finally {
      setProcessing(false);
    }
  };

  const handleExampleClick = (command: string) => {
    setInput(command);
  };

  return (
    <div className="h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Left Side - Design Preview */}
      <div className="flex-1 p-6 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="mb-5">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Design Preview</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Version {currentDesignVersion} &middot; Last updated just now
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <motion.div
            key={currentDesignVersion}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            className="w-full max-w-[500px] aspect-square rounded-lg border overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            <ImageWithFallback
              src="https://via.placeholder.com/1080x1080/1A1A1A/D4AF37?text=Design+Preview"
              alt="Design Preview"
              className="w-full h-full object-contain p-8"
            />
          </motion.div>
        </div>

        <div
          className="mt-5 rounded-lg p-4 border"
          style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255, 255, 255, 0.06)' }}
        >
          <div className="grid grid-cols-3 gap-6 text-sm">
            {[
              ['Design Style', 'Contemporary'],
              ['Metal Weight', '4.2g'],
              ['Gemstone Count', '13 diamonds'],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - AI Chat */}
      <div
        className="w-[440px] border-l flex flex-col"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        {/* Chat Header */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-gold-glow)', color: 'var(--accent-gold)' }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Co-Pilot Editor</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--status-success)' }}></div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Online</span>
              </div>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Describe the changes you want to make using natural language
          </p>
        </div>

        {/* Example Commands */}
        <div className="p-4 border-b" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <div className="eyebrow mb-2">Try these commands</div>
          <div className="flex flex-wrap gap-1.5">
            {exampleCommands.map((command, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(command)}
                className="px-2.5 py-1 rounded-md text-xs font-medium border transition-all"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-gold)';
                  e.currentTarget.style.color = 'var(--accent-gold)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                "{command}"
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[85%] rounded-lg px-4 py-3"
                style={{
                  backgroundColor: message.type === 'user' ? 'var(--accent-gold)' : 'var(--bg-tertiary)',
                  color: message.type === 'user' ? 'var(--text-inverse)' : 'var(--text-primary)',
                }}
              >
                {message.type === 'ai' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3 h-3" style={{ color: 'var(--accent-gold)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--accent-gold)' }}>AI Co-Pilot</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{message.text}</p>
                <div
                  className="text-xs mt-1.5"
                  style={{ color: message.type === 'user' ? 'rgba(10,10,10,0.6)' : 'var(--text-muted)' }}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}

          {processing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3 h-3" style={{ color: 'var(--accent-gold)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--accent-gold)' }}>AI Co-Pilot</span>
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Processing your request...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe the changes you want..."
                className="w-full px-3 py-2.5 rounded-md resize-none text-sm border focus:outline-none transition-all"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-gold)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
                rows={2}
                disabled={processing}
              />
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || processing}
              className="px-4 py-2.5 rounded-md font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: 'var(--accent-gold)', color: 'var(--text-inverse)' }}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
