import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { TealFrame, closeDuckDatabase } from '../../src/teal-frame/index.js';
import { tealFrameAdapter } from '../../src/adapters/teal-frame-adapter/index.js';
import { dataFrameAdapter } from '../../src/adapters/index.js';
import { DataFrame } from '../../src/data-frame/index.js';
import { Column } from '../../src/column/index.js';
import { functionConfigRepository } from '../../src/function-configs/index.js';
import {
    FunctionDefinitionConfig, FunctionDefinitionCategory, DataTypeFieldAndChildren
} from '../../src/function-configs/interfaces.js';

/**
 * `setTimezone`, `toTimeZone` and `toTimeZoneUsingLocation` return a `DateTuple` -
 * `[epochMillis, offsetMinutes]` - and `DataFrame` keeps it: the output renders in local time
 * (`...17:41:50.172+02:00`), and every later date function reads the offset (`getHours` answers
 * 17, not 15). TealFrame stored a TIMESTAMP and dropped it, so 121 of 250 chains below differed.
 * Every date is now `{ ms, tz_offset }` (`date-value.ts`), and the date SQL emissions read the
 * row's own offset - so these chains run as SQL, not through the UDF.
*/

const repo = functionConfigRepository as Record<string, FunctionDefinitionConfig<any>>;

const CONFIG: DataTypeConfig = { version: 1, fields: { d: { type: FieldType.Date } } };
const RECORDS = [
    { d: '2023-08-22T15:41:50.172Z' },
    { d: '2023-11-22T23:41:50.172Z' },
    { d: '2024-02-29T02:00:00.000Z' },
    { d: null },
];

const PRODUCERS: readonly [string, Record<string, unknown>][] = [
    ['setTimezone', { timezone: 120 }],
    ['setTimezone', { timezone: -420 }],
    ['setTimezone', { timezone: 0 }],
    ['toTimeZone', { timezone: 'America/New_York' }],
    ['toTimeZone', { timezone: 'Asia/Calcutta' }],
    ['toTimeZoneUsingLocation', { location: { lat: 40.7, lon: -74.0 } }],
];
const PRODUCER_NAMES = new Set(PRODUCERS.map(([name]) => name));

/** Every date function that takes a Date, with the args of its own first example. */
const CONSUMERS: [string, Record<string, unknown>][] = Object.values(repo)
    .filter((config) => config.category === FunctionDefinitionCategory.DATE)
    .filter((config) => config.accepts.length === 0 || config.accepts.includes(FieldType.Date))
    .filter((config) => !PRODUCER_NAMES.has(config.name))
    .flatMap((config): [string, Record<string, unknown>][] => {
        const example = (config.examples ?? []).find((e) => e.args != null);
        if (config.required_arguments?.length && example == null) return [];
        return [[config.name, (example?.args ?? {}) as Record<string, unknown>]];
    });

/** `undefined` and `null` are the same absence, spelled two ways by the two engines. */
function plain(values: readonly unknown[]): unknown[] {
    return JSON.parse(JSON.stringify(
        values, (_key, value) => (value === undefined ? null : value)
    ));
}

type Outcome = { values: unknown[] } | { threw: true };

async function outcome(run: () => Promise<unknown[]> | unknown[]): Promise<Outcome> {
    try {
        return { values: plain(await run()) };
    } catch {
        return { threw: true };
    }
}

describe('a DateTuple offset travels through TealFrame', () => {
    let frame: TealFrame;
    let dataFrame: DataFrame<Record<string, any>>;

    beforeAll(async () => {
        frame = await TealFrame.fromRecords(CONFIG, RECORDS, { name: 'tz_offset_src' });
        dataFrame = DataFrame.fromJSON<Record<string, any>>(CONFIG, RECORDS);
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    /** Applies each step in turn, threading the adapter's output config into the next step. */
    async function tealChain(steps: readonly [string, Record<string, unknown>][]) {
        let current = frame;
        let inputConfig: DataTypeFieldAndChildren = { field_config: CONFIG.fields.d };
        let lastDispatch = '';
        for (const [name, args] of steps) {
            const result = await tealFrameAdapter(repo[name], { field: 'd', inputConfig, args });
            lastDispatch = result.dispatch;
            current = current.select({ d: result.expression }, {
                config: { version: 1, fields: { d: result.outputConfig.field_config } },
            });
            inputConfig = result.outputConfig;
        }
        return { frame: current, inputConfig, dispatch: lastDispatch };
    }

    async function tealRows(steps: readonly [string, Record<string, unknown>][]) {
        const { frame: chained } = await tealChain(steps);
        const values: unknown[] = [];
        for await (const row of chained.rows()) values.push(row.d);
        return values;
    }

    function dataFrameValues(steps: readonly [string, Record<string, unknown>][]) {
        let column: Column<any, string> = dataFrame.getColumnOrThrow('d');
        for (const [name, args] of steps) {
            column = dataFrameAdapter(repo[name], { args }).column(column);
        }
        return column.toJSON();
    }

    describe.each(PRODUCERS)('%s %j', (producer, producerArgs) => {
        it('renders the offset in rows(), as DataFrame does', async () => {
            const steps: [string, Record<string, unknown>][] = [[producer, producerArgs]];
            expect(await outcome(() => tealRows(steps)))
                .toEqual(await outcome(() => dataFrameValues(steps)));
        });

        it('renders the offset in ndjson(), byte-equal to rows()', async () => {
            const { frame: chained } = await tealChain([[producer, producerArgs]]);
            const lines: string[] = [];
            // every row written, so the lines line up with rows(); the default drops an all-null
            // one
            for await (const line of chained.ndjson({ removeNullFields: false })) lines.push(line);
            const fromRows: unknown[] = [];
            for await (const row of chained.rows()) fromRows.push(row.d);

            expect(lines.map((line) => JSON.parse(line).d ?? null)).toEqual(plain(fromRows));
        });

        it.each(CONSUMERS)('then %s %j matches DataFrame', async (consumer, consumerArgs) => {
            const steps: [string, Record<string, unknown>][] = [
                [producer, producerArgs], [consumer, consumerArgs],
            ];
            expect(await outcome(() => tealRows(steps)))
                .toEqual(await outcome(() => dataFrameValues(steps)));
        });
    });

    it('keeps the offset through a validation, for the step after it', async () => {
        const steps: [string, Record<string, unknown>][] = [
            ['toTimeZone', { timezone: 'Asia/Calcutta' }],
            ['isWeekday', {}],
            ['getHours', {}],
        ];
        expect(await outcome(() => tealRows(steps)))
            .toEqual(await outcome(() => dataFrameValues(steps)));
    });

    it('carries an offset per element of a Date[] column', async () => {
        const arrayConfig: DataTypeConfig = {
            version: 1, fields: { d: { type: FieldType.Date, array: true } },
        };
        const arrayRecords = [
            { d: ['2023-08-22T15:41:50.172Z', '2023-11-22T23:41:50.172Z'] },
            { d: [] },
            { d: null },
        ];
        const arrayFrame = await TealFrame.fromRecords(arrayConfig, arrayRecords, { name: 'tz_offset_arr' });
        try {
            const args = { timezone: 'America/New_York' };
            const toZone = await tealFrameAdapter(repo.toTimeZone, {
                field: 'd', inputConfig: { field_config: arrayConfig.fields.d }, args,
            });
            const hours = await tealFrameAdapter(repo.getHours, {
                field: 'd', inputConfig: toZone.outputConfig,
            });
            const zoned = arrayFrame.select({ d: toZone.expression }, {
                config: { version: 1, fields: { d: toZone.outputConfig.field_config } },
            });
            const values: unknown[] = [];
            for await (const row of zoned.select({ d: hours.expression }, {
                config: { version: 1, fields: { d: hours.outputConfig.field_config } },
            }).rows()) values.push(row.d);

            const arrayDataFrame = DataFrame.fromJSON<Record<string, any>>(
                arrayConfig, arrayRecords
            );
            const expected = dataFrameAdapter(repo.getHours).column(
                dataFrameAdapter(repo.toTimeZone, { args })
                    .column(arrayDataFrame.getColumnOrThrow('d'))
            )
                .toJSON();

            expect(plain(values)).toEqual(plain(expected));
        } finally {
            await arrayFrame.destroy();
        }
    });

    /**
     * A worker hands results between processes as Parquet. The struct is written as it is, and the
     * reader renders it from the column TYPE - its config says `Date` either way.
    */
    it('survives writeParquet -> fromParquet with the offset intact', async () => {
        const { mkdtemp, rm } = await import('node:fs/promises');
        const { tmpdir } = await import('node:os');
        const { join } = await import('node:path');
        const dir = await mkdtemp(join(tmpdir(), 'tz-offset-'));
        try {
            const steps: [string, Record<string, unknown>][] = [['setTimezone', { timezone: 330 }]];
            const { frame: zoned } = await tealChain(steps);
            const path = join(dir, 'zoned.parquet');
            await zoned.writeParquet(path);

            const reread = await TealFrame.fromParquet(CONFIG, path);
            const values: unknown[] = [];
            for await (const row of reread.rows()) values.push(row.d);
            const lines: unknown[] = [];
            for await (const line of reread.ndjson({ removeNullFields: false })) {
                lines.push(JSON.parse(line).d ?? null);
            }

            const expected = plain(dataFrameValues(steps));
            expect(plain(values)).toEqual(expected);
            expect(lines).toEqual(expected);
        } finally {
            await rm(dir, { recursive: true, force: true });
        }
    });

    it('runs a date function after a timezone one as SQL, not the UDF', async () => {
        const { dispatch } = await tealChain([
            ['toTimeZone', { timezone: 'America/New_York' }], ['getHours', {}],
        ]);
        expect(dispatch).toEqual('sql');
    });
});
