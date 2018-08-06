'use strict';

const Promise = require('bluebird');
const generator = require('../../lib/readers/elasticsearch_data_generator');

describe('elasticsearch_data_generator', () => {
    it('has a schema and newReader method', () => {
        expect(generator).toBeDefined();
        expect(generator.newReader).toBeDefined();
        expect(generator.newSlicer).toBeDefined();
        expect(generator.schema).toBeDefined();
        expect(typeof generator.newReader).toEqual('function');
        expect(typeof generator.newSlicer).toEqual('function');
        expect(typeof generator.schema).toEqual('function');
    });

    it('newReader returns a function that produces generated data', (done) => {
        const context = {};
        const opConfig = {};
        const executionContext = {};

        const getData = generator.newReader(context, opConfig, executionContext);
        Promise.resolve()
            .then(() => getData(1))
            .then((results) => {
                expect(results.length).toEqual(1);
                expect(Object.keys(results[0]).length).toBeGreaterThan(1);
                return getData(20);
            })
            .then(results => expect(results.length).toEqual(20))
            .catch(fail)
            .finally(done);
    });

    it('slicer in "once" mode will return number based off total size ', (done) => {
        const context = {};
        const opConfig = { size: 13 };
        const executionContext1 = {
            readerConfig: opConfig,
            config: { lifecycle: 'once', operations: [{ _op: 'elasticsearch_data_generator', size: 13 }, { size: 5 }] }
        };
        // if not specified size defaults to 5000
        const executionContext2 = {
            readerConfig: opConfig,
            config: {
                lifecycle: 'once',
                operations: [{ _op: 'elasticsearch_data_generator', someKey: 'someValue', size: 13 }, { size: 5000 }]
            }
        };


        Promise.resolve(generator.newSlicer(context, executionContext1)).then((slicer) => {
            Promise.resolve(generator.newSlicer(context, executionContext2)).then((slicer2) => {
                expect(typeof slicer[0]).toEqual('function');
                expect(slicer[0]()).toEqual(5);
                expect(slicer[0]()).toEqual(5);
                expect(slicer[0]()).toEqual(3);
                expect(slicer[0]()).toEqual(null);

                expect(typeof slicer2[0]).toEqual('function');
                expect(slicer2[0]()).toEqual(13);
                expect(slicer2[0]()).toEqual(null);

                done();
            });
        });
    });

    it('slicer in "persistent" mode will continuously produce the same number', (done) => {
        const context = {};
        const executionContext = { config: { lifecycle: 'persistent', operations: [{ _op: 'elasticsearch_data_generator', size: 550 }] } };

        Promise.resolve(generator.newSlicer(context, executionContext))
            .then((slicer) => {
                expect(typeof slicer[0]).toEqual('function');
                expect(slicer[0]()).toEqual(550);
                expect(slicer[0]()).toEqual(550);
                expect(slicer[0]()).toEqual(550);
            })
            .catch(fail)
            .finally(done);
    });

    it('data generator will only return one slicer', () => {
        const context = {};
        const opConfig = { size: 550 };
        const executionContext = {
            readerConfig: opConfig,
            config: { lifecycle: 'persistent', slicers: 3, operations: [{ size: 5 }] }
        };

        Promise.resolve(generator.newSlicer(context, executionContext)).then((slicer) => {
            expect(typeof slicer[0]).toEqual('function');
            expect(slicer.length).toEqual(1);
        });
    });
});
