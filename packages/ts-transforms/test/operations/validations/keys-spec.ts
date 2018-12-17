
import { Keys } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('number validation', () => {
   
    it('can instantiate', () => {
        const opConfig = { someField: true };
        expect(() => new Keys(opConfig)).not.toThrow()
    });

    it('can ensure keys exists and that there are more then the keys specified', () => {
        const config = { field: true, otherField: true };
        const test =  new Keys(config);

        const data1 = new DataEntity({});
        const data2 = new DataEntity({ bytes: 123423 });
        const data3 = new DataEntity({ bytes: 123423, field: "data" });
        const data4 = new DataEntity({ field: "data", otherField: 'otherData' });
        const data5 = new DataEntity({ bytes: 123423, field: "data", otherField: 'otherData' });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);

        expect(results1).toEqual(null);
        expect(results2).toEqual(null);
        expect(results3).toEqual(null);
        expect(results4).toEqual(null);
        expect(results5).toEqual({ bytes: 123423, field: "data", otherField: 'otherData' });
    });
});