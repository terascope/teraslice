// Markdown helpers. Cell values must survive pipes, newlines, backticks and
// invisible characters - the chart is only useful if a reviewer can see what was tested.

const CONTROL = new RegExp('[\\u0000-\\u001f\\u007f]', 'g');

export function cell(v) {
    if (v === undefined) return '`undefined`';
    if (v === null) return '`null`';
    let s = typeof v === 'string' ? v : JSON.stringify(v);
    if (s === '') return '`""`';
    s = s.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
    s = s.replace(CONTROL, (c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, '0')}`);
    // surface lone surrogates explicitly - this is how the reverse() defect shows up
    s = s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
        (c) => `\\u${c.charCodeAt(0).toString(16)}`);
    if (s.length > 60) s = `${s.slice(0, 57)}…`;
    return `\`${s.replace(/`/g, 'ˋ')}\``;
}

export function table(headers, rows) {
    if (!rows.length) return '_(none)_\n';
    const out = [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`];
    for (const r of rows) out.push(`| ${r.join(' | ')} |`);
    return `${out.join('\n')}\n`;
}

export const h = (n, t) => `${'#'.repeat(n)} ${t}\n`;
