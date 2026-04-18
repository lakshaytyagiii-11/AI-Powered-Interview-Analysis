/* ============================================
   Role Matcher — Map responses to role expectations
   ============================================ */

class RoleMatcher {
    constructor() {
        this.roleTemplates = {
            'software-engineer': {
                title: 'Software Engineer',
                competencies: {
                    'Problem Solving': ['problem', 'solution', 'debug', 'fix', 'resolve', 'approach', 'algorithm', 'optimize', 'troubleshoot'],
                    'Technical Skills': ['code', 'programming', 'python', 'react', 'api', 'database', 'sql', 'testing', 'framework', 'architecture'],
                    'System Design': ['scalable', 'architecture', 'design', 'pattern', 'performance', 'distributed', 'caching'],
                    'Collaboration': ['team', 'code review', 'agile', 'scrum', 'collaboration', 'mentor', 'communicate'],
                    'Learning Agility': ['learn', 'new technology', 'self-taught', 'adapt', 'growth', 'curiosity'],
                },
            },
            'product-manager': {
                title: 'Product Manager',
                competencies: {
                    'Strategy': ['strategy', 'vision', 'roadmap', 'prioritize', 'market', 'competitive', 'goal'],
                    'User Focus': ['user', 'customer', 'feedback', 'research', 'persona', 'pain point', 'empathy'],
                    'Metrics': ['metric', 'kpi', 'data', 'conversion', 'retention', 'engagement', 'revenue', 'analytics'],
                    'Stakeholder Mgmt': ['stakeholder', 'executive', 'communicate', 'align', 'influence', 'cross-functional'],
                    'Execution': ['launch', 'ship', 'deliver', 'sprint', 'agile', 'backlog', 'timeline'],
                },
            },
            'data-analyst': {
                title: 'Data Analyst',
                competencies: {
                    'Analytical Thinking': ['analyze', 'insight', 'pattern', 'trend', 'hypothesis', 'statistical'],
                    'Technical Tools': ['sql', 'python', 'excel', 'tableau', 'power bi', 'dashboard', 'visualization'],
                    'Data Storytelling': ['story', 'present', 'communicate', 'visual', 'chart', 'report', 'recommendation'],
                    'Business Impact': ['business', 'impact', 'revenue', 'cost', 'efficiency', 'decision', 'roi'],
                    'Data Quality': ['clean', 'quality', 'accuracy', 'validation', 'pipeline', 'etl'],
                },
            },
            'marketing-manager': {
                title: 'Marketing Manager',
                competencies: {
                    'Strategy': ['strategy', 'brand', 'positioning', 'market', 'segment', 'campaign', 'awareness'],
                    'Digital Marketing': ['digital', 'social media', 'seo', 'content', 'email', 'paid', 'funnel'],
                    'ROI & Metrics': ['roi', 'conversion', 'analytics', 'performance', 'budget'],
                    'Creative Thinking': ['creative', 'innovative', 'campaign', 'storytelling', 'brand voice'],
                    'Leadership': ['team', 'lead', 'manage', 'agency', 'cross-functional', 'mentor'],
                },
            },
            'ux-designer': {
                title: 'UX Designer',
                competencies: {
                    'User Empathy': ['user', 'empathy', 'persona', 'research', 'pain point', 'accessibility'],
                    'Design Process': ['wireframe', 'prototype', 'iterate', 'usability', 'design thinking'],
                    'Visual Design': ['visual', 'typography', 'color', 'layout', 'design system', 'figma'],
                    'Collaboration': ['developer', 'product', 'stakeholder', 'feedback', 'workshop'],
                    'Data-Informed': ['data', 'metric', 'a/b test', 'analytics', 'heatmap'],
                },
            },
            'general': {
                title: 'General',
                competencies: {
                    'Communication': ['communicate', 'present', 'explain', 'clear', 'listen', 'concise'],
                    'Leadership': ['lead', 'team', 'initiative', 'motivate', 'delegate', 'mentor'],
                    'Problem Solving': ['problem', 'solution', 'resolve', 'analyze', 'critical thinking'],
                    'Adaptability': ['adapt', 'change', 'flexible', 'learn', 'challenge', 'growth'],
                    'Results Orientation': ['result', 'achieve', 'goal', 'deliver', 'impact', 'outcome'],
                },
            },
        };
    }

    analyze(segments, roleId) {
        const template = this.roleTemplates[roleId] || this.roleTemplates['general'];
        const allText = segments.map(s => s.answer).join(' ').toLowerCase();
        const competencyScores = {};
        const competencyDetails = {};
        let totalScore = 0;
        const competencyNames = Object.keys(template.competencies);

        for (const [competency, keywords] of Object.entries(template.competencies)) {
            let matchCount = 0;
            const matchedKeywords = [], missingKeywords = [];
            for (const kw of keywords) {
                const regex = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                if (allText.match(regex)) { matchCount++; matchedKeywords.push(kw); }
                else { missingKeywords.push(kw); }
            }
            const score = Math.round((matchCount / keywords.length) * 100);
            competencyScores[competency] = score;
            competencyDetails[competency] = { score, matchedKeywords, missingKeywords, total: keywords.length, matched: matchCount };
            totalScore += score;
        }

        const overallScore = Math.round(totalScore / competencyNames.length);
        const sorted = [...competencyNames].sort((a, b) => competencyScores[b] - competencyScores[a]);

        return {
            score: overallScore,
            roleTitle: template.title,
            competencyScores,
            competencyDetails,
            competencyNames,
            strongest: sorted[0],
            weakest: sorted[sorted.length - 1],
            issues: this._getIssues(competencyScores, competencyDetails, template.title),
        };
    }

    _getIssues(scores, details, roleTitle) {
        const issues = [];
        for (const [comp, score] of Object.entries(scores)) {
            if (score < 30) {
                issues.push({ type: 'high', text: `Low coverage in "${comp}" (${score}%) — critical for ${roleTitle}`, impact: 'high', missingKeywords: details[comp].missingKeywords.slice(0, 5) });
            } else if (score < 50) {
                issues.push({ type: 'medium', text: `Moderate coverage in "${comp}" (${score}%)`, impact: 'medium' });
            }
        }
        return issues;
    }
}

window.roleMatcher = new RoleMatcher();
