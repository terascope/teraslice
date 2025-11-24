import { DataEntity } from '@terascope/core-utils';
import { Extraction } from '../../../src/operations';

describe('transform operator', () => {
    it('can instantiate', () => {
        const opConfig = {
            target: 'someField', source: 'someField', __id: 'someId', mutate: false
        };
        expect(() => new Extraction(opConfig)).not.toThrow();
    });

    it('can transform data', () => {
        const opConfig = {
            source: 'someField', target: 'otherField', __id: 'someId', mutate: false
        };
        const test = new Extraction(opConfig);

        const data1 = new DataEntity({ someField: '56.234,95.234' });
        const data2 = new DataEntity({});
        const data3 = new DataEntity({ someField: 'data' });
        const data4 = new DataEntity({ someField: { some: 'data' } });
        const data5 = new DataEntity({ someField: false });
        const data6 = new DataEntity({ someField: 'other' });
        const data7 = new DataEntity({ otherField: 'data' });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(results1).toEqual({ otherField: '56.234,95.234' });
        expect(results2).toEqual(null);
        expect(results3).toEqual({ otherField: 'data' });
        expect(results4).toEqual({ otherField: { some: 'data' } });
        expect(results5).toEqual({ otherField: false });
        expect(results6).toEqual({ otherField: 'other' });
        expect(results7).toEqual(null);
    });

    it('can transform data with start/end', () => {
        const opConfig = {
            source: 'someField',
            target: 'otherField',
            start: 'field=',
            end: 'SomeStr',
            __id: 'someId',
            mutate: false,
        };
        const test = new Extraction(opConfig);

        const data1 = new DataEntity({ someField: '56.234,95.234' });
        const data2 = new DataEntity({});
        const data3 = new DataEntity({ someField: 'field=dataSomeStr' });
        const data4 = new DataEntity({ someField: { some: 'data' } });
        const data5 = new DataEntity({ someField: false });
        const data6 = new DataEntity({ someField: 'field=data' });
        const data7 = new DataEntity({ someField: ['data', 'field=data'] });
        const data8 = new DataEntity({ otherField: 'data' });
        const data9 = new DataEntity({ someField: 'field=dataSomeStr,field=otherSomeStr' });
        const data10 = new DataEntity({ someField: ['field=data', 'field=otherData'] });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);
        const results8 = test.run(data8);
        const results9 = test.run(data9);
        const results10 = test.run(data10);

        expect(results1).toEqual(null);
        expect(results2).toEqual(null);
        expect(results3).toEqual({ otherField: 'data' });
        expect(results4).toEqual(null);
        expect(results5).toEqual(null);
        expect(results6).toEqual({ otherField: 'data' });
        expect(results7).toEqual({ otherField: ['data'] });
        expect(results8).toEqual(null);
        expect(results9).toEqual({ otherField: 'data' });
        expect(results10).toEqual({ otherField: ['data', 'otherData'] });
    });

    it('can transform data end =', () => {
        const opConfig = {
            source: 'someField',
            target: 'otherField',
            start: 'field=',
            end: 'EOP',
            __id: 'someId',
            mutate: false,
        };
        const test = new Extraction(opConfig);

        const data1 = new DataEntity({ someField: 'field=data&SomeStr' });
        const data2 = new DataEntity({ someField: 'field=data' });
        const data3 = new DataEntity({ someField: ['somethingElse', 'field=data'] });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);

        expect(results1).toEqual({ otherField: 'data' });
        expect(results2).toEqual({ otherField: 'data' });
        expect(results3).toEqual({ otherField: ['data'] });
    });

    describe('regexp handling', () => {
        it('can transform data with regex', () => {
            const opConfig = {
                regex: '/d.*ta/',
                source: 'someField',
                target: 'otherField',
                __id: 'someId',
                mutate: false
            };

            const test = new Extraction(opConfig);

            const data1 = new DataEntity({ someField: '56.234,95.234' });
            const data2 = new DataEntity({});
            const data3 = new DataEntity({ someField: 'data' });
            const data4 = new DataEntity({ someField: { some: 'data' } });
            const data5 = new DataEntity({ someField: false });
            const data6 = new DataEntity({ someField: 'other' });
            const data7 = new DataEntity({ otherField: 'data' });
            const data8 = new DataEntity({ someField: ['other', 'data'] });
            const data9 = new DataEntity({ someField: ['otherdatastruff', 'data'] });

            const results1 = test.run(data1);
            const results2 = test.run(data2);
            const results3 = test.run(data3);
            const results4 = test.run(data4);
            const results5 = test.run(data5);
            const results6 = test.run(data6);
            const results7 = test.run(data7);
            const results8 = test.run(data8);
            const results9 = test.run(data9);
            expect(results1).toEqual(null);
            expect(results2).toEqual(null);
            expect(results3).toEqual({ otherField: 'data' });
            expect(results4).toEqual(null);
            expect(results5).toEqual(null);
            expect(results6).toEqual(null);
            expect(results7).toEqual(null);
            expect(results8).toEqual({ otherField: ['data'] });
            expect(results9).toEqual({ otherField: ['data', 'data'] });
        });

        it('regex matching multiple values with a capturing group will return an array', () => {
            const opConfig = {
                regex: '/<(.*?)>/',
                source: 'field',
                target: 'otherField',
                __id: 'someId',
                multivalue: true,
                mutate: false
            };
            const test = new Extraction(opConfig);
            const field = '<tag1> something <tag2>';

            const data = new DataEntity({ field });

            const results = test.run(data);

            expect(results).toEqual({ otherField: ['tag1', 'tag2'] });
        });

        it('regex matching multiple values with mutliple capturing group will return an array', () => {
            const opConfig = {
                regex: '<(\\w+)>.*<(\\d+)>',
                source: 'field',
                target: 'otherField',
                __id: 'someId',
                multivalue: true,
                mutate: false
            };
            const test = new Extraction(opConfig);
            const field = '<tag1> hello <1234>';

            const data = new DataEntity({ field });

            const results = test.run(data);

            expect(results).toEqual({ otherField: ['tag1', '1234'] });
        });

        it('regex regression test', () => {
            const opConfig = {
                regex: '.*',
                source: 'field',
                target: 'otherField',
                __id: 'someId',
                multivalue: true,
                mutate: false
            };
            const test = new Extraction(opConfig);
            const field = 'value';

            const data = new DataEntity({ field });

            const results = test.run(data);

            expect(results).toEqual({ otherField: ['value'] });
        });

        it('can match extended values', () => {
            const opConfig = {
                regex: '<(\\w+)>\\s\\w+\\s+<(\\d+)>',
                source: 'field',
                target: 'otherField',
                __id: 'someId',
                multivalue: true,
                mutate: false
            };
            const test = new Extraction(opConfig);
            const field = '<tag1> hello <1234> <tag2> hello <4567>';

            const data = new DataEntity({ field });

            const results = test.run(data);

            expect(results).toEqual({ otherField: ['tag1', '1234', 'tag2', '4567'] });
        });

        it('can have sub capturing groups', () => {
            const opConfig = {
                regex: '<(?:(\\w+)-(\\d+))>.*<(\\d+)>',
                source: 'field',
                target: 'otherField',
                __id: 'someId',
                multivalue: true,
                mutate: false
            };
            const test = new Extraction(opConfig);
            const field = '<tag-1> hello <1234>';

            const data = new DataEntity({ field });

            const results = test.run(data);
            expect(results).toEqual({ otherField: ['tag', '1', '1234'] });
        });
    });

    it('can maintain extract array values to array extractions and singular values to singular extractions', () => {
        // direct field transfer ignores multivalue=false
        const opConfig1 = {
            source: 'someField', target: 'otherField', __id: 'someId', mutate: false, multivalue: false
        };
        const opConfig2 = {
            source: 'someField',
            target: 'otherField',
            __id: 'someId',
            start: 'data=',
            end: 'EOP',
            mutate: false,
        };
        const opConfig3 = {
            source: 'someField',
            target: 'otherField',
            __id: 'someId',
            start: 'data=',
            end: 'EOP',
            mutate: false,
            multivalue: false,
        };

        const test1 = new Extraction(opConfig1);
        const test2 = new Extraction(opConfig2);
        const test3 = new Extraction(opConfig3);

        const resultsData1 = { someField: 'data=value' };
        const resultsData2 = { someField: ['data=value'] };

        const data1 = new DataEntity(resultsData1);
        const data2 = new DataEntity(resultsData2);

        const results1 = test1.run(data1);
        const results2 = test1.run(data2);
        const results3 = test2.run(data1);
        const results4 = test2.run(data2);
        const results5 = test3.run(data1);
        const results6 = test3.run(data2);

        expect(results1).toEqual({ otherField: 'data=value' });
        expect(results2).toEqual({ otherField: ['data=value'] });
        expect(results3).toEqual({ otherField: 'value' });
        expect(results4).toEqual({ otherField: ['value'] });
        expect(results5).toEqual({ otherField: 'value' });
        expect(results6).toEqual({ otherField: 'value' });
    });

    it('multivalue:false matches only return the first match', () => {
        const opConfig = {
            source: 'someField',
            target: 'otherField',
            __id: 'someId',
            start: 'data=',
            end: 'EOP',
            mutate: false,
            multivalue: false,
        };

        const test = new Extraction(opConfig);

        const resultsData1 = { someField: ['data=value'] };
        const resultsData2 = { someField: ['data=other', 'data=value'] };

        const data1 = new DataEntity(resultsData1);
        const data2 = new DataEntity(resultsData2);

        const results1 = test.run(data1);
        const results2 = test.run(data2);

        expect(results1).toEqual({ otherField: 'value' });
        expect(results2).toEqual({ otherField: 'other' });
    });

    it('can mutate existing doc instead of returning a new one', () => {
        const opConfig = {
            source: 'someField', target: 'otherField', mutate: true, __id: 'someId'
        };
        const test = new Extraction(opConfig);

        const dataArray = DataEntity.makeArray([
            { someField: '56.234,95.234' },
            { someField: 'data' },
            { someField: { some: 'data' } },
            { someField: false },
            { someField: 'other' },
            { otherField: 'data' },
        ]);

        const finalArray = dataArray.map((doc) => {
            if (doc.someField !== undefined) {
                doc.otherField = doc.someField;
            }
            return doc;
        });
        const resultsArray = dataArray.map((data) => test.run(data));

        resultsArray.forEach((result, ind) => {
            if (result) expect(DataEntity.isDataEntity(result)).toEqual(true);
            expect(result).toEqual(finalArray[ind]);
        });
    });

    it('can preserve metadata when transforming documents', () => {
        const opConfig = {
            source: 'someField',
            target: 'otherField',
            mutate: true,
            __id: 'someId',
        };
        const opConfig2 = {
            source: 'firstField',
            target: 'secondField',
            mutate: true,
            __id: 'someId',
        };

        const opConfig3 = {
            selector: 'some:data', source: 'someField', target: 'otherField', __id: 'someId', mutate: false
        };

        const test1 = new Extraction(opConfig);
        const test2 = new Extraction(opConfig2);
        const test3 = new Extraction(opConfig3);

        const metaData = { selectors: { 'some:data': true } };

        const data1 = new DataEntity({ someField: 'data', firstField: 'otherthings' }, metaData);
        const data2 = new DataEntity({ someField: 'data' }, metaData);

        const results1 = test1.run(data1);
        const results2 = test2.run(results1 as DataEntity);
        const results3 = test3.run(data2);

        expect(DataEntity.isDataEntity(results2)).toEqual(true);
        expect((results2 as DataEntity).getMetadata('selectors')).toEqual(metaData.selectors);
        expect(DataEntity.isDataEntity(results3)).toEqual(true);
        expect((results3 as DataEntity).getMetadata('selectors')).toEqual(metaData.selectors);
    });

    it('can set a field using expr', () => {
        const opConfig = {
            exp: '20',
            target: 'my_key',
            __id: 'someId',
            multivalue: false,
            mutate: false
        };
        const test = new Extraction(opConfig);
        const data = new DataEntity({ some: 'data' });

        const results = test.run(data);
        expect(results).toEqual({ my_key: 20 });
    });

    it('can use expr to manipulate data', () => {
        const opConfig = {
            exp: '"transformed_" + some ',
            source: 'some',
            target: 'my_key',
            __id: 'someId',
            multivalue: false,
            mutate: false
        };
        const test = new Extraction(opConfig);
        const data = new DataEntity({ some: 'data' });

        const results = test.run(data);

        expect(results).toEqual({ my_key: 'transformed_data' });
    });
});
