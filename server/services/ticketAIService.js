const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `
You are an expert NLP classification engine for Medquad Health Solutions (MHS).
Your job is to analyze incoming service ticket descriptions and output structured JSON data to categorize the fault, assign a priority score, and recommend a technician specialty.

Rules:
1. Category must be one of: 'MRI', 'CT', 'Ultrasound', 'X-Ray', 'ECG', 'Ventilator', 'Monitor', 'Other'.
2. priorityScore must be an integer from 1 to 5, where 1 is lowest priority and 5 is critical.
3. suggestedSpecialty must be a string describing the ideal technician skill (e.g., 'MRI Technician', 'CT Specialist', 'Biomedical Engineer').
4. You MUST output ONLY valid JSON. No markdown formatting, no backticks, no extra text.

Example output:
{
  "category": "MRI",
  "priorityScore": 5,
  "suggestedSpecialty": "MRI Technician"
}
`;

const analyzeTicketDescription = async (description) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('[AI Service] GEMINI_API_KEY is not set. Skipping NLP categorization.');
            return null;
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: {
                temperature: 0.2, // Low temp for more deterministic output
                topP: 0.8,
                responseMimeType: "application/json",
            },
        });

        const result = await model.generateContent(description);
        const text = result.response.text();
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('[AI Service] Failed to parse JSON response from Gemini:', text);
            return null;
        }
    } catch (error) {
        console.error('[AI Service] Error calling Gemini API:', error);
        return null;
    }
};

module.exports = { analyzeTicketDescription };
