/* ============================================
   Question Bank — Role & Experience-based Questions
   ============================================ */

(function () {
    'use strict';

    const QUESTION_TEMPLATES = {
        'software-engineer': {
            junior: [
                'Tell me about a project you built that you\'re proud of.',
                'How do you approach debugging a complex issue?',
                'Describe your experience with version control systems.',
                'What data structures and algorithms are you most comfortable with?',
                'How do you write clean, maintainable code?',
                'Describe a time you had to learn a new technology quickly.',
                'What\'s your understanding of REST APIs and how would you design one?',
                'How do you ensure your code is well-tested?',
                'Describe your experience with object-oriented programming.',
                'How do you prioritize features when working on a project?',
                'What IDE or editor do you use and why?',
                'How do you handle merge conflicts in your team?',
                'Describe a time you made a mistake in code and how you fixed it.',
                'What\'s your preferred way to document code?',
                'How do you stay updated with new technologies?'
            ],
            mid: [
                'Describe your experience designing scalable systems.',
                'How do you handle database performance optimization?',
                'Tell me about a time you mentored a junior developer.',
                'What\'s your approach to code reviews?',
                'Describe a time you had to make a technical decision under constraints.',
                'How do you approach technical debt in a codebase?',
                'What\'s your experience with microservices architecture?',
                'How do you ensure security best practices in your code?',
                'Describe your experience with cloud platforms.',
                'How do you approach performance testing?',
                'Tell me about a system you designed from scratch.',
                'What\'s your experience with CI/CD pipelines?',
                'How do you handle disagreements with other engineers?',
                'Describe a time you improved a process or workflow.',
                'What\'s your approach to API design?'
            ],
            senior: [
                'Describe your experience leading a major technical initiative.',
                'How do you architect systems that need to scale globally?',
                'Tell me about a time you had to influence stakeholders on a technical decision.',
                'How do you approach system design for high-traffic applications?',
                'Describe your experience with distributed systems.',
                'How do you build and lead high-performing engineering teams?',
                'What\'s your approach to incident management and post-mortems?',
                'How do you balance technical debt with feature delivery?',
                'Describe a time you had to pivot technical strategy.',
                'How do you evaluate new technologies for adoption?',
                'What\'s your experience with cross-functional team leadership?',
                'How do you ensure architectural consistency across teams?',
                'Describe your approach to hiring and growing engineering talent.',
                'How do you measure engineering productivity?',
                'What\'s your philosophy on documentation and knowledge sharing?'
            ]
        },
        'product-manager': {
            junior: [
                'What draws you to product management?',
                'Describe a product you use frequently and what you would improve.',
                'How do you prioritize features on a product roadmap?',
                'What skills do you think are most important for a PM?',
                'Describe your experience working with designers and engineers.',
                'How do you gather and prioritize customer feedback?',
                'What\'s your experience with agile or scrum methodologies?',
                'How do you define success metrics for a product?',
                'Describe a time you had to make a trade-off decision.',
                'How do you keep up with market and competitor trends?',
                'What\'s your experience with product analytics tools?',
                'How do you handle scope changes mid-sprint?',
                'Describe your experience writing user stories or PRDs.',
                'What\'s your approach to stakeholder management?',
                'How do you ensure cross-team alignment on goals?'
            ],
            mid: [
                'Describe a product you launched and your role in it.',
                'How do you balance user needs with business goals?',
                'Tell me about a time you had to say no to a feature request.',
                'How do you approach competitive analysis for your product?',
                'Describe your experience with A/B testing and experimentation.',
                'How do you work with engineering on technical feasibility?',
                'What\'s your framework for product prioritization?',
                'Describe a time you had to pivot a product strategy.',
                'How do you ensure your product meets accessibility standards?',
                'Tell me about a failed product initiative and what you learned.',
                'How do you build and maintain a product roadmap?',
                'What\'s your approach to defining and tracking OKRs?',
                'How do you manage dependencies across multiple teams?',
                'Describe your experience with customer discovery and user research.',
                'How do you handle conflicting priorities from different stakeholders?'
            ],
            senior: [
                'Describe your experience defining a product vision and strategy.',
                'How do you think about platform vs. product decisions?',
                'Tell me about a time you turned around a struggling product.',
                'How do you build a product culture within an organization?',
                'Describe your experience managing a product portfolio.',
                'How do you approach market expansion for a product?',
                'Tell me about a time you had to make a major strategic bet.',
                'How do you balance short-term metrics with long-term vision?',
                'Describe your experience with M&A or integration from acquisitions.',
                'How do you develop and mentor junior PMs on your team?',
                'What\'s your framework for evaluating market opportunities?',
                'How do you ensure product-market fit for new initiatives?',
                'Describe your experience working with executive leadership.',
                'How do you think about moats and competitive advantage?',
                'What\'s your approach to innovation within an established product?'
            ]
        },
        'data-analyst': {
            junior: [
                'What statistical methods are you most comfortable with?',
                'Describe your experience with SQL and databases.',
                'How do you approach cleaning and preparing messy data?',
                'What visualization tools have you used?',
                'Describe a data project you\'re proud of.',
                'How do you ensure your analyses are accurate?',
                'What\'s your experience with Python or R?',
                'How do you communicate findings to non-technical audiences?',
                'Describe your experience with spreadsheet modeling.',
                'What\'s your approach to handling missing data?',
                'How do you determine which data sources to use?',
                'Describe a time you found an error in someone else\'s analysis.',
                'What\'s your experience with BI tools like Tableau or Power BI?',
                'How do you prioritize which analyses to work on?',
                'Describe your understanding of regression analysis.'
            ],
            mid: [
                'Describe your experience building dashboards for stakeholders.',
                'How do you approach designing experiments and A/B tests?',
                'Tell me about a time your analysis changed a business decision.',
                'What\'s your experience with machine learning models?',
                'How do you validate that your data is representative?',
                'Describe your experience with data pipeline development.',
                'How do you handle competing analyses with tight deadlines?',
                'What\'s your approach to documenting your work?',
                'Describe a time you had to advocate for data-driven change.',
                'How do you ensure consistency across multiple data sources?',
                'What\'s your experience with cloud data platforms?',
                'How do you approach building data governance practices?',
                'Describe your experience with ETL and data warehousing.',
                'How do you measure the impact of your analyses?',
                'What\'s your approach to root cause analysis?'
            ],
            senior: [
                'Describe your experience building an analytics organization.',
                'How do you think about data strategy and roadmapping?',
                'Tell me about a time you built a self-service analytics platform.',
                'What\'s your framework for evaluating analytics tools and vendors?',
                'How do you ensure analytics outputs drive action?',
                'Describe your experience with advanced statistical modeling.',
                'How do you build a data culture in an organization?',
                'What\'s your approach to defining data quality standards?',
                'Describe your experience with real-time analytics systems.',
                'How do you think about the difference between causation and correlation?',
                'Tell me about a time you had to influence executive decisions with data.',
                'How do you ensure analytics work is aligned with business strategy?',
                'What\'s your philosophy on self-service vs. centralized analytics?',
                'How do you develop and manage a team of analysts?',
                'Describe your experience with ML model deployment and monitoring.'
            ]
        },
        'marketing-manager': {
            junior: [
                'What marketing channels are you most familiar with?',
                'Describe your experience with social media marketing.',
                'How do you approach target audience segmentation?',
                'What\'s your experience with email marketing campaigns?',
                'Describe a campaign you helped execute.',
                'How do you measure the success of marketing activities?',
                'What\'s your understanding of conversion funnel metrics?',
                'How do you stay updated with digital marketing trends?',
                'Describe your experience with content marketing.',
                'What\'s your approach to managing marketing budgets?',
                'How do you collaborate with designers on creative assets?',
                'Describe your experience with SEO or SEM.',
                'What\'s your experience with marketing automation tools?',
                'How do you approach A/B testing in campaigns?',
                'Describe your understanding of brand positioning.'
            ],
            mid: [
                'Describe a campaign you led from concept to execution.',
                'How do you align marketing strategy with business goals?',
                'Tell me about a time a campaign underperformed and what you did.',
                'What\'s your experience with multi-channel marketing attribution?',
                'How do you approach building and managing a marketing budget?',
                'Describe your experience with influencer or partnership marketing.',
                'What\'s your framework for customer persona development?',
                'How do you ensure brand consistency across channels?',
                'Describe your experience with marketing analytics and tools.',
                'How do you balance short-term acquisition with long-term brand building?',
                'What\'s your approach to managing a marketing team?',
                'Describe your experience with product launches.',
                'How do you think about customer lifetime value in marketing?',
                'What\'s your experience with event or experiential marketing?',
                'How do you stay ahead of competitors in your marketing approach?'
            ],
            senior: [
                'Describe your experience building a marketing strategy from scratch.',
                'How do you think about market expansion and entering new segments?',
                'Tell me about a time you turned around a failing marketing initiative.',
                'What\'s your framework for brand development and positioning?',
                'How do you build and lead high-performing marketing organizations?',
                'Describe your experience with M&A and post-merger marketing integration.',
                'What\'s your approach to marketing technology stack selection?',
                'How do you balance data-driven marketing with creative excellence?',
                'Describe your experience managing large marketing budgets.',
                'How do you think about the customer journey across all touchpoints?',
                'What\'s your philosophy on content and thought leadership?',
                'How do you ensure marketing generates qualified pipeline?',
                'Describe your experience with international marketing.',
                'How do you develop the next generation of marketing leaders?',
                'What\'s your approach to innovation in marketing?'
            ]
        },
        'ux-designer': {
            junior: [
                'Walk me through your design process.',
                'What design tools are you most proficient in?',
                'Describe your experience conducting user research.',
                'How do you approachwireframing and prototyping?',
                'What\'s your understanding of UX principles and heuristics?',
                'Describe a project where you improved user experience.',
                'How do you incorporate feedback into your designs?',
                'What\'s your experience with usability testing?',
                'How do you balance user needs with business constraints?',
                'Describe your experience with design systems.',
                'What\'s your approach to information architecture?',
                'How do you document your design decisions?',
                'Describe your collaboration with developers.',
                'What\'s your experience with mobile-first design?',
                'How do you stay updated with UX trends?'
            ],
            mid: [
                'Describe a complex UX problem you solved.',
                'How do you approach research when you have limited time?',
                'Tell me about a time you advocated for the user.',
                'What\'s your experience with service design or journey mapping?',
                'How do you ensure accessibility in your designs?',
                'Describe your experience building and maintaining design systems.',
                'How do you handle competing priorities from stakeholders?',
                'What\'s your framework for usability evaluation?',
                'Describe a time your design failed and what you learned.',
                'How do you measure the impact of your designs?',
                'What\'s your approach to interaction design?',
                'How do you collaborate with product managers?',
                'Describe your experience with internationalization.',
                'What\'s your philosophy on design iteration?',
                'How do you handle multiple design projects simultaneously?'
            ],
            senior: [
                'Describe your experience establishing a UX design practice.',
                'How do you think about design strategy and vision?',
                'Tell me about a time you had to redesign a product significantly.',
                'What\'s your framework for design thinking and innovation?',
                'How do you build and lead a design team?',
                'Describe your experience with executive stakeholder management.',
                'What\'s your approach to design operations and scaling?',
                'How do you ensure design quality across multiple products?',
                'Describe your experience with research operations.',
                'How do you think about the relationship between UX and business metrics?',
                'What\'s your philosophy on design leadership?',
                'Describe your experience influencing organizational culture around design.',
                'How do you develop and mentor designers?',
                'What\'s your approach to design critique and feedback culture?',
                'How do you balance consistency with creative exploration?'
            ]
        },
        'general': {
            junior: [
                'Tell me about yourself and your background.',
                'What are your greatest strengths and weaknesses?',
                'Where do you see yourself in five years?',
                'Why are you interested in this position?',
                'Describe a time you had to work under pressure.',
                'How do you approach learning new skills?',
                'Describe your experience working in a team.',
                'What\'s your preferred work style and environment?',
                'How do you handle feedback and criticism?',
                'Describe a time you had a conflict with a coworker.',
                'What motivates you in your work?',
                'How do you prioritize when you have multiple deadlines?',
                'Describe a time you showed leadership.',
                'What\'s your approach to problem-solving?',
                'How do you stay organized and manage your time?'
            ],
            mid: [
                'Tell me about a major accomplishment in your career.',
                'How do you approach strategic planning?',
                'Describe your experience managing multiple priorities.',
                'What\'s your approach to building relationships with stakeholders?',
                'Tell me about a time you had to influence without authority.',
                'How do you handle ambiguity in your work?',
                'Describe your experience mentoring or developing others.',
                'What\'s your framework for making decisions?',
                'Tell me about a time you had to adapt to change.',
                'How do you measure success in your role?',
                'Describe your experience with cross-functional collaboration.',
                'What\'s your approach to driving results?',
                'How do you ensure continuous improvement?',
                'Describe a time you overcame a significant obstacle.',
                'What\'s your philosophy on work-life balance?'
            ],
            senior: [
                'Describe your leadership philosophy.',
                'How do you approach organizational transformation?',
                'Tell me about a time you shaped the direction of a company or team.',
                'What\'s your framework for developing talent?',
                'How do you build a culture of innovation and accountability?',
                'Describe your experience with organizational change management.',
                'What\'s your approach to setting vision and strategy?',
                'Tell me about a time you had to make a difficult decision with incomplete information.',
                'How do you ensure your organization remains adaptable?',
                'Describe your experience with crisis management.',
                'What\'s your philosophy on delegation and empowerment?',
                'How do you build trust and credibility with diverse stakeholders?',
                'Describe your experience influencing at the executive level.',
                'What\'s your approach to balancing short-term and long-term priorities?',
                'How do you think about your own continued growth and development?'
            ]
        }
    };

    function getShuffledQuestions(questions, count) {
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    window.questionBank = {
        getQuestions(role, experience, count) {
            const roleQuestions = QUESTION_TEMPLATES[role] || QUESTION_TEMPLATES['general'];
            const expQuestions = roleQuestions[experience] || roleQuestions['junior'];
            return getShuffledQuestions(expQuestions, count);
        },

        getAllRoles() {
            return Object.keys(QUESTION_TEMPLATES);
        }
    };

})();
