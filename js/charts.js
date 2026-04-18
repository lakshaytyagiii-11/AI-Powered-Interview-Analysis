/* ============================================
   Charts Module — Canvas-based chart rendering
   ============================================ */

class ChartRenderer {
    constructor() {
        this.colors = {
            blue: '#3b82f6',
            violet: '#8b5cf6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            pink: '#ec4899',
            cyan: '#06b6d4',
            text: '#8892b0',
            textLight: '#f0f4ff',
            muted: '#5a6380',
            gridLine: 'rgba(255,255,255,0.05)',
            surface: '#1a2340',
        };
        this.palette = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#ef4444','#f97316'];
    }

    /* --- Score Gauge --- */
    drawGauge(canvasId, score, maxScore = 100) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2 + 10;
        const r = Math.min(w, h) / 2 - 20;

        ctx.clearRect(0, 0, w, h);

        // Background arc
        const startAngle = 0.75 * Math.PI;
        const endAngle = 2.25 * Math.PI;
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.strokeStyle = this.colors.surface;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Score arc
        const pct = Math.min(score / maxScore, 1);
        const scoreAngle = startAngle + pct * (endAngle - startAngle);
        const grad = ctx.createLinearGradient(0, 0, w, h);
        if (score >= 70) { grad.addColorStop(0, this.colors.success); grad.addColorStop(1, this.colors.cyan); }
        else if (score >= 40) { grad.addColorStop(0, this.colors.warning); grad.addColorStop(1, '#f97316'); }
        else { grad.addColorStop(0, this.colors.danger); grad.addColorStop(1, this.colors.pink); }

        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, scoreAngle);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    /* --- Bar Chart --- */
    drawBarChart(canvasId, labels, values, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const parent = canvas.parentElement;
        const displayW = canvas.clientWidth || (parent ? parent.clientWidth - 48 : 0) || parseInt(canvas.getAttribute('width')) || 500;
        const displayH = 280;
        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
        canvas.style.width = displayW + 'px';
        canvas.style.height = displayH + 'px';
        ctx.scale(dpr, dpr);

        const pad = { top: 20, right: 20, bottom: 50, left: 45 };
        const chartW = displayW - pad.left - pad.right;
        const chartH = displayH - pad.top - pad.bottom;
        const maxVal = Math.max(...values, 1) * 1.15;
        const barW = Math.min(chartW / labels.length * 0.6, 50);
        const gap = chartW / labels.length;

        ctx.clearRect(0, 0, displayW, displayH);

        // Grid lines
        const gridLines = 5;
        ctx.strokeStyle = this.colors.gridLine;
        ctx.lineWidth = 1;
        ctx.font = `11px Inter, sans-serif`;
        ctx.fillStyle = this.colors.muted;
        ctx.textAlign = 'right';
        for (let i = 0; i <= gridLines; i++) {
            const y = pad.top + (chartH / gridLines) * i;
            const val = Math.round(maxVal - (maxVal / gridLines) * i);
            ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(displayW - pad.right, y); ctx.stroke();
            ctx.fillText(val, pad.left - 8, y + 4);
        }

        // Bars
        ctx.textAlign = 'center';
        labels.forEach((label, i) => {
            const x = pad.left + gap * i + gap / 2 - barW / 2;
            const h = (values[i] / maxVal) * chartH;
            const y = pad.top + chartH - h;
            const color = options.colors ? options.colors[i % options.colors.length] : this.palette[i % this.palette.length];

            // Bar with rounded top
            const radius = Math.min(6, barW / 2);
            ctx.beginPath();
            ctx.moveTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.lineTo(x + barW - radius, y);
            ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
            ctx.lineTo(x + barW, pad.top + chartH);
            ctx.lineTo(x, pad.top + chartH);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            // Value on top
            ctx.fillStyle = this.colors.textLight;
            ctx.font = `bold 11px Inter, sans-serif`;
            ctx.fillText(values[i], x + barW / 2, y - 6);

            // Label
            ctx.fillStyle = this.colors.muted;
            ctx.font = `11px Inter, sans-serif`;
            const maxLabelW = gap - 4;
            const truncLabel = label.length > 12 ? label.slice(0, 11) + '…' : label;
            ctx.fillText(truncLabel, x + barW / 2, pad.top + chartH + 18);
        });
    }

    /* --- Horizontal Bar Chart --- */
    drawHorizontalBarChart(canvasId, labels, values, maxVal = 100) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const displayW = canvas.clientWidth || canvas.getAttribute('width') || 500;
        const displayH = Math.max(labels.length * 44 + 40, 200);
        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
        canvas.style.width = displayW + 'px';
        canvas.style.height = displayH + 'px';
        ctx.scale(dpr, dpr);

        const pad = { top: 10, right: 50, bottom: 10, left: 130 };
        const chartW = displayW - pad.left - pad.right;
        const barH = 22;
        const gap = (displayH - pad.top - pad.bottom) / labels.length;

        ctx.clearRect(0, 0, displayW, displayH);

        labels.forEach((label, i) => {
            const y = pad.top + gap * i + gap / 2 - barH / 2;
            const w = (values[i] / maxVal) * chartW;
            const color = this.palette[i % this.palette.length];

            // Background bar
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.roundRect(pad.left, y, chartW, barH, 4);
            ctx.fill();

            // Value bar
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(pad.left, y, Math.max(w, 4), barH, 4);
            ctx.fill();

            // Label
            ctx.fillStyle = this.colors.text;
            ctx.font = `12px Inter, sans-serif`;
            ctx.textAlign = 'right';
            ctx.fillText(label, pad.left - 10, y + barH / 2 + 4);

            // Value
            ctx.fillStyle = this.colors.textLight;
            ctx.font = `bold 12px Inter, sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(Math.round(values[i]) + '%', pad.left + w + 8, y + barH / 2 + 4);
        });
    }

    /* --- Radar Chart --- */
    drawRadarChart(canvasId, labels, values, maxVal = 100) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const parent = canvas.parentElement;
        const displayW = canvas.clientWidth || (parent ? parent.clientWidth - 48 : 0) || parseInt(canvas.getAttribute('width')) || 500;
        const displayH = 300;
        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
        canvas.style.width = displayW + 'px';
        canvas.style.height = displayH + 'px';
        ctx.scale(dpr, dpr);

        const cx = displayW / 2, cy = displayH / 2;
        const r = Math.min(cx, cy) - 50;
        const n = labels.length;
        const angleStep = (2 * Math.PI) / n;
        const startOffset = -Math.PI / 2;

        ctx.clearRect(0, 0, displayW, displayH);

        // Grid rings
        for (let ring = 1; ring <= 4; ring++) {
            const rr = (r / 4) * ring;
            ctx.beginPath();
            for (let i = 0; i <= n; i++) {
                const angle = startOffset + angleStep * i;
                const px = cx + rr * Math.cos(angle);
                const py = cy + rr * Math.sin(angle);
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.strokeStyle = this.colors.gridLine;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Axes
        for (let i = 0; i < n; i++) {
            const angle = startOffset + angleStep * i;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
            ctx.strokeStyle = this.colors.gridLine;
            ctx.stroke();
        }

        // Data polygon
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
            const idx = i % n;
            const angle = startOffset + angleStep * idx;
            const val = (values[idx] / maxVal) * r;
            const px = cx + val * Math.cos(angle);
            const py = cy + val * Math.sin(angle);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.fill();
        ctx.strokeStyle = this.colors.blue;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Data points
        for (let i = 0; i < n; i++) {
            const angle = startOffset + angleStep * i;
            const val = (values[i] / maxVal) * r;
            const px = cx + val * Math.cos(angle);
            const py = cy + val * Math.sin(angle);
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, 2 * Math.PI);
            ctx.fillStyle = this.colors.blue;
            ctx.fill();
        }

        // Labels
        ctx.font = `12px Inter, sans-serif`;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'center';
        for (let i = 0; i < n; i++) {
            const angle = startOffset + angleStep * i;
            const labelR = r + 24;
            let px = cx + labelR * Math.cos(angle);
            let py = cy + labelR * Math.sin(angle);
            if (angle > 0 && angle < Math.PI) py += 6;
            else if (angle < 0) py -= 2;
            ctx.fillText(labels[i], px, py);
        }
    }
}

window.chartRenderer = new ChartRenderer();
