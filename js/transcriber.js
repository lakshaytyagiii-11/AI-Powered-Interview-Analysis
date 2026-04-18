/* ============================================
   Transcriber — Parse transcript and recording support
   ============================================ */

class Transcriber {
    /** Parse Q/A formatted text into segments */
    parseTranscript(text) {
        const segments = [];
        const lines = text.split('\n');
        let currentQ = null;
        let currentA = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const qMatch = trimmed.match(/^Q[:\.]\s*(.+)/i);
            const aMatch = trimmed.match(/^A[:\.]\s*(.+)/i);

            if (qMatch) {
                if (currentQ && currentA.length > 0) {
                    segments.push({ question: currentQ, answer: currentA.join(' ') });
                }
                currentQ = qMatch[1].trim();
                currentA = [];
            } else if (aMatch) {
                currentA.push(aMatch[1].trim());
            } else if (currentQ) {
                currentA.push(trimmed);
            }
        }
        // Push last segment
        if (currentQ && currentA.length > 0) {
            segments.push({ question: currentQ, answer: currentA.join(' ') });
        }

        // Fallback: if no Q/A detected, treat entire text as one answer
        if (segments.length === 0 && text.trim().length > 0) {
            segments.push({ question: 'General Interview Response', answer: text.trim() });
        }

        return segments;
    }

    /** Start live recording with Web Speech API */
    startRecording(onTranscript, onStatus) {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            onStatus('error', 'Speech Recognition not supported in this browser. Please use Chrome.');
            return null;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let fullTranscript = '';

        recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    fullTranscript += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }
            onTranscript(fullTranscript, interim);
        };

        recognition.onerror = (event) => {
            onStatus('error', 'Recognition error: ' + event.error);
        };

        recognition.onend = () => {
            onStatus('ended', fullTranscript);
        };

        recognition.start();
        onStatus('started', '');
        return recognition;
    }
}

window.transcriber = new Transcriber();
