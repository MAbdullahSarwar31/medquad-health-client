const Equipment = require('../models/Equipment');
const MaintenancePrediction = require('../models/MaintenancePrediction');

/**
 * MedQuad AI Predictive Maintenance Engine v2.0
 * Multi-factor heuristic analysis with category-aware failure classification.
 * Analyzes 5 independent risk factors per device to produce differentiated,
 * actionable maintenance predictions.
 */

/**
 * Maps equipment category to the specific component most at risk of failure.
 */
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

/**
 * Builds a structured, professional recommendation message from risk factors.
 */
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

    const factorSummary = riskFactors.length > 0
        ? `Key risk indicators: ${riskFactors.join('; ')}.`
        : '';

    return `${urgency} ${categoryAction} ${factorSummary}`.trim();
};

/**
 * Core prediction generation engine. Analyzes all active equipment
 * against 5 independent risk factors and upserts predictions in MongoDB.
 */
const generatePredictions = async () => {
    try {
        console.log('[MedQuad AI] Running Predictive Maintenance Analysis v2.0...');
        const equipments = await Equipment.find({
            status: { $in: ['operational', 'maintenance'] }
        }).populate('clientId', 'orgName');

        let newPredictionsCount = 0;

        for (const eq of equipments) {
            // Seed base confidence with small device-unique variance (prevents identical scores)
            const serialSeed = (eq.serialNumber || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            let confidence = 0.10 + ((serialSeed % 7) * 0.007); // 0.10 – 0.149 unique base per device
            let daysUntilFailure = 180;
            const riskFactors = [];

            // ── Factor 1: Days since last service ─────────────────────────
            const daysSinceService = eq.lastServiceDate
                ? (Date.now() - new Date(eq.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24)
                : 400; // Unknown = assume very long ago

            if (daysSinceService > 365) {
                confidence += 0.35;
                daysUntilFailure -= 75;
                riskFactors.push('Critical: No servicing in over 1 year');
            } else if (daysSinceService > 180) {
                confidence += 0.25;
                daysUntilFailure -= 45;
                riskFactors.push('Overdue for scheduled maintenance (>6 months)');
            } else if (daysSinceService > 90) {
                confidence += 0.10;
                daysUntilFailure -= 20;
                riskFactors.push('Approaching service interval (>3 months)');
            }

            // ── Factor 2: Cumulative usage hours ──────────────────────────
            if (eq.totalUsageHours > 8000) {
                confidence += 0.25;
                daysUntilFailure -= 60;
                riskFactors.push('Extreme cumulative usage (>8,000 hrs) — component end-of-life');
            } else if (eq.totalUsageHours > 5000) {
                confidence += 0.15;
                daysUntilFailure -= 35;
                riskFactors.push('High cumulative usage hours (>5,000 hrs)');
            } else if (eq.totalUsageHours > 2000) {
                confidence += 0.08;
                daysUntilFailure -= 15;
                riskFactors.push('Moderate usage accumulation (>2,000 hrs)');
            }

            // ── Factor 3: Recent usage spike (multi-shift operation) ───────
            if (eq.usageHoursLog && eq.usageHoursLog.length > 0) {
                const recentLog = eq.usageHoursLog[eq.usageHoursLog.length - 1];
                if (recentLog.hours > 18) {
                    confidence += 0.18;
                    daysUntilFailure -= 40;
                    riskFactors.push('Extreme usage spike detected (>18 hrs/day — triple shift)');
                } else if (recentLog.hours > 12) {
                    confidence += 0.10;
                    daysUntilFailure -= 20;
                    riskFactors.push('Abnormal usage spike (>12 hrs/day — double shift)');
                }
            }

            // ── Factor 4: Warranty expiry status ──────────────────────────
            if (eq.warrantyExpiry) {
                const warrantyExpired = new Date(eq.warrantyExpiry) < new Date();
                const daysToExpiry = (new Date(eq.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                if (warrantyExpired) {
                    confidence += 0.07;
                    riskFactors.push('Out-of-warranty — no manufacturer coverage');
                } else if (daysToExpiry < 90) {
                    confidence += 0.04;
                    riskFactors.push(`Warranty expiring in ${Math.round(daysToExpiry)} days`);
                }
            }

            // ── Factor 5: Equipment age since installation ─────────────────
            if (eq.installDate) {
                const ageYears = (Date.now() - new Date(eq.installDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
                if (ageYears > 10) {
                    confidence += 0.12;
                    daysUntilFailure -= 25;
                    riskFactors.push(`Aging device — installed ${Math.round(ageYears)} years ago`);
                } else if (ageYears > 7) {
                    confidence += 0.06;
                    riskFactors.push(`Mature device — installed ${Math.round(ageYears)} years ago`);
                }
            }

            // ── Normalize & classify ───────────────────────────────────────
            confidence = Math.min(parseFloat(confidence.toFixed(3)), 0.95);
            const riskTier = confidence >= 0.75 ? 'critical' :
                             confidence >= 0.55 ? 'high' : 'moderate';

            // Only generate predictions for meaningful risk levels (>40%)
            if (confidence > 0.40) {
                const predictedFailureDate = new Date();
                predictedFailureDate.setDate(
                    predictedFailureDate.getDate() + Math.max(7, Math.floor(daysUntilFailure))
                );

                const failureType = getFailureTypeByCategory(eq.category);
                const recommendations = buildRecommendation(eq.category, riskFactors, confidence);

                await MaintenancePrediction.findOneAndUpdate(
                    { equipmentId: eq._id, isAcknowledged: false },
                    {
                        equipmentId: eq._id,
                        predictedFailureDate,
                        confidence,
                        failureType,
                        recommendations,
                        riskTier,
                        riskFactors,
                        generatedAt: new Date(),
                        modelVersion: 'medquad-ai-v2.0',
                    },
                    { upsert: true, new: true }
                );
                newPredictionsCount++;
            }
        }

        console.log(`[MedQuad AI] Analysis complete. ${newPredictionsCount} predictions generated/updated.`);
    } catch (error) {
        console.error('[MedQuad AI] Error generating predictions:', error);
    }
};

module.exports = { generatePredictions };
