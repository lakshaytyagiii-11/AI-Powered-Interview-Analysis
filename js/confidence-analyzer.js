/* ============================================
   Confidence Analyzer — Hesitation, hedging, assertiveness
   ============================================ */

class ConfidenceAnalyzer {
    constructor() {
        this.hedgingPhrases = [
            'i think', 'i believe', 'maybe', 'probably', 'perhaps',
            'i guess', 'sort of', 'kind of', 'not sure', 'i suppose',
            'might be', 'could be', 'more or less', 'in a way',
            'to some extent', 'it depends', 'not exactly', 'i feel like',
            'i would say', 'i\'m not certain'
        ];
        this.assertivePhrases = [
            'i am confident', 'i know', 'absolutely', 'definitely',
            'without a doubt', 'i am certain', 'i\'m sure', 'clearly',
            'i have proven', 'i demonstrated', 'i achieved', 'i delivered',
            'i excel at', 'i successfully', 'my strength is', 'i consistently'
        ];
        this.hesitationMarkers = [
            'um', 'uh', 'uhh', 'umm', 'hmm', 'er', 'erm',
            'well...', '...', 'i mean', 'you know'
        ];
    }

    analyze(segments) {
        const segmentResults = segments.map((seg, idx) => this._analyzeSegment(seg, idx));

        const avgConfidence = this._average(segmentResults.map(s => s.confidenceScore));
        const lowestSegment = segmentResults.reduce((min, s) =>
            s.confidenceScore < min.confidenceScore ? s : min, segmentResults[0]);

        // Confidence trend
        const trend = segmentResults.length >= 3 ?
            this._calculateTrend(segmentResults.map(s => s.confidenceScore)) : 'stable';

        return {
            score: Math.round(avgConfidence),
            avgConfidence: Math.round(avgConfidence),
            segmentResults,
            lowestConfidenceQuestion: lowestSegment ? lowestSegment.question : null,
            lowestConfidenceScore: lowestSegment ? lowestSegment.confidenceScore : 0,
            trend,
            issues: this._getIssues(segmentResults, avgConfidence, trend),
        };
    }

    _analyzeSegment(seg, idx) {
        const lower = seg.answer.toLowerCase();
        const words = seg.answer.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;

        // Count hedging
        let hedgeCount = 0;
        const hedgesFound = [];
        for (const phrase of this.hedgingPhrases) {
            const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            const matches = lower.match(regex);
            if (matches) {
                hedgeCount += matches.length;
                hedgesFound.push({ phrase, count: matches.length });
            }
        }

        // Count assertive phrases
        let assertiveCount = 0;
        for (const phrase of this.assertivePhrases) {
            const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            const matches = lower.match(regex);
            if (matches) assertiveCount += matches.length;
        }

        // Count hesitation markers
        let hesitationCount = 0;
        for (const marker of this.hesitationMarkers) {
            if (marker === '...') {
                hesitationCount += (seg.answer.match(/\.\.\./g) || []).length;
            } else {
                const regex = new RegExp(`\\b${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                const matches = lower.match(regex);
                if (matches) hesitationCount += matches.length;
            }
        }

        // Detect restarts (repeated starts like "I, I think" or "The, the project")
        const restartPattern = /\b(\w+),?\s+\1\b/gi;
        const restarts = (seg.answer.match(restartPattern) || []).length;

        // Calculate confidence score
        let score = 70; // Start at baseline
        // Penalize hedging
        const hedgeRate = wordCount > 0 ? (hedgeCount / wordCount) * 100 : 0;
        score -= hedgeRate * 5;
        // Penalize hesitation
        score -= hesitationCount * 3;
        // Penalize restarts
        score -= restarts * 5;
        // Reward assertiveness
        score += assertiveCount * 5;
        // Penalize very short answers (indicates uncertainty)
        if (wordCount < 15) score -= 10;
        score = Math.max(0, Math.min(100, Math.round(score)));

        return {
            questionIndex: idx,
            question: seg.question,
            confidenceScore: score,
            hedgeCount,
            hedgesFound,
            assertiveCount,
            hesitationCount,
            restarts,
            issues: this._getSegmentIssues(hedgeCount, hesitationCount, restarts, score),
        };
    }

    _getSegmentIssues(hedgeCount, hesitationCount, restarts, score) {
        const issues = [];
        if (hedgeCount >= 3) issues.push({ type: 'issue', text: 'Excessive hedging language' });
        else if (hedgeCount >= 1) issues.push({ type: 'warning', text: 'Some hedging detected' });
        if (hesitationCount >= 3) issues.push({ type: 'issue', text: 'Frequent hesitation markers' });
        if (restarts >= 2) issues.push({ type: 'issue', text: 'Multiple sentence restarts' });
        if (score >= 80) issues.push({ type: 'good', text: 'Confident delivery ✓' });
        return issues;
    }

    _getIssues(results, avgConfidence, trend) {
        const issues = [];
        const lowConfSegments = results.filter(r => r.confidenceScore < 40);
        if (lowConfSegments.length > 0) {
            issues.push({
                type: 'high',
                text: `Major confidence drops on ${lowConfSegments.length} question(s) — interviewer likely noticed uncertainty`,
                impact: 'high'
            });
        }
        if (avgConfidence < 50) {
            issues.push({ type: 'high', text: 'Overall low confidence — too much hedging and hesitation throughout', impact: 'high' });
        } else if (avgConfidence < 65) {
            issues.push({ type: 'medium', text: 'Moderate confidence — reduce hedging language for stronger impact', impact: 'medium' });
        }
        if (trend === 'declining') {
            issues.push({ type: 'medium', text: 'Confidence declined through the interview — fatigue or increasing difficulty', impact: 'medium' });
        }
        return issues;
    }

    _calculateTrend(scores) {
        if (scores.length < 3) return 'stable';
        const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
        const secondHalf = scores.slice(Math.ceil(scores.length / 2));
        const avgFirst = this._average(firstHalf);
        const avgSecond = this._average(secondHalf);
        if (avgSecond > avgFirst + 10) return 'improving';
        if (avgSecond < avgFirst - 10) return 'declining';
        return 'stable';
    }

    _average(arr) { return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
}

window.confidenceAnalyzer = new ConfidenceAnalyzer();
