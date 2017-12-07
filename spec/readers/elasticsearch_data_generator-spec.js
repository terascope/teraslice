'use strict';

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

    it('newReader returns a function that produces generated data', () => {
        const context = {};
        const opConfig = {};
        const jobConfig = {};

        const getData = generator.newReader(context, opConfig, jobConfig);

        const results1 = getData(1);
        const results2 = getData(20);

        expect(results1.length).toEqual(1);
        expect(results2.length).toEqual(20);
        expect(Object.keys(results1[0]).length).toBeGreaterThan(1);
    });

    it('slicer in "once" mode will return number based off total size ', (done) => {
        const context = {};
        const opConfig = { size: 13 };
        const jobConfig1 = {
            readerConfig: opConfig,
            jobConfig: { lifecycle: 'once', operations: [{ _op: 'elasticsearch_data_generator', size: 13 }, { size: 5 }] }
        };
        // if not specified size defaults to 5000
        const jobConfig2 = {
            readerConfig: opConfig,
            jobConfig: {
                lifecycle: 'once',
                operations: [{ _op: 'elasticsearch_data_generator', someKey: 'someValue', size: 13 }, { size: 5000 }]
            }
        };


        Promise.resolve(generator.newSlicer(context, jobConfig1)).then((slicer) => {
            Promise.resolve(generator.newSlicer(context, jobConfig2)).then((slicer2) => {
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

    it('slicer in "persistent" mode will continuously produce the same number', () => {
        const context = {};
        const opConfig = { size: 550 };
        const jobConfig = { readerConfig: opConfig, jobConfig: { lifecycle: 'persistent', operations: [{ size: 5 }] } };

        Promise.resolve(generator.newSlicer(context, jobConfig)).then((slicer) => {
            expect(typeof slicer[0]).toEqual('function');
            expect(slicer[0]()).toEqual(550);
            expect(slicer[0]()).toEqual(550);
            expect(slicer[0]()).toEqual(550);
        });
    });

    it('data generator will only return one slicer', () => {
        const context = {};
        const opConfig = { size: 550 };
        const jobConfig = {
            readerConfig: opConfig,
            jobConfig: { lifecycle: 'persistent', slicers: 3, operations: [{ size: 5 }] }
        };

        Promise.resolve(generator.newSlicer(context, jobConfig)).then((slicer) => {
            expect(typeof slicer[0]).toEqual('function');
            expect(slicer.length).toEqual(1);
        });
    });
});
