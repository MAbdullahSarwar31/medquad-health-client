const Equipment = require('../models/Equipment');
const MaintenancePrediction = require('../models/MaintenancePrediction');

/**
 * Heuristic-based predictive maintenance engine.
 * Analyzes equipment usage and service history to predict failures.
 */
const generatePredictions = async () => {
    try {
        console.log('[AI Service] Running Predictive Maintenance Analysis...');
        const equipments = await Equipment.find({ status: { $in: ['operational', 'maintenance'] } });
        
        let newPredictionsCount = 0;

        for (const eq of equipments) {
            let confidence = 0.1; // Base confidence
            let daysUntilFailure = 180; // Base prediction
            let recommendations = 'Regular maintenance schedule.';

            // 1. Check last service date
            const daysSinceService = eq.lastServiceDate 
                ? (new Date() - new Date(eq.lastServiceDate)) / (1000 * 60 * 60 * 24)
                : 365; // Assume 1 year if unknown
            
            if (daysSinceService > 180) {
                confidence += 0.3;
                daysUntilFailure -= 60;
                recommendations = 'Urgent: Overdue for scheduled maintenance.';
            } else if (daysSinceService > 90) {
                confidence += 0.1;
                daysUntilFailure -= 30;
            }

            // 2. Check total usage hours
            if (eq.totalUsageHours > 5000) {
                confidence += 0.2;
                daysUntilFailure -= 45;
                recommendations += ' High total usage hours detected.';
            } else if (eq.totalUsageHours > 2000) {
                confidence += 0.1;
                daysUntilFailure -= 15;
            }

            // 3. Check recent usage spike
            if (eq.usageHoursLog && eq.usageHoursLog.length > 0) {
                const recentLog = eq.usageHoursLog[eq.usageHoursLog.length - 1];
                if (recentLog.hours > 16) { // High daily usage (e.g. running multiple shifts)
                    confidence += 0.2;
                    daysUntilFailure -= 45;
                    recommendations += ' Abnormal usage spike detected.';
                }
            }

            // Normalize confidence to 0-0.95
            confidence = Math.min(parseFloat(confidence.toFixed(2)), 0.95);
            
            // Only create/update prediction if confidence is significant (> 0.4)
            if (confidence > 0.4) {
                const predictedFailureDate = new Date();
                predictedFailureDate.setDate(predictedFailureDate.getDate() + Math.max(7, Math.floor(daysUntilFailure)));

                await MaintenancePrediction.findOneAndUpdate(
                    { equipmentId: eq._id, isAcknowledged: false },
                    {
                        equipmentId: eq._id,
                        predictedFailureDate,
                        confidence,
                        failureType: 'Heuristic Alert',
                        recommendations: recommendations.trim(),
                        generatedAt: new Date(),
                        modelVersion: 'heuristic-v1.0'
                    },
                    { upsert: true, new: true }
                );
                newPredictionsCount++;
            }
        }
        console.log(`[AI Service] Analysis complete. Generated/updated ${newPredictionsCount} predictions.`);
    } catch (error) {
        console.error('[AI Service] Error generating predictions:', error);
    }
};

module.exports = { generatePredictions };
