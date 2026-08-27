/**
 * STEP 2 — inventory the bucket. Nothing is generated; this reports what is
 * already there.
 *
 * **This is the step that makes every later number interpretable.** The cost
 * model for Parquet is "~26-44 us per ROW GROUP, with file count absent from the
 * law", so a battery time means nothing until the row-group census is known.
 * Two layouts with identical row counts and wildly different group counts
 * answer the same query at wildly different speeds, and that is not a mystery
 * once this table is in front of you.
 *
 * Reads Parquet FOOTERS only (`parquet_file_metadata`, `parquet_metadata`), not
 * the data, so it is cheap even against a large corpus.
 */
import { s3Glob } from '../lib/env.mjs';
import { open } from '../lib/duck.mjs';
import {
    heading, note, table, bytes, num, save, explain
} from '../lib/report.mjs';

const session = await open();

try {
    const glob = s3Glob();

    heading('OBJECTS');
    const files = (await session.rows(`SELECT file FROM glob('${glob}') ORDER BY file`)).map((r) => r[0]);
    if (!files.length) {
        note(`No objects match ${glob}. Run ./run.sh doctor for a diagnosis.`);
        process.exit(1);
    }
    note(`${num(files.length)} object(s) matching ${glob}`);

    /*
     * The row-group census. `parquet_file_metadata` gives one row per FILE with
     * its group count; `parquet_metadata` gives one row per column chunk per
     * group. Counted, never inferred from a requested ROW_GROUP_SIZE — DuckDB
     * rounds that value, so inferring it has been wrong before.
     */
    heading('THE ROW GROUP CENSUS — the unit of query cost');
    const perFile = await session.rows(`
        SELECT file_name,
               num_rows,
               num_row_groups,
               CASE WHEN num_row_groups > 0 THEN num_rows / num_row_groups ELSE 0 END AS rows_per_group
        FROM parquet_file_metadata('${glob}')
        ORDER BY file_name
    `);

    const totalRows = perFile.reduce((a, r) => a + Number(r[1]), 0);
    const totalGroups = perFile.reduce((a, r) => a + Number(r[2]), 0);

    const shown = perFile.slice(0, 12);
    table(
        ['object', 'rows', 'row groups', 'rows/group'],
        shown.map((r) => [
            String(r[0]).split('/')
                .pop(),
            num(r[1]),
            num(r[2]),
            num(r[3]),
        ])
    );
    if (perFile.length > shown.length) note(`… and ${num(perFile.length - shown.length)} more objects`);

    note('');
    note(`TOTAL: ${num(totalRows)} rows in ${num(totalGroups)} row groups across ${num(files.length)} objects`);
    note(`Mean rows per group: ${num(totalRows / Math.max(totalGroups, 1))}`);

    /*
     * DuckDB's default row group is 122,880 rows and qpl-search-api caps a
     * slice at 100k, so a payload written straight through can never fill one.
     * Saying so here means a later "why is this slower than the recorded
     * numbers" question answers itself.
     */
    const meanGroup = totalRows / Math.max(totalGroups, 1);
    note('');
    if (meanGroup < 100_000) {
        note(`Mean group is ${num(meanGroup)} rows, well under DuckDB's 122,880 default.`);
        note('That is EXPECTED for as-received slice payloads and is not a defect —');
        note('a qpl-search-api slice caps at 100k, so no payload can fill a group.');
    } else {
        note(`Mean group is ${num(meanGroup)} rows, at or near DuckDB's 122,880 default —`);
        note('these objects were consolidated or written by something other than a raw slice.');
    }

    heading('SIZE');
    const sizes = await session.rows(`
        SELECT sum(total_compressed_size), sum(total_uncompressed_size)
        FROM parquet_metadata('${glob}')
    `);
    const [compressed, uncompressed] = sizes[0].map(Number);
    table(
        ['measure', 'value'],
        [
            ['compressed on disk', bytes(compressed)],
            ['uncompressed', bytes(uncompressed)],
            ['compression ratio', `${(uncompressed / Math.max(compressed, 1)).toFixed(2)}x`],
            ['bytes per row', bytes(compressed / Math.max(totalRows, 1))],
        ]
    );

    heading('COMPRESSION CODECS IN USE');
    const codecs = await session.rows(`
        SELECT compression, count(*) AS chunks, sum(total_compressed_size) AS bytes
        FROM parquet_metadata('${glob}') GROUP BY 1 ORDER BY 3 DESC
    `);
    table(['codec', 'column chunks', 'compressed'], codecs.map((r) => [r[0], num(r[1]), bytes(r[2])]));

    heading('SCHEMA');
    const schema = await session.rows(`
        SELECT name, type, converted_type
        FROM parquet_schema('${files[0]}')
        WHERE num_children IS NULL OR num_children = 0
        ORDER BY name
    `);
    note(`${num(schema.length)} leaf columns, read from ${String(files[0]).split('/')
        .pop()}`);
    table(['column', 'parquet type', 'converted'], schema.map((r) => [r[0], r[1], r[2] ?? '']));

    /*
     * Column widths decide the memory cliff. The known law for a wide top-N is
     * threads x row_group x COLUMNS PROJECTED, so the widest columns are the
     * ones that make `SELECT *` dangerous. Naming them here is what turns
     * "do not emit SELECT *" from advice into a specific instruction.
     */
    heading('WIDEST COLUMNS — these are what make a wide SELECT * expensive');
    const widest = await session.rows(`
        SELECT path_in_schema,
               sum(total_compressed_size) AS compressed,
               sum(total_uncompressed_size) AS uncompressed
        FROM parquet_metadata('${glob}')
        GROUP BY 1 ORDER BY 3 DESC LIMIT 10
    `);
    table(
        ['column', 'compressed', 'uncompressed', '% of total'],
        widest.map((r) => [
            r[0],
            bytes(r[1]),
            bytes(r[2]),
            `${((Number(r[2]) / Math.max(uncompressed, 1)) * 100).toFixed(1)}%`,
        ])
    );

    save('discover', {
        objects: files.length,
        totalRows,
        totalRowGroups: totalGroups,
        meanRowsPerGroup: meanGroup,
        compressedBytes: compressed,
        uncompressedBytes: uncompressed,
        perFile: perFile.map(([file, rows, groups]) => ({
            file, rows: Number(rows), rowGroups: Number(groups),
        })),
        schema: schema.map(([name, type, converted]) => ({ name, type, converted })),
        widestColumns: widest.map(([name, c, u]) => ({
            name, compressed: Number(c), uncompressed: Number(u),
        })),
        codecs: codecs.map(([codec, chunks, b]) => ({
            codec, chunks: Number(chunks), bytes: Number(b),
        })),
    });

    heading('NEXT');
    note('./run.sh battery    — time the query shapes against this corpus');
} catch (err) {
    explain(err);
    process.exit(1);
} finally {
    session.close();
}
