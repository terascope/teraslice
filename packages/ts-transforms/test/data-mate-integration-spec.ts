import 'jest-extended';
import { DataEntity } from '@terascope/core-utils';
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
                { follow: 'myTag', validation: 'isNumber' }
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
            const results = test.run(data);

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
                { follow: 'myTag', validation: 'isNumber', output: false }
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
            const results = test.run(data);

            expect(results.length).toEqual(2);
            results.forEach((d) => {
                expect(DataEntity.isDataEntity(d)).toEqual(true);
                expect(['data', 'other'].includes(d.next)).toBeTrue();
                expect(d.getMetadata('selectors')).toBeDefined();
            });
        });

        it('can properly validate fields with output:false and does not add missing fields to output', async () => {
            const rules = parseRules([
                { source_field: 'name', target_field: 'name', other_match_required: true },
                { source_field: 'state', target_field: 'place', tag: 'stateName' },
                { follow: 'stateName', validation: 'equals', value: 'arizona', output: false }
            ]);

            const config: WatcherConfig = {
                notification_rules: rules,
                type_config: { _created: xLuceneFieldType.Date },
            };

            const data = DataEntity.makeArray([
                { name: 'mel', state: 'colorado' },
                { name: 'kip', state: 'arizona' },
                { name: 'jr' }
            ]);

            const test = await opTest.init(config);
            const results = test.run(data);

            expect(results.length).toBe(1);

            expect(results[0]).toEqual(DataEntity.make({ name: 'mel', place: 'colorado' }));
        });

        it('can properly validate array fields with output:false and does not add missing fields to output', async () => {
            const rules = parseRules([
                { source_field: 'name', target_field: 'name', other_match_required: true },
                { source_field: 'state', target_field: 'place', tag: 'stateName' },
                { follow: 'stateName', validation: 'equals', value: 'arizona', output: false }
            ]);

            const config: WatcherConfig = {
                notification_rules: rules,
                type_config: { _created: xLuceneFieldType.Date },
            };

            const data = DataEntity.makeArray([
                { name: 'mel', state: 'colorado' },
                { name: 'kip', state: ['arizona', 'utah', 'idaho'] },
                { name: 'jr' }
            ]);

            const test = await opTest.init(config);
            const results = test.run(data);

            expect(results.length).toBe(2);

            expect(results[0]).toEqual(DataEntity.make({ name: 'mel', place: 'colorado' }));
            expect(results[1]).toEqual(DataEntity.make({ name: 'kip', place: ['utah', 'idaho'] }));
        });

        it('can run a simple validation with array values', async () => {
            const rules = parseRules([
                { selector: '_exists_:list', source: 'list', target: 'next', tag: 'myTag' },
                { follow: 'myTag', validation: 'isNumber' }
            ]);

            const config: WatcherConfig = {
                notification_rules: rules,
                type_config: { _created: xLuceneFieldType.Date },
            };

            const data = DataEntity.makeArray([
                { list: 'data', bytes: 200, myfield: 'hello' },
                { list: 3, bytes: 200 },
                { list: [1, 'hello', 3], bytes: 1200 },
                { other: 'xabcd', myfield: 'hello' },
                { _created: '2018-12-16T15:16:09.076Z', myfield: 'hello' },
            ]);

            const test = await opTest.init(config);
            const results = test.run(data);

            expect(results.length).toEqual(2);
            expect(results).toEqual([{ next: 3 }, { next: [1, 3] }]);
        });

        it('can respect functions that take inputs as arrays', async () => {
            const rules = parseRules([
                { selector: '_exists_:list', source: 'list', target: 'next', tag: 'myTag' },
                { follow: 'myTag', validation: 'isArray' }
            ]);

            const config: WatcherConfig = {
                notification_rules: rules,
                type_config: { _created: xLuceneFieldType.Date },
            };

            const data = DataEntity.makeArray([
                { list: 'data', bytes: 200, myfield: 'hello' },
                { list: 3, bytes: 200 },
                { list: [1, 'hello', 3], bytes: 1200 },
                { other: 'xabcd', myfield: 'hello' },
                { _created: '2018-12-16T15:16:09.076Z', myfield: 'hello' },
            ]);

            const test = await opTest.init(config);
            const results = test.run(data);

            expect(results.length).toEqual(1);
            expect(results).toEqual([{ next: [1, 'hello', 3] }]);
        });
    });

    describe('Field Transforms', () => {
        it('can run a simple transform', async () => {
            const rules = parseRules([
                { selector: '_exists_:some', source: 'some', target: 'next', tag: 'myTag' },
                { follow: 'myTag', validation: 'isNumber', tag: 'isNumberNow' },
                { follow: 'isNumberNow', post_process: 'toString' }
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
            const results = test.run(data);

            expect(results.length).toEqual(1);
            results.forEach((d) => {
                expect(DataEntity.isDataEntity(d)).toEqual(true);
                expect(d).toEqual({ next: '3' });
                expect(d.getMetadata('selectors')).toBeDefined();
            });
        });

        it('can run a simple transforms on arrays', async () => {
            const rules = parseRules([
                { selector: '_exists_:some', source: 'some', target: 'next', tag: 'myTag' },
                { follow: 'myTag', validation: 'isNumber', tag: 'isNumberNow' },
                { follow: 'isNumberNow', post_process: 'toString' }
            ]);

            const config: WatcherConfig = {
                notification_rules: rules,
                type_config: { _created: xLuceneFieldType.Date },
            };

            const data = DataEntity.makeArray([
                { some: 'data', bytes: 200, myfield: 'hello' },
                { some: [1, 'hello', 3], bytes: 200 },
                { some: 'other', bytes: 1200 },
                { other: 'xabcd', myfield: 'hello' },
                { _created: '2018-12-16T15:16:09.076Z', myfield: 'hello' },
            ]);

            const test = await opTest.init(config);
            const results = test.run(data);

            expect(results.length).toEqual(1);
            results.forEach((d) => {
                expect(DataEntity.isDataEntity(d)).toEqual(true);
                expect(d).toEqual({ next: ['1', '3'] });
                expect(d.getMetadata('selectors')).toBeDefined();
            });
        });

        it('can respect functions that take input as arrays', async () => {
            const rules = parseRules([
                { selector: '_exists_:some', source: 'some', target: 'next', tag: 'myTag' },
                { follow: 'myTag', validation: 'isNumber', tag: 'isNumberNow' },
                { follow: 'isNumberNow', post_process: 'dedupe' }
            ]);

            const config: WatcherConfig = {
                notification_rules: rules,
                type_config: { _created: xLuceneFieldType.Date },
            };

            const data = DataEntity.makeArray([
                { some: 'data', bytes: 200, myfield: 'hello' },
                { some: [1, 'hello', 3, 1, 4, 3], bytes: 200 },
                { some: 'other', bytes: 1200 },
                { other: 'xabcd', myfield: 'hello' },
                { _created: '2018-12-16T15:16:09.076Z', myfield: 'hello' },
            ]);

            const test = await opTest.init(config);
            const results = test.run(data);

            expect(results.length).toEqual(1);
            results.forEach((d) => {
                expect(DataEntity.isDataEntity(d)).toEqual(true);
                expect(d).toEqual({ next: [1, 3, 4] });
                expect(d.getMetadata('selectors')).toBeDefined();
            });
        });
    });

    describe('Record Validations', () => {
        it('can run simple record validations', async () => {
            const rules = parseRules([
                { selector: '_exists_:some', source: 'some', target: 'next', tag: 'myTag' },
                { follow: 'myTag', validation: 'isString', tag: 'isStringNow' },
                { follow: 'isStringNow', post_process: 'select', query: 'next:data' }
            ]);

            const config: WatcherConfig = {
                notification_rules: rules,
                type_config: { _created: xLuceneFieldType.Date },
            };

            const data = DataEntity.makeArray([
                { some: 'data', bytes: 200, myfield: 'hello' },
                { some: [1, 'hello', 3, 1, 4, 3], bytes: 200 },
                { some: 'other', bytes: 1200 },
                { other: 'xabcd', myfield: 'hello' },
                { _created: '2018-12-16T15:16:09.076Z', myfield: 'hello' },
            ]);

            const test = await opTest.init(config);
            const results = test.run(data);

            expect(results.length).toEqual(1);
            results.forEach((d) => {
                expect(DataEntity.isDataEntity(d)).toEqual(true);
                expect(d).toEqual({ next: 'data' });
                expect(d.getMetadata('selectors')).toBeDefined();
            });
        });
    });

    describe('Record Transforms', () => {
        it('can run simple record transform', async () => {
            const rules = parseRules([
                { selector: '_exists_:some', source: 'some', target: 'next', tag: 'myTag' },
                { follow: 'myTag', validation: 'isNumber', tag: 'isNumberNow' },
                { follow: 'isNumberNow', post_process: 'setField', field: 'other', value: 'foo' }
            ]);

            const config: WatcherConfig = {
                notification_rules: rules,
                type_config: { _created: xLuceneFieldType.Date },
            };

            const data = DataEntity.makeArray([
                { some: 'data', bytes: 200, myfield: 'hello' },
                { some: [1, 'hello', 3], bytes: 200 },
                { some: 'other', bytes: 1200 },
                { other: 'xabcd', myfield: 'hello' },
                { _created: '2018-12-16T15:16:09.076Z', myfield: 'hello' },
            ]);

            const test = await opTest.init(config);
            const results = test.run(data);

            expect(results.length).toEqual(1);
            results.forEach((d) => {
                expect(DataEntity.isDataEntity(d)).toEqual(true);
                expect(d).toEqual({ next: [1, 3], other: 'foo' });
                expect(d.getMetadata('selectors')).toBeDefined();
            });
        });
    });
});
