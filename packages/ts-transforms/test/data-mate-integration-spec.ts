/* eslint-disable object-curly-newline */
import 'jest-extended';
import { DataEntity, get } from '@terascope/utils';

import { xLuceneFieldType } from '@terascope/types';
import { WatcherConfig } from '../src';
import TestHarness from './test-harness';

describe('DataMate Plugin', () => {
    let opTest: TestHarness;

    beforeEach(() => {
        opTest = new TestHarness('transform');
    });

    function parseRules(arr: any[]) {
        return arr
            .map((obj) => JSON.stringify(obj))
            .join('\n');
    }

    describe('Field Validations', () => {
        it('can run a simple validation', async () => {
            const rules = parseRules([
                { selector: '_exists_:some', source: 'some', target: 'next', tag: 'myTag' },
                { follow: 'myTag', post_process: 'isNumber' }
            ]);

            const config: WatcherConfig = {
                notification_rules: rules,
                type_config: { _created: xLuceneFieldType.Date },
            };

            const data = DataEntity.makeArray([
                { some: 'data', bytes: 200, myfield: 'hello' },
                { some: 3, bytes: 200 },
                { some: 'other', bytes: 1200 },
                { other: 'xabcd', myfield: 'hello' },
                { _created: '2018-12-16T15:16:09.076Z', myfield: 'hello' },
            ]);

            const test = await opTest.init(config);
            const results = await test.run(data);

            expect(results.length).toEqual(1);
            results.forEach((d) => {
                expect(DataEntity.isDataEntity(d)).toEqual(true);
                expect(d).toEqual({ next: 3 });
                expect(d.getMetadata('selectors')).toBeDefined();
            });
        });

        it('can run a simple validation and negate it', async () => {
            const rules = parseRules([
                { selector: '_exists_:some', source: 'some', target: 'next', tag: 'myTag' },
                { follow: 'myTag', post_process: 'isNumber', output: false }
            ]);

            const config: WatcherConfig = {
                notification_rules: rules,
                type_config: { _created: xLuceneFieldType.Date },
            };

            const data = DataEntity.makeArray([
                { some: 'data', bytes: 200, myfield: 'hello' },
                { some: 3, bytes: 200 },
                { some: 'other', bytes: 1200 },
                { other: 'xabcd', myfield: 'hello' },
                { _created: '2018-12-16T15:16:09.076Z', myfield: 'hello' },
            ]);

            const test = await opTest.init(config);
            const results = await test.run(data);

            expect(results.length).toEqual(2);
            results.forEach((d) => {
                expect(DataEntity.isDataEntity(d)).toEqual(true);
                expect(['data', 'other'].includes(d.some)).toBeTrue();
                expect(d.getMetadata('selectors')).toBeDefined();
            });
        });

        it('can run a simple validation and negate it', async () => {
            const rules = parseRules([
                { selector: '_exists_:some', source: 'some', target: 'next', tag: 'myTag' },
                { follow: 'myTag', post_process: 'isNumber', output: false }
            ]);

            const config: WatcherConfig = {
                notification_rules: rules,
                type_config: { _created: xLuceneFieldType.Date },
            };

            const data = DataEntity.makeArray([
                { some: 'data', bytes: 200, myfield: 'hello' },
                { some: 3, bytes: 200 },
                { some: 'other', bytes: 1200 },
                { other: 'xabcd', myfield: 'hello' },
                { _created: '2018-12-16T15:16:09.076Z', myfield: 'hello' },
            ]);

            const test = await opTest.init(config);
            const results = await test.run(data);

            expect(results.length).toEqual(2);
            results.forEach((d) => {
                expect(DataEntity.isDataEntity(d)).toEqual(true);
                expect(['data', 'other'].includes(d.some)).toBeTrue();
                expect(d.getMetadata('selectors')).toBeDefined();
            });
        });
    });
});
