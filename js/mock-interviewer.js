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

        const score = Math.min(100, Math.max(0, Math.round(baseScore)));

        let verdict = 'Needs Improvement';
        if (score >= 80) verdict = 'Strong Response';
        else if (score >= 65) verdict = 'Good Response';
        else if (score >= 50) verdict = 'Average Response';

        return {
            score,
            verdict,
            strengths: [
                score >= 50 ? 'Demonstrates relevant experience' : null,
                words >= 30 ? 'Provides an answer with reasonable depth' : null,
                (answer || '').length >= 50 ? 'Attempts to address the question directly' : null
            ].filter(Boolean),
            improvements: [
                words < 30 ? 'Expand your answer with more specific examples' : null,
                fillers.length > 2 ? 'Reduce filler words like "um", "uh", "like"' : null,
                !starPatterns.test(answer || '') ? 'Use the STAR method to structure your response' : null,
                score < 50 ? 'Focus on being more confident and direct' : null
            ].filter(Boolean),
            oneLiner: score >= 65
                ? 'A solid response that demonstrates good interview skills.'
                : 'Consider expanding your answer and being more structured.'
        };
    }

    // ─── Groq API ───────────────────────────────────────────
    async function groqGenerateQuestions(role, experience, count, apiKey) {
        const provider = PROVIDERS.GROQ;
        const prompt = `You are an interview question generator. Generate exactly ${count} interview questions for a ${experience} level ${role.replace('-', ' ')} position.

Return ONLY a JSON array of question strings, no explanation or markup. Example: ["Question 1?", "Question 2?"]

Generate questions that are varied in difficulty and type (behavioral, situational, technical), relevant to the ${role.replace('-', ' ')} role at ${experience} level, and commonly asked in real interviews.`;

        const response = await fetch(provider.questionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: provider.model,
                max_tokens: provider.maxTokens,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content || '';

        try {
            const questions = JSON.parse(rawContent);
            if (Array.isArray(questions) && questions.length > 0) return questions.slice(0, count);
        } catch { /* ignore */ }

        return window.questionBank.getQuestions(role, experience, count);
    }

    async function groqGetFeedback(question, answer, role, apiKey) {
        const provider = PROVIDERS.GROQ;
        const prompt = `You are an interview coach providing feedback on a job interview response.

Role: ${role.replace('-', ' ')}
Question: ${question}
Answer: ${answer || '(no answer provided)'}

Analyze this interview response and return ONLY a valid JSON object with this exact structure:
{
  "score": number (0-100),
  "verdict": "Strong Response" | "Good Response" | "Needs Improvement",
  "strengths": string[] (2-4 specific positive observations),
  "improvements": string[] (2-4 specific actionable improvements),
  "oneLiner": "A single sentence summary feedback"
}

Scoring criteria:
- Score 80-100: Excellent structure, specific examples, confident language, STAR format used
- Score 60-79: Good content but missing some structure or examples
- Score 40-59: Basic answer but lacks depth, examples, or confidence
- Score 0-39: Poor answer that doesn't address the question well

Focus on: clarity, STAR method usage, specific metrics/examples, confident language, relevance to the role.`;

        const response = await fetch(provider.feedbackUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: provider.model,
                max_tokens: provider.maxTokens,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3
            })
        });

        if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content || '';

        return parseFeedbackResponse(rawContent);
    }

    // ─── Gemini API ───────────────────────────────────────────
    async function geminiGenerateQuestions(role, experience, count, apiKey) {
        const provider = PROVIDERS.GEMINI;
        const prompt = `You are an interview question generator. Generate exactly ${count} interview questions for a ${experience} level ${role.replace('-', ' ')} position.

Return ONLY a JSON array of question strings, no explanation or markup. Example: ["Question 1?", "Question 2?"]

Generate questions that are varied in difficulty and type (behavioral, situational, technical), relevant to the ${role.replace('-', ' ')} role at ${experience} level, and commonly asked in real interviews.`;

        const response = await fetch(
            `${provider.baseUrl}/${provider.model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: provider.maxTokens, temperature: 0.7 }
                })
            }
        );

        if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        try {
            const questions = JSON.parse(rawContent);
            if (Array.isArray(questions) && questions.length > 0) return questions.slice(0, count);
        } catch { /* ignore */ }

        return window.questionBank.getQuestions(role, experience, count);
    }

    async function geminiGetFeedback(question, answer, role, apiKey) {
        const provider = PROVIDERS.GEMINI;
        const prompt = `You are an interview coach providing feedback on a job interview response.

Role: ${role.replace('-', ' ')}
Question: ${question}
Answer: ${answer || '(no answer provided)'}

Analyze this interview response and return ONLY a valid JSON object with this exact structure:
{
  "score": number (0-100),
  "verdict": "Strong Response" | "Good Response" | "Needs Improvement",
  "strengths": string[] (2-4 specific positive observations),
  "improvements": string[] (2-4 specific actionable improvements),
  "oneLiner": "A single sentence summary feedback"
}

Focus on: clarity, STAR method usage, specific metrics/examples, confident language.`;

        const response = await fetch(
            `${provider.baseUrl}/${provider.model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: provider.maxTokens, temperature: 0.3 }
                })
            }
        );

        if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return parseFeedbackResponse(rawContent);
    }

    // ─── Shared parser ─────────────────────────────────────────
    function parseFeedbackResponse(rawContent) {
        try {
            const feedback = JSON.parse(rawContent);
            if (feedback && typeof feedback.score === 'number') return feedback;
        } catch { /* ignore */ }

        // Try extracting JSON from markdown code blocks
        const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                         rawContent.match(/\{[\s\S]*"score"[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const feedback = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                if (feedback && typeof feedback.score === 'number') return feedback;
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
