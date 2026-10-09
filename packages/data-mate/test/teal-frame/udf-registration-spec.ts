import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import {
    TealFrame, closeDuckDatabase, registeredFunctionCount
} from '../../src/teal-frame/index.js';
import { tealFrameAdapter } from '../../src/adapters/teal-frame-adapter/index.js';
import { functionConfigRepository } from '../../src/function-configs/index.js';
import { FunctionDefinitionConfig, DataTypeFieldAndChildren } from '../../src/function-configs/interfaces.js';

/**
 * **A UDF registration is permanent** - DuckDB cannot unregister a scalar function - so the number
 * of registrations must be bounded by the CODE and the data types, never by what users type. Each
 * UDF used to be specialised to one argument set and named by it, so every new `lookup` table,
 * regex or format added a function that lived as long as the process: a long-running worker grew
 * without bound. Arguments are now a parameter of one UDF per (function, types).
*/

const repo = functionConfigRepository as Record<string, FunctionDefinitionConfig<any>>;

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        code: { type: FieldType.Keyword },
        other: { type: FieldType.Keyword },
        word: { type: FieldType.Keyword },
    },
};
const RECORDS = [
    { code: 'k0', other: 'k1', word: 'abc' },
    { code: 'k1', other: 'k0', word: 'abcdef' },
    { code: null, other: null, word: null },
];

const keyword: DataTypeFieldAndChildren = { field_config: { type: FieldType.Keyword } };

describe('UDF registrations are bounded', () => {
    let frame: TealFrame;

    beforeAll(async () => {
        frame = await TealFrame.fromRecords(CONFIG, RECORDS, { name: 'udf_registration_src' });
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    async function values(field: string, expression: string, type: FieldType) {
        const out: unknown[] = [];
        for await (const row of frame.select({ [field]: expression }, {
            config: { version: 1, fields: { [field]: { type } } },
        }).rows()) out.push(row[field]);
        return out;
    }

    it('registers ONE lookup UDF for 300 different tables, each answered correctly', async () => {
        const before = await registeredFunctionCount();

        for (let i = 0; i < 300; i++) {
            const table = { k0: `zero-${i}`, k1: `one-${i}` };
            const result = await tealFrameAdapter(repo.lookup, {
                field: 'code', inputConfig: keyword, args: { in: table }, preferSql: false,
            });
            expect(result.dispatch).toEqual('udf');
            expect(await values('code', result.expression, FieldType.Any))
                .toEqual([`zero-${i}`, `one-${i}`, null]);
        }

        expect(await registeredFunctionCount() - before).toEqual(1);
    });

    it('shares that UDF across fields of the same type', async () => {
        const before = await registeredFunctionCount();
        const result = await tealFrameAdapter(repo.lookup, {
            field: 'other', inputConfig: keyword, args: { in: { k0: 'a', k1: 'b' } }, preferSql: false,
        });

        expect(await values('other', result.expression, FieldType.Any)).toEqual(['b', 'a', null]);
        expect(await registeredFunctionCount() - before).toEqual(0);
    });

    it('registers ONE validation UDF for 100 different arguments', async () => {
        const before = await registeredFunctionCount();

        for (let size = 1; size <= 100; size++) {
            const result = await tealFrameAdapter(repo.isLength, {
                field: 'word', inputConfig: keyword, args: { size }, preferSql: false,
            });
            const expected = ['abc', 'abcdef', null].map((v) => (v != null && v.length === size ? v : null));
            expect(await values('word', result.expression, FieldType.Keyword)).toEqual(expected);
        }

        expect(await registeredFunctionCount() - before).toEqual(1);
    });

    it('still answers one query that uses two argument sets of the same UDF', async () => {
        const a = await tealFrameAdapter(repo.lookup, {
            field: 'code', inputConfig: keyword, args: { in: { k0: 'A0', k1: 'A1' } }, preferSql: false,
        });
        const b = await tealFrameAdapter(repo.lookup, {
            field: 'other', inputConfig: keyword, args: { in: { k0: 'B0', k1: 'B1' } }, preferSql: false,
        });
        const rows: unknown[] = [];
        for await (const row of frame.select({ code: a.expression, other: b.expression }, {
            config: {
                version: 1,
                fields: { code: { type: FieldType.Any }, other: { type: FieldType.Any } },
            },
        }).rows()) rows.push(row);

        expect(rows).toEqual([
            { code: 'A0', other: 'B1' },
            { code: 'A1', other: 'B0' },
            { code: null, other: null },
        ]);
    });
});
