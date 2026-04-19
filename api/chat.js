/* ============================================
   Vercel Serverless Function — API Proxy
   Handles Groq and Gemini API calls securely
   ============================================ */

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { provider, messages, model, apiKey, questionCount, question, answer, role } = req.body;

    // Validate API key
    if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
    }

    try {
        if (provider === 'groq') {
            return await handleGroq(res, apiKey, messages, model, questionCount, question, answer, role);
        } else if (provider === 'gemini') {
            return await handleGemini(res, apiKey, messages, model, questionCount, question, answer, role);
        } else {
            return res.status(400).json({ error: 'Invalid provider' });
        }
    } catch (error) {
        console.error(`API Error (${provider}):`, error.message);
        return res.status(500).json({ error: error.message || 'API request failed' });
    }
}

async function handleGroq(res, apiKey, messages, model, questionCount, question, answer, role) {
    const payload = {
        model: model || 'llama-3.1-8b-instant',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({
        success: true,
        provider: 'groq',
        content: content,
        raw: data
    });
}

async function handleGemini(res, apiKey, messages, model, questionCount, question, answer, role) {
    // Convert OpenAI format to Gemini format
    const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    const payload = {
        contents: contents,
        generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7
        }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
        success: true,
        provider: 'gemini',
        content: content,
        raw: data
    });
}
