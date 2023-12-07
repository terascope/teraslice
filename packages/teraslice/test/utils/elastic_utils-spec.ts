import { dateOptions } from '../../src/lib/utils/date_utils';

describe('elastic_utils', () => {
    it('has methods dateOptions and processInterval', () => {
        expect(dateOptions).toBeDefined();
        expect(typeof dateOptions).toEqual('function');
    });

    it('dateOptions returns a string used for the moment library', () => {
        expect(() => {
            dateOptions('Day');
        }).toThrowError();

        expect(dateOptions('day')).toEqual('d');
    });

    it('dateOptions will throw a new error if not given correct values', () => {
        expect(() => {
            dateOptions('hourz');
        }).toThrowError();

        expect(() => {
            dateOptions(3 as any);
        }).toThrowError();

        expect(() => {
            dateOptions({ some: 'obj' } as any);
        }).toThrowError();
    });
});
