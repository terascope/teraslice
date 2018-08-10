'use strict';

const mocker = require('mocker-data-generator').default;
const moment = require('moment');
const schema = require('../../lib/utils/data_utils');

describe('data_utils', () => {
    it('format isoBetween creates an iso date between two dates', (done) => {
        const opConfig = {
            format: 'isoBetween',
            start: '2015-12-07T04:00:00-07:00',
            end: '2015-12-07T08:00:00-07:00',
            date_key: 'created'
        };
        const resultSchema = schema(opConfig);

        mocker()
            .schema('schema', resultSchema, 1)
            .build()
            .then((data) => {
                const finalResult = data.schema[0];
                expect(new Date(finalResult.created)).toBeLessThan(new Date(opConfig.end));
                expect(new Date(finalResult.created)).toBeGreaterThan(new Date(opConfig.start));
                done();
            })
            .catch((err) => {
                fail(err);
                done();
            });
    });

    it('between formats will default to current date if end is missing', (done) => {
        const opConfig = { format: 'isoBetween', start: '2015-12-07T04:00:00-07:00', date_key: 'created' };
        const resultSchema = schema(opConfig);

        mocker()
            .schema('schema', resultSchema, 1)
            .build()
            .then((data) => {
                const newDate = new Date();
                const finalResult = data.schema[0];
                expect(new Date(finalResult.created)).toBeLessThan(newDate);
                expect(new Date(finalResult.created)).toBeGreaterThan(new Date(opConfig.start));
                done();
            })
            .catch((err) => {
                fail(err);
                done();
            });
    });

    it('between formats will default to 01 January, 1970 UTC if start is missing', (done) => {
        const endDate = moment().add(2, 'h');
        const newDate = new Date(0);
        const opConfig = { format: 'isoBetween', end: endDate.format(), date_key: 'created' };
        const resultSchema = schema(opConfig);

        mocker()
            .schema('schema', resultSchema, 1)
            .build()
            .then((data) => {
                const finalResult = data.schema[0];
                expect(new Date(finalResult.created)).toBeLessThan(new Date(endDate.format()));
                expect(new Date(finalResult.created)).toBeGreaterThan(newDate);
                done();
            })
            .catch((err) => {
                fail(err);
                done();
            });
    });

    it('default data creation', () => {
        const opConfig = {};
        const data = schema(opConfig);

        expect(data).toBeDefined();
        expect(data.ip).toBeDefined();
        expect(data.userAgent).toBeDefined();
        expect(data.url).toBeDefined();
        expect(data.uuid).toBeDefined();
        expect(data.created).toBeDefined();
        expect(data.ipv6).toBeDefined();
        expect(data.location).toBeDefined();
        expect(data.bytes).toBeDefined();
    });
});
