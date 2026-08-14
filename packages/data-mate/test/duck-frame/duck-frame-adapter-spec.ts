import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DuckFrame, closeDuckDatabase } from '../../src/duck-frame/DuckFrame.js';
import { duckFrameAdapter } from '../../src/adapters/duck-frame-adapter/index.js';
import { functionConfigRepository } from '../../src/function-configs/index.js';
import { FunctionDefinitionConfig } from '../../src/function-configs/interfaces.js';

const repo = functionConfigRepository as Record<string, FunctionDefinitionConfig<any>>;

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        name: { type: FieldType.Keyword },
        ip: { type: FieldType.Keyword },
        tags: { type: FieldType.Keyword, array: true },
        bytes: { type: FieldType.Integer },
    },
};

const RECORDS = [
    { name: 'alpha', ip: '1.2.3.4', tags: ['x', 'y'], bytes: 1 },
    { name: 'beta', ip: 'not-an-ip', tags: ['z'], bytes: 2 },
    { name: null, ip: null, tags: null, bytes: null },
];

async function collect(frame: DuckFrame): Promise<Record<string, unknown>[]> {
    const out: Record<string, unknown>[] = [];
    for await (const row of frame.rows()) out.push(row);
    return out;
}

/** Apply one function config to a column and read the resulting values. */
async function applyTo(
    frame: DuckFrame, fnName: string, field: string, args?: Record<string, unknown>
) {
    const fields = CONFIG.fields as Record<string, any>;
    const result = await duckFrameAdapter(repo[fnName], {
        field,
        inputConfig: { field_config: fields[field] },
        args,
    });

    const rows = await collect(frame.select(
        { [field]: result.expression },
        { version: 1, fields: { [field]: result.outputConfig.field_config } }
    ));

    return { result, values: rows.map((r) => r[field]) };
}

describe('duckFrameAdapter', () => {
    let frame: DuckFrame;

    beforeAll(async () => {
        frame = await DuckFrame.fromRecords(CONFIG, RECORDS, { name: 'adapter_src' });
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    it('runs a real transform config, using its own implementation', async () => {
        const { values } = await applyTo(frame, 'toUpperCase', 'name');
        expect(values).toEqual(['ALPHA', 'BETA', null]);
    });

    it('skips nulls for INDIVIDUAL_VALUES, matching the JS adapter', async () => {
        const { values } = await applyTo(frame, 'toUpperCase', 'name');
        expect(values[2]).toBeNull();
    });

    it('takes the output field config from the function, not from the caller', async () => {
        // toNumber declares its own result type via output_type: a Keyword becomes a Number
        const { result, values } = await applyTo(frame, 'toNumber', 'bytes');
        expect(result.outputConfig.field_config.type).toEqual(FieldType.Integer);
        expect(values).toEqual([1, 2, null]);

        const asNumber = await duckFrameAdapter(repo.toNumber, {
            field: 'name',
            inputConfig: { field_config: { type: FieldType.Keyword } },
        });
        expect(asNumber.outputConfig.field_config.type).toEqual(FieldType.Number);
    });

    it('maps element-wise over an array column via list_transform', async () => {
        const { result, values } = await applyTo(frame, 'toUpperCase', 'tags');

        expect(result.expression).toContain('list_transform');
        expect(values).toEqual([['X', 'Y'], ['Z'], null]);
    });

    it('nulls a failing validation and keeps the row', async () => {
        const { result, values } = await applyTo(frame, 'isIP', 'ip');

        // validatorTransformFN semantics: value if valid, else null - never a dropped row
        expect(result.expression).toContain('CASE WHEN');
        expect(values).toEqual(['1.2.3.4', null, null]);
    });

    it('leaves the field type unchanged for a validation', async () => {
        const { result } = await applyTo(frame, 'isIP', 'ip');
        expect(result.outputConfig.field_config.type).toEqual(FieldType.Keyword);
    });

    it('throws for a transform whose accepts does not match the column', async () => {
        await expect(duckFrameAdapter(repo.toUpperCase, {
            field: 'bytes',
            inputConfig: { field_config: { type: FieldType.Boolean } },
        })).toReject();
    });

    it('clears the column for a validation whose accepts does not match', async () => {
        const result = await duckFrameAdapter(repo.isIP, {
            field: 'bytes',
            inputConfig: { field_config: { type: FieldType.Boolean } },
        });
        // validateColumnData returns column.clearAll() rather than throwing
        expect(result.expression).toEqual('NULL');
    });

    it('reuses one registration for the same function, column and args', async () => {
        const a = await applyTo(frame, 'toUpperCase', 'name');
        const b = await applyTo(frame, 'toUpperCase', 'name');
        expect(a.result.functionName).toEqual(b.result.functionName);
    });

    it('composes: the expression drops into select, filter and groupBy', async () => {
        const upper = await duckFrameAdapter(repo.toUpperCase, {
            field: 'name',
            inputConfig: { field_config: { type: FieldType.Keyword } },
        });

        const rows = await collect(frame
            .select({ name: upper.expression, bytes: 'bytes' }, CONFIG)
            .filter('name IS NOT NULL')
            .select(
                { n: 'count(*)' },
                { version: 1, fields: { n: { type: FieldType.Integer } } }
            ));

        expect(rows).toEqual([{ n: 2 }]);
    });

    it('chains steps, threading the config from one into the next', async () => {
        // the Keyword -> transform -> transform sequence, applied the way a plan would:
        // each step is a select over the previous frame, carrying the config forward
        const nameConfig = { field_config: { type: FieldType.Keyword } };

        const step1 = await duckFrameAdapter(repo.trim, { field: 'name', inputConfig: nameConfig });
        const after1 = frame.select(
            { name: step1.expression },
            { version: 1, fields: { name: step1.outputConfig.field_config } }
        );

        const step2 = await duckFrameAdapter(repo.toUpperCase, {
            field: 'name',
            inputConfig: step1.outputConfig,
        });
        const after2 = after1.select(
            { name: step2.expression },
            { version: 1, fields: { name: step2.outputConfig.field_config } }
        );

        expect((await collect(after2)).map((r) => r.name)).toEqual(['ALPHA', 'BETA', null]);

        // two different functions, so two different registrations
        expect(step1.functionName).not.toEqual(step2.functionName);
    });
});
