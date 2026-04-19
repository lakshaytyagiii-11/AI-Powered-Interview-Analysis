/* ============================================
   Mock Interviewer — AI feedback via Groq or Gemini API
   Auto-detects provider from API key format:
   - gsk_... → Groq (Llama models, free tier)
   - AIza... → Google Gemini
   ============================================ */

(function () {
    'use strict';

    const PROVIDERS = {
        GROQ: {
            name: 'groq',
            questionUrl: 'https://api.groq.com/openai/v1/chat/completions',
            feedbackUrl: 'https://api.groq.com/openai/v1/chat/completions',
            model: 'llama-3.1-8b-instant',
            maxTokens: 500
        },
        GEMINI: {
            name: 'gemini',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
            model: 'gemini-1.5-flash',
            maxTokens: 1000
        }
    };

    function detectProvider(apiKey) {
        if (!apiKey) return null;
        if (apiKey.startsWith('gsk_')) return PROVIDERS.GROQ;
        if (apiKey.startsWith('AIza') || apiKey.startsWith('gemini')) return PROVIDERS.GEMINI;
        return null;
    }

    function generateFallbackFeedback(question, answer, role) {
        const words = (answer || '').split(/\s+/).length;
        let baseScore = Math.min(85, 40 + words);

        const fillers = (answer || '').match(/\b(um|uh|like|you know|basically)\b/gi) || [];
        baseScore = Math.max(20, baseScore - fillers.length * 3);

        const starPatterns = /\b(because|therefore|as a result|so that|in order to)\b/gi;
        if ((answer || '').match(starPatterns)) baseScore += 10;

        const hedges = (answer || '').match(/\b(maybe|i think|i believe|probably|sort of|kind of)\b/gi) || [];
        const assertive = (answer || '').match(/\b(definitely|absolutely|certainly|i know|i can|i will)\b/gi) || [];

        const speechScore = Math.max(0, Math.min(100, 100 - fillers.length * 8));
        const structureScore = Math.min(100, baseScore + (starPatterns.test(answer || '') ? 20 : 0));
        const confidenceScore = Math.max(0, Math.min(100, 100 - hedges.length * 10 + assertive.length * 8));
        const relevanceScore = Math.min(100, 40 + Math.min(50, words / 2));
        const overallScore = Math.min(100, Math.max(0, Math.round(baseScore)));

        let verdict = 'Needs Improvement';
        if (overallScore >= 85) verdict = 'Exceptional Response';
        else if (overallScore >= 75) verdict = 'Strong Response';
        else if (overallScore >= 60) verdict = 'Good Response';
        else if (overallScore >= 45) verdict = 'Needs Improvement';

        const roleName = (role || 'general').replace('-', ' ');
        const questionLower = (question || '').toLowerCase();
        const isBehavioral = questionLower.includes('time when') || questionLower.includes('describe a situation') || questionLower.includes('tell me about');
        const questionType = isBehavioral ? 'behavioral' : questionLower.includes('what would') || questionLower.includes('how would you handle') ? 'situational' : 'technical';

        return {
            score: overallScore,
            verdict,
            speechScore,
            structureScore,
            confidenceScore,
            relevanceScore,
            strengths: [
                speechScore >= 60 && fillers.length <= 2 ? 'Speaks clearly with minimal filler words' : null,
                structureScore >= 65 && starPatterns.test(answer || '') ? 'Uses structured approach to answer questions' : null,
                confidenceScore >= 60 && assertive.length > 0 ? 'Demonstrates confidence in responses' : null,
                relevanceScore >= 55 && words >= 30 ? 'Provides detailed, relevant answers' : null,
                words >= 50 ? 'Shows ability to elaborate with examples' : null
            ].filter(Boolean),
            improvements: [
                speechScore < 60 ? 'Reduce filler words and practice more fluent delivery' : null,
                structureScore < 65 ? 'Use STAR method to structure behavioral answers' : null,
                confidenceScore < 60 ? 'Replace hedging phrases with more assertive language' : null,
                relevanceScore < 55 ? 'Ensure answers directly address the question asked' : null,
                words < 30 ? 'Expand answers with more specific examples and details' : null
            ].filter(Boolean),
            oneLiner: overallScore >= 65
                ? 'A solid response demonstrating good interview skills for a ' + roleName + ' role.'
                : 'Consider expanding your answers and using more structured responses.',
            questionType,
            keyMoment: fillers.length > 3 ? 'Noticeable filler word usage affects fluency' : starPatterns.test(answer || '') ? 'Good use of structured response format' : 'Direct and concise delivery'
        };
    }

    // ─── Groq API (via Vercel Proxy) ───────────────────────────────────────────
    async function groqGenerateQuestions(role, experience, count, apiKey) {
        const expLabel = experience === 'junior' ? 'entry-level (0-2 years)' : experience === 'mid' ? 'mid-level (3-5 years)' : 'senior-level (5+ years)';
        const roleName = role.replace('-', ' ');
        const prompt = `You are a professional interview coach generating questions for a ${expLabel} ${roleName} position.

Generate exactly ${count} questions that are diverse in type and realistic for actual interviews.

Question types to include:
- Behavioral (STAR-format): "Tell me about a time when..." / "Describe a situation where..."
- Situational: "What would you do if..." / "How would you handle..."
- Technical/Role-specific: questions testing actual ${roleName} knowledge and skills
- Curveball: unexpected scenarios that test thinking on your feet

For ${experience} level candidates, include:
- Junior: foundational questions, growth mindset, basic scenario handling
- Mid: leadership moments, trade-off decisions, technical depth questions
- Senior: strategy, influencing without authority, high-complexity scenarios, mentoring

Make questions specific and memorable. Avoid generic questions. Each question should test a distinct skill or competency.

Return ONLY a valid JSON array of question strings, no markup or explanation. Example: ["Question 1?", "Question 2?"]`;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'groq',
                    apiKey: apiKey,
                    model: 'llama-3.1-8b-instant',
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) throw new Error(`API proxy error: ${response.status}`);

            const data = await response.json();
            const rawContent = data.content || '';

            try {
                const questions = JSON.parse(rawContent);
                if (Array.isArray(questions) && questions.length > 0) return questions.slice(0, count);
            } catch { /* ignore */ }
        } catch (err) {
            console.warn('Groq API failed, using fallback:', err.message);
        }

        return window.questionBank.getQuestions(role, experience, count);
    }

    async function groqGetFeedback(question, answer, role, apiKey) {
        const roleName = role.replace('-', ' ');
        const prompt = `You are an expert interview coach evaluating a candidate's response to this interview question for a ${roleName} position.

Question: ${question}
Candidate's Answer: ${answer || '(no answer provided)'}

Evaluate the response across FOUR dimensions and return a detailed JSON assessment:

{
  "score": overall score 0-100,
  "verdict": "Exceptional Response" | "Strong Response" | "Good Response" | "Needs Improvement" | "Weak Response",
  "speechScore": speech quality score 0-100 (filler words, pacing, clarity, tone),
  "structureScore": answer structure score 0-100 (STAR method usage, logical flow, organization, depth),
  "confidenceScore": confidence level score 0-100 (assertive language, conviction, hesitation markers),
  "relevanceScore": role relevance score 0-100 (addressing the question, role alignment, specific examples),
  "strengths": [3-5 specific positive observations about what the candidate did well],
  "improvements": [3-5 specific, actionable suggestions for improvement],
  "oneLiner": "one sentence overall feedback summary",
  "questionType": "behavioral" | "situational" | "technical" | "curveball",
  "keyMoment": "a specific phrase or moment in the answer worth highlighting"
}

Scoring guidelines:
- Speech (25% weight): No fillers, good pace, clear articulation, confident tone
- Structure (30% weight): STAR format used, clear beginning/middle/end, good depth
- Confidence (25% weight): Assertive language, no hedging, clear conviction
- Relevance (20% weight): Directly addresses question, shows ${roleName} alignment

Focus on specificity. Generic praise or generic suggestions earn lower scores. Identify the EXACT strength or weakness in the answer.`;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'groq',
                    apiKey: apiKey,
                    model: 'llama-3.1-8b-instant',
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) throw new Error(`API proxy error: ${response.status}`);

            const data = await response.json();
            const rawContent = data.content || '';

            return parseFeedbackResponse(rawContent);
        } catch (err) {
            console.warn('Groq feedback failed, using fallback:', err.message);
            return generateFallbackFeedback(question, answer, role);
        }
    }

    // ─── Gemini API (via Vercel Proxy) ───────────────────────────────────────────
    async function geminiGenerateQuestions(role, experience, count, apiKey) {
        const expLabel = experience === 'junior' ? 'entry-level (0-2 years)' : experience === 'mid' ? 'mid-level (3-5 years)' : 'senior-level (5+ years)';
        const roleName = role.replace('-', ' ');
        const prompt = `You are a professional interview coach generating questions for a ${expLabel} ${roleName} position.

Generate exactly ${count} questions that are diverse in type and realistic for actual interviews.

Question types to include:
- Behavioral (STAR-format): "Tell me about a time when..." / "Describe a situation where..."
- Situational: "What would you do if..." / "How would you handle..."
- Technical/Role-specific: questions testing actual ${roleName} knowledge and skills
- Curveball: unexpected scenarios that test thinking on your feet

For ${experience} level candidates, include:
- Junior: foundational questions, growth mindset, basic scenario handling
- Mid: leadership moments, trade-off decisions, technical depth questions
- Senior: strategy, influencing without authority, high-complexity scenarios, mentoring

Make questions specific and memorable. Avoid generic questions. Each question should test a distinct skill or competency.

Return ONLY a valid JSON array of question strings, no markup or explanation. Example: ["Question 1?", "Question 2?"]`;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'gemini',
                    apiKey: apiKey,
                    model: 'gemini-1.5-flash',
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) throw new Error(`API proxy error: ${response.status}`);

            const data = await response.json();
            const rawContent = data.content || '';

            try {
                const questions = JSON.parse(rawContent);
                if (Array.isArray(questions) && questions.length > 0) return questions.slice(0, count);
            } catch { /* ignore */ }
        } catch (err) {
            console.warn('Gemini API failed, using fallback:', err.message);
        }

        return window.questionBank.getQuestions(role, experience, count);
    }

    async function geminiGetFeedback(question, answer, role, apiKey) {
        const roleName = role.replace('-', ' ');
        const prompt = `You are an expert interview coach evaluating a candidate's response to this interview question for a ${roleName} position.

Question: ${question}
Candidate's Answer: ${answer || '(no answer provided)'}

Evaluate the response across FOUR dimensions and return a detailed JSON assessment:

{
  "score": overall score 0-100,
  "verdict": "Exceptional Response" | "Strong Response" | "Good Response" | "Needs Improvement" | "Weak Response",
  "speechScore": speech quality score 0-100 (filler words, pacing, clarity, tone),
  "structureScore": answer structure score 0-100 (STAR method usage, logical flow, organization, depth),
  "confidenceScore": confidence level score 0-100 (assertive language, conviction, hesitation markers),
  "relevanceScore": role relevance score 0-100 (addressing the question, role alignment, specific examples),
  "strengths": [3-5 specific positive observations about what the candidate did well],
  "improvements": [3-5 specific, actionable suggestions for improvement],
  "oneLiner": "one sentence overall feedback summary",
  "questionType": "behavioral" | "situational" | "technical" | "curveball",
  "keyMoment": "a specific phrase or moment in the answer worth highlighting"
}

Scoring guidelines:
- Speech (25% weight): No fillers, good pace, clear articulation, confident tone
- Structure (30% weight): STAR format used, clear beginning/middle/end, good depth
- Confidence (25% weight): Assertive language, no hedging, clear conviction
- Relevance (20% weight): Directly addresses question, shows ${roleName} alignment

Focus on specificity. Generic praise or generic suggestions earn lower scores.`;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'gemini',
                    apiKey: apiKey,
                    model: 'gemini-1.5-flash',
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) throw new Error(`API proxy error: ${response.status}`);

            const data = await response.json();
            const rawContent = data.content || '';

            return parseFeedbackResponse(rawContent);
        } catch (err) {
            console.warn('Gemini feedback failed, using fallback:', err.message);
            return generateFallbackFeedback(question, answer, role);
        }
    }

    // ─── Shared parser ─────────────────────────────────────────
    function parseFeedbackResponse(rawContent) {
        try {
            const feedback = JSON.parse(rawContent);
            if (feedback && typeof feedback.score === 'number') {
                // Ensure all sub-scores exist (backward compatibility)
                feedback.speechScore = feedback.speechScore || Math.round(feedback.score * 0.9);
                feedback.structureScore = feedback.structureScore || Math.round(feedback.score * 0.85);
                feedback.confidenceScore = feedback.confidenceScore || Math.round(feedback.score * 0.95);
                feedback.relevanceScore = feedback.relevanceScore || Math.round(feedback.score * 0.9);
                feedback.questionType = feedback.questionType || 'behavioral';
                feedback.keyMoment = feedback.keyMoment || feedback.oneLiner || '';
                return feedback;
            }
        } catch { /* ignore */ }

        // Try extracting JSON from markdown code blocks
        const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                         rawContent.match(/\{[\s\S]*"score"[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const feedback = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                if (feedback && typeof feedback.score === 'number') {
                    feedback.speechScore = feedback.speechScore || Math.round(feedback.score * 0.9);
                    feedback.structureScore = feedback.structureScore || Math.round(feedback.score * 0.85);
                    feedback.confidenceScore = feedback.confidenceScore || Math.round(feedback.score * 0.95);
                    feedback.relevanceScore = feedback.relevanceScore || Math.round(feedback.score * 0.9);
                    feedback.questionType = feedback.questionType || 'behavioral';
                    feedback.keyMoment = feedback.keyMoment || feedback.oneLiner || '';
                    return feedback;
                }
            } catch { /* ignore */ }
        }

        return generateFallbackFeedback('', '', '');
    }

    // ─── Main exports ──────────────────────────────────────────
    async function generateQuestions(role, experience, count, apiKey) {
        if (!apiKey) {
            return window.questionBank.getQuestions(role, experience, count);
        }

        const provider = detectProvider(apiKey);
        if (!provider) {
            console.warn('Unknown API key format, using question bank fallback');
            return window.questionBank.getQuestions(role, experience, count);
        }

        try {
            if (provider.name === 'groq') {
                return await groqGenerateQuestions(role, experience, count, apiKey);
            } else if (provider.name === 'gemini') {
                return await geminiGenerateQuestions(role, experience, count, apiKey);
            }
        } catch (err) {
            console.warn(`API call failed (${provider.name}):`, err.message);
        }

        return window.questionBank.getQuestions(role, experience, count);
    }

    async function getAIFeedback(question, answer, role, apiKey) {
        if (!apiKey) {
            return generateFallbackFeedback(question, answer, role);
        }

        const provider = detectProvider(apiKey);
        if (!provider) {
            return generateFallbackFeedback(question, answer, role);
        }

        try {
            if (provider.name === 'groq') {
                return await groqGetFeedback(question, answer, role, apiKey);
            } else if (provider.name === 'gemini') {
                return await geminiGetFeedback(question, answer, role, apiKey);
            }
        } catch (err) {
            console.warn(`API call failed (${provider.name}):`, err.message);
            return generateFallbackFeedback(question, answer, role);
        }
    }

    window.mockInterviewer = {
        generateQuestions,
        getAIFeedback,
        detectProvider
    };

})();
