import { cloneDeep } from '@terascope/utils';
import { RecordTransform } from '../src';

describe('record transforms', () => {
    it('can rename a field', () => {
        const obj = { hello: 'world' };
        const config = { oldFieldName: 'hello', newFieldName: 'goodbye' };

        const results = RecordTransform.renameField(cloneDeep(obj), config);

        expect(results).toEqual({ goodbye: 'world' });
    });

    it('can set a field', () => {
        const obj = { hello: 'world' };
        const config = { field: 'other', value: 'stuff' };
        const expectResults = Object.assign({}, obj, { other: 'stuff' });
        const results = RecordTransform.setField(cloneDeep(obj), config);

        expect(results).toEqual(expectResults);
    });

    it('can drop a field', () => {
        const obj = { hello: 'world', other: 'stuff' };
        const config = { field: 'other' };

        const results = RecordTransform.dropField(cloneDeep(obj), config);

        expect(results).toEqual({ hello: 'world' });
    });

    it('can copy a field', () => {
        const obj = { hello: 'world', other: 'stuff' };
        const config = { field: 'other', copyTo: 'myCopy' };

        const results = RecordTransform.copyField(cloneDeep(obj), config);

        expect(results).toEqual({ hello: 'world', other: 'stuff', myCopy: 'stuff' });
    });
});
