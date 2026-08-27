// SECTION 1: type + coercion matrix.
// For each FieldType, run the adversarial battery through data-mate's coercion and
// through the candidate DuckDB cast, and record every divergence.
import { mateCoerce, duckExpr, same, norm, FieldType } from './lib/runners.mjs';
import { batteryForType } from './lib/battery.mjs';
import { cell, table, h } from './lib/render.mjs';

// FieldType -> internal Vector type, candidate DuckDB type, and the SQL used to coerce.
// `cast: null` means no single-expression equivalent exists; those are described, not diffed.
export const TYPE_MAP = {
    [FieldType.Keyword]:  { vector: 'String',   duck: 'VARCHAR',     cast: 'TRY_CAST(v AS VARCHAR)' },
    [FieldType.Text]:     { vector: 'String',   duck: 'VARCHAR',     cast: 'TRY_CAST(v AS VARCHAR)' },
    [FieldType.String]:   { vector: 'String',   duck: 'VARCHAR',     cast: 'TRY_CAST(v AS VARCHAR)' },
    [FieldType.Byte]:     { vector: 'Int',      duck: 'TINYINT',     cast: 'TRY_CAST(v AS TINYINT)' },
    [FieldType.Short]:    { vector: 'Int',      duck: 'SMALLINT',    cast: 'TRY_CAST(v AS SMALLINT)' },
    [FieldType.Integer]:  { vector: 'Int',      duck: 'INTEGER',     cast: 'TRY_CAST(v AS INTEGER)' },
    [FieldType.Long]:     { vector: 'BigInt',   duck: 'BIGINT',      cast: 'TRY_CAST(v AS BIGINT)' },
    // NOTE: FieldType.Float must map to DOUBLE, not FLOAT. data-mate stores a JS double;
    // a 32-bit FLOAT turns 3.14159 into 3.141590118. That is a width mismatch, not a
    // semantic difference, but it silently corrupts every float if mapped naively.
    [FieldType.Float]:    { vector: 'Float',    duck: 'DOUBLE',      cast: 'TRY_CAST(v AS DOUBLE)' },
    [FieldType.Double]:   { vector: 'Float',    duck: 'DOUBLE',      cast: 'TRY_CAST(v AS DOUBLE)' },
    [FieldType.Number]:   { vector: 'Float',    duck: 'DOUBLE',      cast: 'TRY_CAST(v AS DOUBLE)' },
    [FieldType.Boolean]:  { vector: 'Boolean',  duck: 'BOOLEAN',     cast: 'TRY_CAST(v AS BOOLEAN)' },
    [FieldType.Date]:     { vector: 'Date',     duck: 'TIMESTAMPTZ', cast: `strftime(TRY_CAST(v AS TIMESTAMPTZ),'%Y-%m-%dT%H:%M:%S.%g') || 'Z'` },
    [FieldType.IP]:       { vector: 'IP',       duck: 'INET',        cast: 'TRY_CAST(v AS INET)::VARCHAR' },
    [FieldType.IPRange]:  { vector: 'IPRange',  duck: 'INET',        cast: 'TRY_CAST(v AS INET)::VARCHAR' },
    [FieldType.Binary]:   { vector: 'Any (BinaryVector is never constructed)', duck: 'BLOB', cast: null },
    [FieldType.GeoPoint]: {
        vector: 'GeoPoint',
        duck: 'STRUCT(lat DOUBLE, lon DOUBLE) or POINT_2D',
        cast: `CASE WHEN v IS NULL THEN NULL ELSE {'lat': TRY_CAST(split_part(v,',',1) AS DOUBLE), 'lon': TRY_CAST(split_part(v,',',2) AS DOUBLE)} END`,
    },
    [FieldType.GeoJSON]:  { vector: 'GeoJSON',  duck: 'GEOMETRY (spatial ext)', cast: null },
    [FieldType.Boundary]: { vector: 'GeoBoundary', duck: 'LIST(STRUCT(lat,lon))', cast: null },
    [FieldType.Object]:   { vector: 'Object',   duck: 'STRUCT (known children) or JSON', cast: null },
    [FieldType.Tuple]:    { vector: 'Tuple',    duck: 'STRUCT with positional keys', cast: null },
    [FieldType.Any]:      { vector: 'Any',      duck: 'VARIANT', cast: null },
};

export async function build() {
    const summary = [];
    const details = [];
    let totalDiverge = 0;
    let totalThrow = 0;

    for (const [ft, m] of Object.entries(TYPE_MAP)) {
        const battery = batteryForType(ft);
        const mateOut = battery.map((v) => mateCoerce(ft, v));
        let duckOut = null;
        let duckErr = null;
        if (m.cast) {
            const r = await duckExpr(m.cast, battery);
            if (r.ok) duckOut = r.values;
            else duckErr = r.error;
        }

        let agree = 0;
        let diverge = 0;
        const threw = mateOut.filter((x) => !x.ok).length;
        const rows = [];

        battery.forEach((inp, i) => {
            if (!duckOut) return;
            const mo = mateOut[i];
            const d = duckOut[i];
            // data-mate throwing and DuckDB nulling is the *expected* contract difference,
            // recorded once at the top rather than as N divergences.
            const matches = mo.ok ? same(mo.value, d) : d === null;
            if (matches) { agree++; return; }
            diverge++;
            rows.push([
                cell(inp),
                mo.ok ? cell(norm(mo.value)) : '**THROW**',
                cell(norm(d)),
            ]);
        });

        totalDiverge += diverge;
        totalThrow += threw;

        summary.push([
            `\`${ft}\``,
            m.vector,
            `\`${m.duck}\``,
            duckOut ? String(battery.length) : '—',
            duckOut ? String(agree) : '—',
            duckOut ? (diverge ? `**${diverge}**` : '0') : '—',
            String(threw),
        ]);

        if (duckErr) {
            details.push(`${h(4, `\`${ft}\``)}\nCandidate cast failed to execute: \`${duckErr}\`\n`);
        } else if (!m.cast) {
            // No single-expression equivalent. Record what data-mate accepts and rejects,
            // so v2 has the acceptance contract even without a diff.
            const accepted = [];
            const rejected = [];
            battery.forEach((inp, i) => {
                const mo = mateOut[i];
                if (mo.ok) accepted.push([cell(inp), cell(norm(mo.value))]);
                else rejected.push([cell(inp), `\`${mo.error.split(';')[0].slice(0, 70)}\``]);
            });
            details.push(`${h(4, `\`${ft}\` — no single-expression equivalent`)}
Target representation: \`${m.duck}\`. Not diffed; data-mate's acceptance contract recorded instead.

**Accepted (${accepted.length})**

${table(['input', 'data-mate stores'], accepted)}
**Rejected (${rejected.length})**

${table(['input', 'error'], rejected)}`);
        } else if (rows.length) {
            details.push(`${h(4, `\`${ft}\` — ${rows.length} divergence${rows.length === 1 ? '' : 's'}`)}
_cast tested: \`${m.cast}\`_

${table(['input', 'data-mate', 'DuckDB'], rows)}`);
        }
    }

    return { summary, details, totalDiverge, totalThrow };
}
