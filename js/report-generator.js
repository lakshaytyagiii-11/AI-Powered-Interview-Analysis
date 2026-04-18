/* ============================================
   Report Generator — Aggregates all analysis results
   ============================================ */

class ReportGenerator {
    generate(speechResult, structureResult, confidenceResult, roleResult, segments) {
        // Overall score (weighted average)
        const overall = Math.round(
            speechResult.score * 0.2 +
            structureResult.score * 0.3 +
            confidenceResult.score * 0.25 +
            roleResult.score * 0.25
        );

        // Score verdict
        let verdict, verdictClass;
        if (overall >= 80) { verdict = 'Excellent — Strong candidate performance'; verdictClass = 'success'; }
        else if (overall >= 65) { verdict = 'Good — Some areas to improve'; verdictClass = 'success'; }
        else if (overall >= 45) { verdict = 'Needs Improvement — Multiple weak areas detected'; verdictClass = 'warning'; }
        else { verdict = 'Poor — Significant issues across the board'; verdictClass = 'danger'; }

        // Compile all issues and rank by impact
        const allIssues = [
            ...speechResult.issues.map(i => ({ ...i, category: 'Speech' })),
            ...structureResult.issues.map(i => ({ ...i, category: 'Structure' })),
            ...confidenceResult.issues.map(i => ({ ...i, category: 'Confidence' })),
            ...roleResult.issues.map(i => ({ ...i, category: 'Role Alignment' })),
        ];

        const impactOrder = { high: 0, medium: 1, low: 2 };
        const weaknesses = allIssues
            .filter(i => i.impact)
            .sort((a, b) => (impactOrder[a.impact] || 2) - (impactOrder[b.impact] || 2));

        // Per-question feedback
        const questionFeedback = segments.map((seg, idx) => {
            const structSeg = structureResult.segmentResults[idx] || {};
            const confSeg = confidenceResult.segmentResults[idx] || {};
            const speechSeg = speechResult.segmentAnalysis[idx] || {};

            const issues = [
                ...(structSeg.issues || []),
                ...(confSeg.issues || []),
            ];
            if (speechSeg.fillerCount > 2) {
                issues.push({ type: 'warning', text: `${speechSeg.fillerCount} filler words` });
            }

            const qScore = Math.round(
                ((structSeg.overallQuality || 50) + (confSeg.confidenceScore || 50)) / 2
            );

            let feedback = '';
            if (qScore >= 75) feedback = 'Strong answer with good structure and confident delivery.';
            else if (qScore >= 55) feedback = 'Adequate response but could be strengthened with more specific examples and assertive language.';
            else if (qScore >= 35) feedback = 'Weak response — lacking depth, specifics, or delivered with low confidence. Practice restructuring with the STAR method.';
            else feedback = 'Very weak response — this likely raised concerns with the interviewer. Needs complete rework.';

            // Add specific advice
            if (structSeg.lengthAssessment === 'too-brief') feedback += ' Your answer was too brief — expand with specific examples.';
            if (structSeg.starComponents < 2) feedback += ' Use the STAR framework (Situation, Task, Action, Result) to structure your response.';
            if (confSeg.hedgeCount > 2) feedback += ' Reduce hedging language (I think, maybe, probably) for stronger impact.';

            return {
                question: seg.question,
                answer: seg.answer.length > 200 ? seg.answer.slice(0, 200) + '...' : seg.answer,
                score: qScore,
                issues,
                feedback,
                structureScore: structSeg.overallQuality || 0,
                confidenceScore: confSeg.confidenceScore || 0,
            };
        });

        // Improvement plan
        const improvementPlan = this._generateImprovementPlan(weaknesses, speechResult, structureResult, confidenceResult, roleResult);

        return {
            overallScore: overall,
            verdict,
            verdictClass,
            speechResult,
            structureResult,
            confidenceResult,
            roleResult,
            weaknesses,
            questionFeedback,
            improvementPlan,
        };
    }

    _generateImprovementPlan(weaknesses, speech, structure, confidence, role) {
        const plan = [];

        if (structure.avgSTAR < 60) {
            plan.push({
                title: '📋 Master the STAR Method',
                description: 'Your answers lack structured storytelling. Practice framing every behavioral answer using Situation → Task → Action → Result.',
                exercise: 'Pick 5 common interview questions. Write answers for each using the STAR format. Time yourself to deliver each in 60-90 seconds.',
                priority: 'high',
            });
        }

        if (speech.fillerRate > 3) {
            plan.push({
                title: '🗣️ Eliminate Filler Words',
                description: `You used filler words at a ${speech.fillerRate}% rate. Replace "um", "like", "you know" with brief pauses instead.`,
                exercise: 'Record yourself answering a question for 2 minutes. Count every filler word. Repeat until you reduce by 50%. Practice pausing instead of filling.',
                priority: 'high',
            });
        }

        if (confidence.avgConfidence < 60) {
            plan.push({
                title: '💪 Build Confident Delivery',
                description: 'Your responses contained too much hedging language and hesitation. Replace tentative phrases with assertive statements.',
                exercise: 'Replace "I think I can" with "I can". Replace "maybe" with specific statements. Practice power posing for 2 minutes before mock interviews.',
                priority: 'high',
            });
        }

        if (role.score < 50) {
            const weak = role.weakest;
            const details = role.competencyDetails[weak];
            plan.push({
                title: `🎯 Strengthen "${weak}" Competency`,
                description: `Your responses scored low in ${weak}. Include keywords and examples related to: ${(details?.missingKeywords || []).slice(0, 4).join(', ')}.`,
                exercise: `Prepare 2-3 specific examples that demonstrate your ${weak} skills. Include measurable outcomes and concrete details.`,
                priority: 'medium',
            });
        }

        if (structure.avgDepth < 50) {
            plan.push({
                title: '📊 Add Specifics and Metrics',
                description: 'Your answers lack quantifiable impact. Interviewers want to hear numbers, percentages, and concrete outcomes.',
                exercise: 'For each past project, write down 3 measurable outcomes (e.g., "reduced load time by 40%", "managed a team of 5", "increased revenue by $200K").',
                priority: 'medium',
            });
        }

        if (confidence.trend === 'declining') {
            plan.push({
                title: '⚡ Manage Interview Energy',
                description: 'Your confidence declined through the interview. Build stamina through practice and preparation.',
                exercise: 'Do full mock interviews (45-60 min) with a friend. Focus on maintaining energy and enthusiasm throughout. Stay hydrated and take brief mental resets between questions.',
                priority: 'low',
            });
        }

        if (plan.length === 0) {
            plan.push({
                title: '✨ Fine-tune Your Performance',
                description: 'Your overall performance is solid. Focus on polishing the small details for a competitive edge.',
                exercise: 'Record mock interviews and review them critically. Focus on body language cues that text analysis cannot capture.',
                priority: 'low',
            });
        }

        return plan;
    }

    /** Generate downloadable text report */
    generateTextReport(report) {
        let txt = '═══════════════════════════════════════════\n';
        txt += '    INTERVIEWIQ — ANALYSIS REPORT\n';
        txt += '═══════════════════════════════════════════\n\n';
        txt += `Overall Score: ${report.overallScore}/100\n`;
        txt += `Verdict: ${report.verdict}\n\n`;
        txt += `Speech Quality:    ${report.speechResult.score}/100\n`;
        txt += `Answer Structure:  ${report.structureResult.score}/100\n`;
        txt += `Confidence Level:  ${report.confidenceResult.score}/100\n`;
        txt += `Role Alignment:    ${report.roleResult.score}/100\n\n`;

        txt += '───── QUESTION-BY-QUESTION FEEDBACK ─────\n\n';
        report.questionFeedback.forEach((qf, i) => {
            txt += `Q${i + 1}: ${qf.question}\n`;
            txt += `Score: ${qf.score}/100\n`;
            txt += `Feedback: ${qf.feedback}\n\n`;
        });

        txt += '───── WEAKNESS RANKING ─────\n\n';
        report.weaknesses.forEach((w, i) => {
            txt += `${i + 1}. [${w.impact.toUpperCase()}] ${w.text}\n`;
        });

        txt += '\n───── IMPROVEMENT PLAN ─────\n\n';
        report.improvementPlan.forEach(item => {
            txt += `${item.title}\n`;
            txt += `${item.description}\n`;
            txt += `Exercise: ${item.exercise}\n\n`;
        });

        return txt;
    }
}

window.reportGenerator = new ReportGenerator();
