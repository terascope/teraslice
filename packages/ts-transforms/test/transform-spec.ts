import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { get, cloneDeep } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import { xLuceneFieldType } from '@terascope/types';
import TestHarness from './test-harness.js';
import { WatcherConfig } from '../src/index.js';
import Plugins from './fixtures/plugins/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('can transform matches', () => {
    let opTest: TestHarness;

    beforeEach(() => {
        opTest = new TestHarness('transform');
    });

    function getPath(fileName: string) {
        return path.join(dirname, `./fixtures/${fileName}`);
    }

    function encode(str: string, type: string) {
        const buff = Buffer.from(str);
        return buff.toString(type as any);
    }

    it('should transform matching data', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules1.txt')],
            type_config: { _created: xLuceneFieldType.Date },
        };

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 200, myfield: 'hello' },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
            { other: 'xabcd', myfield: 'hello' },
            { _created: '2018-12-16T15:16:09.076Z', myfield: 'hello' },
        ]);

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        results.forEach((d) => {
            expect(DataEntity.isDataEntity(d)).toEqual(true);
            expect(get(d, 'topfield.value1')).toEqual('hello');
            expect(d.getMetadata('selectors')).toBeDefined();
        });
    });

    it('can uses typeConifg', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules1.txt')],
            type_config: { location: xLuceneFieldType.Geo },
        };

        const data = DataEntity.makeArray([
            { hostname: 'www.other.com', location: '33.435967,  -111.867710 ' }, //  true
            { hostname: 'www.other.com', location: '33.435967412341452595678,  -111.8677102345324523452345467456 ' }, //  true
            { hostname: 'www.example.com', location: '22.435967,-150.867710' }, //  false
        ]);

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(2);
        expect(results[0]).toEqual({ point: data[0].location });
        expect(results[1]).toEqual({ point: data[1].location });
    });

    it('should transform matching data with no selector', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules3.txt')],
        };

        const data = DataEntity.makeArray([{ data: 'someData' }, { data: 'otherData' }, {}]);
        const resultSet = data.map((obj) => obj.data);
        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(2);
        results.forEach((d, index) => {
            expect(DataEntity.isDataEntity(d)).toEqual(true);
            expect(d.other).toEqual(resultSet[index]);
            expect(d.getMetadata('selectors').includes('*')).toBeTrue();
        });
    });

    it('can work with regex transform queries', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules1.txt')],
        };

        const data = DataEntity.makeArray([
            { some: 'data', someField: 'something' },
            { some: 'data', someField: 'otherthing' }, //  should not return anyting
            { some: 'data' }, //  should not return anyting
        ]);

        const test = await opTest.init(config);
        const results = await test.run(data);
        //  NOTE: 'regex': 'some.*?$'
        //      - will give you the entire matched string => wholeRegexResponse
        //  NOTE: 'regex': 'some(.*?)$'
        //      - will give you the captured part of the string => partRegexResponse

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ wholeRegexResponse: 'something', partRegexResponse: 'thing' });
    });

    it('can extract using start/end', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules1.txt')],
        };

        const data1 = DataEntity.makeArray([{ some: 'data', bytes: 1200, myfield: 'http:// google.com?field1=helloThere&other=things' }]);

        const data2 = DataEntity.makeArray([{ some: 'data', bytes: 1200, myfield: 'http:// google.com?field1=helloThere' }]);

        const test = await opTest.init(config);
        const results1 = await test.run(data1);

        expect(results1.length).toEqual(1);
        expect(results1[0]).toEqual({ topfield: { value1: 'helloThere' } });

        const results2 = await test.run(data2);

        expect(results2.length).toEqual(1);
        expect(results2[0]).toEqual({ topfield: { value1: 'helloThere' } });
    });

    it('can extract using start/end on fields that are arrays', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules10.txt')],
        };
        const urls = [
            'http:// www.example.com/path?field1=blah',
            'http:// www.example.com/path?field2=moreblah',
            'http:// www.example.com/path?field3=evenmoreblah',
        ];

        const data = DataEntity.makeArray([{ domain: 'example.com', url: urls }]);

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ field1: ['blah'], field2: ['moreblah'], field3: ['evenmoreblah'] });
        expect(DataEntity.isDataEntity(results[0])).toEqual(true);
    });

    it('can merge extacted results', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules1.txt')],
        };

        const data = DataEntity.makeArray([
            {
                hostname: 'www.example.com',
                pathLat: '/path/tiles/latitude/33.435967',
                pathLon: '/path/tiles/longitude/-111.867710',
            }, //  true
            {
                hostname: 'www.other.com',
                location: '33.435967,  -111.867710 ',
            }, //  false
            {
                hostname: 'www.example.com',
                location: '22.435967,-150.867710',
            }, //  false
        ]);

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results).toBeArrayOfSize(2);
        expect(results[0]).toEqual({ location: { lat: '33.435967', lon: '-111.867710' } });
        expect(results[1]).toEqual({ point: '33.435967,  -111.867710 ' });
    });

    it('can use post process operations', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules2.txt')],
        };

        const data = DataEntity.makeArray([{ hello: 'world', first: 'John', last: 'Doe' }]);

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ full_name: 'John Doe' });
    });

    it('false validations remove the fields', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules2.txt')],
        };

        const data = DataEntity.makeArray([{ geo: true, lat: '2233', other: 'data' }, { geo: true, lon: '2233' }]);

        const data2 = DataEntity.makeArray([{ geo: true, lat: '2233' }, { geo: true, lon: '2233' }]);

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ other: 'data' });

        const results2 = await test.run(data2);
        expect(results2).toEqual([]);
    });

    it('refs can target the right field', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules4.txt')],
        };

        const data = DataEntity.makeArray([
            {
                hello: 'world', lat: 23.423, lon: 93.33, first: 'John', last: 'Doe'
            }, //  all good
            {
                hello: 'world', lat: 123.423, lon: 93.33, first: 'John', last: 'Doe'
            }, //  bad geo
            {
                hello: 'world', lat: 123.423, lon: 93.33, first: 'John', last: 'Doe'
            }, //  bad geo
            {
                hello: 'world', lat: 23.423, lon: 93.33, full_name: 3243423
            }, //  full_name is not string
        ]);

        const resultSet = [
            {
                location: { lat: 23.423, lon: 93.33 }, first_name: 'John', last_name: 'Doe', full_name: 'John Doe'
            },
            { first_name: 'John', last_name: 'Doe', full_name: 'John Doe' },
            { first_name: 'John', last_name: 'Doe', full_name: 'John Doe' },
            { location: { lat: 23.423, lon: 93.33 } },
        ];

        const test = await opTest.init(config);
        const results = await test.run(data);

        results.forEach((d, index) => {
            // console.log('what is d', d)
            expect(DataEntity.isDataEntity(d)).toEqual(true);
            expect(d).toEqual(resultSet[index]);
            expect(d.getMetadata('selectors')).toBeDefined();
        });
    });

    it('can chain selection => transform => selection', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules5.txt')],
        };

        const data = DataEntity.makeArray([
            { hello: 'world', first: 'John', last: 'Doe' },
            { hello: 'world', first: 'Jane', last: 'Austin' },
            { hello: 'world', first: 'Jane', last: 'Doe' },
            { hello: 'world' },
        ]);

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ first_name: 'Jane', last_name: 'Doe', full_name: 'Jane Doe' });

        const metaData = results[0].getMetadata();
        expect(metaData.selectors).toEqual(['hello:world', 'full_name:"Jane Doe"']);
    });

    it('can chain selection => transform => selection => transform', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules6.txt')],
        };

        const data = DataEntity.makeArray([
            { hello: 'world', first: 'John', last: 'Doe' },
            { hello: 'world', first: 'Jane', last: 'Austin' },
            { hello: 'world', first: 'Jane', last: 'Doe' },
            { hello: 'world' },
        ]);

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({
            first_name: 'Jane',
            full_name: 'Jane Doe',
            last_name: 'Doe',
            transfered_name: 'Jane Doe',
        });

        const metaData = results[0].getMetadata();
        expect(metaData.selectors).toEqual(['hello:world', 'full_name:"Jane Doe"']);
    });

    it('can chain selection => validation => post_process', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules26.txt')],
        };

        const data = DataEntity.makeArray([
            { some: 'value', field: 'some@gmail.com' },
            { some: 'value', field: '12398074##&*' },
            { some: 'value', field: 'other@tera.io' },
        ]);

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(2);
        expect(results[0]).toEqual({ newField: 'some@gmail.com', final: ['gmail'] });
        expect(results[1]).toEqual({ newField: 'other@tera.io', final: ['tera'] });
    });

    it('validations work with the different ways to configure them', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules7.txt')],
        };

        const config2: WatcherConfig = {
            rules: [getPath('transformRules8.txt')],
        };

        const config3: WatcherConfig = {
            rules: [getPath('transformRules9.txt')],
        };

        const data = [
            { hello: 'world', txt: 'first' },
            { hello: 'world', txt: 'second' },
            { hello: 'world', txt: 'third' },
            { hello: 'world' },
        ];

        const transformedData = data.map((doc) => {
            if (doc.txt) {
                const txt = Buffer.from(doc.txt).toString('hex');
                return Object.assign({}, doc, { txt });
            }
            return doc;
        });

        const resultsData1 = data.map((doc) => ({ hex: doc.txt }));

        const data1 = DataEntity.makeArray(cloneDeep(transformedData));
        const data2 = DataEntity.makeArray(cloneDeep(transformedData));
        const data3 = DataEntity.makeArray(cloneDeep(transformedData));

        const test1 = await opTest.init(config);
        const results1 = await test1.run(data1);

        expect(results1.length).toEqual(3);
        results1.forEach((result, ind) => {
            expect(result).toEqual(resultsData1[ind]);
            expect(DataEntity.isDataEntity(result)).toEqual(true);
        });

        const test2 = await opTest.init(config2);
        const results2 = await test2.run(data2);

        expect(results2.length).toEqual(3);
        results2.forEach((result, ind) => {
            expect(result).toEqual(resultsData1[ind]);
            expect(DataEntity.isDataEntity(result)).toEqual(true);
        });

        const test3 = await opTest.init(config3);
        const results3 = await test3.run(data3);

        expect(results3.length).toEqual(3);
        results3.forEach((result, ind) => {
            expect(result).toEqual(resultsData1[ind]);
            expect(DataEntity.isDataEntity(result)).toEqual(true);
        });
    });

    it('can target multiple transforms on the same field', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules10.txt')],
        };

        const data = DataEntity.makeArray([
            { domain: 'example.com', url: 'http:// www.example.com/path?field1=blah&field2=moreblah&field3=evenmoreblah' },
            { domain: 'other.com', url: 'http:// www.example.com/path?field1=blah&field2=moreblah&field3=evenmoreblah' },
            { domain: 'example.com', url: 'http:// www.example.com/path?field5=blah&field6=moreblah&field7=evenmoreblah' },
        ]);

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ field1: 'blah', field2: 'moreblah', field3: 'evenmoreblah' });
        expect(DataEntity.isDataEntity(results[0])).toEqual(true);
    });

    it('can run the two variations of the same config', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules11.txt')],
        };

        const config2: WatcherConfig = {
            rules: [getPath('transformRules12.txt')],
        };

        const formatedWord = Buffer.from('evenmoreblah').toString('base64');
        const url = `http:// www.example.com/path?field1=blah&field2=moreblah&field3=${formatedWord}`;

        const data = [
            { domain: 'example.com', url },
            { domain: 'other.com', url },
            { domain: 'example.com', url: 'http:// www.example.com/path?field5=blah&field6=moreblah&field7=evenmoreblah' },
        ];

        const data1 = DataEntity.makeArray(cloneDeep(data));
        const data2 = DataEntity.makeArray(cloneDeep(data));

        const test1 = await opTest.init(config);
        const results1 = await test1.run(data1);

        expect(results1.length).toEqual(1);
        expect(results1[0]).toEqual({ field3: 'evenmoreblah' });
        expect(DataEntity.isDataEntity(results1[0])).toEqual(true);

        const test2 = await opTest.init(config2);
        const results2 = await test2.run(data2);

        expect(results2.length).toEqual(1);
        expect(results2[0]).toEqual({ field3: 'evenmoreblah' });
        expect(DataEntity.isDataEntity(results2[0])).toEqual(true);
    });

    it('do more basic extractions', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules13.txt')],
        };

        const data = DataEntity.makeArray([{ hello: 'world', data: 'someData' }, { hello: 'world', data: 'otherData' }]);

        const resultSet = [{ other: 'someData' }, { other: 'otherData' }];

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(2);
        results.forEach((d, index) => {
            expect(DataEntity.isDataEntity(d)).toEqual(true);
            expect(d).toEqual(resultSet[index]);
        });
    });

    it('should transform data if previous transforms had occured', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules14.txt')],
        };

        const date = new Date().toISOString();
        const key = '123456789';

        const data = DataEntity.makeArray([
            {
                domain: 'example.com', url: 'http:// www.example.com/path?value=blah&value2=moreblah&value3=evenmoreblah', date, key
            },
        ]);

        // should not expect anything back
        const data2 = DataEntity.makeArray([{
            domain: 'example.com', hello: 'world', data: 'otherData', date, key
        },
        {}]);

        // should not expect anything back
        const data3 = DataEntity.makeArray([
            { domain: 'example.com', url: 'http:// www.example.com/path?value=blah&value2=moreblah&value3=evenmoreblah', date },
            {},
        ]);

        const test1 = await opTest.init(config);
        const results1 = await test1.run(data);

        expect(results1.length).toEqual(1);
        expect(results1[0]).toEqual({
            value: 'blah',
            value2: 'moreblah',
            key,
            date,
        });

        const test2 = await opTest.init(config);
        const results2 = await test2.run(data2);

        expect(results2.length).toEqual(0);
        expect(results2).toEqual([]);

        const test3 = await opTest.init(config);
        const results3 = await test3.run(data3);

        expect(results3.length).toEqual(1);
        expect(results3[0]).toEqual({
            value: 'blah',
            value2: 'moreblah',
            date,
        });
    });

    it('should transform data if previous transforms had occured with other post_processing', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules15.txt')],
        };

        const date = new Date().toISOString();
        const key = '123456789';

        const data = DataEntity.makeArray([
            {
                host: 'fc2.com',
                field1: `http://www.example.com/path?field1=${encode(key, 'base64')}&value2=moreblah&value3=evenmoreblah`,
                date,
                key,
            },
            { host: 'fc2.com', key, date },
            {
                host: 'fc2.com', field1: 'someRandomStr', key, date
            },
            {
                host: 'fc2.com',
                field1: [
                    'someRandomStr',
                    `http://www.example.com/path?field1=${encode(key, 'base64')}&value2=moreblah&value3=evenmoreblah`,
                ],
                key,
                date,
            },
        ]);

        // should not expect anything back
        const data2 = DataEntity.makeArray([{
            domain: 'example.com', hello: 'world', data: 'otherData', date, key
        },
        {}]);

        // should not expect anything back
        const data3 = DataEntity.makeArray([
            { domain: 'example.com', url: 'http://www.example.com/path?value=blah&value2=moreblah&value3=evenmoreblah', date },
            {},
        ]);

        const test1 = await opTest.init(config);
        const results1 = await test1.run(data);

        expect(results1.length).toEqual(2);
        expect(results1[0]).toEqual({
            field1: key,
            date,
        });

        expect(results1[1]).toEqual({
            field1: [key],
            date,
        });

        const test2 = await opTest.init(config);
        const results2 = await test2.run(data2);

        expect(results2.length).toEqual(0);
        expect(results2).toEqual([]);

        const test3 = await opTest.init(config);
        const results3 = await test3.run(data3);

        expect(results3.length).toEqual(0);
        expect(results3).toEqual([]);
    });

    // TODO fix this test description is ambiguous, use describe blocks to group tests
    it('should work like the test before but with different config layout', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules16.txt')],
        };

        const date = new Date().toISOString();
        const key = '123456789';

        const data = DataEntity.makeArray([
            {
                host: 'fc2.com',
                field1: `http://www.example.com/path?field1=${encode(key, 'base64')}&value2=moreblah&value3=evenmoreblah`,
                date,
                key,
            },
            { host: 'fc2.com', key, date },
            {
                host: 'fc2.com', field1: 'someRandomStr', key, date
            },
            {
                host: 'fc2.com',
                field1: [
                    'someRandomStr',
                    `http://www.example.com/path?field1=${encode(key, 'base64')}&value2=moreblah&value3=evenmoreblah`,
                ],
                key,
                date,
            },
            { date, other: 'things' },
        ]);

        // should not expect anything back
        const data2 = DataEntity.makeArray([{
            domain: 'example.com', hello: 'world', data: 'otherData', date, key
        },
        {}]);

        // should not expect anything back
        const data3 = DataEntity.makeArray([
            { domain: 'example.com', url: 'http://www.example.com/path?value=blah&value2=moreblah&value3=evenmoreblah', date },
            {},
        ]);

        const test1 = await opTest.init(config);
        const results1 = await test1.run(data);

        expect(results1.length).toEqual(2);
        expect(results1[0]).toEqual({
            field1: key,
            date,
        });

        expect(results1[1]).toEqual({
            field1: [key],
            date,
        });

        const test2 = await opTest.init(config);
        const results2 = await test2.run(data2);

        expect(results2.length).toEqual(0);
        expect(results2).toEqual([]);

        const test3 = await opTest.init(config);
        const results3 = await test3.run(data3);

        expect(results3.length).toEqual(0);
        expect(results3).toEqual([]);
    });

    it('chaining configurations sample 1', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules17.txt')],
        };
        const key = '123456789';

        const data = DataEntity.makeArray([
            {
                host: 'example.com',
                field1: `http://www.example.com/path?field1=${encode(key, 'base64')}&value2=moreblah&value3=evenmoreblah`,
            },
            { host: 'example.com' },
            { host: 'example.com', field1: 'someRandomStr' },
            {
                host: 'example.com',
                field1: [
                    'someRandomStr',
                    `http://www.example.com/path?field1=${encode(key, 'base64')}&value2=moreblah&value3=evenmoreblah`,
                ],
            },
        ]);

        const test1 = await opTest.init(config);
        const results1 = await test1.run(data);

        expect(results1.length).toEqual(2);
        expect(results1[0]).toEqual({
            field1: key,
        });
        expect(results1[1]).toEqual({
            field1: [key],
        });
    });

    it('build an array with post_process array', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules19.txt')],
        };
        const key = '123456789';

        const data = DataEntity.makeArray([
            { selectfield: 'value' },
            { selectfield: 'value', url: `http://www.example.com/path?field1=${key}&field2=moreblah&field3=evenmoreblah` },
        ]);

        const test1 = await opTest.init(config);
        const results1 = await test1.run(data);

        expect(results1.length).toEqual(1);
        expect(results1[0]).toEqual({
            myfield: [key, 'moreblah'],
        });
    });

    it('build an array with post_process array with validations', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules20.txt')],
        };
        const key = '123456789';

        const data = DataEntity.makeArray([
            { selectfield: 'value' },
            {
                selectfield: 'value',
                url: `http://www.example.com/path?field1=${key}&field2=moreblah&field3=evenmoreblah&field4=finalCountdown`,
            },
        ]);

        const test1 = await opTest.init(config);
        const results1 = await test1.run(data);

        expect(results1.length).toEqual(1);
        expect(results1[0]).toEqual({
            firstSet: [Number(key), 'moreblah'],
            secondSet: ['evenmoreblah', 'finalCountdown'],
        });
    });

    it('can load plugins', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules18.txt')],
        };
        const key = '123456789';

        const data = DataEntity.makeArray([
            { host: 'example.com', field1: `http://www.example.com/path?field1=${key}&value2=moreblah&value3=evenmoreblah` },
            { host: 'example.com' },
            { host: 'example.com', field1: 'someRandomStr' },
            {
                host: 'example.com',
                field1: ['someRandomStr', `http://www.example.com/path?field1=${key}&value2=moreblah&value3=evenmoreblah`],
            },
            { size: 2 },
        ]);
        const test1 = await opTest.init(config, [Plugins]);
        const results1 = await test1.run(data);

        expect(results1.length).toEqual(3);
        expect(results1[0]).toEqual({
            field1: key,
        });
        expect(results1[1]).toEqual({
            field1: [key],
        });
        expect(results1[2]).toEqual({
            height: 4,
        });
    });

    it('can extract json and omit intermediate fields', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules21.txt')],
        };

        const data = [
            new DataEntity({ some: 'value', field: JSON.stringify('something') }),
            new DataEntity({ some: 'value', field: JSON.stringify({ field: 'value' }) }),
        ];

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ myfield: 'value' });
    });

    it('can run and omit fields', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules22.txt')],
        };

        const data = [
            new DataEntity({ some: 'value', field: 'something' }),
            new DataEntity({ some: 'value', field: 'null' }),
            new DataEntity({ some: 'value', field: 'otherthing' }),
        ];

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(2);
        expect(results[0]).toEqual({ newField: 'something' });
        expect(results[1]).toEqual({ newField: 'otherthing' });
    });

    it('other_match_required can have selectors to narrow their fields', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules24.txt')],
        };

        const date = new Date().toISOString();
        const key = '123456789';

        const data1 = DataEntity.makeArray([
            { some: 'value', input: 'stuff' },
            { some: 'value', date },
            { some: 'value', input: 'stuff', date },
            {
                some: 'value', input: 'stuff', date, key
            },
        ]);

        const data2 = DataEntity.makeArray([
            { other: 'value', other_input: 'stuff' },
            { other: 'value', date },
            { other: 'value', other_input: 'stuff', date },
            {
                other: 'value', other_input: 'stuff', date, key
            },
        ]);

        const data1Results = data1.reduce<Record<string, any>[]>((arr, obj) => {
            if (obj.input) {
                const results: any = {};
                results.output = obj.input;
                if (obj.date) results.date = obj.date;
                arr.push(results);
            }
            return arr;
        }, []);

        const data2Results = data2.reduce<Record<string, any>[]>((arr, obj) => {
            if (obj.other_input) {
                const results: any = {};
                results.other_output = obj.other_input;
                if (obj.date) results.date = obj.date;
                if (obj.key) results.output_key = obj.key;
                arr.push(results);
            }
            return arr;
        }, []);

        const test = await opTest.init(config);
        const results1 = await test.run(data1);

        expect(results1.length).toEqual(3);
        results1.forEach((result, ind) => {
            expect(result).toEqual(data1Results[ind]);
        });

        const test2 = await opTest.init(config);
        const results2 = await test2.run(data2);

        expect(results2.length).toEqual(3);
        results2.forEach((result, ind) => {
            expect(result).toEqual(data2Results[ind]);
        });
    });

    it('other_match_required regression test', async () => {
        const config: WatcherConfig = {
            rules: [getPath('warnRules.txt')],
        };

        const data = DataEntity.makeArray([
            { some: 'data', field: 'hello', otherField: 'world' },
            { some: 'data', field: 'hello' },
        ]);

        const finalData = DataEntity.makeArray([
            { final: 'hello', lastField: 'world' },
        ]);

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results).toBeArrayOfSize(1);
        expect(results).toEqual(finalData);
    });

    it('can run a regression test1', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules23.txt')],
        };

        const data = [
            new DataEntity({ somefield: `something&value=${encode('{%20"some":%20"data"}', 'base64')}` }),
            new DataEntity({ field: 'null' }),
        ];

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ hashoutput: { some: 'data' } });
    });

    it('can run a array post_process operation', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules28.txt')],
        };

        const data = [new DataEntity({ hello: 'world', field1: 'hello', field2: 'world' }), new DataEntity({ field: 'null' })];

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ results: ['hello', 'world'] });
    });

    it('can run a dedup post_process operation', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules29.txt')],
        };

        const data = [
            new DataEntity({
                hello: 'world', field1: 'hello', field2: 'world', field3: 'world'
            }),
            new DataEntity({ field: 'null' }),
        ];

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ results: ['hello', 'world'] });
    });

    it('can run multivalue on two different post_process extractions', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules25.txt')],
        };

        const data = [new DataEntity({ some: 'value', other: 'some_data' })];

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results[0]).toEqual({
            field: 'some_data',
            first_copy: ['some_data'],
            second_copy: ['data'],
            third_copy: ['some'],
        });
    });

    it('can apply other_match_required in post_process extraction rule', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules41.txt')],
        };

        const data = [
            new DataEntity({ some: 'data', field1: 'field1=12345', field2: 'yo' }),
            new DataEntity({ some: 'data', field1: 'field1=12345' })
        ];

        const test = await opTest.init(config);
        const results = test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ field3: '1234', field2: 'yo' });
    });

    it('can catch all selector extractions for transformRules31', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules31.txt')],
        };

        const data = [
            new DataEntity({ some: 'value', other: 'some_data', first: '1234' }),
            new DataEntity({ some: 'stuff', field: 'some_data', id: '12345' }),
        ];

        const test = await opTest.init(config, [Plugins]);
        const results = await test.run(data);

        expect(results[0]).toEqual({
            double: 2468,
            thing: 'value',
            data: 'data',
            last: 1234,
        });

        expect(results[1]).toEqual({
            thing: 'stuff',
            valid_id: 12345,
            double: 24690,
        });
    });

    it('*-match-required, no-match-regular-selector and *-selector rule bug', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules32.txt')],
        };

        const data = [new DataEntity({ some: 'stuff', field: 'some_data', id: '12345' })];

        const test = await opTest.init(config, [Plugins]);
        const results = await test.run(data);

        expect(results[0]).toEqual({
            thing: 'stuff',
            valid_id: '12345',
        });
    });

    it('can catch all selector extractions for sameSourceDifferentSelector', async () => {
        const config: WatcherConfig = {
            rules: [getPath('sameSourceDifferentSelector.txt')],
        };

        const data = [
            new DataEntity({ some: 'selector', inputarray: ['Value1=email1@gmail.com', 'Value1=asdfasdf'] }),
            new DataEntity({ some: 'selector2', inputarray: ['Value2=email2@gmail.com', 'Value2=asdfasdf'] }),
        ];

        const test = await opTest.init(config, [Plugins]);
        const results = await test.run(data);

        expect(results[0]).toEqual({ email: ['email1@gmail.com'] });
        expect(results[1]).toEqual({ email: ['email2@gmail.com'] });
    });

    it('properly extract multiple fields, regression test', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules33.txt')],
        };

        const data = [
            new DataEntity({ field1: 'value' })
        ];

        const test = await opTest.init(config, [Plugins]);
        const results = await test.run(data);

        expect(results).toEqual([
            {
                fields: [
                    'value',
                ]
            }
        ]);
    });

    it('can set values in extractions', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules37.txt')],
        };

        const data = [
            new DataEntity({ field1: 'value' })
        ];

        const test = await opTest.init(config, [Plugins]);
        const results = await test.run(data);
        expect(results).toEqual([
            { wasSet: true }
        ]);
    });

    it('can conditionally set values in extractions', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules38.txt')],
        };

        const data = [
            new DataEntity({ html: '<value>' }),
            new DataEntity({ some: 'otherValue' })
        ];

        const test = await opTest.init(config, [Plugins]);
        const results = await test.run(data);
        expect(results).toEqual([
            { output: 'value', count: 20 }
        ]);
    });

    it('can transform with source/target instead of source/target', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules39.txt')],
        };

        const data = [
            new DataEntity({ html: '<value>' }),
            new DataEntity({ some: 'otherValue' })
        ];

        const test = await opTest.init(config, [Plugins]);
        const results = await test.run(data);
        expect(results).toEqual([
            { output: 'value', count: 20 }
        ]);
    });

    it('missing fields test', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules40.txt')],
        };

        const data = [
            new DataEntity({ badField: 'value' }),
        ];

        const test = await opTest.init(config, [Plugins]);
        const results = await test.run(data);

        expect(results).toEqual([]);
    });

    it('should be able to turn a value into an array with jexl', async () => {
        const config: WatcherConfig = {
            rules: [getPath('regression-test1.txt')],
        };

        const data = [
            new DataEntity({ other: 'stuff' }),
            new DataEntity({ field: 'value', other: 'stuff' }),
            new DataEntity({ field: 'value' }),
        ];

        const test = await opTest.init(config, [Plugins]);
        const results = await test.run(data);

        expect(results).toEqual([
            { field: ['value'], other: 'stuff' },
            { field: ['value'] }
        ]);
    });

    it('should be able to turn a value into an array with array post_process', async () => {
        const config: WatcherConfig = {
            rules: [getPath('regression-test2.txt')],
        };

        const data = [
            new DataEntity({ other: 'stuff' }),
            new DataEntity({ field: 'value', other: 'stuff' }),
            new DataEntity({ field: 'value' }),
        ];

        const test = await opTest.init(config, [Plugins]);
        const results = await test.run(data);

        expect(results).toEqual([
            { field: ['value'], other: 'stuff' },
            { field: ['value'] }
        ]);
    });

    it('can run with variables', async () => {
        const config: WatcherConfig = {
            rules: [getPath('transformRules28.txt')],
            variables: {
                hello: 'world'
            }
        };

        const data = [new DataEntity({ hello: 'world', field1: 'hello', field2: 'world' }), new DataEntity({ field: 'null' })];

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ results: ['hello', 'world'] });
    });

    it('should ignore empty strings', async () => {
        const config: WatcherConfig = {
            rules: [getPath('regression-test3.txt')],
        };

        const data = [
            new DataEntity({ field1: false }),
            new DataEntity({ field1: '' }),
            new DataEntity({ field1: null }),
        ];

        const test = await opTest.init(config);
        const results = await test.run(data);

        expect(results).toBeArrayOfSize(0);
    });
});
