import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { TealFrame, closeDuckDatabase, registerScalarFunction } from '../../src/index.js';

/**
 * `coerceResult` coerces what a registered function returns into its declared type, as a
 * `DataFrame` Builder coerces a value. A caller building values in JS (a list of a constant and
 * a number from the row) gets `["x", "23"]` for a Keyword list instead of a DuckDB error.
*/
describe('registerScalarFunction with coerceResult', () => {
    const config: DataTypeConfig = { version: 1, fields: { n: { type: FieldType.Integer } } };
    let frame: TealFrame;

    beforeAll(async () => {
        frame = await TealFrame.fromRecords(config, [{ n: 23 }, { n: null }]);
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    async function run(
        name: string, returns: { type: FieldType; array?: boolean }, coerceResult?: boolean
    ) {
        await registerScalarFunction({
            name,
            parameter: FieldType.Integer,
            returns,
            fn: (value) => (returns.array ? ['x', value] : value),
            ...(coerceResult != null && { coerceResult }),
        });
        const values: unknown[] = [];
        const selected = frame.select({ v: `${name}("n")` }, {
            config: { version: 1, fields: { v: returns } },
        });
        for await (const row of selected.rows()) values.push(row.v);
        return values;
    }

    it('makes a number a string for a Keyword result', async () => {
        await expect(run('zz_coerce_keyword', { type: FieldType.Keyword }, true))
            .resolves.toEqual(['23', null]);
    });

    it('coerces each value of a Keyword list', async () => {
        await expect(run('zz_coerce_keyword_list', { type: FieldType.Keyword, array: true }, true))
            .resolves.toEqual([['x', '23'], null]);
    });

    it('leaves the result as it is without it, which DuckDB refuses', async () => {
        await expect(run('zz_raw_keyword', { type: FieldType.Keyword }))
            .rejects.toThrow(/A string was expected/);
    });
});
