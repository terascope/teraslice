import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DataFrame, TealFrame, closeDuckDatabase } from '../../src/index.js';
import { getChildDataTypeConfig } from '../../src/core/utils.js';

/**
 * A field whose name ends with another field's name (`user` and `enduser`, `ip` and `src_ip`)
 * is not that field's child. Matching the name anywhere in the path gave `user` a member
 * `endname`, and the frame could not be stored.
*/
/** Rows as plain JSON, null fields dropped at every depth: `rows()` writes them, `toJSON` not. */
function plain(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(plain);
    if (value == null || typeof value !== 'object') return value ?? null;
    return Object.fromEntries(Object.entries(value)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, plain(v)]));
}

describe('fields whose names end with another field name', () => {
    afterAll(() => closeDuckDatabase());

    it('gives a field only the children under it', () => {
        expect(getChildDataTypeConfig({
            user: { type: FieldType.Object },
            'user.id': { type: FieldType.Keyword },
            enduser: { type: FieldType.Object },
            'enduser.name': { type: FieldType.Keyword },
        }, 'user', FieldType.Object)).toEqual({ id: { type: FieldType.Keyword } });
    });

    const CASES: [string, DataTypeConfig, Record<string, unknown>[]][] = [
        ['an untyped object beside one with children',
            {
                version: 1,
                fields: {
                    user: { type: FieldType.Object },
                    enduser: { type: FieldType.Object },
                    'enduser.name': { type: FieldType.Keyword },
                },
            },
            [{ user: { a: 1 }, enduser: { name: 'n' } }, {}]],
        ['two objects with children',
            {
                version: 1,
                fields: {
                    user: { type: FieldType.Object },
                    'user.id': { type: FieldType.Keyword },
                    enduser: { type: FieldType.Object },
                    'enduser.name': { type: FieldType.Keyword },
                },
            },
            [{ user: { id: 'u' }, enduser: { name: 'n' } }]],
        ['the same one level down',
            {
                version: 1,
                fields: {
                    m: { type: FieldType.Object },
                    'm.ip': { type: FieldType.Object },
                    'm.src_ip': { type: FieldType.Object },
                    'm.src_ip.v': { type: FieldType.Keyword },
                },
            },
            [{ m: { ip: { x: 1 }, src_ip: { v: 'a' } } }]],
    ];

    it.each(CASES)('stores and outputs %s like DataFrame', async (_label, config, records) => {
        const frame = await TealFrame.fromRecords(config, records);
        const out: unknown[] = [];
        for await (const row of frame.rows()) out.push(row);

        expect(plain(out)).toEqual(plain(DataFrame.fromJSON(config, records).toJSON()));
        await frame.destroy();
    });
});
