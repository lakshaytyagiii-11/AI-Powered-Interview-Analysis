/* ============================================
   Session Manager — Mock interview session state
   ============================================ */

(function () {
    'use strict';

    window.sessionManager = {
        state: 'idle', // idle | active | paused | complete
        role: null,
        experience: null,
        questions: [],
        currentIndex: 0,
        answers: [],
        startTime: null,
        pausedAt: null,
        totalDuration: 0,

        startSession(role, experience, questions) {
            this.state = 'active';
            this.role = role;
            this.experience = experience;
            this.questions = questions;
            this.currentIndex = 0;
            this.answers = [];
            this.startTime = Date.now();
            this.pausedAt = null;
            this.totalDuration = 0;
        },

        getCurrentQuestion() {
            if (this.state === 'idle' || this.currentIndex >= this.questions.length) {
                return null;
            }
            return this.questions[this.currentIndex];
        },

        getProgress() {
            return {
                current: this.currentIndex + 1,
                total: this.questions.length,
                percent: Math.round((this.currentIndex / this.questions.length) * 100)
            };
        },

        getCurrentAnswer() {
            if (this.currentIndex < this.answers.length) {
                return this.answers[this.currentIndex];
            }
            return null;
        },

        recordAnswer(answerText, feedback) {
            if (this.state !== 'active' && this.state !== 'paused') return null;

            const entry = {
                question: this.questions[this.currentIndex],
                answer: answerText,
                feedback: feedback,
                timestamp: Date.now()
            };

            this.answers[this.currentIndex] = entry;
            return entry;
        },

        advanceQuestion() {
            if (this.currentIndex < this.questions.length - 1) {
                this.currentIndex++;
                return true;
            }
            return false;
        },

        isComplete() {
            return this.state === 'complete';
        },

        pauseSession() {
            if (this.state === 'active') {
                this.state = 'paused';
                this.pausedAt = Date.now();
                if (this.startTime) {
                    this.totalDuration += (this.pausedAt - this.startTime);
                }
            }
        },

        resumeSession() {
            if (this.state === 'paused') {
                this.state = 'active';
                this.startTime = Date.now();
                this.pausedAt = null;
            }
        },

        endSession() {
            this.state = 'complete';

            if (this.startTime && this.state === 'complete') {
                this.totalDuration += (Date.now() - this.startTime);
            }

            const answerScores = this.answers
                .filter(a => a && a.feedback)
                .map(a => a.feedback.score || 0);

            const avgScore = answerScores.length > 0
                ? Math.round(answerScores.reduce((a, b) => a + b, 0) / answerScores.length)
                : 0;

            return {
                role: this.role,
                experience: this.experience,
                questions: this.questions,
                answers: this.answers.filter(a => a),
                overallScore: avgScore,
                totalDuration: this.totalDuration,
                completedAt: Date.now()
            };
        },

        reset() {
            this.state = 'idle';
            this.role = null;
            this.experience = null;
            this.questions = [];
            this.currentIndex = 0;
            this.answers = [];
            this.startTime = null;
            this.pausedAt = null;
            this.totalDuration = 0;
        }
    };

})();
