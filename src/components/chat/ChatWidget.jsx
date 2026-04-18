import { useRef, useEffect, useState } from 'react';
import { useChatbot } from './useChatbot';
import './ChatWidget.css';

// ─── Suggested opening questions ──────────────────────────────
const QUICK_REPLIES = [
    'What services do you offer?',
    'MRI maintenance & repair',
    'CT scanner tube replacement',
    'Need a spare part urgently',
    'Request a service quote',
];

function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
}

// ─── Typing dots ───────────────────────────────────────────────
function TypingDots() {
    return (
        <div className="cw-typing" aria-label="Typing">
            <span className="cw-dot" /><span className="cw-dot" /><span className="cw-dot" />
        </div>
    );
}

// ─── Team avatar (initials-based, no robot icon) ───────────────
function TeamAvatar({ size = 30 }) {
    return (
        <div className="cw-team-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
            MH
        </div>
    );
}

// ─── Single message ────────────────────────────────────────────
function MessageBubble({ msg }) {
    const isUser = msg.role === 'user';

    const renderText = (text) =>
        text.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
        ));

    return (
        <div className={`cw-msg ${isUser ? 'cw-msg--user' : 'cw-msg--support'}`}>
            {!isUser && <TeamAvatar size={28} />}
            <div className="cw-bubble-col">
                <div className={`cw-bubble ${isUser ? 'cw-bubble--user' : 'cw-bubble--support'}`}>
                    {msg.isStreaming && !msg.text ? (
                        <TypingDots />
                    ) : (
                        renderText(msg.text)
                    )}
                    {msg.isStreaming && msg.text && (
                        <span className="cw-cursor" aria-hidden />
                    )}
                </div>
                <span className="cw-time">{formatTime(msg.timestamp)}</span>
            </div>
        </div>
    );
}

// ─── Main Widget ───────────────────────────────────────────────
export default function ChatWidget() {
    const { isOpen, setIsOpen, messages, isStreaming, sendMessage, clearHistory, stopStreaming } =
        useChatbot();

    const [input, setInput]     = useState('');
    const [closing, setClosing] = useState(false);
    const bottomRef             = useRef(null);
    const inputRef              = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 280);
    }, [isOpen]);

    const open = () => { setClosing(false); setIsOpen(true); };
    const close = () => {
        setClosing(true);
        setTimeout(() => { setIsOpen(false); setClosing(false); }, 230);
    };

    const send = () => {
        if (!input.trim() || isStreaming) return;
        sendMessage(input);
        setInput('');
    };

    const onKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const waHref = `https://wa.me/923225014415?text=${encodeURIComponent(
        'Hi, I need to speak with an MHS engineer about my equipment.'
    )}`;

    const showChips = messages.length === 1 && messages[0].id === 'welcome' && !isStreaming;

    return (
        <>
            {/* ── FAB ── */}
            <button
                className={`cw-fab ${isOpen ? 'cw-fab--active' : ''}`}
                onClick={isOpen ? close : open}
                aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
                aria-expanded={isOpen}
            >
                {isOpen ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <>
                        {/* Chat bubble with subtle inner dots */}
                        <svg viewBox="0 0 24 24" fill="none" width="23" height="23">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                fill="white" fillOpacity="0.95" />
                            <circle cx="9"  cy="10" r="1.1" fill="#E8192C" />
                            <circle cx="12" cy="10" r="1.1" fill="#E8192C" />
                            <circle cx="15" cy="10" r="1.1" fill="#E8192C" />
                        </svg>
                        <span className="cw-fab-ping" aria-hidden />
                    </>
                )}
            </button>

            {/* ── Chat Window ── */}
            {(isOpen || closing) && (
                <div
                    className={`cw-window ${closing ? 'cw-window--out' : 'cw-window--in'}`}
                    role="dialog"
                    aria-label="MHS Engineering Support"
                >
                    {/* Header */}
                    <div className="cw-header">
                        <div className="cw-header-left">
                            <div className="cw-header-avatar-wrap">
                                <TeamAvatar size={40} />
                                <span className="cw-online-dot" aria-hidden />
                            </div>
                            <div className="cw-header-text">
                                <p className="cw-header-name">MHS Engineering Support</p>
                                <p className="cw-header-sub">
                                    {isStreaming ? '● Typing a response...' : '● Typically responds instantly'}
                                </p>
                            </div>
                        </div>
                        <div className="cw-header-btns">
                            <button className="cw-hbtn" onClick={clearHistory} title="Clear chat" aria-label="Clear chat">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                                </svg>
                            </button>
                            <button className="cw-hbtn" onClick={close} aria-label="Close">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Intro strip */}
                    <div className="cw-intro-strip">
                        <span>Biomedical equipment experts — MRI · CT · Spare Parts · Maintenance</span>
                    </div>

                    {/* Messages */}
                    <div className="cw-body" role="log" aria-live="polite">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} msg={msg} />
                        ))}

                        {showChips && (
                            <div className="cw-chips" role="group" aria-label="Suggested questions">
                                {QUICK_REPLIES.map(q => (
                                    <button key={q} className="cw-chip" onClick={() => sendMessage(q)}>
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="cw-input-row">
                        <textarea
                            ref={inputRef}
                            className="cw-input"
                            placeholder="Message MHS Support..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={onKey}
                            rows={1}
                            disabled={isStreaming}
                            aria-label="Type your message"
                        />
                        {isStreaming ? (
                            <button className="cw-btn-stop" onClick={stopStreaming} aria-label="Stop">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                    <rect x="5" y="5" width="14" height="14" rx="2" />
                                </svg>
                            </button>
                        ) : (
                            <button className="cw-btn-send" onClick={send} disabled={!input.trim()} aria-label="Send">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="17" height="17">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="cw-footer">
                        <a href={waHref} target="_blank" rel="noreferrer" className="cw-wa">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.117 1.528 5.846L0 24l6.335-1.658A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.796 9.796 0 01-4.988-1.366l-.358-.212-3.76.985 1.003-3.655-.233-.374A9.79 9.79 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182c5.418 0 9.818 4.4 9.818 9.818 0 5.418-4.4 9.818-9.818 9.818z" />
                            </svg>
                            Speak with an Engineer
                        </a>
                        <span className="cw-secure">🔒 Private & Secure</span>
                    </div>
                </div>
            )}
        </>
    );
}
