const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * MedQuad AI Intelligent Ticket Routing Engine v1.0
 * 
 * Academic Concepts:
 *  - Multi-Criteria Decision Making (MCDM)
 *  - Skill-Task Matching using LLM reasoning
 *  - Workload-Aware Resource Allocation
 *  - Explainable AI Recommendations (XAI)
 * 
 * Given a new ticket, this service analyzes all available employees
 * alongside their past performance and suggests the optimal assignment
 * with a transparent natural-language explanation.
 */

const ROUTING_SYSTEM_PROMPT = `
You are MedQuad RouteAI — an intelligent workforce optimization engine for a 
biomedical engineering company. Your job is to match incoming service tickets
to the most suitable available technician.

You will receive:
1. The service ticket details (equipment category, fault description, priority, AI classification)
2. A list of available employees with their specialties and recent workload

Your task is to select the BEST employee for this ticket and explain why.

OUTPUT FORMAT (ONLY valid JSON, no markdown, no backticks):
{
  "recommendedEmployeeId": "64abc123...",
  "recommendedEmployeeName": "Usman Rafiq",
  "confidenceScore": 0.88,
  "matchReason": "Usman has successfully resolved 3 MRI gradient amplifier tickets in the past 6 months with an average resolution time of 6 hours. His specialization in Siemens MRI systems directly matches this MAGNETOM Vida fault.",
  "alternativeEmployeeId": "64def456...",
  "alternativeEmployeeName": "Fatima Noor",
  "workloadWarning": null
}

RULES:
1. recommendedEmployeeId must exactly match one of the provided employee IDs
2. confidenceScore must be between 0.50 and 0.99
3. matchReason must be specific — reference the employee's actual history or skills
4. If all employees are overloaded (>5 open tickets), set workloadWarning to a brief note
5. If no good match exists, still pick the best available with a low confidenceScore
6. Output ONLY valid JSON — no extra text, no markdown
`;

let _genAI = null;
const getGenAI = () => {
    if (!_genAI && process.env.GEMINI_API_KEY) {
        _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return _genAI;
};

/**
 * Suggests the best employee for a given ticket.
 * 
 * @param {Object} ticket - The new ticket object (populated)
 * @param {Array} employees - List of employee users with their ticket history
 * @returns {Object|null} - Routing recommendation or null on failure
 */
const suggestEmployee = async (ticket, employees) => {
    try {
        const genAI = getGenAI();
        if (!genAI || !employees || employees.length === 0) return null;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: ROUTING_SYSTEM_PROMPT,
            generationConfig: {
                temperature: 0.2,
                topP: 0.85,
                responseMimeType: 'application/json',
            },
        });

        // Build input context
        const ticketContext = {
            category: ticket.aiCategory || ticket.equipmentId?.category || 'Unknown',
            priority: ticket.priority,
            priorityScore: ticket.aiPriorityScore,
            description: ticket.description?.substring(0, 300), // Truncate for token efficiency
            equipment: ticket.equipmentId?.name,
            manufacturer: ticket.equipmentId?.manufacturer,
            clientOrg: ticket.clientId?.orgName,
            aiReasoning: ticket.aiReasoning || null,
        };

        const employeeProfiles = employees.map(emp => ({
            id: emp._id.toString(),
            name: emp.name,
            email: emp.email,
            openTickets: emp.openTicketCount || 0,
            recentCategories: emp.recentCategories || [],
            totalResolved: emp.totalResolved || 0,
            avgResolutionDays: emp.avgResolutionDays || null,
        }));

        const inputPayload = {
            ticket: ticketContext,
            availableEmployees: employeeProfiles,
        };

        const result = await model.generateContent(JSON.stringify(inputPayload));
        const text = result.response.text();
        const parsed = JSON.parse(text);

        if (!parsed.recommendedEmployeeId || !parsed.matchReason) {
            console.warn('[Routing AI] Malformed response from Gemini');
            return null;
        }

        return parsed;
    } catch (err) {
        console.error('[Routing AI] Error:', err.message);
        return null;
    }
};

module.exports = { suggestEmployee };
