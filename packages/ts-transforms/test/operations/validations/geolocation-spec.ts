
import { Geolocation } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('geolocation validation', () => {
   
    it('can instantiate', () => {
        const opConfig = { source_field: 'someField' };
        expect(() => new Geolocation(opConfig)).not.toThrow()
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source_field: 1324 };
        const badConfig2 = { source_field: "" };
        const badConfig3 = { source_field: {} };
        const badConfig4 = {};
        //@ts-ignore
        expect(() => new Geolocation(badConfig1)).toThrow();
        expect(() => new Geolocation(badConfig2)).toThrow();
        //@ts-ignore
        expect(() => new Geolocation(badConfig3)).toThrow();
        expect(() => new Geolocation(badConfig4)).toThrow();
    });

    it('can validate geo fields', () => {
        const opConfig = { source_field: 'location' };
        const test =  new Geolocation(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

        const data1 = new DataEntity({ location: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ location: ' 56.234,   95.234 ' });
        const data3 = new DataEntity({ location: '56.234' });
        const data4 = new DataEntity({ location: 12341234 });
        const data5 = new DataEntity({ location: [{ some: 'data' }] });
        const data6 = new DataEntity({ location: { lat: 'thing'} });
        const data7 = new DataEntity({ location: { lat: '56.234', lon: '95.234'} });
        const data8 = new DataEntity({ location: { latitude: '56.234', longitude: '95.234'} }, metaData);
        const data9 = new DataEntity({ location: { longitude: { other:'things'}} });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);
        const results8 = test.run(data8);
        const results9 = test.run(data9);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData.selectors)
        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual({});
        expect(results4).toEqual({});
        expect(results5).toEqual({});
        expect(results6).toEqual({});
        expect(DataEntity.isDataEntity(results7)).toEqual(true);
        expect(results7).toEqual(data7);
        expect(DataEntity.isDataEntity(results8)).toEqual(true);
        expect(results8).toEqual(data8);
        expect(DataEntity.getMetadata(results8 as DataEntity, 'selectors')).toEqual(metaData.selectors)
        expect(results9).toEqual({});
    });
});
