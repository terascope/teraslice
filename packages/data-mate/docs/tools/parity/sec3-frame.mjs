// SECTION 3: frame semantics. Ordering, nulls, dedup, aggregation widening, wire format.
// The defect rates here are MEASURED at generation time, not copied from notes.
import { mate, FieldType } from './lib/runners.mjs';
import { cell, table, h } from './lib/render.mjs';

const DF = mate.DataFrame;

/** Deterministic LCG so the fuzz result is reproducible across runs. */
function lcg(seed) {
    let s = seed;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

/** D1: multi-key sort sums per-field comparisons instead of taking first-non-zero. */
export function fuzzMultiKey(trials = 2000, seed = 12345) {
    const rnd = lcg(seed);
    const cfg = { version: 1, fields: { a: { type: FieldType.Integer }, b: { type: FieldType.Integer } } };
    let fails = 0; let first = null;
    for (let t = 0; t < trials; t++) {
        const n = 3 + Math.floor(rnd() * 12);
        const rows = Array.from({ length: n }, () => ({ a: Math.floor(rnd() * 3), b: Math.floor(rnd() * 3) }));
        const got = DF.fromJSON(cfg, rows).orderBy('a:asc', 'b:desc').toJSON().map((r) => [r.a, r.b]);
        const want = rows.map((r) => [r.a, r.b]).sort((x, y) => x[0] - y[0] || y[1] - x[1]);
        if (JSON.stringify(got) !== JSON.stringify(want)) {
            fails++;
            if (!first) first = { rows, got, want };
        }
    }
    return { trials, fails, first };
}

/** D2: null makes the string comparator non-transitive, corrupting NON-NULL ordering. */
export function fuzzNullSort(sizes = [8, 16, 32, 64, 128], per = 300, seed = 999) {
    const rnd = lcg(seed);
    const cfg = { version: 1, fields: { s: { type: FieldType.Keyword } } };
    const letters = 'abcdefghijklmnopqrst'.split('');
    const out = [];
    let sample = null;
    for (const n of sizes) {
        let fails = 0;
        for (let t = 0; t < per; t++) {
            const rows = Array.from({ length: n }, () => ({
                s: rnd() < 0.25 ? null : letters[Math.floor(rnd() * letters.length)],
            }));
            const got = DF.fromJSON(cfg, rows).orderBy('s:asc').toJSON()
                .map((r) => r.s).filter((x) => x != null);
            const sorted = [...got].sort();
            if (JSON.stringify(got) !== JSON.stringify(sorted)) {
                fails++;
                if (!sample && n === 16) sample = { rows: rows.map((r) => r.s ?? '_'), got, sorted };
            }
        }
        out.push({ n, per, fails });
    }
    return { out, sample };
}

/** The five existing ->orderBy expectations in data-frame-spec.ts, checked against a reference. */
export function checkExistingOrderTests() {
    const cfg = { version: 1, fields: {
        name: { type: FieldType.Keyword }, age: { type: FieldType.Short },
        friends: { type: FieldType.Keyword, array: true },
    } };
    const people = [
        { name: 'Jill', age: 39, friends: ['Frank'] },
        { name: 'Billy', age: 47, friends: ['Jill'] },
        { name: 'Frank', age: 20, friends: ['Jill'] },
        { name: 'Nancy', age: 10 },
        { name: 'Jane', friends: ['Jill'] },
    ];
    const df = DF.fromJSON(cfg, people);
    const show = (rows) => rows.map((r) => `${r.name}(${r.age ?? '_'})`).join(' ');
    const ref = (keys) => [...people].sort((x, y) => {
        for (const k of keys) {
            const [f, d = 'asc'] = k.split(':');
            const a = x[f]; const b = y[f];
            if (a == null && b == null) continue;
            if (a == null) return 1;
            if (b == null) return -1;
            if (a === b) continue;
            return d === 'desc' ? (a < b ? 1 : -1) : (a < b ? -1 : 1);
        }
        return 0;
    });
    return [['name'], ['name:desc'], ['age'], ['age:desc'], ['name:desc', 'age:desc']].map((keys) => {
        const actual = df.orderBy(keys.length > 1 ? keys : keys[0]).toJSON();
        const correct = ref(keys);
        return {
            keys: keys.join(', '),
            actual: show(actual),
            correct: show(correct),
            matches: show(actual) === show(correct),
        };
    });
}

/** D3: reverse() operates on UTF-16 code units. */
export function checkReverse() {
    const inputs = ['abc', '😀x', 'a😀b', 'ünïcödé'];
    const col = mate.Column.fromJSON('s', { type: FieldType.Keyword }, inputs);
    const got = mate.dataFrameAdapter(mate.functionConfigRepository.reverse, { field: 's' })
        .column(col).toJSON();
    const lone = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
    return inputs.map((inp, i) => ({
        input: inp,
        got: got[i],
        correct: [...inp].reverse().join(''),
        corrupt: typeof got[i] === 'string' && lone.test(got[i]),
    }));
}

/** D5: date coercion delegates to JS Date for loose formats, so it reads process TZ. */
export function tzDependentDateInputs() {
    // Values whose data-mate result is produced by JS Date parsing rather than ISO parsing.
    return ['Mar 10 2024', '03/10/2024', '0'];
}

export function render() {
    let out = '';

    out += h(3, 'Ordering');
    const mk = fuzzMultiKey();
    const ns = fuzzNullSort();
    out += `
**D1 — multi-key sort sums comparisons.** \`Vector.getSortedIndices\`
(\`src/vector/Vector.ts:45-51\`) reduces per-field comparisons with \`acc + (d === 'asc' ? res : -res)\`.
Two keys that disagree cancel to \`0\`, so the comparator reports "equal" and the first key is
ignored. Fuzzed over ${mk.trials} random frames with a fixed seed:

**${mk.fails}/${mk.trials} frames (${(100 * mk.fails / mk.trials).toFixed(0)}%) sorted incorrectly.**

`;
    if (mk.first) {
        out += `Smallest observed failure:\n\n${table(['', 'rows (a,b)'], [
            ['input', cell(mk.first.rows.map((r) => `${r.a}${r.b}`).join(' '))],
            ['data-mate', cell(mk.first.got.map((r) => r.join('')).join(' '))],
            ['correct', cell(mk.first.want.map((r) => r.join('')).join(' '))],
        ])}\n`;
    }

    out += `
**D2 — null breaks ordering of NON-NULL values.** \`Vector.compare\`
(\`src/vector/Vector.ts:493-500\`) maps nullish to \`null\`. For strings \`null < 'a'\` and
\`null > 'a'\` are both false, so it returns \`0\`: null compares equal to every string. That makes the
comparator **non-transitive**, and a non-transitive comparator does not merely misplace nulls, it
misorders real values. Rate rises with array size as V8 switches sort strategy:

${table(['array size', 'frames with non-null values out of order'],
        ns.out.map((r) => [String(r.n), `${r.fails}/${r.per} (${(100 * r.fails / r.per).toFixed(0)}%)`]))}
For numerics the same mapping makes \`null\` compare as \`0\` (\`null < 10\` evaluates \`0 < 10\`), so
nulls sort first ascending and last descending — and would land **mid-range among negative numbers**.

`;
    if (ns.sample) {
        out += `Example at n=16:\n\n${table(['', 'value'], [
            ['input', cell(ns.sample.rows.join(' '))],
            ['non-null, as sorted', cell(ns.sample.got.join(' '))],
            ['non-null, correct', cell(ns.sample.sorted.join(' '))],
        ])}\n`;
    }

    out += h(4, 'Existing test expectations that encode this');
    const ex = checkExistingOrderTests();
    out += `\nThe five \`->orderBy\` tests in \`test/data-frame-spec.ts\`, checked against a
first-non-zero-key reference with nulls last. **Not modified** — listed so the freeze is informed.\n\n`;
    out += table(['orderBy', 'asserted / actual', 'correct', ''], ex.map((r) => [
        `\`${r.keys}\``, cell(r.actual), cell(r.correct), r.matches ? 'matches' : '**differs**',
    ]));
    out += `
\`name:desc, age:desc\` is the unambiguous one: the asserted result is not sorted by name in either
direction. \`age\` differs only in null placement, which follows from the null-as-zero mapping — where
nulls belong is a convention choice, the mechanism behind it is not.

`;

    out += h(3, 'Unicode');
    const rev = checkReverse();
    out += `
**D3 — \`reverse()\` operates on UTF-16 code units**, so astral characters are split into
lone surrogates:

${table(['input', 'data-mate', 'correct', 'produces lone surrogates'],
        rev.map((r) => [cell(r.input), cell(r.got), cell(r.correct), r.corrupt ? '**yes**' : 'no']))}
Related but distinct: \`toUpperCase\`/\`toLowerCase\` use JS full case-folding
(\`ß\`→\`SS\`, \`ﬁ\`→\`FI\`), where SQL \`upper()\` maps to the single codepoint \`ẞ\` and leaves
ligatures alone. Neither is wrong; they are different standards, and v2 must pick one.

`;

    out += h(3, 'Non-finite numbers');
    out += `
data-mate coerces \`'Infinity'\` to the JS number \`Infinity\` successfully, but its **numeric function
closures return \`null\` for non-finite results** — \`abs\`'s closure returns \`null\` for \`Infinity\`,
and the adapter emits \`undefined\`. DuckDB propagates \`inf\`. This is function-layer behaviour, not
coercion, and it is why most NUMERIC functions show one or two residual divergences.

`;

    out += h(3, 'Timezone');
    out += `
**D5 — date coercion is process-timezone dependent.** ISO-8601 inputs parse deterministically, but
loose formats (${tzDependentDateInputs().map((x) => `\`${x}\``).join(', ')}) fall through to JS
\`Date\` parsing, which reads the process timezone. The same input therefore produces a different
stored value on differently-configured pods.

On the DuckDB side the mirror-image hazard is that **\`SET TimeZone='UTC'\` is mandatory**. At the
default session timezone every \`TIMESTAMPTZ\` operation silently shifts:
\`date_part('hour', …)\` returned 7 where data-mate returned 14, and \`date_trunc('day', …)\`
moved results to the previous day. This is configuration, not a defect, but it is silent.

`;

    out += h(3, 'Other frame semantics v2 must decide');
    out += table(['area', 'current behaviour', 'source'], [
        ['validator return', 'validators return the **value or null**, not a boolean (`validatorTransformFN`)', '`adapters/data-frame-adapter/index.ts:147`'],
        ['failed validation on a whole column', '`validateAccepts` failure returns `column.clearAll()` — an all-null column, not an error', '`adapters/data-frame-adapter/index.ts:204`'],
        ['coercion failure', 'throws on the **first** bad value, rejecting the whole batch', '`builder/Builder.ts:107`'],
        ['null vs undefined', 'treated identically; `SerializeOptions.useNullForUndefined` decides what is emitted', '`vector/interfaces.ts:77`'],
        ['aggregation widening', '`avg` on Long→Double, `sum` on Long/Integer→Long, `count`→Integer; unsupported types throw', '`aggregation-frame/utils.ts:7-60`'],
        ['dedup / group keys', '`getHashCodeFrom`, md5 above 1024 chars', '`builder/type-coercion.ts:159`'],
        ['wire format', 'dfjson: line 0 a JSON header `{v,name,size,metadata,config}`, then one line per column', '`data-frame/DataFrame.ts:1175`'],
        ['row-count without parsing', 'consumers read `size` from the header line without deserializing the body', '`ThreadedReaderWorker.ts:392`'],
    ]);

    return out;
}
