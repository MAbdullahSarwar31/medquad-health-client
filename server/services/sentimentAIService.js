const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * MedQuad Sentiment Analysis Engine v1.0
 * 
 * Academic Concepts:
 *  - Sentiment Analysis / Opinion Mining (NLP subfield)
 *  - Affective Computing — understanding emotional state from text
 *  - Automated Escalation Trigger (business process automation via AI)
 *  - Calibrated Sentiment Scoring (continuous -1.0 to 1.0 scale)
 * 
 * Runs on every client comment/update on a service ticket.
 * If negative sentiment is detected (frustrated client), the ticket is
 * automatically flagged for escalation and admins are notified.
 */

const SENTIMENT_SYSTEM_PROMPT = `
You are MedQuad SentimentAI — a specialized NLP engine that analyzes customer messages
in the context of medical equipment service tickets.

Your task is to evaluate the emotional tone and urgency of a client's message and determine
if the situation requires immediate escalation to a manager.

Context: These clients are hospital administrators, biomedical engineers, and doctors who 
depend on MRI, CT, X-Ray, and other critical medical imaging equipment for patient care.
When equipment fails, lives may be at stake — frustration and urgency are entirely legitimate.

OUTPUT FORMAT (ONLY valid JSON, no markdown, no backticks):
{
  "sentiment": "negative",
  "sentimentScore": -0.78,
  "escalationNeeded": true,
  "escalationReason": "Client explicitly mentions patient harm risk, multi-day downtime without response, and has used escalating language ('completely unacceptable', 'demanding immediate action').",
  "emotionalIndicators": ["unacceptable delay", "patients at risk", "demanding action"],
  "urgencyLevel": "high"
}

SENTIMENT VALUES: "positive", "neutral", "negative"
SENTIMENT SCORE: float from -1.0 (extremely negative) to 1.0 (extremely positive), 0.0 is neutral

ESCALATION CRITERIA (set escalationNeeded: true if any apply):
- Client mentions patient harm or clinical risk
- Client expresses extreme frustration (multiple exclamation marks, words like "unacceptable", "demand", "lawsuit", "complaint")
- Client states the issue has gone unresolved for 3+ days without response
- Client threatens to contact management, regulators, or switch vendors
- The overall sentiment score is below -0.60

RULES:
1. Output ONLY valid JSON — no markdown, no extra text
2. sentimentScore must be between -1.0 and 1.0 (2 decimal places)
3. emotionalIndicators must be 2-4 exact or near-exact phrases from the message
4. urgencyLevel must be exactly: "low", "medium", or "high"
5. Be calibrated — routine complaints are "negative" but not escalation-worthy
6. Medical context matters: "patient diversion" is more urgent than "minor inconvenience"
`;

let _genAI = null;
const getGenAI = () => {
    if (!_genAI && process.env.GEMINI_API_KEY) {
        _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return _genAI;
};

/**
 * Analyzes the sentiment of a client message on a ticket update.
 * 
 * @param {string} message - The client's message text
 * @param {Object} ticketContext - Brief ticket context (priority, equipmentName, daysSinceCreated)
 * @returns {Object|null} - Sentiment analysis result or null on failure
 */
const analyzeSentiment = async (message, ticketContext = {}) => {
    try {
        const genAI = getGenAI();
        if (!genAI) return null;

        if (!message || message.trim().length < 10) return null;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: SENTIMENT_SYSTEM_PROMPT,
            generationConfig: {
                temperature: 0.1, // Very deterministic for consistent sentiment scoring
                topP: 0.8,
                responseMimeType: 'application/json',
            },
        });

        const inputPayload = {
            clientMessage: message,
            context: {
                ticketPriority: ticketContext.priority || 'unknown',
                equipmentName: ticketContext.equipmentName || 'Unknown Equipment',
                daysSinceTicketCreated: ticketContext.daysSinceCreated || null,
                currentStatus: ticketContext.status || 'unknown',
            },
        };

        const result = await model.generateContent(JSON.stringify(inputPayload));
        const text = result.response.text();
        const parsed = JSON.parse(text);

        if (typeof parsed.sentimentScore !== 'number' || !parsed.sentiment) {
            console.warn('[Sentiment AI] Malformed response:', text);
            return null;
        }

        return {
            sentiment: parsed.sentiment,
            sentimentScore: Math.max(-1, Math.min(1, parsed.sentimentScore)),
            escalationNeeded: parsed.escalationNeeded === true,
            escalationReason: parsed.escalationReason || null,
            emotionalIndicators: parsed.emotionalIndicators || [],
            urgencyLevel: parsed.urgencyLevel || 'low',
        };
    } catch (err) {
        console.error('[Sentiment AI] Error:', err.message);
        return null;
    }
};

module.exports = { analyzeSentiment };
