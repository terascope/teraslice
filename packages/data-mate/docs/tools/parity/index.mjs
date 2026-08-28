// Assembles packages/data-mate/docs/duckdb-parity.md.
// Deterministic: TZ pinned to UTC, fixed fuzz seeds, no Date.now() anywhere.
// Run:  TZ=UTC node gen/index.mjs > /path/to/duckdb-parity.md
import { loadedExtensions, mate } from './lib/runners.mjs';
import { table, h } from './lib/render.mjs';
import * as sec1 from './sec1-coercion.mjs';
import * as sec2 from './sec2-functions.mjs';
import * as sec3 from './sec3-frame.mjs';

import api from '@duckdb/node-api';

const s1 = await sec1.build();
const s2built = await sec2.build();
const s2 = sec2.render(s2built);
const exts = await loadedExtensions();
const fnCount = Object.keys(mate.functionConfigRepository).length;

// ---- section 4: gap list, derived from the generated data ----
function gapList() {
    const noEq = [];
    for (const rows of Object.values(s2built.byCat)) {
        for (const r of rows) {
            if (r.status === 'no-equivalent' || r.status === 'array-input' || r.status === 'untestable') {
                noEq.push([`\`${r.name}\``, r.cat, r.note.replace(/\|/g, '\\|')]);
            }
        }
    }
    const approx = [];
    for (const rows of Object.values(s2built.byCat)) {
        for (const r of rows) if (r.approx) approx.push([`\`${r.name}\``, r.cat, r.note.replace(/\|/g, '\\|')]);
    }
    const noType = Object.entries(sec1.TYPE_MAP)
        .filter(([, m]) => !m.cast)
        .map(([ft, m]) => [`\`${ft}\``, `\`${m.duck}\``]);

    let out = h(2, '4. Gap list');
    out += `
What v2 must build, ordered by how much of the catalogue each unblocks.

`;
    out += h(3, `4.1 Types with no single-expression coercion (${noType.length})`);
    out += `\nThese need a decided representation before anything above them can be specified.\n\n`;
    out += table(['FieldType', 'candidate representation'], noType);

    out += h(3, `4.2 Functions with no DuckDB equivalent (${noEq.length} of ${fnCount})`);
    out += `\n> **STALE — 41 of these now run as SQL.** See the banner at the top of this file;
\`docs/sql-emission.md\` is the authority. The line below about none of these being guesses is the
specific claim that did not hold.

Each must be implemented in v2 as a scalar UDF, a host-side pass, or a deliberate
behaviour change. **None of these are guesses** — a candidate was only omitted where none was found.\n\n`;
    out += table(['function', 'category', 'why'], noEq);

    out += h(3, `4.3 Approximations that need a parity decision (${approx.length})`);
    out += `\nA candidate exists and runs, but it is an approximation rather than a translation.
Shipping these silently would be a user-visible behaviour change, because via
\`v3/type-defs/directives.ts:189-224\` **every one of these function names is a QPL directive**.\n\n`;
    out += table(['function', 'category', 'note'], approx);

    out += h(3, '4.4 Decisions that are not technical');
    out += `
| decision | why it is a judgement call |
|---|---|
| Keep or fix the multi-key sort (D1) | Fixing it changes results for any query using multiple sort keys. It is currently snapshotted as correct. |
| Keep or fix null ordering (D2) | The mechanism is wrong; where nulls *should* sort is a convention. |
| Unicode case-folding standard | JS full folding (\`ß\`→\`SS\`) vs SQL single-codepoint (\`ẞ\`). Neither is wrong. |
| Non-finite numeric results | data-mate nulls them; SQL propagates \`inf\`. |
| Coercion failure contract | Throw-the-batch vs null-the-value. Affects every ingest path. |
| Accept epoch-as-string dates | Real capability today (\`'1710028800000'\`), absent in \`TRY_CAST\`. Greppable whether production relies on it. |
| Leading-zero IPs | data-mate rejects \`01.02.03.04\`, DuckDB reads it as \`1.2.3.4\`. data-mate's strictness is the safer behaviour and should be kept deliberately. |
`;
    return out;
}

// ---- assemble ----
const parts = [];

parts.push(`# DataFrame → DuckDB semantic parity

**Generated**, not hand-written. Every cell below is the result of running the same input through
data-mate's built \`dist\` and through DuckDB and diffing. Regenerate with
\`TZ=UTC node gen/index.mjs\`.

> ## SUPERSEDED AS A GAP ANALYSIS (2026-08-21) — read this before citing anything below
>
> **The §2 matrix and §4.2 gap list understate what SQL can do, by a lot.** They record what a
> candidate expression was found for BY INSPECTION in mid-August. Since then the emissions were
> built and gated, and:
>
> - **41 of the 53 functions this document calls "no DuckDB equivalent" now run as SQL**, verified
>   byte-equal to their own UDF over an adversarial battery by \`test/duck-frame/sql-emission-spec.ts\`.
> - **13 of the 17 marked "APPROXIMATION" are promoted with EXACT emissions**, including \`isEmail\`,
>   \`isMACAddress\`, \`formatDate\` and \`toDate\`.
> - §4.2's own claim that "**None of these are guesses** — a candidate was only omitted where none
>   was found" is the thing to distrust. "None was found" meant none was found by reading; several
>   notes describe **a different implementation than the one \`core-utils\` actually calls** —
>   \`isPhoneNumberLike\` was recorded as "phone-number parsing via awesome-phonenumber" and never
>   touches it, \`isCountryCode\` as an "ISO-3166 table lookup" when it is one 249-entry \`IN\` list,
>   \`entropy\` as having "no scalar SQL form" when it is a \`list_reduce\`.
>
> **\`docs/sql-emission.md\` is the authority on what runs as SQL** — 188 of 205 as of 2026-08-21 —
> and \`HANDOFF.md\` NEXT STEPS item 2 on what is left. Two parts of THIS document are still good and
> were not affected: **§1 the type/coercion matrix** and **§3 frame semantics**, which measure
> DuckDB's own casts and ordering rather than judging portability.

| | |
|---|---|
| data-mate functions | ${fnCount} |
| DuckDB | ${api.default.version()} via \`@duckdb/node-api\` |
| extensions loaded | ${exts.join(', ')} — **loaded BY THIS GENERATOR, not by default.** Measured 2026-08-21: only \`autocomplete\`, \`core_functions\`, \`icu\`, \`json\` and \`parquet\` load on their own; \`inet\` autoloads on first use and \`spatial\` does NOT autoload at all |
| session timezone | \`UTC\` (pinned — see §3) |

## Why this document exists

\`DataFrame\` and the QPL engine are being frozen. The 205 functions are a **list of behaviours**, and
v2 is free to implement the behaviour rather than call the function — but only if the behaviour is
written down first. Right now it exists solely as the implementation, which is about to stop being the
reference. This is the extraction.

**How to read the parity column**

| | |
|---|---|
| ✅ exact | every input in the battery produced an identical result |
| ⚠️ drift | a candidate exists and runs, but results differ on the listed inputs |
| — none | no single-expression equivalent found. **Not a guess** — an omission |
| — array | operates on an array-valued field; not exercised by the scalar battery |
| — untestable | every battery input already diverges at the coercion layer |
| ⓐ | the candidate is an *approximation*, not a translation |

Inputs where the two engines already disagree at the **coercion** layer are excluded from the function
diff and counted separately, so §2 reports drift attributable to the function rather than re-reporting
§1 once per function.

---
`);

parts.push(h(2, '1. Type and coercion matrix'));
parts.push(`
Per \`FieldType\`: how data-mate stores it, the candidate DuckDB type, and how the two differ over an
adversarial battery. "throws" counts inputs data-mate rejects outright.

**The contract differs before any individual value does:** data-mate **throws on the first bad value
in a batch**, rejecting the whole batch. \`TRY_CAST\` nulls that value and continues. Every ingest
path is affected by this choice.

`);
parts.push(table(
    ['FieldType', 'internal Vector', 'DuckDB candidate', 'n', 'agree', 'diverge', 'mate throws'],
    s1.summary,
));
parts.push(`\n_${s1.totalDiverge} divergences across all typed batteries._\n\n`);
parts.push(h(3, 'Divergence detail'));
parts.push(s1.details.join('\n'));

parts.push(`\n---\n`);
parts.push(h(2, `2. Function behaviour matrix (${fnCount})`));
parts.push(`
| | |
|---|---|
| exact | **${s2built.stats.exact}** |
| drift | **${s2built.stats.drift}** |
| no equivalent / array / untestable | **${s2built.stats.none}** |
| of which approximations | ${s2built.stats.approx} |

Two conventions that are not obvious from the source and that any translation must reproduce:

1. **Validators return the value or \`null\`, not a boolean.** Validation is implemented as a nulling
   transform (\`validatorTransformFN\`), so the SQL form is
   \`CASE WHEN <pred> THEN <value> ELSE NULL END\`, not \`<pred>\`.
2. **\`SET TimeZone='UTC'\` is mandatory.** At any other session timezone every \`TIMESTAMPTZ\`
   operation silently shifts its result.

`);
parts.push(s2.out);

parts.push(`---\n`);
parts.push(h(2, '3. Frame semantics'));
parts.push(sec3.render());

parts.push(`---\n`);
parts.push(gapList());

parts.push(`
---

## Method and limits

- Generated by a throwaway script; only this document is committed.
- Deterministic: \`TZ=UTC\`, fixed LCG seeds, no \`Date.now()\`. Re-running produces byte-identical output.
- data-mate is exercised through its built \`dist\`, one value at a time, because both \`fromJSON\` and
  the adapter throw on the first bad value in a batch and would otherwise mask every later value.
- DuckDB expressions are wrapped in \`TRY()\` so a per-row error becomes \`null\` rather than aborting
  the statement — mirroring data-mate rejecting a single value.
- Batteries are adversarial by design and are **not** a sample of production data. A function marked
  ✅ exact is exact *over these inputs*; it is not a proof.
- \`random\` and the five now-relative date validators are excluded as non-deterministic.
`);

process.stdout.write(parts.join('\n'));
