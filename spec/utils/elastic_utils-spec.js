'use strict';

const utils = require('../../lib/utils/date_utils');


describe('elastic_utils', () => {
    it('has methods dateOptions and processInterval', () => {
        const dateOptions = utils.dateOptions;

        expect(dateOptions).toBeDefined();
        expect(typeof dateOptions).toEqual('function');
    });

    it('dateOptions returns a string used for the moment library', () => {
        const dateOptions = utils.dateOptions;

        expect(() => {
            dateOptions('Day');
        }).toThrowError();

        expect(dateOptions('day')).toEqual('d');
    });

    it('dateOptions will throw a new error if not given correct values', () => {
        const dateOptions = utils.dateOptions;

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
