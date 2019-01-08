
import { DataEntity } from '@terascope/job-components';
import path from 'path';
import _ from 'lodash';
import TestHarness from './test-harness';

describe('matcher', () => {
    const matchRules1Path = path.join(__dirname, './fixtures/matchRules1.txt');

    let opTest: TestHarness;

    beforeEach(() => {
        opTest = new TestHarness;
    });

    it('can return matching documents', async () => {
        const config = {
            rules: [matchRules1Path],
            types: { _created: 'date' },
            type: 'matcher'
        };

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200 },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
            { other: 'xabcd' },
            { _created: '2018-12-16T15:16:09.076Z' }
        ]);

        const test = await opTest.init(config);
        const results =  await test.run(data);

        expect(results.length).toEqual(3);
    });

    it('it add metadata to returning docs', async () => {
        const config = {
            rules: [matchRules1Path],
            types: { _created: 'date' },
            type: 'matcher'
        };

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200 },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
            { other: 'xabcd' },
            { _created: '2018-12-16T15:16:09.076Z' }
        ]);

        const test = await opTest.init(config);
        const results: DataEntity[] =  await test.run(data);

        expect(results.length).toEqual(3);
        results.forEach(doc => expect(doc.getMetadata('selectors')).toBeDefined());
    });

    it('it can match multiple rules', async () => {
        const config = {
            rules: [matchRules1Path],
            types: { _created: 'date' },
            type: 'matcher'
        };

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200, _created: '2018-12-16T15:16:09.076Z' },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 }
        ]);

        const rules = {
            'some:data AND bytes:>=1000': true,
            'other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z': true
        };

        const test = await opTest.init(config);
        const results =  await test.run(data);
        // each match will be inserted into the results
        expect(results.length).toEqual(1);
        expect(results[0].getMetadata('selectors')).toEqual(rules);
    });
});
