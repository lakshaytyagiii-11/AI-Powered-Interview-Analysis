/* ============================================
   App.js — Main Application Orchestrator
   ============================================ */

(function () {
    'use strict';

    // ---- State ----
    let selectedRole = null;
    let recognition = null;
    let isRecording = false;
    let recordTimer = null;
    let recordSeconds = 0;
    let recordedTranscript = '';
    let analysisReport = null;

    // ---- Mock Interview State ----
    let mockRole = null;
    let mockExperience = null;
    let mockQuestionCount = 10;
    let mockApiKey = '';
    let mockRecognition = null;
    let mockIsRecording = false;
    let mockIsPaused = false;
    let mockCurrentAnswer = '';
    let mockAnswerTimer = null;
    let mockAnswerSeconds = 0;
    let mockSettings = { readAloud: true, showTranscription: true, autoAdvance: false };
    let mockSessionReport = null;
    let mockLastFeedback = null;

    // ---- DOM References ----
    const $ = (id) => document.getElementById(id);
    const sections = {
        landing: $('landing-section'),
        setup: $('setup-section'),
        processing: $('processing-section'),
        dashboard: $('dashboard-section'),
        mockSetup: $('mock-setup-section'),
        mockInterview: $('mock-interview-section'),
        mockResults: $('mock-results-section'),
    };

    // ---- Navigation ----
    function goToStep(stepName) {
        Object.values(sections).forEach(s => s.classList.remove('active'));
        sections[stepName].classList.add('active');
        window.scrollTo(0, 0);
    }

    // ---- Landing ----
    $('get-started-btn').addEventListener('click', () => goToStep('setup'));
    $('mock-interview-btn').addEventListener('click', () => goToStep('mockSetup'));

    // ---- Setup: Back Button ----
    $('back-to-landing').addEventListener('click', () => goToStep('landing'));

    // ---- Setup: Role Selection ----
    const roleCards = document.querySelectorAll('#role-grid .role-card');
    roleCards.forEach(card => {
        card.addEventListener('click', () => {
            roleCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedRole = card.dataset.role;
        });
    });

    // ---- Setup: Tabs ----
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            $(tab.dataset.tab + '-tab').classList.add('active');
        });
    });

    // ---- Setup: Demo Transcript ----
    const demoTranscript = `Q: Tell me about yourself.
A: Um, well, I have been working as a software developer for about three years now. I, I started at a small startup where I basically did a bit of everything, you know, frontend, backend, some DevOps stuff. Then I moved to a mid-size company where I sort of focused more on React and Node.js development. I think I'm pretty good at, like, building user interfaces and I guess I enjoy problem solving.

Q: What is your greatest strength?
A: I would say my greatest strength is probably, um, my ability to learn new things quickly. Like, at my last job, there was this new framework that nobody on the team knew, and I kind of just picked it up in a couple of weeks and basically became the go-to person for it. I think I'm also, you know, pretty good at collaborating with others.

Q: Tell me about a time you faced a difficult challenge at work.
A: So, um, there was this one time where our main database went down during peak hours and it was sort of a crisis situation. I think I was the most senior developer on call that night. I had to, like, quickly diagnose the issue and I found that it was a memory leak in one of our background jobs. I guess I fixed it by optimizing the query and adding proper connection pooling. The result was, um, the system came back up in about an hour and we didn't lose any data.

Q: Why are you leaving your current job?
A: Honestly, I'm looking for more growth opportunities. I feel like I've kind of plateaued at my current role and I'm not really learning as much anymore. I want to work on more challenging projects, maybe in a team that's doing more innovative work. I think your company has some really interesting products.

Q: Where do you see yourself in five years?
A: Um, that's a good question. I guess I see myself maybe in a senior or lead developer role. I would like to, sort of, mentor junior developers and have more influence on architectural decisions. I'm not totally sure about management though, I think I prefer staying technical but, you know, we'll see.

Q: Do you have any questions for us?
A: Um, yeah, I guess I was wondering about the team structure? Like, how big is the team I would be working with? And, um, what does the typical development process look like?`;

    $('load-demo-btn').addEventListener('click', () => {
        $('transcript-input').value = demoTranscript;
    });

    // ---- Setup: Recording ----
    const recordBtn = $('record-btn');
    recordBtn.addEventListener('click', () => {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    });

    function startRecording() {
        recordedTranscript = '';
        recognition = window.transcriber.startRecording(
            (full, interim) => {
                recordedTranscript = full;
                $('live-transcript').textContent = full + (interim ? '... ' + interim : '');
            },
            (status, data) => {
                if (status === 'error') {
                    $('record-status').textContent = data;
                } else if (status === 'ended') {
                    stopRecording();
                }
            }
        );
        if (recognition) {
            isRecording = true;
            recordBtn.classList.add('recording');
            $('record-status').textContent = 'Recording... Click to stop';
            recordSeconds = 0;
            recordTimer = setInterval(() => {
                recordSeconds++;
                const min = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
                const sec = String(recordSeconds % 60).padStart(2, '0');
                $('record-timer').textContent = `${min}:${sec}`;
            }, 1000);
        }
    }

    function stopRecording() {
        if (recognition) { try { recognition.stop(); } catch (e) { /* ignore */ } }
        isRecording = false;
        recordBtn.classList.remove('recording');
        $('record-status').textContent = 'Recording stopped. Click Analyze to proceed.';
        clearInterval(recordTimer);
    }

    // ---- Analyze ----
    $('analyze-btn').addEventListener('click', () => {
        // Get transcript
        const activeTab = document.querySelector('.tab.active').dataset.tab;
        let transcript = '';
        if (activeTab === 'paste') {
            transcript = $('transcript-input').value.trim();
        } else if (activeTab === 'record') {
            transcript = recordedTranscript.trim();
        }

        if (!transcript) {
            alert('Please provide an interview transcript before analyzing.');
            return;
        }
        if (!selectedRole) {
            alert('Please select a target role.');
            return;
        }

        runAnalysis(transcript);
    });

    async function runAnalysis(transcript) {
        goToStep('processing');
        const steps = document.querySelectorAll('.proc-step');
        const progressFill = $('analysis-progress');
        const totalSteps = steps.length;

        // Parse transcript
        await animateStep(steps[0], progressFill, 0, totalSteps, 400);
        const segments = window.transcriber.parseTranscript(transcript);

        // Speech analysis
        await animateStep(steps[1], progressFill, 1, totalSteps, 500);
        const speechResult = window.speechAnalyzer.analyze(segments);

        // Structure analysis
        await animateStep(steps[2], progressFill, 2, totalSteps, 600);
        const structureResult = window.structureAnalyzer.analyze(segments);

        // Confidence analysis
        await animateStep(steps[3], progressFill, 3, totalSteps, 500);
        const confidenceResult = window.confidenceAnalyzer.analyze(segments);

        // Role matching
        await animateStep(steps[4], progressFill, 4, totalSteps, 500);
        const roleResult = window.roleMatcher.analyze(segments, selectedRole);

        // Generate report
        await animateStep(steps[5], progressFill, 5, totalSteps, 600);
        analysisReport = window.reportGenerator.generate(
            speechResult, structureResult, confidenceResult, roleResult, segments
        );

        // All done
        progressFill.style.width = '100%';
        await delay(500);

        goToStep('dashboard');
        // Wait for DOM layout to complete before rendering charts
        setTimeout(() => {
            renderDashboard(analysisReport);
        }, 150);
    }

    function animateStep(stepEl, progressFill, idx, total, ms) {
        return new Promise(resolve => {
            // Mark previous as done
            const steps = document.querySelectorAll('.proc-step');
            if (idx > 0) {
                steps[idx - 1].classList.remove('active');
                steps[idx - 1].classList.add('done');
            }
            stepEl.classList.add('active');
            progressFill.style.width = ((idx + 1) / total * 90) + '%';
            setTimeout(resolve, ms);
        });
    }

    function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ---- Dashboard Rendering ----
    function renderDashboard(report) {
        // Score gauge
        window.chartRenderer.drawGauge('score-gauge', report.overallScore);
        animateCounter($('score-number'), report.overallScore, 1500);

        // Verdict
        const verdictEl = $('score-verdict');
        verdictEl.textContent = report.verdict;
        verdictEl.style.color =
            report.verdictClass === 'success' ? '#10b981' :
            report.verdictClass === 'warning' ? '#f59e0b' : '#ef4444';

        // Stat cards
        setStatCard('stat-speech', report.speechResult.score);
        setStatCard('stat-structure', report.structureResult.score);
        setStatCard('stat-confidence', report.confidenceResult.score);
        setStatCard('stat-role', report.roleResult.score);

        // Charts
        renderCharts(report);

        // Feedback timeline
        renderFeedbackTimeline(report.questionFeedback);

        // Weakness ranking
        renderWeaknesses(report.weaknesses);

        // Improvement plan
        renderImprovementPlan(report.improvementPlan);

        // Mark processing steps as done
        document.querySelectorAll('.proc-step').forEach(s => {
            s.classList.remove('active');
            s.classList.add('done');
        });
    }

    function setStatCard(id, score) {
        const card = $(id);
        const valEl = card.querySelector('.stat-card-value');
        animateCounter(valEl, score, 1200);
        valEl.style.color =
            score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
    }

    function animateCounter(el, target, duration) {
        const start = performance.now();
        const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function renderCharts(report) {
        // Filler word chart
        const fillerLabels = Object.keys(report.speechResult.fillerCounts);
        const fillerValues = Object.values(report.speechResult.fillerCounts);
        if (fillerLabels.length > 0) {
            window.chartRenderer.drawBarChart('filler-chart', fillerLabels, fillerValues);
        }

        // Answer quality chart
        const qLabels = report.questionFeedback.map((_, i) => 'Q' + (i + 1));
        const qValues = report.questionFeedback.map(qf => qf.score);
        window.chartRenderer.drawBarChart('quality-chart', qLabels, qValues, {
            colors: qValues.map(v => v >= 70 ? '#10b981' : v >= 45 ? '#f59e0b' : '#ef4444')
        });

        // Confidence per response
        const confValues = report.confidenceResult.segmentResults.map(s => s.confidenceScore);
        window.chartRenderer.drawBarChart('confidence-chart', qLabels, confValues, {
            colors: confValues.map(v => v >= 70 ? '#10b981' : v >= 45 ? '#f59e0b' : '#ef4444')
        });

        // Competency radar
        const compNames = report.roleResult.competencyNames;
        const compValues = compNames.map(n => report.roleResult.competencyScores[n]);
        window.chartRenderer.drawRadarChart('competency-chart', compNames, compValues);
    }

    function renderFeedbackTimeline(feedbackItems) {
        const container = $('feedback-timeline');
        container.innerHTML = '';
        feedbackItems.forEach((item, i) => {
            const scoreClass = item.score >= 70 ? 'score-high' : item.score >= 45 ? 'score-medium' : 'score-low';
            const badgeColor = item.score >= 70 ? '#10b981' : item.score >= 45 ? '#f59e0b' : '#ef4444';
            const div = document.createElement('div');
            div.className = `feedback-item ${scoreClass}`;
            div.innerHTML = `
                <div class="feedback-score-badge" style="background:${badgeColor}22;color:${badgeColor}">Score: ${item.score}/100</div>
                <div class="feedback-question">Q${i + 1}: ${escapeHtml(item.question)}</div>
                <div class="feedback-answer">"${escapeHtml(item.answer)}"</div>
                <div class="feedback-issues">
                    ${item.issues.map(iss => `<span class="feedback-tag ${iss.type}">${escapeHtml(iss.text)}</span>`).join('')}
                </div>
                <div class="feedback-detail">${escapeHtml(item.feedback)}</div>
            `;
            container.appendChild(div);
        });
    }

    function renderWeaknesses(weaknesses) {
        const container = $('weakness-list');
        container.innerHTML = '';
        if (weaknesses.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted)">No major weaknesses detected. Great job!</p>';
            return;
        }
        weaknesses.forEach((w, i) => {
            const div = document.createElement('div');
            div.className = 'weakness-item';
            div.innerHTML = `
                <div class="weakness-rank">${i + 1}</div>
                <div class="weakness-content">
                    <div class="weakness-title">${escapeHtml(w.text)}</div>
                    <div class="weakness-desc">Category: ${escapeHtml(w.category)}</div>
                    <div class="weakness-impact impact-${w.impact}">${w.impact.toUpperCase()} IMPACT</div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    function renderImprovementPlan(plan) {
        const container = $('improvement-plan');
        container.innerHTML = '';
        plan.forEach(item => {
            const div = document.createElement('div');
            div.className = 'improvement-item';
            div.innerHTML = `
                <div class="improvement-title">${escapeHtml(item.title)}</div>
                <div class="improvement-desc">${escapeHtml(item.description)}</div>
                <div class="improvement-exercise"><strong>Practice Exercise:</strong> ${escapeHtml(item.exercise)}</div>
            `;
            container.appendChild(div);
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ---- Download Report ----
    $('download-report-btn').addEventListener('click', () => {
        if (!analysisReport) return;
        const text = window.reportGenerator.generateTextReport(analysisReport);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'InterviewIQ_Report.txt';
        a.click();
        URL.revokeObjectURL(url);
    });

    // ---- New Analysis ----
    $('new-analysis-btn').addEventListener('click', () => {
        // Reset processing steps
        document.querySelectorAll('.proc-step').forEach(s => {
            s.classList.remove('active', 'done');
        });
        $('analysis-progress').style.width = '0%';
        goToStep('setup');
    });

    // ============================================
    // MOCK INTERVIEW — SETUP
    // ============================================

    // Mock Role Selection
    const mockRoleCards = document.querySelectorAll('#mock-role-grid .role-card');
    mockRoleCards.forEach(card => {
        card.addEventListener('click', () => {
            mockRoleCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            mockRole = card.dataset.role;
            $('mock-role-error').classList.remove('visible');
        });
    });

    // Experience Selection
    const expCards = document.querySelectorAll('.experience-card');
    expCards.forEach(card => {
        card.addEventListener('click', () => {
            expCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            mockExperience = card.dataset.exp;
            $('mock-exp-error').classList.remove('visible');
        });
    });

    // Question Count Slider
    $('mock-count-slider').addEventListener('input', (e) => {
        mockQuestionCount = parseInt(e.target.value);
        $('mock-count-display').textContent = mockQuestionCount;
    });

    // API Key Input
    $('mock-api-key').addEventListener('input', (e) => {
        mockApiKey = e.target.value.trim();
    });

    // Settings Checkboxes
    $('mock-read-aloud').addEventListener('change', (e) => {
        mockSettings.readAloud = e.target.checked;
    });
    $('mock-show-transcript').addEventListener('change', (e) => {
        mockSettings.showTranscription = e.target.checked;
    });
    $('mock-auto-advance').addEventListener('change', (e) => {
        mockSettings.autoAdvance = e.target.checked;
    });

    // Back Button
    $('mock-back-btn').addEventListener('click', () => {
        resetMockSession();
        goToStep('landing');
    });

    // Start Mock Interview Button
    $('start-mock-btn').addEventListener('click', async () => {
        let valid = true;
        if (!mockRole) {
            $('mock-role-error').classList.add('visible');
            valid = false;
        }
        if (!mockExperience) {
            $('mock-exp-error').classList.add('visible');
            valid = false;
        }
        if (!valid) return;

        const btn = $('start-mock-btn');
        btn.textContent = 'Generating questions...';
        btn.disabled = true;

        try {
            const questions = await window.mockInterviewer.generateQuestions(
                mockRole, mockExperience, mockQuestionCount, mockApiKey
            );

            window.sessionManager.startSession(mockRole, mockExperience, questions);
            goToStep('mockInterview');
            startMockQuestion();
        } catch (err) {
            console.error('Failed to start mock interview:', err);
            alert('Failed to generate questions. Please try again.');
        } finally {
            btn.textContent = 'Begin Mock Interview';
            btn.disabled = false;
        }
    });

    // ============================================
    // MOCK INTERVIEW — CORE FLOW
    // ============================================

    function startMockQuestion() {
        const q = window.sessionManager.getCurrentQuestion();
        if (!q) { finishMockSession(); return; }

        const progress = window.sessionManager.getProgress();
        $('mock-progress-text').textContent = `Question ${progress.current} of ${progress.total}`;
        $('mock-progress-fill').style.width = `${progress.percent}%`;
        $('mock-question-text').textContent = q;
        $('mock-q-num').textContent = progress.current;

        $('mock-live-answer').textContent = '';
        $('mock-word-count').textContent = '0 words';
        $('mock-word-count').className = 'mock-word-count words-low';

        $('mock-feedback-card').classList.remove('visible');
        $('mock-submit-btn').disabled = true;
        $('mock-next-btn').style.display = 'none';

        // Only reset answer state when starting a fresh question, not on resume
        if (!window.sessionManager.getCurrentAnswer()) {
            mockCurrentAnswer = '';
        }
        mockAnswerSeconds = 0;
        setMockOrb('orb-speaking');

        if (mockSettings.readAloud && window.ttsEngine.isSupported()) {
            window.ttsEngine.speak(q, () => {
                setMockOrb('orb-listening');
                startMockListening();
            });
        } else if (!window.ttsEngine.isSupported()) {
            showMockBanner('Text-to-speech not supported. Questions display as text only.');
            setMockOrb('orb-listening');
            startMockListening();
        } else {
            setMockOrb('orb-listening');
            startMockListening();
        }
    }

    function startMockListening(resumeTranscript) {
        if (!mockSettings.showTranscription) {
            $('mock-live-answer').textContent = '(Transcription disabled)';
        }

        mockIsRecording = true;
        $('mock-mic-btn').classList.add('mock-recording');

        mockAnswerTimer = setInterval(() => {
            mockAnswerSeconds++;
            const min = String(Math.floor(mockAnswerSeconds / 60)).padStart(2, '0');
            const sec = String(mockAnswerSeconds % 60).padStart(2, '0');
        }, 1000);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showMockBanner('Speech recognition not available. Please type your answer below.');
            enableMockTextFallback();
            return;
        }

        // If resuming from pause, keep existing transcript
        if (resumeTranscript) {
            mockCurrentAnswer = resumeTranscript;
            $('mock-live-answer').textContent = mockCurrentAnswer;
            const words = mockCurrentAnswer.trim().split(/\s+/);
            const count = words.length;
            $('mock-word-count').textContent = `${count} words`;
            $('mock-word-count').className = 'mock-word-count ' + (count < 10 ? 'words-low' : count < 30 ? 'words-mid' : 'words-high');
            $('mock-submit-btn').disabled = count < 10;
        } else {
            mockCurrentAnswer = '';
        }

        mockRecognition = new SpeechRecognition();
        mockRecognition.lang = 'en-US';
        mockRecognition.continuous = true;
        mockRecognition.interimResults = true;

        mockRecognition.onresult = (event) => {
            let fullTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            mockCurrentAnswer = fullTranscript;

            if (mockSettings.showTranscription) {
                $('mock-live-answer').textContent = mockCurrentAnswer;
            }

            const words = mockCurrentAnswer.trim().split(/\s+/);
            const count = words.length;
            $('mock-word-count').textContent = `${count} words`;
            $('mock-word-count').className = 'mock-word-count ' + (count < 10 ? 'words-low' : count < 30 ? 'words-mid' : 'words-high');

            $('mock-submit-btn').disabled = count < 10;
        };

        mockRecognition.onerror = (event) => {
            if (event.error !== 'no-speech') {
                console.warn('Speech recognition error:', event.error);
            }
        };

        mockRecognition.onend = () => {
            if (mockIsRecording) {
                // Restart if still recording
                try { mockRecognition.start(); } catch (e) {}
            }
        };

        try {
            mockRecognition.start();
        } catch (e) {
            console.warn('Recognition start error:', e);
        }
    }

    function stopMockListening() {
        if (mockRecognition) {
            try { mockRecognition.stop(); } catch (e) {}
            mockRecognition = null;
        }
        mockIsRecording = false;
        clearInterval(mockAnswerTimer);
        $('mock-mic-btn').classList.remove('mock-recording');
    }

    function enableMockTextFallback() {
        stopMockListening();
        mockIsRecording = false;
        $('mock-mic-btn').style.display = 'none';
        $('mock-submit-btn').disabled = true;

        const inputArea = document.createElement('textarea');
        inputArea.id = 'mock-text-answer';
        inputArea.className = 'textarea-main';
        inputArea.rows = 4;
        inputArea.placeholder = 'Type your answer here...';

        const wcInterval = setInterval(() => {
            const words = inputArea.value.trim().split(/\s+/);
            const count = words.length;
            $('mock-word-count').textContent = `${count} words`;
            $('mock-word-count').className = 'mock-word-count ' + (count < 10 ? 'words-low' : count < 30 ? 'words-mid' : 'words-high');
            $('mock-submit-btn').disabled = count < 10;
        }, 200);

        inputArea.addEventListener('input', () => {
            mockCurrentAnswer = inputArea.value;
        });

        const existingMain = document.querySelector('.mock-interview-main');
        if (existingMain) {
            existingMain.appendChild(inputArea);
        }
    }

    function showMockBanner(message) {
        const existing = document.getElementById('mock-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'mock-banner';
        banner.style.cssText = 'margin:8px auto;max-width:700px;padding:10px 16px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:var(--radius-md);color:var(--warning);font-size:0.85rem;text-align:center;';
        banner.textContent = message;
        const container = document.querySelector('.mock-interview-container');
        if (container) container.prepend(banner);
    }

    function setMockOrb(state) {
        const orb = $('interviewer-orb');
        orb.className = 'interviewer-orb ' + state;
    }

    async function submitMockAnswer() {
        stopMockListening();
        setMockOrb('orb-processing');

        $('mock-feedback-card').innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Analyzing your response...</div>';
        $('mock-feedback-card').classList.add('visible');

        const q = window.sessionManager.getCurrentQuestion();
        const feedback = await window.mockInterviewer.getAIFeedback(q, mockCurrentAnswer, mockRole, mockApiKey);
        mockLastFeedback = feedback;

        const scoreColor = feedback.score >= 70 ? 'var(--success)' : feedback.score >= 45 ? 'var(--warning)' : 'var(--danger)';
        const verdictColor = feedback.score >= 80 ? 'var(--success)' : feedback.score >= 65 ? 'var(--warning)' : 'var(--danger)';

        $('mock-feedback-card').innerHTML = `
            <div class="feedback-header">
                <div class="feedback-score-badge" style="background:${scoreColor}22;color:${scoreColor}">Score: ${feedback.score}/100</div>
                <div class="verdict-label" style="color:${verdictColor}">${feedback.verdict}</div>
            </div>
            <div class="feedback-strengths">
                <div class="fb-section-title">✓ Strengths</div>
                <ul>${(feedback.strengths || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
            </div>
            <div class="feedback-improvements">
                <div class="fb-section-title">→ Areas to Improve</div>
                <ul>${(feedback.improvements || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
            </div>
            <div class="feedback-one-liner">"${escapeHtml(feedback.oneLiner || '')}"</div>
        `;

        window.sessionManager.recordAnswer(mockCurrentAnswer, feedback);

        $('mock-next-btn').style.display = 'inline-flex';

        if (mockSettings.autoAdvance && !window.sessionManager.isComplete()) {
            setTimeout(advanceMockQuestion, 3000);
        }
    }

    function advanceMockQuestion() {
        if (window.sessionManager.isComplete()) {
            finishMockSession();
        } else {
            window.sessionManager.advanceQuestion();
            startMockQuestion();
        }
    }

    function finishMockSession() {
        stopMockListening();
        window.ttsEngine.stop();
        const sessionData = window.sessionManager.endSession();
        mockSessionReport = window.mockReport.generate(sessionData);
        renderMockResults(mockSessionReport, sessionData);
        goToStep('mockResults');
    }

    function renderMockResults(report, sessionData) {
        window.chartRenderer.drawGauge('mock-score-gauge', report.overallScore);
        animateCounter($('mock-score-number'), report.overallScore, 1500);

        const verdictEl = $('mock-score-verdict');
        verdictEl.textContent = report.verdict;
        verdictEl.style.color = report.overallScore >= 70 ? 'var(--success)' : report.overallScore >= 45 ? 'var(--warning)' : 'var(--danger)';

        // Stats
        $('mock-stat-questions').textContent = report.questionCount;
        $('mock-stat-duration').textContent = report.durationMin + 'm';
        $('mock-stat-words').textContent = report.avgWords;
        $('mock-stat-answers').textContent = report.answeredCount;

        // Dimension cards
        function setDimensionCard(id, barId, score) {
            const color = score >= 70 ? 'var(--success)' : score >= 45 ? 'var(--warning)' : 'var(--danger)';
            $(id).textContent = score;
            $(id).style.color = color;
            $(barId).style.width = score + '%';
            $(barId).style.background = `linear-gradient(90deg, ${color}, ${score >= 70 ? 'var(--accent-blue)' : 'var(--accent-violet)'})`;
        }
        setDimensionCard('mock-dim-speech', 'mock-dim-speech-bar', report.avgSpeech);
        setDimensionCard('mock-dim-structure', 'mock-dim-structure-bar', report.avgStructure);
        setDimensionCard('mock-dim-confidence', 'mock-dim-confidence-bar', report.avgConfidence);

        // Score per question bar chart
        const qLabels = report.answerBreakdown.map((_, i) => 'Q' + (i + 1));
        const qScores = report.answerBreakdown.map(a => a.score);
        window.chartRenderer.drawBarChart('mock-score-chart', qLabels, qScores, {
            colors: qScores.map(v => v >= 70 ? 'var(--success)' : v >= 45 ? 'var(--warning)' : 'var(--danger)')
        });

        // Dimension per question chart (grouped bar)
        const speechVals = report.answerBreakdown.map(a => a.speechScore);
        const structVals = report.answerBreakdown.map(a => a.structureScore);
        const confVals = report.answerBreakdown.map(a => a.confidenceScore);
        window.chartRenderer.drawHorizontalBarChart('mock-dimension-chart',
            ['Speech', 'Structure', 'Confidence'],
            [report.avgSpeech, report.avgStructure, report.avgConfidence]
        );

        // Quick insights bar above accordion
        const weaknessContainer = $('mock-weakness-list');
        weaknessContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:8px;">Quick highlights across all answers:</p>';
        report.weaknesses.slice(0, 3).forEach((w, i) => {
            const div = document.createElement('div');
            div.className = 'weakness-item';
            div.innerHTML = `
                <div class="weakness-rank">${i + 1}</div>
                <div class="weakness-content">
                    <div class="weakness-title">${escapeHtml(w.text)}</div>
                    <div class="weakness-desc">Affects Qs: ${w.questionsAffected.join(', ')}</div>
                    <div class="weakness-impact impact-${w.impact}">${w.impact.toUpperCase()} IMPACT</div>
                </div>
            `;
            weaknessContainer.appendChild(div);
        });

        // Question accordion with detailed review
        const accordion = $('mock-question-accordion');
        accordion.innerHTML = '';
        report.answerBreakdown.forEach((a, i) => {
            const details = document.createElement('details');
            const scoreColor = a.score >= 70 ? 'var(--success)' : a.score >= 45 ? 'var(--warning)' : 'var(--danger)';
            details.innerHTML = `
                <summary>
                    <span style="display:flex;flex-direction:column;gap:2px;">
                        <span>Question ${i + 1}</span>
                        <span style="font-size:0.75rem;color:var(--text-muted);font-weight:400;">${escapeHtml(a.question.substring(0, 55))}${a.question.length > 55 ? '...' : ''}</span>
                    </span>
                    <span style="display:flex;align-items:center;gap:12px;">
                        <span class="qa-score" style="color:${scoreColor};font-weight:700;">${a.score}/100</span>
                        <span style="font-size:0.8rem;color:${scoreColor};">${a.verdict}</span>
                    </span>
                </summary>
                <div class="qa-content">
                    <div class="qa-mini-scores">
                        <div class="qa-mini-score">🗣️ Speech: <span style="color:${a.speechScore >= 70 ? 'var(--success)' : a.speechScore >= 45 ? 'var(--warning)' : 'var(--danger)'}">${a.speechScore}</span></div>
                        <div class="qa-mini-score">📋 Structure: <span style="color:${a.structureScore >= 70 ? 'var(--success)' : a.structureScore >= 45 ? 'var(--warning)' : 'var(--danger)'}">${a.structureScore}</span></div>
                        <div class="qa-mini-score">💪 Confidence: <span style="color:${a.confidenceScore >= 70 ? 'var(--success)' : a.confidenceScore >= 45 ? 'var(--warning)' : 'var(--danger)'}">${a.confidenceScore}</span></div>
                        <div class="qa-mini-score">📖 Words: <span>${a.wordCount}</span></div>
                    </div>
                    <div class="qa-question"><strong>Question:</strong> ${escapeHtml(a.question)}</div>
                    <div class="qa-answer"><strong>Your Answer:</strong> ${a.answer ? escapeHtml(a.answer) : '<em>No answer recorded</em>'}</div>
                    ${a.insights && a.insights.length > 0 ? `<div style="margin-bottom:10px;">${a.insights.map(ins => `<span class="qa-insight ${ins.type}">${escapeHtml(ins.text)}</span>`).join('')}</div>` : ''}
                    ${a.strengths && a.strengths.length > 0 ? `<div class="qa-tags">${a.strengths.map(s => `<span class="qa-tag good">${escapeHtml(s.substring(0, 40))}</span>`).join('')}</div>` : ''}
                    ${a.improvements && a.improvements.length > 0 ? `<div class="qa-tags" style="margin-top:6px;">${a.improvements.map(s => `<span class="qa-tag improve">${escapeHtml(s.substring(0, 40))}</span>`).join('')}</div>` : ''}
                    ${a.oneLiner ? `<div class="qa-one-liner" style="margin-top:10px;font-size:0.85rem;color:var(--text-secondary);font-style:italic;">"${escapeHtml(a.oneLiner)}"</div>` : ''}
                </div>
            `;
            accordion.appendChild(details);
        });

        // Weakness detail list
        const weaknessDetail = $('mock-weakness-detail');
        weaknessDetail.innerHTML = '';
        if (report.weaknesses.length === 0) {
            weaknessDetail.innerHTML = '<p style="color:var(--success)">No major weaknesses detected. Great performance!</p>';
        } else {
            report.weaknesses.forEach((w, i) => {
                const div = document.createElement('div');
                div.className = 'weakness-item';
                div.innerHTML = `
                    <div class="weakness-rank">${i + 1}</div>
                    <div class="weakness-content">
                        <div class="weakness-title">${escapeHtml(w.text)}</div>
                        <div class="weakness-desc">Category: ${escapeHtml(w.category)} · Affects Qs: ${w.questionsAffected.join(', ')}</div>
                        <div class="weakness-impact impact-${w.impact}">${w.impact.toUpperCase()} IMPACT</div>
                    </div>
                `;
                weaknessDetail.appendChild(div);
            });
        }

        // Improvement plan
        const impContainer = $('mock-improvement-plan');
        impContainer.innerHTML = '';
        (report.improvements || []).forEach(item => {
            const div = document.createElement('div');
            div.className = 'improvement-item';
            div.innerHTML = `
                <div class="improvement-title">${escapeHtml(item.title)}</div>
                <div class="improvement-desc">${escapeHtml(item.description)}</div>
                <div class="improvement-exercise"><strong>Practice Exercise:</strong> ${escapeHtml(item.exercise)}</div>
            `;
            impContainer.appendChild(div);
        });
    }
                <div class="improvement-desc">${escapeHtml(item.description)}</div>
                <div class="improvement-exercise"><strong>Practice Exercise:</strong> ${escapeHtml(item.exercise)}</div>
            `;
            impContainer.appendChild(div);
        });
    }

    function resetMockSession() {
        window.sessionManager.reset();
        stopMockListening();
        window.ttsEngine.stop();
        mockRole = null;
        mockExperience = null;
        mockCurrentAnswer = '';
        mockAnswerSeconds = 0;
        mockLastFeedback = null;
        mockIsPaused = false;

        document.querySelectorAll('#mock-role-grid .role-card').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.experience-card').forEach(c => c.classList.remove('selected'));
        $('mock-role-error').classList.remove('visible');
        $('mock-exp-error').classList.remove('visible');
        $('mock-feedback-card').classList.remove('visible');
        $('mock-feedback-card').innerHTML = '';
        $('mock-next-btn').style.display = 'none';
        $('mock-mic-btn').classList.remove('mock-recording');
        $('mock-mic-btn').style.display = '';

        const textInput = document.getElementById('mock-text-answer');
        if (textInput) textInput.remove();

        const banner = document.getElementById('mock-banner');
        if (banner) banner.remove();
    }

    // ============================================
    // MOCK INTERVIEW — BUTTON WIRING
    // ============================================

    $('mock-mic-btn').addEventListener('click', () => {
        if (mockIsRecording) {
            stopMockListening();
        } else {
            startMockListening();
        }
    });

    $('mock-submit-btn').addEventListener('click', submitMockAnswer);
    $('mock-next-btn').addEventListener('click', advanceMockQuestion);
    $('mock-replay-btn').addEventListener('click', () => {
        window.ttsEngine.speak(window.sessionManager.getCurrentQuestion());
    });

    $('mock-pause-btn').addEventListener('click', () => {
        if (window.sessionManager.state === 'paused') {
            window.sessionManager.resumeSession();
            mockIsPaused = false;
            startMockListening(mockCurrentAnswer);
            $('mock-pause-btn').textContent = '⏸ Pause';
        } else {
            stopMockListening();
            window.ttsEngine.stop();
            window.sessionManager.pauseSession();
            mockIsPaused = true;
            $('mock-pause-btn').textContent = '▶ Resume';
        }
    });

    $('mock-end-btn').addEventListener('click', () => {
        if (confirm('End the session now? Answers so far will be scored.')) {
            stopMockListening();
            window.ttsEngine.stop();
            finishMockSession();
        }
    });

    $('mock-download-btn').addEventListener('click', () => {
        if (!mockSessionReport) return;
        const text = window.mockReport.generateDownloadText(mockSessionReport);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'InterviewIQ_MockReport.txt';
        a.click();
        URL.revokeObjectURL(url);
    });

    $('transcript-analyze-btn').addEventListener('click', () => {
        const sessionData = window.sessionManager.state === 'complete'
            ? window.sessionManager : null;

        if (!sessionData) {
            goToStep('setup');
            return;
        }

        const answers = (sessionData.answers || []).map((a, i) => {
            return `Q: ${a.question}\nA: ${a.answer}`;
        }).join('\n\n');

        $('transcript-input').value = answers;

        document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
        const targetCard = document.querySelector(`.role-card[data-role="${sessionData.role}"]`);
        if (targetCard) {
            targetCard.classList.add('selected');
            selectedRole = sessionData.role;
        }

        goToStep('setup');
    });

    $('mock-new-btn').addEventListener('click', () => {
        resetMockSession();
        goToStep('mockSetup');
    });

})();
