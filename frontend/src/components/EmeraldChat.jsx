import { useState, useEffect, useRef } from 'react';

export default function EmeraldChat({ data }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [llmAvailable, setLlmAvailable] = useState(true);
    const [showNudge, setShowNudge] = useState(false);
    const [dismissedNudges, setDismissedNudges] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem('emerald_dismissed_nudges') || '{}');
        } catch {
            return {};
        }
    });

    const messagesEndRef = useRef(null);
    const product = data?.product;
    const compliance = data?.compliance;
    const risk = data?.risk;
    const productId = product?.name || 'current_product';

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Proactive Nudge on new result
    useEffect(() => {
        if (!data || !product?.name) return;

        if (!dismissedNudges[productId] && !isOpen) {
            const timer = setTimeout(() => {
                setShowNudge(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [productId, data]);

    const markNudgeDismissed = () => {
        setShowNudge(false);
        const updated = { ...dismissedNudges, [productId]: true };
        setDismissedNudges(updated);
        try {
            sessionStorage.setItem('emerald_dismissed_nudges', JSON.stringify(updated));
        } catch (e) {
            console.error(e);
        }
    };

    // Formulate quick-reply chips based on analysis result
    const getQuickReplies = () => {
        const chips = [];
        if (compliance?.complianceLevel !== 'SAFE') {
            chips.push('Why is this restricted?');
        }
        if (risk?.importIntelligenceScore != null && risk.importIntelligenceScore < 60) {
            chips.push('Why is buying locally suggested?');
        }
        chips.push('What do these numbers mean?');
        chips.push('Explain the customs duty breakdown');
        chips.push('What is CIF and BCD?');
        return chips.slice(0, 3);
    };

    const handleSend = async (queryText = null) => {
        const textToSend = queryText || input;
        if (!textToSend || typeof textToSend !== 'string' || textToSend.trim().length === 0) return;

        const userMsg = { role: 'user', content: textToSend.trim() };
        const updatedMessages = [...messages, userMsg];

        setMessages(updatedMessages);
        if (!queryText) setInput('');
        setLoading(true);

        if (showNudge) {
            markNudgeDismissed();
        }

        if (!isOpen) {
            setIsOpen(true);
        }

        try {
            // Trim analysis data to necessary fields to keep payload light
            const contextPayload = {
                product: data.product,
                compliance: data.compliance,
                importCosts: data.importCosts,
                risk: data.risk,
                recommendation: data.recommendation,
                localPrices: data.localPrices,
            };

            const historyPayload = updatedMessages.slice(-6).map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: textToSend.trim(),
                    analysis_context: contextPayload,
                    history: historyPayload,
                }),
            });

            const resData = await response.json();

            if (resData.llm_available === false) {
                setLlmAvailable(false);
            } else {
                setLlmAvailable(true);
            }

            const assistantMsg = {
                role: 'assistant',
                content: resData.answer || resData.error || 'I could not generate an answer right now.',
                sources: resData.sources_used || [],
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch (err) {
            console.error('[Emerald Chat] Fetch error:', err);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Emerald is currently offline or unreachable. Please verify backend connection.',
                    sources: [],
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickReply = (chipText) => {
        handleSend(chipText);
    };

    const quickReplies = getQuickReplies();

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Proactive Speech Bubble Nudge */}
            {showNudge && !isOpen && (
                <div className="mb-3 w-72 sm:w-80 glass-card p-4 rounded-2xl border border-emerald-400/50 shadow-2xl animate-card-pop relative">
                    <button
                        onClick={markNudgeDismissed}
                        className="absolute top-2 right-3 text-white/60 hover:text-white text-xs font-bold cursor-pointer"
                    >
                        ✕
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-xs font-black text-emerald-300 uppercase tracking-wider">Emerald Assistant</p>
                    </div>
                    <p className="text-xs text-white leading-relaxed font-medium mb-3">
                        New here? I can walk you through this result — ask me anything about costs, compliance, or ratings.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {quickReplies.map((chip, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleQuickReply(chip)}
                                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors text-left cursor-pointer"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Chat Panel */}
            {isOpen ? (
                <div className="w-80 sm:w-96 h-[490px] max-h-[82vh] glass-card flex flex-col border border-emerald-500/40 shadow-2xl overflow-hidden animate-card-pop">
                    {/* Header */}
                    <div className="p-3.5 border-b border-white/15 flex items-center justify-between bg-emerald-950/60">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full btn-gradient flex items-center justify-center text-white font-black text-sm shadow-md">
                                E
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-white leading-none">Emerald</h4>
                                    {!llmAvailable && (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                            Basic mode
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-emerald-300 font-semibold mt-0.5">Import Intelligence Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-7 h-7 rounded-full glass-card flex items-center justify-center text-white/70 hover:text-white text-xs font-bold cursor-pointer transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {/* Initial Greeting */}
                        <div className="glass-card p-3.5 rounded-2xl rounded-tl-none text-xs leading-relaxed text-white bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                            <p className="font-semibold">
                                👋 Ask me anything about the <span className="text-emerald-300 font-bold">{product?.name || 'this product'}</span> import — compliance, costs, tariffs, or site terms.
                            </p>
                            {quickReplies.length > 0 && messages.length === 0 && (
                                <div className="pt-2 border-t border-white/10 space-y-1.5">
                                    <p className="text-[10px] font-bold text-white/70 uppercase">Quick Questions:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {quickReplies.map((chip, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleQuickReply(chip)}
                                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/10 text-emerald-200 border border-white/15 hover:bg-emerald-500/20 hover:text-white transition-colors cursor-pointer text-left"
                                            >
                                                {chip}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Conversation History */}
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={
                                        m.role === 'user'
                                            ? 'bg-emerald-600/90 text-white rounded-2xl rounded-tr-none px-3.5 py-2 text-xs font-medium shadow-md border border-emerald-400/30 max-w-[85%]'
                                            : 'glass-card px-3.5 py-2.5 rounded-2xl rounded-tl-none text-xs leading-relaxed text-white max-w-[88%] bg-emerald-950/60 border border-emerald-500/30 space-y-1.5'
                                    }
                                >
                                    <div className="whitespace-pre-wrap">{m.content}</div>
                                    {m.sources && m.sources.length > 0 && (
                                        <div className="pt-1.5 border-t border-white/10 flex flex-wrap gap-1">
                                            {m.sources.map((src, i) => (
                                                <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                                    {src}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {loading && (
                            <div className="flex items-center gap-1.5 glass-card px-3.5 py-2.5 rounded-2xl rounded-tl-none w-20 bg-emerald-950/60 border border-emerald-500/30">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Footer */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="p-3 border-t border-white/15 bg-black/40 flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask Emerald about this import..."
                            className="flex-1 bg-black/40 text-white placeholder-white/50 border border-white/15 focus:border-emerald-400 text-xs px-3 py-2 rounded-xl focus:outline-none transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="btn-gradient px-3.5 py-2 text-xs font-extrabold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Send
                        </button>
                    </form>
                </div>
            ) : (
                /* Floating Action Button */
                <button
                    onClick={() => {
                        setIsOpen(true);
                        if (showNudge) markNudgeDismissed();
                    }}
                    className="w-14 h-14 rounded-full btn-gradient flex items-center justify-center shadow-2xl pulse-glow cursor-pointer border-2 border-emerald-300/40 text-white font-black text-xl hover:scale-105 transition-transform"
                    title="Ask Emerald Assistant"
                >
                    E
                </button>
            )}
        </div>
    );
}
