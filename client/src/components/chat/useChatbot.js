import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'mhs_chat_history';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const WELCOME = {
    id: 'welcome',
    role: 'assistant',
    text: "Hello! I'm MHS Assistant — your expert guide for medical imaging equipment.\n\nI can help with MRI & CT queries, service questions, spare parts, maintenance planning, and more.\n\nHow can I assist you today?",
    timestamp: Date.now(),
};

export function useChatbot() {
    const [isOpen, setIsOpen]       = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [messages, setMessages]   = useState(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [WELCOME];
        } catch {
            return [WELCOME];
        }
    });

    const abortRef = useRef(null);

    // Persist conversation to sessionStorage on every change
    useEffect(() => {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); }
        catch { /* storage full — ignore */ }
    }, [messages]);

    const sendMessage = useCallback(async (text) => {
        const trimmed = text.trim();
        if (!trimmed || isStreaming) return;

        const userMsg = {
            id:        `u-${Date.now()}`,
            role:      'user',
            text:      trimmed,
            timestamp: Date.now(),
        };
        const assistantMsg = {
            id:          `a-${Date.now() + 1}`,
            role:        'assistant',
            text:        '',
            timestamp:   Date.now() + 1,
            isStreaming: true,
        };

        setMessages(prev => [...prev, userMsg, assistantMsg]);
        setIsStreaming(true);

        // Build history for API: all messages except the welcome stub
        const history = [...messages.filter(m => m.id !== 'welcome'), userMsg].map(m => ({
            role: m.role,
            text: m.text,
        }));

        try {
            const controller = new AbortController();
            abortRef.current = controller;

            // Use the Vercel Serverless Function instead of the Express backend
            const response = await fetch('/api/chat', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ messages: history }),
                signal:  controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const reader  = response.body.getReader();
            const decoder = new TextDecoder();
            let   accumulated = '';

            // Read SSE stream
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const raw   = decoder.decode(value, { stream: true });
                const lines = raw.split('\n');

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const payload = line.slice(6).trim();
                    if (payload === '[DONE]') break;

                    try {
                        const parsed = JSON.parse(payload);
                        accumulated += parsed.text ?? '';

                        // Update last assistant message in-place with each chunk
                        setMessages(prev => {
                            const copy = [...prev];
                            copy[copy.length - 1] = {
                                ...copy[copy.length - 1],
                                text: accumulated,
                                isStreaming: true,
                            };
                            return copy;
                        });
                    } catch { /* malformed chunk — skip */ }
                }
            }

            // Mark streaming complete
            setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { ...copy[copy.length - 1], isStreaming: false };
                return copy;
            });

        } catch (err) {
            if (err.name === 'AbortError') return;

            const errText =
                "I'm having trouble connecting. Please reach our team directly:\n\n" +
                "📞 +92 322 5014415\n✉️ info@medquadhealth.com";

            setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { ...copy[copy.length - 1], text: errText, isStreaming: false };
                return copy;
            });
        } finally {
            setIsStreaming(false);
        }
    }, [messages, isStreaming]);

    const clearHistory = useCallback(() => {
        sessionStorage.removeItem(STORAGE_KEY);
        setMessages([WELCOME]);
    }, []);

    const stopStreaming = useCallback(() => {
        abortRef.current?.abort();
        setIsStreaming(false);
        setMessages(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = { ...copy[copy.length - 1], isStreaming: false };
            return copy;
        });
    }, []);

    return { isOpen, setIsOpen, messages, isStreaming, sendMessage, clearHistory, stopStreaming };
}
