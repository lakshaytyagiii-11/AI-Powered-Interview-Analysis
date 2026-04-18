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

    // ---- DOM References ----
    const $ = (id) => document.getElementById(id);
    const sections = {
        landing: $('landing-section'),
        setup: $('setup-section'),
        processing: $('processing-section'),
        dashboard: $('dashboard-section'),
    };

    // ---- Navigation ----
    function goToStep(stepName) {
        Object.values(sections).forEach(s => s.classList.remove('active'));
        sections[stepName].classList.add('active');
        window.scrollTo(0, 0);
    }

    // ---- Landing ----
    $('get-started-btn').addEventListener('click', () => goToStep('setup'));

    // ---- Setup: Back Button ----
    $('back-to-landing').addEventListener('click', () => goToStep('landing'));

    // ---- Setup: Role Selection ----
    const roleCards = document.querySelectorAll('.role-card');
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

})();
