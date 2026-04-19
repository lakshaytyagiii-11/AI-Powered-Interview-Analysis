/* ============================================
   TTS Engine — Browser Text-to-Speech Wrapper
   ============================================ */

(function () {
    'use strict';

    const SPEECH_SYNTHESIS = window.speechSynthesis;
    const MAX_CHUNK_LENGTH = 200;

    function chunkText(text, maxLength) {
        const sentences = text.split(/([.!?]+[\s]+)/);
        const chunks = [];
        let current = '';

        for (const part of sentences) {
            if ((current + part).length > maxLength && current.length > 0) {
                chunks.push(current.trim());
                current = part;
            } else {
                current += part;
            }
        }
        if (current.trim()) chunks.push(current.trim());
        return chunks;
    }

    function isSupported() {
        return !!(SPEECH_SYNTHESIS && SPEECH_SYNTHESIS.getVoices);
    }

    function speak(text, onEnd) {
        if (!isSupported()) {
            if (onEnd) onEnd();
            return null;
        }

        SPEECH_SYNTHESIS.cancel();

        const chunks = chunkText(text, MAX_CHUNK_LENGTH);
        let index = 0;

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voices = SPEECH_SYNTHESIS.getVoices();
        const preferred = voices.find(v =>
            v.name.includes('Google') && v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (preferred) utterance.voice = preferred;

        utterance.onend = () => {
            index++;
            if (index < chunks.length) {
                const next = new SpeechSynthesisUtterance(chunks[index]);
                next.rate = 0.95;
                next.pitch = 1;
                next.volume = 1;
                if (preferred) next.voice = preferred;
                SPEECH_SYNTHESIS.speak(next);
            } else {
                if (onEnd) onEnd();
            }
        };

        utterance.onerror = (e) => {
            console.warn('TTS error:', e.error);
            if (onEnd) onEnd();
        };

        SPEECH_SYNTHESIS.speak(utterance);
        return utterance;
    }

    function stop() {
        if (isSupported()) SPEECH_SYNTHESIS.cancel();
    }

    function isSpeaking() {
        return isSupported() && SPEECH_SYNTHESIS.speaking;
    }

    // Chrome requires waiting for voices to load
    if (SPEECH_SYNTHESIS) {
        SPEECH_SYNTHESIS.getVoices();
        SPEECH_SYNTHESIS.onvoiceschanged = () => SPEECH_SYNTHESIS.getVoices();
    }

    window.ttsEngine = {
        speak,
        stop,
        isSpeaking,
        isSupported
    };

})();
