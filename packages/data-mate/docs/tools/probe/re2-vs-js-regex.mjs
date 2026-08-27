/**
 * Where do RE2's CHARACTER CLASSES disagree with JavaScript's, over real values?
 *
 * `isRe2Safe` in `string/sql-utils.ts` rejects lookaround and backreferences, because RE2 ERRORS
 * on those and a dead query is worse than a slow one. That is not the only way the two engines
 * differ: a pattern both engines COMPILE can still match different characters, which is silent.
 *
 * This measures the three classes a promoted pattern is most likely to contain - `\s`, `\S` and
 * `.` - against every character where the definitions could differ. Every string is built from
 * escape sequences rather than typed literally, so nothing here depends on what an editor did to
 * an invisible character.
 *
 *     node packages/data-mate/docs/tools/probe/re2-vs-js-regex.mjs
 */
import { open } from '../lib/duck.mjs';

const { connection: conn, close } = await open();

const lit = (v) => `'${String(v).replaceAll("'", "''")}'`;

async function sqlMatches(pattern, value) {
    const reader = await conn.run(
        `SELECT regexp_matches(${lit(value)}, ${lit(pattern)}) AS v`
    );
    return (await reader.getRowsJson())[0][0];
}

/**
 * Every code point that JavaScript's `\s` accepts, plus the two line separators that JavaScript's
 * `.` excludes and RE2's does not. Named, because the answer is only useful if it says WHICH.
*/
const CHARS = [
    ['TAB', '\u0009'], ['LF', '\u000a'], ['VT', '\u000b'], ['FF', '\u000c'],
    ['CR', '\u000d'], ['SPACE', '\u0020'], ['NBSP', '\u00a0'], ['NEL', '\u0085'],
    ['OGHAM', '\u1680'], ['EN QUAD', '\u2000'], ['EM QUAD', '\u2001'],
    ['EN SPACE', '\u2002'], ['EM SPACE', '\u2003'], ['3/PER-EM', '\u2004'],
    ['4/PER-EM', '\u2005'], ['6/PER-EM', '\u2006'], ['FIGURE SP', '\u2007'],
    ['PUNCT SP', '\u2008'], ['THIN SP', '\u2009'], ['HAIR SP', '\u200a'],
    ['ZWSP', '\u200b'], ['LINE SEP', '\u2028'], ['PARA SEP', '\u2029'],
    ['NNBSP', '\u202f'], ['MMSP', '\u205f'], ['IDEOGRAPHIC', '\u3000'],
    ['BOM', '\ufeff'], ['a', 'a'],
];

const PATTERNS = ['\\s', '\\S', '.', '\\w', '\\d', '\\b.'];

for (const pattern of PATTERNS) {
    const diverge = [];
    for (const [name, char] of CHARS) {
        const js = new RegExp(pattern).test(char);
        const sql = await sqlMatches(pattern, char);
        if (js !== sql) diverge.push(`${name} (js=${js} sql=${sql})`);
    }
    console.log(`/${pattern}/`.padEnd(8), diverge.length === 0 ? `AGREES on all ${CHARS.length}` : `DIVERGES: ${diverge.join(', ')}`);
}

/* ---------------------------------------------------- the array shapes `extract` needs */

console.log('\n=== regexp_extract_all, with and without a capture group ===');
for (const [pattern, input, group] of [
    ['([A-Z]\\w+)', 'Hello World some other things', 1],
    ['[0-9]+', 'a1b22c333', 0],
    ['\\d+', 'abc', 0],
]) {
    const reader = await conn.run(
        `SELECT regexp_extract_all(${lit(input)}, ${lit(pattern)}, ${group}) AS v`
    );
    const sql = (await reader.getRowsJson())[0][0];
    const re = new RegExp(pattern, 'g');
    const js = [];
    let m = re.exec(input);
    while (m != null && m[0]) {
        if (m.length > 1) js.push(...m.slice(1));
        else js.push(m[0]);
        m = re.exec(input);
    }
    const match = JSON.stringify(sql) === JSON.stringify(js.length ? js : []);
    console.log(`${match ? '  ' : '!!'} /${pattern}/g on ${JSON.stringify(input).slice(0, 24)}`,
        'js=', JSON.stringify(js), 'sql=', JSON.stringify(sql));
}

console.log('\n=== marker mode, GLOBAL: repeated extraction between two chars ===');
const MARKER_CASES = [
    ['<hello> some stuff <world>', '<', '>'],
    ['<a<b> <c>', '<', '>'],
    ['no markers', '<', '>'],
    ['<unterminated', '<', '>'],
    ['<>', '<', '>'],
    ['a|b|c|d', '|', '|'],
    [`line1\n<multi\nline> <x>`, '<', '>'],
];
for (const [input, start, end] of MARKER_CASES) {
    // the JavaScript state machine from extract.ts, verbatim
    const results = [];
    let found = false;
    let item = '';
    for (const ch of input) {
        if (found && ch === end) { found = false; results.push(item); item = ''; } else if (found) { item += ch; } else if (ch === start) { found = true; }
    }
    // SQL: a non-greedy dotall match between the two, escaped as literals
    const esc = (c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = `${esc(start)}((?s).*?)${esc(end)}`;
    const reader = await conn.run(
        `SELECT regexp_extract_all(${lit(input)}, ${lit(pattern)}, 1) AS v`
    );
    const sql = (await reader.getRowsJson())[0][0];
    const match = JSON.stringify(sql) === JSON.stringify(results);
    console.log(`${match ? '  ' : '!!'} ${JSON.stringify(input).slice(0, 28).padEnd(30)}`,
        'js=', JSON.stringify(results), 'sql=', JSON.stringify(sql));
}

close();
