/* ============================================
   Mock Report — Enhanced session report
   ============================================ */

(function () {
    'use strict';

    function calculateOverallScore(answers) {
        const scores = answers
            .filter(a => a && a.feedback && typeof a.feedback.score === 'number')
            .map(a => a.feedback.score);
        if (scores.length === 0) return 0;
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    function analyzeSpeechMetrics(answerText) {
        if (!answerText) return { fillerCount: 0, fillerRate: 0, wpm: 0, wordCount: 0, fillerWords: [] };
        const words = answerText.trim().split(/\s+/);
        const wordCount = words.length;
        const fillers = answerText.match(/\b(um|uh|like|you know|basically|sort of|kind of|er|ah|well|i mean|right|okay so)\b/gi) || [];
        return {
            fillerCount: fillers.length,
            fillerRate: wordCount > 0 ? Math.round((fillers.length / wordCount) * 100) : 0,
            wordCount,
            fillerWords: [...new Set(fillers.map(f => f.toLowerCase()))]
        };
    }

    function analyzeStructure(answerText) {
        if (!answerText) return { hasSTAR: false, clarity: 0, depth: 0, hasNumbers: false };
        const hasSTAR = /\b(because|therefore|as a result|so that|in order to|which led to|which resulted in|I realized|I decided|I acted)\b/gi.test(answerText);
        const hasNumbers = /\b(\d+%|\d+ percent|\d+ people|\d+ dollars|\d+ times|\d+ years|\d+ months|\d+ weeks)\b/gi.test(answerText);
        const words = answerText.trim().split(/\s+/).length;
        const hasExamples = /\b(for example|for instance|such as|like when|there was a time|one time| конкретн)\b/gi.test(answerText);
        const clarity = hasSTAR ? 75 : 40;
        const depth = (hasSTAR ? 20 : 0) + (hasNumbers ? 20 : 0) + (hasExamples ? 15 : 0) + Math.min(45, words / 3);
        return {
            hasSTAR,
            clarity: Math.min(100, clarity + (words > 30 ? 15 : 0)),
            depth: Math.min(100, depth),
            hasNumbers
        };
    }

    function analyzeConfidence(answerText) {
        if (!answerText) return { hedgeCount: 0, assertiveCount: 0, confidence: 0 };
        const hedges = answerText.match(/\b(maybe|i think|i believe|probably|sort of|kind of|well|perhaps|i guess|i suppose|not sure|might be|could be)\b/gi) || [];
        const assertive = answerText.match(/\b(i know|i am sure|definitely|absolutely|certainly|i will|i can|i did|i have|without doubt|clearly|obviously)\b/gi) || [];
        const words = answerText.trim().split(/\s+/).length;
        const confidence = words > 0 ? Math.max(0, 100 - hedges.length * 8 + assertive.length * 5) : 50;
        return {
            hedgeCount: hedges.length,
            assertiveCount: assertive.length,
            confidence: Math.min(100, Math.round(confidence))
        };
    }

    function generateReport(sessionData) {
        const overallScore = calculateOverallScore(sessionData.answers);

        let verdict = 'Needs Improvement';
        if (overallScore >= 80) verdict = 'Strong Performer';
        else if (overallScore >= 65) verdict = 'Good Performer';
        else if (overallScore >= 50) verdict = 'Developing Performer';

        // Per-question detailed analysis
        const answerBreakdown = sessionData.answers.map((a, i) => {
            const speech = analyzeSpeechMetrics(a.answer);
            const structure = analyzeStructure(a.answer);
            const confidence = analyzeConfidence(a.answer);

            const speechScore = Math.max(0, 100 - speech.fillerRate * 6);
            const structureScore = Math.min(100, Math.round((structure.clarity + structure.depth) / 2));
            const confidenceScore = confidence.confidence;
            const compositeScore = Math.round(speechScore * 0.25 + structureScore * 0.50 + confidenceScore * 0.25);

            const feedbackScore = a.feedback?.score || compositeScore;

            let questionVerdict = 'Needs Improvement';
            if (feedbackScore >= 80) questionVerdict = 'Excellent';
            else if (feedbackScore >= 65) questionVerdict = 'Good';
            else if (feedbackScore >= 50) questionVerdict = 'Average';

            // Auto-detected insights
            const insights = [];
            if (speech.fillerCount > 3) insights.push({ type: 'warning', text: `${speech.fillerCount} filler words detected (${speech.fillerRate}% rate)` });
            if (!structure.hasSTAR) insights.push({ type: 'warning', text: 'No clear STAR structure detected' });
            if (speech.wordCount < 30) insights.push({ type: 'warning', text: 'Answer is too brief — aim for 30+ words' });
            if (structure.hasNumbers) insights.push({ type: 'good', text: 'Uses specific metrics/examples' });
            if (structure.hasSTAR) insights.push({ type: 'good', text: 'Demonstrates STAR framework usage' });
            if (confidence.hedgeCount > 2) insights.push({ type: 'warning', text: 'Hedging language may reduce impact' });
            if (confidence.assertiveCount > 2) insights.push({ type: 'good', text: 'Confident, assertive language' });
            if (speech.wordCount >= 80) insights.push({ type: 'good', text: 'Good answer depth' });

            return {
                questionNum: i + 1,
                question: a.question,
                answer: a.answer,
                score: feedbackScore,
                verdict: questionVerdict,
                strengths: a.feedback?.strengths || [],
                improvements: a.feedback?.improvements || [],
                oneLiner: a.feedback?.oneLiner || '',
                speechScore: Math.round(speechScore),
                structureScore,
                confidenceScore,
                speech,
                structure,
                confidence,
                insights,
                wordCount: speech.wordCount
            };
        });

        // Aggregate scores
        const validScores = answerBreakdown.filter(a => a.score > 0);
        const avgSpeech = validScores.length > 0 ? Math.round(validScores.reduce((s, a) => s + a.speechScore, 0) / validScores.length) : 0;
        const avgStructure = validScores.length > 0 ? Math.round(validScores.reduce((s, a) => s + a.structureScore, 0) / validScores.length) : 0;
        const avgConfidence = validScores.length > 0 ? Math.round(validScores.reduce((s, a) => s + a.confidenceScore, 0) / validScores.length) : 0;

        // Weaknesses aggregation
        const allWeaknesses = answerBreakdown.flatMap(a => a.insights.filter(i => i.type === 'warning').map(i => ({ text: i.text, question: a.questionNum, score: a.score })));
        const weaknessMap = {};
        allWeaknesses.forEach(w => {
            if (!weaknessMap[w.text]) weaknessMap[w.text] = { text: w.text, count: 0, questions: [], avgScore: 0, totalScore: 0 };
            weaknessMap[w.text].count++;
            weaknessMap[w.text].questions.push(w.question);
            weaknessMap[w.text].totalScore += w.score;
        });
        const weaknesses = Object.values(weaknessMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
            .map(w => ({
                text: w.text,
                category: w.text.includes('filler') ? 'Speech' : w.text.includes('STAR') || w.text.includes('structure') ? 'Structure' : w.text.includes('hedg') || w.text.includes('confidence') ? 'Confidence' : 'General',
                impact: w.count >= 3 ? 'high' : w.count >= 2 ? 'medium' : 'low',
                questionsAffected: w.questions
            }));

        // Strengths aggregation
        const allStrengths = answerBreakdown.flatMap(a => a.insights.filter(i => i.type === 'good').map(i => i.text));
        const strengthCounts = {};
        allStrengths.forEach(s => { strengthCounts[s] = (strengthCounts[s] || 0) + 1; });
        const topStrengths = Object.entries(strengthCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([text, count]) => ({ text, count }));

        // Score trend
        const scoreTrend = validScores.map(a => a.score);
        const trendDirection = scoreTrend.length >= 3
            ? (scoreTrend[scoreTrend.length - 1] - scoreTrend[0]) / scoreTrend.length
            : 0;
        const trendLabel = trendDirection > 5 ? 'Improving ↑' : trendDirection < -5 ? 'Declining ↓' : 'Consistent →';

        // Improvements
        const improvements = generateImprovements(weaknesses, avgSpeech, avgStructure, avgConfidence, overallScore);

        const durationMin = Math.round((sessionData.totalDuration || 0) / 60000);
        const totalWords = answerBreakdown.reduce((sum, a) => sum + a.wordCount, 0);
        const avgWords = validScores.length > 0 ? Math.round(totalWords / validScores.length) : 0;

        return {
            overallScore,
            verdict,
            role: sessionData.role,
            experience: sessionData.experience,
            questionCount: sessionData.questions.length,
            answeredCount: validScores.length,
            durationMin,
            totalWords,
            avgWords,
            avgSpeech,
            avgStructure,
            avgConfidence,
            scoreTrend,
            trendLabel,
            strengths: topStrengths,
            weaknesses,
            improvements,
            answerBreakdown
        };
    }

    function generateImprovements(weaknesses, avgSpeech, avgStructure, avgConfidence, score) {
        const improvements = [];
        const weaknessTexts = weaknesses.map(w => w.text.toLowerCase());
        const weaknessCategories = [...new Set(weaknesses.map(w => w.category))];

        if (avgStructure < 60 || weaknessTexts.some(w => w.includes('star') || w.includes('structure'))) {
            improvements.push({
                title: 'Master the STAR Method',
                description: 'Structure behavioral answers using Situation, Task, Action, Result. This is the most expected framework in behavioral interviews.',
                exercise: 'Pick one experience. Practice answering in exactly 4 parts: What was the context? What was your responsibility? What specific actions did you take? What were the measurable results?',
                priority: weaknessCategories.includes('Structure') ? 'high' : 'medium'
            });
        }

        if (avgSpeech < 70 || weaknessTexts.some(w => w.includes('filler'))) {
            improvements.push({
                title: 'Eliminate Filler Words',
                description: 'Filler words like "um", "uh", "like", and "you know" signal uncertainty. Replace them with confident pauses.',
                exercise: 'Record yourself answering a question for 2 minutes. Count every filler word. Practice again aiming for zero fillers. Use pauses instead of filler sounds.',
                priority: weaknessCategories.includes('Speech') ? 'high' : 'medium'
            });
        }

        if (avgConfidence < 60 || weaknessTexts.some(w => w.includes('hedg'))) {
            improvements.push({
                title: 'Use Confident Language',
                description: 'Replace "I think", "maybe", "probably" with assertive language. Hiring managers respond to conviction.',
                exercise: 'For your next practice session, replace every "I think" with "I know" or "I am confident that". Replace every "maybe" with a clear statement.',
                priority: weaknessCategories.includes('Confidence') ? 'high' : 'medium'
            });
        }

        if (score < 65) {
            improvements.push({
                title: 'Add Specific Metrics & Examples',
                description: 'Generic answers don\'t stand out. Quantify your impact with specific numbers, timelines, and outcomes.',
                exercise: 'For each answer, prepare at least one specific metric: percentages, dollar amounts, team sizes, time saved, revenue generated, or效率 improvements.',
                priority: 'medium'
            });
        }

        if (weaknesses.some(w => w.text.includes('too brief'))) {
            improvements.push({
                title: 'Expand Answer Depth',
                description: 'Aim for answers of at least 30-50 words to demonstrate thoughtfulness and provide enough context.',
                exercise: 'For a "Tell me about yourself" question, aim for 2-3 minutes. For STAR questions, aim for 90 seconds per answer.',
                priority: 'medium'
            });
        }

        if (improvements.length === 0 || score >= 80) {
            improvements.push({
                title: 'Keep Practicing Consistently',
                description: 'Your performance is strong! Maintain momentum with regular practice. Focus on refining delivery rather than fixing fundamentals.',
                exercise: 'Schedule one mock interview session per week. Review your feedback after each session and track improvement in specific areas.',
                priority: 'low'
            });
        }

        return improvements;
    }

    function generateDownloadText(report) {
        const lines = [
            '═══════════════════════════════════════════════════════════════',
            '              INTERVIEWIQ — MOCK INTERVIEW SESSION REPORT',
            '═══════════════════════════════════════════════════════════════',
            '',
            `  Role: ${report.role?.replace('-', ' ')}`,
            `  Experience Level: ${report.experience}`,
            `  Session Date: ${new Date().toLocaleDateString()}`,
            `  Questions Attempted: ${report.answeredCount} / ${report.questionCount}`,
            `  Duration: ${report.durationMin} minutes`,
            '',
            '───────────────────────────────────────────────────────────────',
            `                    OVERALL SCORE: ${report.overallScore}`,
            `                    ${report.verdict.toUpperCase()}`,
            '───────────────────────────────────────────────────────────────',
            '',
            `  Speech Quality: ${report.avgSpeech}  |  Structure: ${report.avgStructure}  |  Confidence: ${report.avgConfidence}`,
            `  Average Answer Length: ${report.avgWords} words  |  Total Words: ${report.totalWords}`,
            `  Score Trend: ${report.trendLabel}`,
            ''
        ];

        report.answerBreakdown.forEach((a, i) => {
            lines.push(`───────────────────────────────────────────────────────────────`);
            lines.push(`  Q${i + 1}: ${a.question}`);
            lines.push(`  Score: ${a.score}/100 — ${a.verdict}`);
            lines.push(`  Speech: ${a.speechScore} | Structure: ${a.structureScore} | Confidence: ${a.confidenceScore} | Words: ${a.wordCount}`);
            if (a.answer) {
                lines.push(`  Answer: ${a.answer}`);
            }
            if (a.insights && a.insights.length > 0) {
                lines.push(`  Insights: ${a.insights.map(i => `[${i.type}] ${i.text}`).join(' | ')}`);
            }
            if (a.strengths && a.strengths.length > 0) {
                lines.push(`  ✓ Strengths: ${a.strengths.join('; ')}`);
            }
            if (a.improvements && a.improvements.length > 0) {
                lines.push(`  ✗ Improve: ${a.improvements.join('; ')}`);
            }
            lines.push('');
        });

        if (report.topStrengths && report.topStrengths.length > 0) {
            lines.push('───────────────────────────────────────────────────────────────');
            lines.push('                       KEY STRENGTHS');
            lines.push('───────────────────────────────────────────────────────────────');
            report.topStrengths.forEach((s, i) => {
                lines.push(`${i + 1}. ${s.text} (seen in ${s.count} answers)`);
            });
            lines.push('');
        }

        if (report.weaknesses.length > 0) {
            lines.push('───────────────────────────────────────────────────────────────');
            lines.push('                       KEY WEAKNESSES');
            lines.push('───────────────────────────────────────────────────────────────');
            report.weaknesses.forEach((w, i) => {
                lines.push(`${i + 1}. ${w.text} [${w.impact.toUpperCase()} IMPACT] — Qs: ${w.questionsAffected.join(', ')}`);
            });
            lines.push('');
        }

        if (report.improvements.length > 0) {
            lines.push('───────────────────────────────────────────────────────────────');
            lines.push('                     IMPROVEMENT PLAN');
            lines.push('───────────────────────────────────────────────────────────────');
            report.improvements.forEach((imp, i) => {
                lines.push(`${i + 1}. ${imp.title} [${imp.priority.toUpperCase()}]`);
                lines.push(`   ${imp.description}`);
                lines.push(`   → Exercise: ${imp.exercise}`);
                lines.push('');
            });
        }

        lines.push('═══════════════════════════════════════════════════════════════');
        lines.push('Generated by InterviewIQ — interviewiq-iota.vercel.app');
        lines.push('═══════════════════════════════════════════════════════════════');

        return lines.join('\n');
    }

    window.mockReport = {
        generate: generateReport,
        generateDownloadText
    };

})();
