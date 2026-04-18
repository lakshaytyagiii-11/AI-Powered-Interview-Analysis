/* ============================================
   Structure Analyzer — STAR, clarity, depth, relevance
   ============================================ */

class StructureAnalyzer {
    constructor() {
        this.starIndicators = {
            situation: ['when i was', 'at my previous', 'in my role', 'while working', 'there was a time', 'at my last', 'during my', 'back when', 'one time', 'a few months ago', 'last year', 'the context was', 'the situation was'],
            task: ['i was responsible', 'my task was', 'i needed to', 'the goal was', 'i had to', 'the challenge was', 'i was asked to', 'my objective', 'the requirement', 'was tasked with'],
            action: ['i decided to', 'i implemented', 'i created', 'i built', 'i led', 'i organized', 'i developed', 'what i did was', 'i took the initiative', 'i worked on', 'i collaborated', 'i designed', 'i proposed', 'i analyzed', 'my approach was', 'i started by'],
            result: ['as a result', 'the outcome', 'which led to', 'this resulted in', 'we achieved', 'the impact was', 'we saw', 'increased by', 'decreased by', 'improved', 'saved', 'successfully', 'the result was', 'we were able to', 'this led to']
        };
        this.specificityMarkers = ['percent', '%', 'million', 'thousand', 'doubled', 'tripled', 'reduced by', 'increased by', 'saved', '$', 'hours', 'weeks', 'months', 'team of', 'customers', 'users', 'revenue', 'roi'];
    }

    analyze(segments) {
        const segmentResults = segments.map((seg, idx) => this._analyzeSegment(seg, idx));

        const avgClarity = this._average(segmentResults.map(s => s.clarity));
        const avgDepth = this._average(segmentResults.map(s => s.depth));
        const avgRelevance = this._average(segmentResults.map(s => s.relevance));
        const avgSTAR = this._average(segmentResults.map(s => s.starScore));
        const overallScore = Math.round(avgClarity * 0.25 + avgDepth * 0.3 + avgRelevance * 0.2 + avgSTAR * 0.25);

        return {
            score: overallScore,
            avgClarity: Math.round(avgClarity),
            avgDepth: Math.round(avgDepth),
            avgRelevance: Math.round(avgRelevance),
            avgSTAR: Math.round(avgSTAR),
            segmentResults,
            issues: this._getIssues(segmentResults, avgClarity, avgDepth, avgSTAR),
        };
    }

    _analyzeSegment(seg, idx) {
        const answer = seg.answer;
        const words = answer.split(/\s+/).filter(w => w.length > 0);
        const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const wordCount = words.length;

        // --- STAR Detection ---
        const starFound = {};
        const lower = answer.toLowerCase();
        for (const [component, indicators] of Object.entries(this.starIndicators)) {
            starFound[component] = indicators.some(ind => lower.includes(ind));
        }
        const starComponents = Object.values(starFound).filter(Boolean).length;
        const starScore = (starComponents / 4) * 100;

        // --- Clarity Score ---
        const avgSentenceLen = sentences.length > 0 ? wordCount / sentences.length : wordCount;
        let clarity = 80;
        if (avgSentenceLen > 30) clarity -= (avgSentenceLen - 30) * 2;
        if (avgSentenceLen < 5 && wordCount > 10) clarity -= 10;
        if (wordCount < 10) clarity -= 20;
        clarity = Math.max(0, Math.min(100, clarity));

        // --- Depth Score ---
        let depth = 50;
        // Reward specificity
        const specificCount = this.specificityMarkers.filter(m => lower.includes(m)).length;
        depth += specificCount * 8;
        // Reward length (moderate)
        if (wordCount > 40) depth += 10;
        if (wordCount > 80) depth += 10;
        if (wordCount > 150) depth += 5;
        // Penalize too short
        if (wordCount < 20) depth -= 20;
        if (wordCount < 10) depth -= 20;
        // Reward examples
        if (lower.includes('for example') || lower.includes('for instance') || lower.includes('such as')) depth += 10;
        depth = Math.max(0, Math.min(100, depth));

        // --- Relevance Score ---
        // Basic: check if answer seems substantive
        let relevance = 60;
        if (wordCount > 15) relevance += 10;
        if (wordCount > 30) relevance += 10;
        if (starComponents >= 2) relevance += 10;
        if (specificCount > 0) relevance += 10;
        relevance = Math.max(0, Math.min(100, relevance));

        // --- Answer Length Assessment ---
        let lengthAssessment;
        if (wordCount < 15) lengthAssessment = 'too-brief';
        else if (wordCount < 30) lengthAssessment = 'brief';
        else if (wordCount > 200) lengthAssessment = 'rambling';
        else if (wordCount > 120) lengthAssessment = 'detailed';
        else lengthAssessment = 'good';

        return {
            questionIndex: idx,
            question: seg.question,
            wordCount,
            sentenceCount: sentences.length,
            starFound,
            starComponents,
            starScore,
            clarity: Math.round(clarity),
            depth: Math.round(depth),
            relevance: Math.round(relevance),
            lengthAssessment,
            specificityCount: specificCount,
            overallQuality: Math.round((clarity + depth + relevance + starScore) / 4),
            issues: this._getSegmentIssues(wordCount, starComponents, clarity, depth, lengthAssessment),
        };
    }

    _getSegmentIssues(wordCount, starComponents, clarity, depth, lengthAssessment) {
        const issues = [];
        if (lengthAssessment === 'too-brief') issues.push({ type: 'issue', text: 'Answer too brief' });
        if (lengthAssessment === 'rambling') issues.push({ type: 'warning', text: 'Answer may be too long' });
        if (starComponents === 0) issues.push({ type: 'warning', text: 'No STAR structure detected' });
        else if (starComponents < 3) issues.push({ type: 'warning', text: `Partial STAR (${starComponents}/4 components)` });
        else if (starComponents === 4) issues.push({ type: 'good', text: 'Full STAR structure ✓' });
        if (clarity < 50) issues.push({ type: 'issue', text: 'Low clarity — simplify sentences' });
        if (depth < 40) issues.push({ type: 'issue', text: 'Lacks depth — add specifics & metrics' });
        return issues;
    }

    _getIssues(results, avgClarity, avgDepth, avgSTAR) {
        const issues = [];
        const briefCount = results.filter(r => r.lengthAssessment === 'too-brief').length;
        if (briefCount > 0) issues.push({ type: 'high', text: `${briefCount} answer(s) were too brief to demonstrate competence`, impact: 'high' });
        if (avgSTAR < 40) issues.push({ type: 'high', text: `Weak use of STAR method — answers lack structured storytelling`, impact: 'high' });
        if (avgClarity < 50) issues.push({ type: 'medium', text: `Answers lack clarity — sentences are overly complex or fragmented`, impact: 'medium' });
        if (avgDepth < 40) issues.push({ type: 'high', text: `Answers lack depth — missing specific metrics, examples, or outcomes`, impact: 'high' });
        return issues;
    }

    _average(arr) { return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
}

window.structureAnalyzer = new StructureAnalyzer();
