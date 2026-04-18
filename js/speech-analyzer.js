/* ============================================
   Speech Analyzer — Filler words, pacing, vocabulary
   ============================================ */

class SpeechAnalyzer {
    constructor() {
        this.fillerWords = [
            'um', 'uh', 'uhh', 'umm', 'hmm', 'hm',
            'like', 'you know', 'basically', 'actually',
            'sort of', 'kind of', 'i mean', 'right',
            'so yeah', 'literally', 'obviously', 'honestly',
            'essentially', 'totally'
        ];
    }

    analyze(segments, totalDurationSec = 0) {
        const allText = segments.map(s => s.answer).join(' ');
        const words = allText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        const totalWords = words.length;

        // Filler word counts
        const fillerCounts = {};
        let totalFillers = 0;
        const lowerText = allText.toLowerCase();
        for (const filler of this.fillerWords) {
            const regex = new RegExp(`\\b${filler.replace(/\s+/g, '\\s+')}\\b`, 'gi');
            const matches = lowerText.match(regex);
            const count = matches ? matches.length : 0;
            if (count > 0) {
                fillerCounts[filler] = count;
                totalFillers += count;
            }
        }

        // Words per minute
        const estimatedDuration = totalDurationSec > 0 ? totalDurationSec : (totalWords / 2.5);
        const wpm = estimatedDuration > 0 ? Math.round((totalWords / estimatedDuration) * 60) : 0;

        // Vocabulary diversity
        const uniqueWords = new Set(words.filter(w => w.length > 3));
        const diversityScore = totalWords > 0 ? (uniqueWords.size / totalWords) * 100 : 0;

        // Per-segment analysis
        const segmentAnalysis = segments.map(seg => {
            const segWords = seg.answer.toLowerCase().split(/\s+/).filter(w => w.length > 0);
            let segFillers = 0;
            const segLower = seg.answer.toLowerCase();
            for (const filler of this.fillerWords) {
                const regex = new RegExp(`\\b${filler.replace(/\s+/g, '\\s+')}\\b`, 'gi');
                const matches = segLower.match(regex);
                if (matches) segFillers += matches.length;
            }
            return {
                question: seg.question,
                wordCount: segWords.length,
                fillerCount: segFillers,
                fillerRate: segWords.length > 0 ? (segFillers / segWords.length * 100) : 0,
            };
        });

        // Filler rate
        const fillerRate = totalWords > 0 ? (totalFillers / totalWords * 100) : 0;

        // Score: 100 = perfect (no fillers, good pace, good diversity)
        let score = 100;
        // Penalize fillers: -2 per percentage point
        score -= fillerRate * 2;
        // Penalize pace: ideal is 130-160 WPM
        if (wpm > 0) {
            if (wpm < 100) score -= (100 - wpm) * 0.3;
            else if (wpm > 180) score -= (wpm - 180) * 0.3;
        }
        // Penalize low diversity
        if (diversityScore < 30) score -= (30 - diversityScore) * 0.5;
        score = Math.max(0, Math.min(100, Math.round(score)));

        return {
            score,
            totalWords,
            totalFillers,
            fillerRate: Math.round(fillerRate * 10) / 10,
            fillerCounts,
            wpm,
            vocabularyDiversity: Math.round(diversityScore),
            uniqueWordCount: uniqueWords.size,
            segmentAnalysis,
            issues: this._getIssues(fillerRate, wpm, diversityScore),
        };
    }

    _getIssues(fillerRate, wpm, diversity) {
        const issues = [];
        if (fillerRate > 5) issues.push({ type: 'high', text: `High filler word rate (${fillerRate.toFixed(1)}%)`, impact: 'high' });
        else if (fillerRate > 2) issues.push({ type: 'medium', text: `Moderate filler word usage (${fillerRate.toFixed(1)}%)`, impact: 'medium' });
        if (wpm > 0 && wpm < 100) issues.push({ type: 'medium', text: `Speaking too slowly (${wpm} WPM — aim for 130-160)`, impact: 'medium' });
        if (wpm > 180) issues.push({ type: 'medium', text: `Speaking too fast (${wpm} WPM — aim for 130-160)`, impact: 'medium' });
        if (diversity < 25) issues.push({ type: 'medium', text: `Low vocabulary diversity — use more varied language`, impact: 'low' });
        return issues;
    }
}

window.speechAnalyzer = new SpeechAnalyzer();
