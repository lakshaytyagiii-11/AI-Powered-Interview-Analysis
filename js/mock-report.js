/* ============================================
   Mock Report — Enhanced comprehensive analytics
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
        if (!answerText) return { fillerCount: 0, fillerRate: 0, wpm: 0, wordCount: 0, fillerWords: [], pace: 'slow', clarity: 0 };
        const words = answerText.trim().split(/\s+/);
        const wordCount = words.length;
        const fillers = answerText.match(/\b(um|uh|like|you know|basically|sort of|kind of|er|ah|well|i mean|right|okay so|actually|literally|so basically|i guess|i suppose)\b/gi) || [];
        const avgWordLen = words.reduce((sum, w) => sum + w.length, 0) / Math.max(wordCount, 1);
        const complexityScore = Math.min(100, Math.round(avgWordLen * 12));
        return {
            fillerCount: fillers.length,
            fillerRate: wordCount > 0 ? Math.round((fillers.length / wordCount) * 100) : 0,
            wordCount,
            fillerWords: [...new Set(fillers.map(f => f.toLowerCase()))],
            complexityScore,
            pace: wordCount < 20 ? 'quick' : wordCount > 80 ? 'detailed' : 'balanced',
            clarity: Math.min(100, Math.max(0, 85 - fillers.length * 8 - (avgWordLen < 3.5 ? 15 : 0) - (wordCount < 25 ? 10 : 0)))
        };
    }

    function analyzeStructure(answerText) {
        if (!answerText) return { hasSTAR: false, hasNumbers: false, hasExamples: false, clarity: 0, depth: 0, completeness: 0 };
        const starPatterns = /\b(because|therefore|as a result|so that|in order to|which led to|which resulted in|I realized|I decided|I acted|I took|led by example|in charge of|I championed)\b/gi;
        const hasSTAR = starPatterns.test(answerText);
        const numberPatterns = /\b(\d+%|\d+ percent|\d+ people|\d+ dollars|\d+ times|\d+ years|\d+ months|\d+ weeks|\d+K|\d+M|\$\d+)\b/gi;
        const hasNumbers = numberPatterns.test(answerText);
        const examplePatterns = /\b(for example|for instance|such as|like when|there was a time|one time|specifically|I recall|I remember)\b/gi;
        const hasExamples = examplePatterns.test(answerText);
        const words = answerText.trim().split(/\s+/).length;
        const sentences = answerText.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
        const avgSentenceLen = sentences > 0 ? words / sentences : words;
        const clarity = hasSTAR ? 65 : hasExamples ? 45 : hasNumbers ? 35 : 25;
        const depth = (hasSTAR ? 20 : 0) + (hasNumbers ? 15 : 0) + (hasExamples ? 10 : 0) + Math.min(25, words / 6);
        const completeness = Math.min(100, Math.round((words / 60) * 100));
        return {
            hasSTAR,
            hasNumbers,
            hasExamples,
            clarity: Math.min(100, clarity + (words > 30 ? 15 : 0) + (avgSentenceLen > 12 ? 10 : 0)),
            depth: Math.min(100, depth),
            completeness,
            sentenceCount: sentences,
            wordCount: words
        };
    }

    function analyzeConfidence(answerText) {
        if (!answerText) return { hedgeCount: 0, assertiveCount: 0, confidence: 0, hesitationCount: 0, fillerRatio: 0 };
        const hedges = answerText.match(/\b(maybe|i think|i believe|probably|sort of|kind of|well|perhaps|i guess|i suppose|not sure|might be|could be|not certain|I assume|I suspect)\b/gi) || [];
        const assertive = answerText.match(/\b(i know|i am sure|definitely|absolutely|certainly|i will|i can|i did|i have|without doubt|clearly|obviously|I guarantee|I always|I never|I insist|I recommend)\b/gi) || [];
        const hesitations = answerText.match(/\b(um|uh|er|ah)\b/gi) || [];
        const words = answerText.trim().split(/\s+/).length;
        const fillerRatio = words > 0 ? (hesitations.length / words) * 100 : 0;
        const baseConf = words > 0 ? Math.max(0, 60 - hedges.length * 6 + assertive.length * 4) : 30;
        const confidence = Math.min(100, Math.round(Math.max(0, baseConf - fillerRatio * 2 - (words < 20 ? 10 : 0))));
        return {
            hedgeCount: hedges.length,
            assertiveCount: assertive.length,
            confidence,
            hesitationCount: hesitations.length,
            fillerRatio: Math.round(fillerRatio),
            tone: hedges.length > assertive.length ? 'uncertain' : assertive.length > hedges.length ? 'confident' : 'neutral'
        };
    }

    function analyzeRelevance(answerText, questionText) {
        if (!answerText || !questionText) return { score: 50, directness: 0 };
        const questionWords = questionText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const answerWords = answerText.toLowerCase();
        const matchedWords = questionWords.filter(w => answerWords.includes(w)).length;
        const directness = questionWords.length > 0 ? Math.round((matchedWords / questionWords.length) * 100) : 30;
        const questionLower = questionText.toLowerCase();
        let topicAlignment = 30; // Lower base score
        if (questionLower.includes('project') && (answerWords.includes('project') || answerWords.includes('built') || answerWords.includes('developed'))) topicAlignment += 25;
        if (questionLower.includes('team') && (answerWords.includes('team') || answerWords.includes('collaborat') || answerWords.includes('work with'))) topicAlignment += 25;
        if (questionLower.includes('challenge') && (answerWords.includes('challeng') || answerWords.includes('problem') || answerWords.includes('difficult'))) topicAlignment += 25;
        return {
            score: Math.min(100, Math.round((directness * 0.6) + (topicAlignment * 0.4))),
            directness,
            topicAlignment
        };
    }

    function generateReport(sessionData) {
        const overallScore = calculateOverallScore(sessionData.answers);

        let verdict = 'Needs Significant Improvement';
        let verdictClass = 'danger';
        if (overallScore >= 85) { verdict = 'Exceptional Performer'; verdictClass = 'success'; }
        else if (overallScore >= 75) { verdict = 'Strong Performer'; verdictClass = 'success'; }
        else if (overallScore >= 65) { verdict = 'Good Performer'; verdictClass = 'warning'; }
        else if (overallScore >= 55) { verdict = 'Developing Performer'; verdictClass = 'warning'; }
        else if (overallScore >= 40) { verdict = 'Needs Practice'; verdictClass = 'danger'; }
        else { verdict = 'Needs Focused Improvement'; verdictClass = 'danger'; }

        // Per-question detailed analysis
        const answerBreakdown = sessionData.answers.map((a, i) => {
            const speech = analyzeSpeechMetrics(a.answer);
            const structure = analyzeStructure(a.answer);
            const confidence = analyzeConfidence(a.answer);
            const relevance = analyzeRelevance(a.answer, a.question);

            const speechScore = a.feedback?.speechScore || Math.max(0, Math.min(100, Math.round(
                (speech.clarity * 0.6) + (speech.complexityScore * 0.4) - (speech.fillerRate * 2) - (speech.wordCount < 30 ? 15 : 0)
            )));
            const structureScore = a.feedback?.structureScore || Math.max(0, Math.min(100, Math.round(
                (structure.clarity * 0.4) + (structure.depth * 0.4) + (structure.completeness * 0.2) - (!structure.hasSTAR && a.feedback?.questionType === 'behavioral' ? 20 : 0)
            )));
            const confidenceScore = a.feedback?.confidenceScore || Math.max(0, Math.min(100, Math.round(
                confidence.confidence - (confidence.hedgeCount * 3) + (confidence.assertiveCount * 2) - (confidence.fillerRatio * 1.5)
            )));
            const relevanceScore = a.feedback?.relevanceScore || Math.max(0, Math.min(100, Math.round(
                (relevance.directness * 0.7) + (relevance.topicAlignment * 0.3) - (relevance.directness < 40 ? 20 : 0)
            )));

            const compositeScore = Math.round(speechScore * 0.20 + structureScore * 0.30 + confidenceScore * 0.25 + relevanceScore * 0.25);
            const feedbackScore = a.feedback?.score || compositeScore;

            let questionVerdict = 'Needs Improvement';
            if (feedbackScore >= 85) questionVerdict = 'Exceptional';
            else if (feedbackScore >= 75) questionVerdict = 'Strong';
            else if (feedbackScore >= 65) questionVerdict = 'Good';
            else if (feedbackScore >= 50) questionVerdict = 'Developing';

            // Auto-detected insights
            const insights = [];
            if (speech.fillerCount > 3) insights.push({ type: 'warning', text: `${speech.fillerCount} filler words (${speech.fillerRate}% rate)`, icon: '🗣️' });
            if (!structure.hasSTAR && a.feedback?.questionType === 'behavioral') insights.push({ type: 'warning', text: 'No STAR structure for behavioral question', icon: '📋' });
            if (speech.wordCount < 25) insights.push({ type: 'warning', text: `Answer too brief (${speech.wordCount} words)`, icon: '📖' });
            if (structure.hasNumbers) insights.push({ type: 'good', text: 'Uses specific metrics and data', icon: '📊' });
            if (structure.hasSTAR) insights.push({ type: 'good', text: 'Good STAR framework usage', icon: '✅' });
            if (confidence.hedgeCount > 2) insights.push({ type: 'warning', text: 'Hedging language reduces impact', icon: '💪' });
            if (confidence.assertiveCount > 2) insights.push({ type: 'good', text: 'Confident, assertive language', icon: '💪' });
            if (speech.wordCount >= 60) insights.push({ type: 'good', text: 'Thorough, detailed response', icon: '📝' });
            if (relevance.directness > 70) insights.push({ type: 'good', text: 'Directly addresses the question', icon: '🎯' });
            if (structure.hasExamples) insights.push({ type: 'good', text: 'Provides specific examples', icon: '💡' });

            return {
                questionNum: i + 1,
                question: a.question,
                answer: a.answer,
                score: feedbackScore,
                verdict: questionVerdict,
                speechScore: Math.round(speechScore),
                structureScore: Math.round(structureScore),
                confidenceScore: Math.round(confidenceScore),
                relevanceScore: Math.round(relevanceScore),
                speech,
                structure,
                confidence,
                relevance,
                insights,
                wordCount: speech.wordCount,
                questionType: a.feedback?.questionType || 'behavioral',
                keyMoment: a.feedback?.keyMoment || (insights.find(i => i.type === 'good') || insights.find(i => i.type === 'warning') || { text: 'Average response quality' }).text,
                strengths: a.feedback?.strengths || [],
                improvements: a.feedback?.improvements || [],
                oneLiner: a.feedback?.oneLiner || ''
            };
        });

        // Aggregate scores with weights
        const validScores = answerBreakdown.filter(a => a.score > 0);
        const avgSpeech = validScores.length > 0 ? Math.round(validScores.reduce((s, a) => s + a.speechScore, 0) / validScores.length) : 0;
        const avgStructure = validScores.length > 0 ? Math.round(validScores.reduce((s, a) => s + a.structureScore, 0) / validScores.length) : 0;
        const avgConfidence = validScores.length > 0 ? Math.round(validScores.reduce((s, a) => s + a.confidenceScore, 0) / validScores.length) : 0;
        const avgRelevance = validScores.length > 0 ? Math.round(validScores.reduce((s, a) => s + a.relevanceScore, 0) / validScores.length) : 0;

        // Best and worst answers
        const sortedByScore = [...answerBreakdown].sort((a, b) => b.score - a.score);
        const bestAnswer = sortedByScore[0] || null;
        const worstAnswer = sortedByScore[sortedByScore.length - 1] || null;

        // Weaknesses aggregation
        const allWeaknesses = answerBreakdown.flatMap(a => a.insights.filter(i => i.type === 'warning').map(i => ({ text: i.text, icon: i.icon, question: a.questionNum, score: a.score })));
        const weaknessMap = {};
        allWeaknesses.forEach(w => {
            if (!weaknessMap[w.text]) weaknessMap[w.text] = { text: w.text, icon: w.icon, count: 0, questions: [], avgScore: 0, totalScore: 0 };
            weaknessMap[w.text].count++;
            weaknessMap[w.text].questions.push(w.question);
            weaknessMap[w.text].totalScore += w.score;
        });
        const weaknesses = Object.values(weaknessMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
            .map(w => ({
                text: w.text,
                icon: w.icon,
                category: w.text.includes('filler') || w.text.includes('🗣️') ? 'Speech' :
                          w.text.includes('STAR') || w.text.includes('📋') || w.text.includes('structure') ? 'Structure' :
                          w.text.includes('hedg') || w.text.includes('💪') && w.text.includes('uncertain') ? 'Confidence' :
                          w.text.includes('brief') ? 'Depth' : 'General',
                impact: w.count >= 3 ? 'high' : w.count >= 2 ? 'medium' : 'low',
                questionsAffected: w.questions,
                avgScore: Math.round(w.totalScore / w.count)
            }));

        // Strengths aggregation
        const allStrengths = answerBreakdown.flatMap(a => a.insights.filter(i => i.type === 'good').map(i => ({ text: i.text, icon: i.icon })));
        const strengthCounts = {};
        allStrengths.forEach(s => { strengthCounts[s.text] = (strengthCounts[s.text] || 0) + 1; });
        const topStrengths = Object.entries(strengthCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([text, count]) => {
                const icon = allStrengths.find(s => s.text === text)?.icon || '✨';
                return { text, count, icon };
            });

        // Score trend analysis
        const scoreTrend = validScores.map(a => a.score);
        const trendDirection = scoreTrend.length >= 3 ? (scoreTrend[scoreTrend.length - 1] - scoreTrend[0]) / scoreTrend.length : 0;
        const trendLabel = trendDirection > 3 ? 'Improving ↑' : trendDirection < -3 ? 'Declining ↓' : 'Consistent →';
        const improvingQuestions = scoreTrend.filter((s, i) => i > 0 && s > scoreTrend[i - 1]).length;
        const decliningQuestions = scoreTrend.filter((s, i) => i > 0 && s < scoreTrend[i - 1]).length;

        // Speech trend
        const speechTrend = validScores.map(a => a.speechScore);
        const avgFillerRate = validScores.length > 0 ? Math.round(validScores.reduce((sum, a) => sum + a.speech.fillerRate, 0) / validScores.length) : 0;
        const totalFillerWords = validScores.reduce((sum, a) => sum + a.speech.fillerCount, 0);

        // Structure trend
        const starUsageCount = validScores.filter(a => a.structure.hasSTAR).length;
        const metricUsageCount = validScores.filter(a => a.structure.hasNumbers).length;

        // Improvements generation
        const improvements = generateImprovements(weaknesses, avgSpeech, avgStructure, avgConfidence, avgRelevance, overallScore, starUsageCount, validScores.length);

        const durationMin = Math.round((sessionData.totalDuration || 0) / 60000);
        const totalWords = answerBreakdown.reduce((sum, a) => sum + a.wordCount, 0);
        const avgWords = validScores.length > 0 ? Math.round(totalWords / validScores.length) : 0;
        const answeredCount = validScores.length;

        // Performance badges
        const badges = [];
        if (avgStructure >= 70 && starUsageCount >= validScores.length * 0.6) badges.push({ label: 'STAR Expert', icon: '🏆', color: 'success' });
        if (avgSpeech >= 70 && avgFillerRate < 8) badges.push({ label: 'Fluent Speaker', icon: '🎯', color: 'success' });
        if (avgConfidence >= 70) badges.push({ label: 'Confident Communicator', icon: '💪', color: 'success' });
        if (avgRelevance >= 70) badges.push({ label: 'Highly Relevant', icon: '🎯', color: 'success' });
        if (improvingQuestions >= scoreTrend.length * 0.7 && scoreTrend.length >= 3) badges.push({ label: 'Steady Improver', icon: '📈', color: 'success' });
        if (avgWords >= 50) badges.push({ label: 'Detailed & Thorough', icon: '📝', color: 'success' });
        if (overallScore < 50) badges.push({ label: 'Needs Practice', icon: '📚', color: 'warning' });
        if (avgFillerRate > 12) badges.push({ label: 'Reduce Fillers', icon: '🗣️', color: 'warning' });
        if (worstAnswer && worstAnswer.score < 45) badges.push({ label: 'Focus on Weak Areas', icon: '🔧', color: 'warning' });

        // Comparative insights
        const comparativeInsights = [];
        if (bestAnswer && worstAnswer) {
            const scoreGap = bestAnswer.score - worstAnswer.score;
            if (scoreGap > 20) {
                comparativeInsights.push(`Score range of ${scoreGap} points — your performance varies significantly by question type`);
            }
        }
        if (avgConfidence < avgStructure) {
            comparativeInsights.push('Your answers are well-structured but could be delivered with more confidence');
        }
        if (avgSpeech < avgStructure) {
            comparativeInsights.push('Good content structure but filler words and delivery need attention');
        }
        if (starUsageCount < validScores.length * 0.3) {
            comparativeInsights.push('Behavioral questions need more STAR-formatted responses');
        }
        if (avgWords < 35) {
            comparativeInsights.push('Answers tend to be brief — aim for more detailed responses (40-60 words)');
        }
        if (improvingQuestions > decliningQuestions && scoreTrend.length >= 3) {
            comparativeInsights.push('You\'re getting stronger as the interview progresses — maintain this momentum');
        }

        return {
            overallScore,
            verdict,
            verdictClass,
            role: sessionData.role,
            experience: sessionData.experience,
            questionCount: sessionData.questions.length,
            answeredCount,
            durationMin,
            totalWords,
            avgWords,
            avgSpeech,
            avgStructure,
            avgConfidence,
            avgRelevance,
            scoreTrend,
            trendLabel,
            improvingQuestions,
            decliningQuestions,
            bestAnswer: bestAnswer ? { num: bestAnswer.questionNum, score: bestAnswer.score, question: bestAnswer.question } : null,
            worstAnswer: worstAnswer ? { num: worstAnswer.questionNum, score: worstAnswer.score, question: worstAnswer.question } : null,
            strengths: topStrengths,
            weaknesses,
            improvements,
            answerBreakdown,
            speechTrend,
            avgFillerRate,
            totalFillerWords,
            starUsageCount,
            metricUsageCount,
            badges,
            comparativeInsights
        };
    }

    function generateImprovements(weaknesses, avgSpeech, avgStructure, avgConfidence, avgRelevance, score, starUsageCount, totalQuestions) {
        const improvements = [];
        const weaknessTexts = weaknesses.map(w => w.text.toLowerCase());
        const weaknessCategories = [...new Set(weaknesses.map(w => w.category))];
        const starRate = totalQuestions > 0 ? starUsageCount / totalQuestions : 0;

        if (avgStructure < 65 || starRate < 0.4) {
            improvements.push({
                title: 'Master the STAR Method',
                description: 'Structure behavioral answers using Situation, Task, Action, Result. This framework is expected in virtually all behavioral interviews.',
                exercise: 'Pick your strongest experience. Practice answering in exactly 4 parts: (S) What was the context? (T) What was your responsibility? (A) What specific actions did you take? (R) What measurable results did you achieve? Record yourself and check for all 4 parts.',
                priority: weaknessCategories.includes('Structure') ? 'high' : 'medium',
                icon: '📋'
            });
        }

        if (avgSpeech < 70 || weaknessTexts.some(w => w.includes('filler'))) {
            improvements.push({
                title: 'Eliminate Filler Words',
                description: 'Filler words like "um", "uh", "like", and "you know" signal uncertainty and dilute your message. Replace them with confident pauses.',
                exercise: 'Record yourself answering a question for 2 minutes. Count every filler word. Practice again aiming for zero fillers — use strategic pauses instead of filler sounds.',
                priority: weaknessCategories.includes('Speech') ? 'high' : 'medium',
                icon: '🗣️'
            });
        }

        if (avgConfidence < 60 || weaknessTexts.some(w => w.includes('uncertain') || w.includes('hedg'))) {
            improvements.push({
                title: 'Use Confident Language',
                description: 'Replace "I think", "maybe", "probably" with assertive language. Hiring managers respond to conviction and clarity.',
                exercise: 'For your next practice session, replace every "I think" with "I know" or "I am confident that". Replace every "maybe" with a clear statement. Notice how the shift changes your delivery.',
                priority: weaknessCategories.includes('Confidence') ? 'high' : 'medium',
                icon: '💪'
            });
        }

        if (score < 65) {
            improvements.push({
                title: 'Add Specific Metrics & Examples',
                description: 'Generic answers don\'t stand out. Quantify your impact with specific numbers — percentages, dollar amounts, team sizes, time saved, or efficiency gains.',
                exercise: 'For each main experience, prepare at least one specific metric. For example: "I reduced load time by 40%" not "I made it faster". Use the X/Y/Z format: "In 3 months, I led a team of 5 to deliver a 25% increase in retention."',
                priority: 'medium',
                icon: '📊'
            });
        }

        if (weaknesses.some(w => w.text.includes('brief') || w.text.includes('too short'))) {
            improvements.push({
                title: 'Expand Answer Depth',
                description: 'Aim for answers of at least 40-60 words to demonstrate thoughtfulness and provide enough context for evaluation.',
                exercise: 'For "Tell me about yourself" aim for 2-3 minutes. For STAR questions, aim for 90 seconds minimum. Practice the "2-minute rule" — say enough to fully answer but not so much you lose focus.',
                priority: 'medium',
                icon: '📝'
            });
        }

        if (avgRelevance < 60) {
            improvements.push({
                title: 'Stay Directly Relevant',
                description: 'Ensure every answer directly addresses what was asked. Tangential responses lose points even if they\'re well-delivered.',
                exercise: 'Before answering, briefly mentally restate the question. Start your answer with language that echoes the question. This keeps you focused and shows active listening.',
                priority: 'medium',
                icon: '🎯'
            });
        }

        if (improvements.length === 0 || score >= 80) {
            improvements.push({
                title: 'Maintain Consistent Practice',
                description: 'Your performance is strong! Keep the momentum with regular practice sessions. Focus on refinement rather than fixing fundamentals.',
                exercise: 'Schedule one mock interview per week. After each session, review your top 2 weaknesses and spend 20 minutes specifically practicing those areas.',
                priority: 'low',
                icon: '🚀'
            });
        }

        return improvements;
    }

    function generateDownloadText(report) {
        const roleName = (report.role || 'General').replace('-', ' ');
        const lines = [
            '═══════════════════════════════════════════════════════════════════',
            '              INTERVIEWIQ — AI MOCK INTERVIEW SESSION REPORT',
            '═══════════════════════════════════════════════════════════════════',
            '',
            `  Role: ${roleName}`,
            `  Experience Level: ${report.experience}`,
            `  Session Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
            `  Questions Attempted: ${report.answeredCount} / ${report.questionCount}`,
            `  Total Duration: ${report.durationMin} minutes`,
            `  Average Answer Length: ${report.avgWords} words`,
            '',
            '───────────────────────────────────────────────────────────────────',
            `                    OVERALL SCORE: ${report.overallScore}`,
            `                    ${report.verdict.toUpperCase()}`,
            '───────────────────────────────────────────────────────────────────',
            '',
            `  Speech Quality:    ${report.avgSpeech}/100`,
            `  Answer Structure:  ${report.avgStructure}/100`,
            `  Confidence Level:  ${report.avgConfidence}/100`,
            `  Role Relevance:    ${report.avgRelevance}/100`,
            '',
        ];

        if (report.badges && report.badges.length > 0) {
            lines.push('  🏆 Performance Badges:');
            report.badges.forEach(b => lines.push(`     ${b.icon} ${b.label}`));
            lines.push('');
        }

        lines.push('───────────────────────────────────────────────────────────────────');
        lines.push('                    SCORE TREND ANALYSIS');
        lines.push('───────────────────────────────────────────────────────────────────');
        lines.push(`  Trend: ${report.trendLabel}  |  Questions Improving: ${report.improvingQuestions}  |  Declining: ${report.decliningQuestions}`);
        if (report.bestAnswer) lines.push(`  Best Answer: Q${report.bestAnswer.num} (${report.bestAnswer.score}/100) — ${report.bestAnswer.question.substring(0, 50)}...`);
        if (report.worstAnswer) lines.push(`  Needs Work: Q${report.worstAnswer.num} (${report.worstAnswer.score}/100) — ${report.worstAnswer.question.substring(0, 50)}...`);
        lines.push('');

        lines.push('───────────────────────────────────────────────────────────────────');
        lines.push('              DETAILED QUESTION-BY-QUESTION REVIEW');
        lines.push('───────────────────────────────────────────────────────────────────');

        report.answerBreakdown.forEach((a, i) => {
            lines.push(`\n  ┌────────────────────────────────────────────────────────────`);
            lines.push(`  │ Q${i + 1}: ${a.question.substring(0, 70)}${a.question.length > 70 ? '...' : ''}`);
            lines.push(`  │ Score: ${a.score}/100 — ${a.verdict}`);
            lines.push(`  │ Speech: ${a.speechScore} | Structure: ${a.structureScore} | Confidence: ${a.confidenceScore} | Relevance: ${a.relevanceScore}`);
            lines.push(`  │ Words: ${a.wordCount} | Filler Rate: ${a.speech.fillerRate}% | STAR: ${a.structure.hasSTAR ? 'Yes' : 'No'}`);
            if (a.answer) {
                const displayAnswer = a.answer.length > 150 ? a.answer.substring(0, 150) + '...' : a.answer;
                lines.push(`  │ Answer: "${displayAnswer}"`);
            }
            if (a.insights && a.insights.length > 0) {
                lines.push(`  │ Insights: ${a.insights.map(i => `${i.icon} ${i.text}`).join(' | ')}`);
            }
            lines.push('  └────────────────────────────────────────────────────────────');
        });

        if (report.strengths && report.strengths.length > 0) {
            lines.push('\n───────────────────────────────────────────────────────────────────');
            lines.push('                       KEY STRENGTHS');
            lines.push('───────────────────────────────────────────────────────────────────');
            report.strengths.forEach((s, i) => {
                lines.push(`  ${i + 1}. ${s.icon} ${s.text} (seen in ${s.count} answers)`);
            });
            lines.push('');
        }

        if (report.weaknesses.length > 0) {
            lines.push('───────────────────────────────────────────────────────────────────');
            lines.push('                    AREAS FOR IMPROVEMENT');
            lines.push('───────────────────────────────────────────────────────────────────');
            report.weaknesses.forEach((w, i) => {
                lines.push(`  ${i + 1}. ${w.icon} ${w.text} [${w.impact.toUpperCase()} IMPACT]`);
                lines.push(`     Affects Qs: ${w.questionsAffected.join(', ')}`);
            });
            lines.push('');
        }

        if (report.improvements.length > 0) {
            lines.push('───────────────────────────────────────────────────────────────────');
            lines.push('                      IMPROVEMENT PLAN');
            lines.push('───────────────────────────────────────────────────────────────────');
            report.improvements.forEach((imp, i) => {
                lines.push(`  ${i + 1}. ${imp.icon} ${imp.title} [${imp.priority.toUpperCase()}]`);
                lines.push(`     ${imp.description}`);
                lines.push(`     → Practice: ${imp.exercise}`);
                lines.push('');
            });
        }

        if (report.comparativeInsights && report.comparativeInsights.length > 0) {
            lines.push('───────────────────────────────────────────────────────────────────');
            lines.push('                     ANALYST INSIGHTS');
            lines.push('───────────────────────────────────────────────────────────────────');
            report.comparativeInsights.forEach((insight, i) => {
                lines.push(`  • ${insight}`);
            });
            lines.push('');
        }

        lines.push('═══════════════════════════════════════════════════════════════════');
        lines.push('Generated by InterviewIQ — AI-Powered Mock Interview Practice');
        lines.push('═══════════════════════════════════════════════════════════════════');

        return lines.join('\n');
    }

    window.mockReport = {
        generate: generateReport,
        generateDownloadText
    };

})();