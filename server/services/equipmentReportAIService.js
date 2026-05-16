const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * MedQuad AI Equipment Health Report Generator v1.0
 * 
 * Academic Concepts:
 *  - Automated Report Generation / Data-to-Text Generation
 *  - Summarization (multi-document: equipment + tickets + predictions → single report)
 *  - Grounded Generation (outputs tied to real data, not hallucinated)
 *  - Explainable AI (XAI) — reports explain reasoning in plain English
 *  - Retrieval-Augmented Generation (RAG): live database context fed to LLM
 * 
 * Given an equipment ID, this service fetches:
 *  - Equipment profile (model, usage, age, service dates)
 *  - Recent service tickets (last 10)
 *  - Active AI maintenance predictions
 * 
 * It then generates a professional biomedical equipment health brief that
 * a hospital biomedical manager or service engineer would recognize as
 * authoritative and clinically meaningful.
 */

const REPORT_SYSTEM_PROMPT = `
You are MedQuad ReportAI — a senior biomedical engineering expert system that generates
professional equipment health assessment reports for hospital administrators and 
biomedical engineering managers.

You will receive a JSON object containing:
- Equipment specifications and operational history
- Recent service ticket history
- Active AI maintenance predictions

Generate a comprehensive but concise Equipment Health Summary Report as structured JSON.

OUTPUT FORMAT (ONLY valid JSON, no markdown, no backticks):
{
  "overallHealthStatus": "Moderate Risk",
  "healthScore": 62,
  "executiveSummary": "The GE Optima CT660 128-Slice CT Scanner at Shifa International Hospital shows signs of approaching component end-of-life. With 18,200 cumulative scan hours — approximately 91% of the rated tube lifecycle — and 8+ months since last preventive maintenance, this system requires priority attention within the next 30-45 days to prevent unplanned downtime.",
  "clinicalRiskAssessment": "Continued operation without intervention carries a moderate-to-high risk of unplanned failure, which could disrupt CT service delivery and require patient diversion. Given this is a high-volume 128-slice system, the operational and clinical impact of an unplanned outage would be significant.",
  "keyFindings": [
    "X-ray tube approaching rated lifecycle: 18,200 of ~20,000 hours (91%)",
    "Last preventive maintenance: 8 months ago — 2 months overdue per annual PM schedule",
    "2 open service tickets related to image quality degradation",
    "Warranty expired 14 months ago — no manufacturer support coverage"
  ],
  "immediateRecommendations": [
    "Schedule X-ray tube replacement within 30 days — order GE Performix 16D tube assembly",
    "Perform full PPM (Planned Preventive Maintenance) visit within 2 weeks",
    "Obtain detector calibration verification and dark/air calibration before next scan"
  ],
  "maintenanceSchedule": "Annual PPM overdue. Next PM due immediately. Post-tube replacement: full calibration suite required.",
  "riskProjection": "Without intervention, probability of unplanned failure within 60 days is estimated at 78-85% based on historical failure data for CT systems at this utilization level.",
  "generatedAt": "2026-05-17T00:00:00Z",
  "modelVersion": "medquad-report-ai-v1.0"
}

RULES:
1. Output ONLY valid JSON — no markdown, no backticks, no extra text
2. healthScore must be an integer 0-100 (100 = perfect health)
3. overallHealthStatus must be: "Excellent", "Good", "Fair", "Moderate Risk", "High Risk", or "Critical"
4. executiveSummary must be 2-3 sentences — precise, professional, non-generic
5. keyFindings must be 3-6 specific, evidence-based findings from the data provided
6. immediateRecommendations must be 2-4 actionable items with specifics (part numbers where known)
7. All content must be grounded in the actual data provided — do not hallucinate specifications
8. Write like a senior biomedical engineer with 15+ years of field experience
9. Include the exact generatedAt timestamp from the input data
`;

let _genAI = null;
const getGenAI = () => {
    if (!_genAI && process.env.GEMINI_API_KEY) {
        _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return _genAI;
};

/**
 * Generates a professional AI health report for a piece of equipment.
 * 
 * @param {Object} equipment - Full equipment document (populated)
 * @param {Array} tickets - Recent service tickets for this equipment
 * @param {Array} predictions - Active maintenance predictions for this equipment
 * @returns {Object|null} - Report object or null on failure
 */
const generateEquipmentReport = async (equipment, tickets = [], predictions = []) => {
    try {
        const genAI = getGenAI();
        if (!genAI) {
            return {
                error: 'AI service unavailable — GEMINI_API_KEY not configured.',
                overallHealthStatus: 'Unknown',
                healthScore: null,
            };
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: REPORT_SYSTEM_PROMPT,
            generationConfig: {
                temperature: 0.3,
                topP: 0.88,
                responseMimeType: 'application/json',
            },
        });

        const daysSinceService = equipment.lastServiceDate
            ? Math.floor((Date.now() - new Date(equipment.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24))
            : null;

        const ageYears = equipment.installDate
            ? ((Date.now() - new Date(equipment.installDate).getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)
            : null;

        const warrantyStatus = equipment.warrantyExpiry
            ? (new Date(equipment.warrantyExpiry) < new Date()
                ? `Expired ${Math.floor((Date.now() - new Date(equipment.warrantyExpiry).getTime()) / (1000 * 60 * 60 * 24 * 30))} months ago`
                : `Valid until ${new Date(equipment.warrantyExpiry).toLocaleDateString()}`)
            : 'Unknown';

        const inputData = {
            equipment: {
                name: equipment.name,
                model: equipment.model,
                manufacturer: equipment.manufacturer,
                category: equipment.category,
                serialNumber: equipment.serialNumber,
                status: equipment.status,
                clientOrganization: equipment.clientId?.orgName || 'Unknown',
                totalUsageHours: equipment.totalUsageHours || 0,
                ageInYears: ageYears ? parseFloat(ageYears) : null,
                installDate: equipment.installDate,
                lastServiceDate: equipment.lastServiceDate,
                daysSinceLastService: daysSinceService,
                warrantyStatus,
                description: equipment.description?.substring(0, 200),
                specifications: equipment.specifications ? Object.fromEntries(equipment.specifications) : {},
            },
            recentTickets: tickets.slice(0, 10).map(t => ({
                status: t.status,
                priority: t.priority,
                aiCategory: t.aiCategory,
                description: t.description?.substring(0, 100),
                createdAt: t.createdAt,
                resolvedAt: t.resolvedAt || null,
                updates: t.updates?.length || 0,
            })),
            activePredictions: predictions.map(p => ({
                riskTier: p.riskTier,
                confidence: p.confidence,
                failureType: p.failureType,
                daysUntilFailure: p.predictedFailureDate
                    ? Math.floor((new Date(p.predictedFailureDate) - Date.now()) / (1000 * 60 * 60 * 24))
                    : null,
                riskFactors: p.riskFactors,
                recommendations: p.recommendations,
            })),
            reportRequestedAt: new Date().toISOString(),
        };

        const result = await model.generateContent(JSON.stringify(inputData));
        const text = result.response.text();
        const parsed = JSON.parse(text);

        if (!parsed.overallHealthStatus || typeof parsed.healthScore !== 'number') {
            console.error('[Report AI] Malformed response structure');
            return null;
        }

        return parsed;
    } catch (err) {
        console.error('[Report AI] Error generating equipment report:', err.message);
        return null;
    }
};

module.exports = { generateEquipmentReport };
