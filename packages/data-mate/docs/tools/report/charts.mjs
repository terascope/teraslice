/**
 * Hand-authored SVG chart helpers for the storage report.
 *
 * No chart library, no runtime: every chart is static SVG emitted from the measured JSON, so the
 * page cannot drift from the results files and a stale number is impossible by construction.
 *
 * Colours come from the validated categorical palette as CSS custom properties (--s1..--s4), which
 * the page defines per theme - so a chart is never a literal hue that only works on one ground.
 * The light steps carry a documented contrast WARN, which is why every bar is DIRECTLY LABELLED and
 * every chart is backed by a table: that is the required relief, not a stylistic choice.
 */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Grouped horizontal bars. Horizontal because the category labels are long phrases
 * ("TABLE from pq (memory)") that would need rotating on a vertical axis, and a rotated label is
 * the most common way a chart becomes unreadable.
 */
export function groupedBars({
    rows, series, width = 720, rowHeight = 26, groupGap = 14, labelWidth = 150,
    valueFormat = (v) => v.toFixed(0), max = null, caption = '', ariaLabel = '', unit = '',
    marker = null,
}) {
    const barH = Math.max(9, Math.floor((rowHeight - 6) / series.length));
    const groupH = barH * series.length + groupGap;
    const height = rows.length * groupH + 34;
    const plotW = width - labelWidth - 74;
    const top = 8;
    const cap = max ?? Math.max(...rows.flatMap((r) => series.map((s) => r.values[s.key] ?? 0)));
    const scale = (v) => (cap > 0 ? (v / cap) * plotW : 0);

    let body = '';
    rows.forEach((row, i) => {
        const gy = top + i * groupH;
        body += `<text x="${labelWidth - 10}" y="${gy + (groupH - groupGap) / 2 + 4}"`
            + ` text-anchor="end" class="c-lbl">${esc(row.label)}</text>`;
        series.forEach((s, j) => {
            const v = row.values[s.key];
            if (v == null) return;
            const y = gy + j * barH;
            const w = Math.max(1.5, scale(v));
            body += `<rect x="${labelWidth}" y="${y}" width="${w.toFixed(1)}" height="${barH - 2}"`
                + ` rx="2.5" fill="var(--${s.color})"><title>${esc(row.label)} · ${esc(s.label)}:`
                + ` ${esc(valueFormat(v))}${esc(unit)}</title></rect>`;
            body += `<text x="${(labelWidth + w + 6).toFixed(1)}" y="${y + barH - 5}"`
                + ` class="c-val">${esc(valueFormat(v))}</text>`;
        });
    });

    /**
     * An optional threshold rule - the value a bar has to beat to matter. Drawn behind the bars so
     * it reads as context rather than as another series, and labelled on the mark itself because a
     * legend entry for a single line is noise.
     */
    let markerEl = '';
    if (marker && cap > 0) {
        const mx = labelWidth + scale(marker.value);
        markerEl = `<line x1="${mx.toFixed(1)}" y1="2" x2="${mx.toFixed(1)}" y2="${height - 26}"`
            + ' stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.55"/>'
            + `<text x="${(mx + 6).toFixed(1)}" y="${height - 14}" class="c-tick"`
            + ` opacity="0.8">${esc(marker.label)}</text>`;
    }

    const legend = series.map((s) => `<span class="lg"><i style="background:var(--${s.color})"></i>`
        + `${esc(s.label)}</span>`).join('');

    return `<figure class="fig">
<div class="chart-scroll"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(ariaLabel)}" class="chart">
${markerEl}
${body}
</svg></div>
<div class="legend">${legend}</div>
${caption ? `<figcaption>${caption}</figcaption>` : ''}
</figure>`;
}

/**
 * A log-scaled bar row, for the quantities that span four orders of magnitude - memory footprint,
 * ingest time. A linear axis there would render every small value as an invisible sliver, which is
 * how a real 65x difference gets read as "about the same".
 */
export function logBars({
    rows, width = 720, rowHeight = 30, labelWidth = 170, valueFormat = (v) => v.toFixed(0),
    caption = '', ariaLabel = '', unit = '',
}) {
    const vals = rows.map((r) => r.value).filter((v) => v > 0);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const plotW = width - labelWidth - 96;
    const lgLo = Math.log10(lo / 2);
    const lgHi = Math.log10(hi * 1.3);
    const scale = (v) => (v <= 0 ? 2 : ((Math.log10(v) - lgLo) / (lgHi - lgLo)) * plotW);
    const height = rows.length * rowHeight + 12;

    let body = '';
    rows.forEach((row, i) => {
        const y = 6 + i * rowHeight;
        const w = Math.max(2, scale(row.value));
        body += `<text x="${labelWidth - 10}" y="${y + rowHeight / 2 + 4}" text-anchor="end"`
            + ` class="c-lbl">${esc(row.label)}</text>`;
        body += `<rect x="${labelWidth}" y="${y + 3}" width="${w.toFixed(1)}" height="${rowHeight - 12}"`
            + ` rx="2.5" fill="var(--${row.color || 's1'})"><title>${esc(row.label)}:`
            + ` ${esc(valueFormat(row.value))}${esc(unit)}</title></rect>`;
        body += `<text x="${(labelWidth + w + 7).toFixed(1)}" y="${y + rowHeight / 2 + 4}"`
            + ` class="c-val">${esc(valueFormat(row.value))}</text>`;
    });

    return `<figure class="fig">
<div class="chart-scroll"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(ariaLabel)}" class="chart">
${body}
</svg></div>
<p class="axis-note">log scale — each step is 10x</p>
${caption ? `<figcaption>${caption}</figcaption>` : ''}
</figure>`;
}

/** Multi-series line chart, for anything measured against a swept continuous axis (RTT). */
export function lineChart({
    xs, series, width = 720, height = 300, xLabel = '', yLabel = '',
    valueFormat = (v) => v.toFixed(0), caption = '', ariaLabel = '',
}) {
    const padL = 62; const padR = 116; const padT = 16; const padB = 42;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const maxY = Math.max(...series.flatMap((s) => s.values)) * 1.08;
    const x = (i) => padL + (xs.length === 1 ? plotW / 2 : (i / (xs.length - 1)) * plotW);
    const y = (v) => padT + plotH - (v / maxY) * plotH;

    let grid = '';
    const ticks = 4;
    for (let t = 0; t <= ticks; t++) {
        const v = (maxY / ticks) * t;
        grid += `<line x1="${padL}" y1="${y(v).toFixed(1)}" x2="${padL + plotW}" y2="${y(v).toFixed(1)}" class="c-grid"/>`;
        grid += `<text x="${padL - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" class="c-tick">${esc(valueFormat(v))}</text>`;
    }
    xs.forEach((xv, i) => {
        grid += `<text x="${x(i).toFixed(1)}" y="${height - padB + 18}" text-anchor="middle" class="c-tick">${esc(xv)}</text>`;
    });

    let body = '';
    series.forEach((s) => {
        const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
        body += `<polyline points="${pts}" fill="none" stroke="var(--${s.color})" stroke-width="2"`
            + ' stroke-linejoin="round" stroke-linecap="round"/>';
        s.values.forEach((v, i) => {
            body += `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4"`
                + ` fill="var(--${s.color})" stroke="var(--surface)" stroke-width="2">`
                + `<title>${esc(s.label)} at ${esc(xs[i])}: ${esc(valueFormat(v))}</title></circle>`;
        });
        // direct label at the line's end - identity is never colour alone
        const last = s.values.length - 1;
        body += `<text x="${(x(last) + 10).toFixed(1)}" y="${(y(s.values[last]) + 4).toFixed(1)}"`
            + ` class="c-end" fill="var(--${s.color})">${esc(s.label)}</text>`;
    });

    return `<figure class="fig">
<div class="chart-scroll"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(ariaLabel)}" class="chart">
${grid}
<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" class="c-axis"/>
<line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" class="c-axis"/>
${body}
<text x="${padL + plotW / 2}" y="${height - 4}" text-anchor="middle" class="c-axlbl">${esc(xLabel)}</text>
<text x="14" y="${padT + plotH / 2}" text-anchor="middle" class="c-axlbl" transform="rotate(-90 14 ${padT + plotH / 2})">${esc(yLabel)}</text>
</svg></div>
${caption ? `<figcaption>${caption}</figcaption>` : ''}
</figure>`;
}

/** A plain data table — the accessible companion every chart above is required to have. */
export function table({ head, rows, note = '', className = '' }) {
    const th = head.map((h) => `<th>${esc(h)}</th>`).join('');
    const tr = rows.map((r) => `<tr>${r.map((c, i) => {
        const cell = c && typeof c === 'object' ? c : { v: c };
        const tag = i === 0 ? 'th' : 'td';
        const cls = cell.cls ? ` class="${cell.cls}"` : '';
        return `<${tag}${cls}>${cell.raw ? cell.v : esc(cell.v)}</${tag}>`;
    }).join('')}</tr>`).join('\n');
    return `<div class="table-scroll"><table class="${className}">
<thead><tr>${th}</tr></thead>
<tbody>
${tr}
</tbody>
</table></div>${note ? `<p class="tnote">${note}</p>` : ''}`;
}
