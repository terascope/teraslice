import { cloneDeep } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import { Geolocation } from '../../../src/operations';

describe('geolocation validation', () => {
    it('can instantiate', () => {
        const opConfig = {
            source: 'someField', target: 'someField', __id: 'someId', follow: 'otherId'
        };
        expect(() => new Geolocation(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source: 1324 };
        const badConfig2 = { source: '' };
        const badConfig3 = { source: {} };
        const badConfig4 = {};
        // @ts-expect-error
        expect(() => new Geolocation(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new Geolocation(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new Geolocation(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new Geolocation(badConfig4)).toThrow();
    });

    it('can validate geo fields', () => {
        const opConfig = {
            source: 'location', target: 'location', __id: 'someId', follow: 'otherId'
        };
        const test = new Geolocation(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ location: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ location: ' 56.234,   95.234 ' });
        const data3 = new DataEntity({ location: '56.234' });
        const data4 = new DataEntity({ location: 12341234 });
        const data5 = new DataEntity({ location: [{ some: 'data' }] });
        const data6 = new DataEntity({ location: { lat: 'thing' } });
        const data7 = new DataEntity({ location: { lat: '56.234', lon: '95.234' } });
        const data8 = new DataEntity({ location: { latitude: '56.234', longitude: '95.234' } }, metaData);
        const data9 = new DataEntity({ location: { longitude: { other: 'things' } } });
        const data10 = new DataEntity({ location: '56.23424357895435,95.23423450985438972' }, metaData);
        const data11 = new DataEntity(
            { location: ['56.23424357895435,95.23423450985438972', 12342, { other: 'things' }, 'hello,world'] },
            metaData
        );

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));
        const results6 = test.run(cloneDeep(data6));
        const results7 = test.run(cloneDeep(data7));
        const results8 = test.run(cloneDeep(data8));
        const results9 = test.run(cloneDeep(data9));
        const results10 = test.run(cloneDeep(data10));
        const results11 = test.run(cloneDeep(data11));

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(results1?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual(null);
        expect(results4).toEqual(null);
        expect(results5).toEqual(null);
        expect(results6).toEqual(null);
        expect(DataEntity.isDataEntity(results7)).toEqual(true);
        expect(results7).toEqual(data7);
        expect(DataEntity.isDataEntity(results8)).toEqual(true);
        expect(results8).toEqual(data8);
        expect(results8?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results9).toEqual(null);
        expect(results10).toEqual(data10);
        expect(results11).toEqual({ location: ['56.23424357895435,95.23423450985438972'] });
    });

    it('can validate nested fields', async () => {
        const opConfig = {
            source: 'event.location', target: 'event.location', __id: 'someId', follow: 'otherId'
        };
        const metaData = { selectors: { 'some:query': true } };

        const test = new Geolocation(opConfig);

        const data1 = new DataEntity({ event: 'something' });
        const data2 = new DataEntity({ event: {} });
        const data3 = new DataEntity({ event: { location: '56.234,95.234' } }, metaData);
        const data4 = new DataEntity({ event: { location: { lat: '56.234', lon: '95.234' } } }, metaData);
        const data5 = new DataEntity({ event: { location: 'sadrasfwe32q' } });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));

        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual(data3);
        expect(results4).toEqual(data4);
        expect(results5).toEqual(data2);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
    });
});
