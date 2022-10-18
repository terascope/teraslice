import utils from '../../lib/utils/date_utils.js';

describe('elastic_utils', () => {
    it('has methods dateOptions and processInterval', () => {
        const { dateOptions } = utils;

        expect(dateOptions).toBeDefined();
        expect(typeof dateOptions).toEqual('function');
    });

    it('dateOptions returns a string used for the moment library', () => {
        const { dateOptions } = utils;

        expect(() => {
            dateOptions('Day');
        }).toThrowError();

        expect(dateOptions('day')).toEqual('d');
    });

    it('dateOptions will throw a new error if not given correct values', () => {
        const { dateOptions } = utils;

        expect(() => {
            dateOptions('hourz');
        }).toThrowError();

        expect(() => {
            dateOptions(3);
        }).toThrowError();

        expect(() => {
            dateOptions({ some: 'obj' });
        }).toThrowError();
    });
});
