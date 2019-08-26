
import _ from 'lodash';
import path from 'path';
import { DataEntity } from '@terascope/utils';
import { FieldType } from 'xlucene-evaluator';
import TestHarness from './test-harness';
import { WatcherConfig } from '../src';

describe('matcher', () => {
    const matchRules1Path = path.join(__dirname, './fixtures/matchRules1.txt');

    let opTest: TestHarness;

    beforeEach(() => {
        opTest = new TestHarness('matcher');
    });

    it('can return matching documents', async () => {
        const config: WatcherConfig = {
            rules: [matchRules1Path],
            types: { _created: FieldType.Date },
        };

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200 },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
            { other: 'xabcd' },
            { _created: '2018-12-16T15:16:09.076Z' },
        ]);

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(3);
    });

    it('should add metadata to returning docs', async () => {
        const config: WatcherConfig = {
            rules: [matchRules1Path],
            types: { _created: FieldType.Date },
        };

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200 },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
            { other: 'xabcd' },
            { _created: '2018-12-16T15:16:09.076Z' },
        ]);

        const test = await opTest.init(config);
        const results: DataEntity[] = await test.run(data);

        expect(results.length).toEqual(3);
        results.forEach((doc) => expect(doc.getMetadata('selectors')).toBeDefined());
    });

    it('should match multiple rules', async () => {
        const config: WatcherConfig = {
            rules: [matchRules1Path],
            types: { _created: FieldType.Date },
        };

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200, _created: '2018-12-16T15:16:09.076Z' },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
        ]);

        const rules = ['some:data AND bytes:>=1000', 'other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z'];

        const test = await opTest.init(config);
        const results = await test.run(data);
        // each match will be inserted into the results
        expect(results.length).toEqual(1);
        expect(results[0].getMetadata('selectors')).toEqual(rules);
    });

    it('matcher can run with notification rules', async () => {
        const rules = [
            'some:data AND bytes:>=1000',
            'other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z'
        ];

        const config: WatcherConfig = {
            types: { _created: FieldType.Date },
            notification_rules: rules.join('\n')
        };

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200, _created: '2018-12-16T15:16:09.076Z' },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 }
        ]);

        const test = await opTest.init(config);
        const results =  await test.run(data);
        // each match will be inserted into the results
        expect(results.length).toEqual(1);
        expect(results[0].getMetadata('selectors')).toEqual(rules);
    });

    it('matcher throws with bad notification rules', async () => {
        const rules1 = [
            'some:data AND bytes:>=1000',
            'alasdf{789q;lk]erasp98d7@'
        ];

        const config1: WatcherConfig = {
            types: { _created: FieldType.Date },
            notification_rules: rules1.join('\n')
        };

        await expect(opTest.init(config1)).toReject();
    });
});
