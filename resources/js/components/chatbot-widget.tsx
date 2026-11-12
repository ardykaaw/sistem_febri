import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, ArrowUp, Sparkles, ChevronDown } from 'lucide-react';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    time: string;
}

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Halo, ada yang bisa kami bantu mengenai antrean, jadwal drg. Febri, atau keluhan gigi Anda?",
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        }
    ]);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Custom event listener for external triggers
    useEffect(() => {
        const handleOpenEvent = (e?: Event) => {
            setIsOpen(true);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const customPrompt = (e as any)?.detail?.prompt;
            if (customPrompt) {
                setTimeout(() => handleSendMessage(customPrompt), 300);
            }
        };

        window.addEventListener('open-chatbot', handleOpenEvent);
        return () => window.removeEventListener('open-chatbot', handleOpenEvent);
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen, messages]);

    const quickPrompts = [
        'Status antrean saat ini',
        'Keluhan sakit gigi',
        'Jadwal praktik dokter',
        'Panduan reservasi',
    ];

    const handleSendMessage = async (textToSend?: string) => {
        const text = (textToSend || inputMessage).trim();
        if (!text || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInputMessage('');
        setIsLoading(true);

        const historyPayload = updatedMessages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
        }));

        try {
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    message: text,
                    history: historyPayload,
                }),
            });

            const data = await response.json();

            if (data.success && data.reply) {
                const botMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.reply,
                    time: data.server_time ? data.server_time.substring(0, 5) : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                };
                setMessages((prev) => [...prev, botMsg]);
            } else {
                throw new Error('Gagal');
            }
        } catch {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Maaf, terjadi gangguan koneksi. Anda tetap dapat langsung mengambil nomor antrean di halaman Beranda.',
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Clean, typography-focused formatter
    const renderFormattedContent = (content: string) => {
        return content.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
            const textToProcess = isBullet ? trimmed.replace(/^[•\-]\s*/, '') : line;

            // Parse bold tags **text**
            const parts = textToProcess.split(/(\*\*.*?\*\*)/g);
            const renderedLine = parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={pIdx} className="fw-semibold text-dark">{part.slice(2, -2)}</strong>;
                }
                return part;
            });

            if (isBullet) {
                return (
                    <div key={idx} className="d-flex align-items-start gap-2 mb-1.5 ms-1">
                        <span className="text-secondary" style={{ fontSize: '10px', marginTop: '5px' }}>●</span>
                        <div className="flex-grow-1">{renderedLine}</div>
                    </div>
                );
            }

            if (trimmed === '') {
                return <div key={idx} style={{ height: '6px' }} />;
            }

            return <div key={idx} className="mb-1">{renderedLine}</div>;
        });
    };

    return (
        <div 
            className="chatbot-widget d-print-none"
            style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1060,
                fontFamily: 'inherit',
            }}
        >
            {/* 1. MINIMALIST FLOATING TRIGGER BUTTON */}
            {!isOpen && (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="btn rounded-circle d-flex align-items-center justify-content-center text-white shadow"
                    style={{
                        width: 52,
                        height: 52,
                        background: '#0C7C70',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 8px 24px -4px rgba(12, 124, 112, 0.4)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title="Bantuan & Antrean Pasien"
                >
                    <MessageSquare size={22} />
                    <span 
                        className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle"
                        style={{ width: 12, height: 12, marginRight: 2, marginBottom: 2 }}
                    />
                </button>
            )}

            {/* 2. MODERN MINIMALIST CHAT WINDOW */}
            {isOpen && (
                <div
                    className="card border-0 shadow-lg d-flex flex-column overflow-hidden"
                    style={{
                        width: '360px',
                        maxWidth: 'calc(100vw - 32px)',
                        height: '520px',
                        maxHeight: 'calc(100vh - 60px)',
                        borderRadius: 16,
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        boxShadow: '0 16px 48px -8px rgba(15, 23, 42, 0.16)',
                    }}
                >
                    {/* Clean Minimalist Header */}
                    <div 
                        className="px-3 py-2.5 bg-white border-bottom d-flex align-items-center justify-content-between"
                        style={{ borderColor: '#F1F5F9' }}
                    >
                        <div className="d-flex align-items-center gap-2">
                            <div 
                                className="d-flex align-items-center justify-content-center text-white rounded-circle font-monospace fw-bold"
                                style={{ width: 32, height: 32, background: '#0C7C70', fontSize: '13px' }}
                            >
                                W
                            </div>
                            <div>
                                <div className="fw-bold text-dark" style={{ fontSize: '13px', lineHeight: 1.2 }}>
                                    Klinik drg. Febri, Sp.KG
                                </div>
                                <div className="text-secondary d-flex align-items-center gap-1.5" style={{ fontSize: '11px' }}>
                                    <span className="bg-success rounded-circle" style={{ width: 6, height: 6 }} />
                                    <span>Layanan Pasien Online</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="btn btn-sm btn-ghost-secondary p-1 text-secondary"
                            style={{ borderRadius: 8, border: 'none' }}
                            title="Tutup"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Messages Body */}
                    <div 
                        className="p-3 flex-grow-1 overflow-y-auto"
                        style={{
                            background: '#F8FAFC',
                            fontSize: '12.5px',
                            lineHeight: 1.55,
                            color: '#334155',
                        }}
                    >
                        {messages.map((m) => {
                            const isUser = m.role === 'user';
                            return (
                                <div 
                                    key={m.id}
                                    className={`d-flex mb-2.5 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
                                >
                                    <div style={{ maxWidth: '85%' }}>
                                        <div 
                                            className="p-2.5 px-3 rounded-3"
                                            style={{
                                                background: isUser ? '#0C7C70' : '#FFFFFF',
                                                color: isUser ? '#FFFFFF' : '#1E293B',
                                                border: isUser ? 'none' : '1px solid #E2E8F0',
                                                borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                                boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.03)',
                                            }}
                                        >
                                            {renderFormattedContent(m.content)}
                                        </div>
                                        <div 
                                            className={`text-muted px-1 mt-0.5 ${isUser ? 'text-end' : 'text-start'}`}
                                            style={{ fontSize: '10px', opacity: 0.8 }}
                                        >
                                            {m.time}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing state */}
                        {isLoading && (
                            <div className="d-flex justify-content-start mb-2">
                                <div 
                                    className="p-2.5 px-3 bg-white border rounded-3 d-flex align-items-center gap-1.5 shadow-xs"
                                    style={{ borderRadius: '14px 14px 14px 2px', borderColor: '#E2E8F0' }}
                                >
                                    <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompts Bar */}
                    <div className="p-2 bg-white border-top overflow-x-auto" style={{ borderColor: '#F1F5F9', whiteSpace: 'nowrap' }}>
                        <div className="d-flex gap-1.5">
                            {quickPrompts.map((promptText, pIdx) => (
                                <button
                                    key={pIdx}
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleSendMessage(promptText)}
                                    className="btn btn-sm btn-light border text-secondary px-2.5 py-1 text-nowrap"
                                    style={{
                                        borderRadius: 8,
                                        fontSize: '11px',
                                        background: '#F8FAFC',
                                        borderColor: '#E2E8F0',
                                        fontWeight: 500,
                                    }}
                                >
                                    {promptText}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Minimalist Input Bar */}
                    <div className="p-2.5 bg-white border-top" style={{ borderColor: '#F1F5F9' }}>
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="d-flex align-items-center gap-1.5 position-relative"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                placeholder="Tulis pertanyaan..."
                                className="form-control form-control-sm pe-5"
                                style={{
                                    borderRadius: 10,
                                    padding: '9px 12px',
                                    fontSize: '12px',
                                    border: '1px solid #CBD5E1',
                                }}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !inputMessage.trim()}
                                className="btn btn-sm position-absolute end-0 me-1 d-flex align-items-center justify-content-center text-white"
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 7,
                                    background: inputMessage.trim() ? '#0C7C70' : '#94A3B8',
                                    border: 'none',
                                    transition: 'background 0.2s ease',
                                }}
                                aria-label="Kirim"
                            >
                                <ArrowUp size={14} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
