const { GoogleGenerativeAI } = require('@google/generative-ai');
const { notify, getAdminIds } = require('./notificationService');
const Equipment = require('../models/Equipment');
const MaintenancePrediction = require('../models/MaintenancePrediction');

/**
 * MedQuad AI Predictive Maintenance Engine v3.0
 * 
 * Powered by Google Gemini AI — genuine LLM-based reasoning replaces
 * the previous deterministic rule-based heuristic system.
 * 
 * Architecture:
 *  - Each equipment's full telemetry profile is sent to Gemini
 *  - Gemini reasons about failure probability using its trained knowledge
 *    of medical imaging equipment lifecycles and failure patterns
 *  - Output: structured JSON with confidence, failure type, risk factors,
 *    days to failure, and explainable recommendations (XAI)
 *  - Graceful degradation: if Gemini is unavailable, falls back to
 *    the legacy heuristic engine
 */

// ── Gemini model singleton ────────────────────────────────────────────────────
let _genAI = null;
const getGenAI = () => {
    if (!_genAI && process.env.GEMINI_API_KEY) {
        _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return _genAI;
};

// ── AI System Prompt ──────────────────────────────────────────────────────────
const PREDICTION_SYSTEM_PROMPT = `
You are MedQuad AI — an expert predictive maintenance system for medical imaging equipment
used by Medquad Health Solutions, a biomedical engineering company in Pakistan.

Your task is to analyze a piece of medical equipment's operational data and predict 
the likelihood and nature of an upcoming failure. You must reason like a senior 
biomedical engineer with 20 years of experience servicing MRI, CT, X-Ray, Ultrasound,
ECG, Ventilator, and patient monitoring equipment.

INPUT FORMAT:
You will receive a JSON object with the equipment's telemetry and service history.

OUTPUT FORMAT:
You MUST output ONLY valid JSON. No markdown, no backticks, no extra text. Exactly this structure:

{
  "shouldGeneratePrediction": true,
  "confidence": 0.82,
  "riskTier": "high",
  "failureType": "X-Ray Tube Lifecycle Exceeded",
  "daysUntilFailure": 45,
  "riskFactors": [
    "CT tube at 18,200 hours — rated lifecycle is ~20,000 hours",
    "No servicing in over 8 months despite high usage",
    "Warranty expired 14 months ago with no extended coverage"
  ],
  "recommendations": "Schedule X-ray tube replacement within 30–45 days. Order GE Performix tube assembly (part GE-XRT-128S). Allocate 6–8 hours downtime for replacement. Run post-replacement dose calibration and detector alignment.",
  "aiExplanation": "The Optima CT660 is exhibiting a classic pre-failure profile for CT tube degradation. With 18,200 cumulative scan hours against a rated tube life of 20,000 hours, the probability of tube failure within the next 60 days is statistically high based on field data for this model family. The absence of scheduled maintenance for 8+ months compounds thermal stress accumulation on the anode disk."
}

RULES:
1. confidence must be a float between 0.0 and 0.95
2. riskTier must be exactly: "critical" (>=0.75), "high" (>=0.55), or "moderate" (>=0.40)
3. Set shouldGeneratePrediction to false only if the equipment is in near-perfect condition
4. daysUntilFailure must be a realistic integer between 7 and 365
5. riskFactors must be 2-5 specific, technical, evidence-based bullet points
6. recommendations must be actionable with part numbers where applicable
7. aiExplanation must be 2-3 sentences of engineering reasoning — NOT generic statements
8. Base your reasoning on real-world failure patterns for that specific equipment category and manufacturer
`;

// ── Gemini-based AI prediction per device ────────────────────────────────────
const predictWithAI = async (eq) => {
    const genAI = getGenAI();
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: PREDICTION_SYSTEM_PROMPT,
            generationConfig: {
                temperature: 0.3,
                topP: 0.85,
                responseMimeType: 'application/json',
            },
        });

        const daysSinceService = eq.lastServiceDate
            ? Math.floor((Date.now() - new Date(eq.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24))
            : null;

        const ageYears = eq.installDate
            ? ((Date.now() - new Date(eq.installDate).getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)
            : null;

        const warrantyStatus = eq.warrantyExpiry
            ? (new Date(eq.warrantyExpiry) < new Date()
                ? `Expired ${Math.floor((Date.now() - new Date(eq.warrantyExpiry).getTime()) / (1000 * 60 * 60 * 24 * 30))} months ago`
                : `Valid, expires ${new Date(eq.warrantyExpiry).toLocaleDateString()}`)
            : 'Unknown';

        const recentDailyHours = eq.usageHoursLog?.length > 0
            ? eq.usageHoursLog[eq.usageHoursLog.length - 1].hours
            : null;

        const equipmentProfile = {
            name: eq.name,
            model: eq.model,
            manufacturer: eq.manufacturer,
            category: eq.category,
            serialNumber: eq.serialNumber,
            status: eq.status,
            totalUsageHours: eq.totalUsageHours || 0,
            recentDailyUsageHours: recentDailyHours,
            daysSinceLastService: daysSinceService,
            ageInYears: ageYears ? parseFloat(ageYears) : null,
            warrantyStatus,
            description: eq.description || null,
        };

        const result = await model.generateContent(JSON.stringify(equipmentProfile));
        const text = result.response.text();
        const parsed = JSON.parse(text);

        // Validate required fields
        if (typeof parsed.confidence !== 'number' || !parsed.riskTier || !parsed.failureType) {
            console.warn(`[MedQuad AI] Malformed Gemini response for ${eq.name}`);
            return null;
        }

        return parsed;
    } catch (err) {
        console.warn(`[MedQuad AI] Gemini call failed for ${eq.name}: ${err.message}`);
        return null;
    }
};

// ── Legacy Heuristic Fallback Engine ─────────────────────────────────────────
const getFailureTypeByCategory = (category) => {
    const map = {
        'MRI':        'Magnet Cooling System Degradation',
        'CT':         'X-Ray Tube Lifecycle Exceeded',
        'X-Ray':      'Detector Panel Calibration Drift',
        'Ultrasound': 'Transducer Array Wear',
        'ECG':        'Lead & Electrode Calibration Drift',
        'Ventilator': 'Flow Sensor & Valve Wear',
        'Monitor':    'Display & Biosensor Degradation',
        'Other':      'General Component Degradation',
    };
    return map[category] || 'General Component Degradation';
};

const buildRecommendation = (category, riskFactors, confidence) => {
    const urgency = confidence >= 0.75 ? 'Immediate action required.' :
                    confidence >= 0.55 ? 'Schedule within 2 weeks.' :
                    'Schedule at next available maintenance window.';
    const categoryAction = {
        'MRI':        'Inspect cryogenic cooling system and helium levels.',
        'CT':         'Evaluate X-ray tube output and schedule tube replacement assessment.',
        'X-Ray':      'Perform detector calibration and flat-field correction.',
        'Ultrasound': 'Inspect transducer connectors and perform acoustic output test.',
        'ECG':        'Recalibrate all leads and verify signal integrity.',
        'Ventilator': 'Test flow sensors, valves, and perform full circuit check.',
        'Monitor':    'Verify sensor accuracy, display brightness, and alarm thresholds.',
    }[category] || 'Perform full preventive maintenance inspection.';
    const factorSummary = riskFactors.length > 0 ? `Key risk indicators: ${riskFactors.join('; ')}.` : '';
    return `${urgency} ${categoryAction} ${factorSummary}`.trim();
};

const heuristicFallback = (eq) => {
    const serialSeed = (eq.serialNumber || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    let confidence = 0.10 + ((serialSeed % 7) * 0.007);
    let daysUntilFailure = 180;
    const riskFactors = [];

    const daysSinceService = eq.lastServiceDate
        ? (Date.now() - new Date(eq.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24)
        : 400;

    if (daysSinceService > 365) { confidence += 0.35; daysUntilFailure -= 75; riskFactors.push('Critical: No servicing in over 1 year'); }
    else if (daysSinceService > 180) { confidence += 0.25; daysUntilFailure -= 45; riskFactors.push('Overdue for scheduled maintenance (>6 months)'); }
    else if (daysSinceService > 90) { confidence += 0.10; daysUntilFailure -= 20; riskFactors.push('Approaching service interval (>3 months)'); }

    if (eq.totalUsageHours > 8000) { confidence += 0.25; daysUntilFailure -= 60; riskFactors.push('Extreme cumulative usage (>8,000 hrs)'); }
    else if (eq.totalUsageHours > 5000) { confidence += 0.15; daysUntilFailure -= 35; riskFactors.push('High cumulative usage hours (>5,000 hrs)'); }
    else if (eq.totalUsageHours > 2000) { confidence += 0.08; daysUntilFailure -= 15; riskFactors.push('Moderate usage accumulation (>2,000 hrs)'); }

    if (eq.usageHoursLog?.length > 0) {
        const recentLog = eq.usageHoursLog[eq.usageHoursLog.length - 1];
        if (recentLog.hours > 18) { confidence += 0.18; daysUntilFailure -= 40; riskFactors.push('Extreme usage spike (>18 hrs/day)'); }
        else if (recentLog.hours > 12) { confidence += 0.10; daysUntilFailure -= 20; riskFactors.push('Abnormal usage spike (>12 hrs/day)'); }
    }

    if (eq.warrantyExpiry) {
        const warrantyExpired = new Date(eq.warrantyExpiry) < new Date();
        const daysToExpiry = (new Date(eq.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (warrantyExpired) { confidence += 0.07; riskFactors.push('Out-of-warranty — no manufacturer coverage'); }
        else if (daysToExpiry < 90) { confidence += 0.04; riskFactors.push(`Warranty expiring in ${Math.round(daysToExpiry)} days`); }
    }

    if (eq.installDate) {
        const ageYears = (Date.now() - new Date(eq.installDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (ageYears > 10) { confidence += 0.12; daysUntilFailure -= 25; riskFactors.push(`Aging device — ${Math.round(ageYears)} years old`); }
        else if (ageYears > 7) { confidence += 0.06; riskFactors.push(`Mature device — ${Math.round(ageYears)} years old`); }
    }

    confidence = Math.min(parseFloat(confidence.toFixed(3)), 0.95);
    const riskTier = confidence >= 0.75 ? 'critical' : confidence >= 0.55 ? 'high' : 'moderate';

    if (confidence <= 0.40) return null;

    return {
        shouldGeneratePrediction: true,
        confidence,
        riskTier,
        failureType: getFailureTypeByCategory(eq.category),
        daysUntilFailure: Math.max(7, Math.floor(daysUntilFailure)),
        riskFactors,
        recommendations: buildRecommendation(eq.category, riskFactors, confidence),
        aiExplanation: null, // No explanation in fallback mode
        modelVersion: 'medquad-heuristic-fallback-v2.0',
    };
};

// ── Main Prediction Runner ────────────────────────────────────────────────────
const generatePredictions = async () => {
    try {
        const useGemini = !!process.env.GEMINI_API_KEY;
        console.log(`[MedQuad AI] Running Predictive Maintenance Engine v3.0 (Mode: ${useGemini ? 'Gemini AI' : 'Heuristic Fallback'})...`);

        const equipments = await Equipment.find({
            status: { $in: ['operational', 'maintenance'] }
        }).populate('clientId', 'orgName');

        let newPredictionsCount = 0;
        let aiSuccessCount = 0;
        let fallbackCount = 0;

        for (const eq of equipments) {
            let result = null;

            // Attempt Gemini AI prediction first
            if (useGemini) {
                result = await predictWithAI(eq);
                if (result) aiSuccessCount++;
            }

            // Graceful degradation to heuristic engine
            if (!result) {
                result = heuristicFallback(eq);
                if (result) fallbackCount++;
            }

            if (!result || result.shouldGeneratePrediction === false) continue;

            const predictedFailureDate = new Date();
            predictedFailureDate.setDate(predictedFailureDate.getDate() + result.daysUntilFailure);

            // Critical alert notification
            if (result.confidence >= 0.75) {
                try {
                    const adminIds = await getAdminIds();
                    await notify({
                        recipientId: adminIds,
                        type: 'ai_critical_alert',
                        title: 'AI Critical Risk Alert',
                        message: `MedQuad AI v3.0 detected CRITICAL risk for "${eq.name}": ${result.failureType}. Confidence: ${Math.round(result.confidence * 100)}%. Estimated failure in ~${result.daysUntilFailure} days.`,
                        link: '/admin',
                        buttonText: 'View AI Dashboard',
                        metadata: { equipmentId: eq._id, confidence: result.confidence, daysUntilFailure: result.daysUntilFailure },
                        sendEmail: true,
                    });
                } catch (notifyErr) {
                    console.warn('[MedQuad AI] Notification failed:', notifyErr.message);
                }
            }

            await MaintenancePrediction.findOneAndUpdate(
                { equipmentId: eq._id, isAcknowledged: false },
                {
                    equipmentId: eq._id,
                    predictedFailureDate,
                    confidence: result.confidence,
                    failureType: result.failureType,
                    recommendations: result.recommendations,
                    riskTier: result.riskTier,
                    riskFactors: result.riskFactors,
                    aiExplanation: result.aiExplanation || null,
                    generatedAt: new Date(),
                    modelVersion: result.modelVersion || 'medquad-ai-v3.0',
                },
                { upsert: true, new: true }
            );
            newPredictionsCount++;
        }

        console.log(`[MedQuad AI] Analysis complete. ${newPredictionsCount} predictions generated (${aiSuccessCount} Gemini AI, ${fallbackCount} heuristic fallback).`);
    } catch (error) {
        console.error('[MedQuad AI] Fatal error in prediction engine:', error);
    }
};

module.exports = { generatePredictions };
