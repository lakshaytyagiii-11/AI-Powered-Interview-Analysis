/* ============================================
   Live Scorer — Real-time answer quality scoring
   ============================================ */

(function () {
    'use strict';

    window.liveScorer = {
        scoreAnswer(answerText, questionText, roleId) {
            if (!answerText || answerText.trim().length < 10) {
                return {
                    score: 0,
                    wordCount: 0,
                    status: 'too_short',
                    message: 'Answer is too short. Please speak more.'
                };
            }

            const words = answerText.trim().split(/\s+/);
            const wordCount = words.length;

            // Calculate scores using existing analyzers
            let speechScore = 100;
            let confidenceScore = 100;
            let structureScore = 100;

            const fillerPatterns = /\b(um|uh|like|you know|basically|sort of|kind of|i think|i believe|maybe|probably)\b/gi;
            const fillers = answerText.match(fillerPatterns) || [];
            const fillerRate = (fillers.length / wordCount) * 100;
            speechScore = Math.max(0, 100 - fillerRate * 5);

            const hedgingPatterns = /\b(maybe|i think|i believe|probably|sort of|kind of|kind of|well|perhaps)\b/gi;
            const hedges = answerText.match(hedgingPatterns) || [];
            const hedgeRate = (hedges.length / wordCount) * 100;
            confidenceScore = Math.max(0, 100 - hedgeRate * 6);

            const starIndicators = /\b(because|therefore|as a result|so that|in order to|which led to|which resulted in|which caused)\b/gi;
            const starMatches = answerText.match(starIndicators) || [];
            if (starMatches.length >= 2) {
                structureScore = 85;
            } else if (starMatches.length === 1) {
                structureScore = 65;
            } else {
                structureScore = 45;
            }

            if (wordCount < 30) structureScore -= 10;
            if (wordCount > 150) structureScore += 5;

            const overall = Math.round(
                (speechScore * 0.25) +
                (confidenceScore * 0.25) +
                (structureScore * 0.50)
            );

            return {
                score: overall,
                wordCount,
                status: wordCount >= 10 ? 'ready' : 'too_short',
                message: wordCount >= 10 ? 'Ready to submit' : `${10 - wordCount} more words needed`,
                breakdown: {
                    speech: Math.round(speechScore),
                    confidence: Math.round(confidenceScore),
                    structure: Math.round(structureScore)
                }
            };
        }
    };

})();
