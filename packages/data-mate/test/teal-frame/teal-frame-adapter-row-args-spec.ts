import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import {
    TealFrame, closeDuckDatabase, tealFrameAdapter, functionConfigRepository,
    FunctionDefinitionConfig
} from '../../src/index.js';

const repo = functionConfigRepository as Record<string, FunctionDefinitionConfig<any>>;

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        name: { type: FieldType.Keyword },
        delim: { type: FieldType.Keyword },
        tags: { type: FieldType.Keyword, array: true },
        bytes: { type: FieldType.Integer },
        amount: { type: FieldType.Keyword },
        search: { type: FieldType.Keyword },
    },
};

const RECORDS = [
    {
        name: 'a-b', delim: '-', tags: ['x-y', 'z'], bytes: 1, amount: '5', search: 'a'
    },
    {
        name: 'c_d', delim: '_', tags: ['p_q'], bytes: 2, amount: '10', search: 'q'
    },
    {
        name: null, delim: '-', tags: null, bytes: null, amount: '1', search: 'a'
    },
];

async function collect(frame: TealFrame): Promise<Record<string, unknown>[]> {
    const out: Record<string, unknown>[] = [];
    for await (const row of frame.rows()) out.push(row);
    return out;
}

describe('tealFrameAdapter with per-row arguments', () => {
    let frame: TealFrame;

    beforeAll(async () => {
        frame = await TealFrame.fromRecords(CONFIG, RECORDS, { name: 'row_args_src' });
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    /** Apply one function config to a column, with arguments from each row. */
    async function applyTo(
        fnName: string,
        field: string,
        rowArgs: Record<string, string>,
        args?: Record<string, unknown>
    ) {
        const fields = CONFIG.fields as Record<string, any>;
        const result = await tealFrameAdapter(repo[fnName], {
            field,
            inputConfig: { field_config: fields[field] },
            args,
            rowArgs,
        });

        const rows = await collect(frame.select(
            { [field]: result.expression },
            { config: { version: 1, fields: { [field]: result.outputConfig.field_config } } }
        ));
        return { result, values: rows.map((r) => r[field]) };
    }

    it('reads each row\'s argument from the expression', async () => {
        const { result, values } = await applyTo('split', 'name', { delimiter: '"delim"' });

        expect(values).toEqual([['a', 'b'], ['c', 'd'], null]);
        // the sql definition binds its arguments once, so the UDF runs
        expect(result.dispatch).toBe('udf');
        expect(result.outputConfig.field_config).toMatchObject({ array: true });
    });

    it('coerces each row\'s argument like the argument schema, as dataFrameAdapter does', async () => {
        const { values } = await applyTo('add', 'bytes', { value: '"amount"' });

        expect(values).toEqual([6, 12, null]);
    });

    it('merges the arguments that are the same for every row', async () => {
        const { values } = await applyTo(
            'replaceLiteral', 'name', { search: '"search"' }, { replace: 'Z' }
        );

        expect(values).toEqual(['Z-b', 'c_d', null]);
    });

    it('refuses an argument for every row that has no JSON form', async () => {
        await expect(applyTo(
            'replaceLiteral', 'name', { search: '"search"' }, { replace: new Map() }
        )).rejects.toThrow(
            'Argument "replace" must be a string, finite number, boolean, null, array or plain object '
            + 'when another argument is per row, got Map'
        );
    });

    it('applies a validation with the row\'s arguments, nulling the failures', async () => {
        const { values } = await applyTo('contains', 'name', { value: '"search"' });

        expect(values).toEqual(['a-b', null, null]);
    });

    it('maps over an array column with the row\'s arguments', async () => {
        const { values } = await applyTo('split', 'tags', { delimiter: '"delim"' });

        expect(values).toEqual([[['x', 'y'], ['z']], [['p', 'q']], null]);
    });

    it('registers one function for every row expression', async () => {
        const first = await applyTo('split', 'name', { delimiter: '"delim"' });
        const second = await applyTo('split', 'name', { delimiter: '"search"' });

        expect(second.result.functionName).toBe(first.result.functionName);
        expect(second.values).toEqual([['', '-b'], ['c_d'], null]);
    });

    it('throws when a row has no value for a required argument, as dataFrameAdapter does', async () => {
        const result = await tealFrameAdapter(repo.split, {
            field: 'name',
            inputConfig: { field_config: { type: FieldType.Keyword } },
            rowArgs: { delimiter: 'NULL' },
        });
        // split's delimiter is optional, so a missing one is the default
        const rows = await collect(frame.select(
            { name: result.expression },
            { config: { version: 1, fields: { name: { type: FieldType.Keyword, array: true } } } }
        ));
        expect(rows.map((r) => r.name)).toEqual([['a', '-', 'b'], ['c', '_', 'd'], null]);

        const required = await tealFrameAdapter(repo.contains, {
            field: 'name',
            inputConfig: { field_config: { type: FieldType.Keyword } },
            rowArgs: { value: 'NULL' },
        });
        await expect(collect(frame.select(
            { name: required.expression },
            { config: { version: 1, fields: { name: { type: FieldType.Keyword } } } }
        ))).rejects.toThrow('requires value to be set');
    });

    it('does not take per-row arguments for a function that changes the field type', async () => {
        await expect(tealFrameAdapter(repo.cast, {
            field: 'bytes',
            inputConfig: { field_config: { type: FieldType.Integer } },
            rowArgs: { type: '"name"' },
        })).rejects.toThrow('per-row arguments');
    });
});
