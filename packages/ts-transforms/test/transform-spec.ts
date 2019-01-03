import { DataEntity } from '@terascope/job-components';
import path from 'path';
import _ from 'lodash';
import TestHarness from './test-harness';
import { WatcherConfig } from '../src/interfaces';

describe('can transform matches', () => {

    let opTest: TestHarness;

    beforeEach(() => {
        opTest = new TestHarness;
    });

    function getPath(fileName:string) {
        return path.join(__dirname, `./fixtures/${fileName}`);
    }

    it('it can transform matching data', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules1.txt'),
            selector_config: { _created: 'date' },
            type: 'transform'
        };

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 200, myfield: 'hello' },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
            { other: 'xabcd', myfield: 'hello' },
            { _created: '2018-12-16T15:16:09.076Z', myfield: 'hello' }
        ]);

        const test = await opTest.init(config);
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        _.each(results, (data) => {
            expect(DataEntity.isDataEntity(data)).toEqual(true);
            expect(_.get(data, 'topfield.value1')).toEqual('hello');
            expect(data.getMetadata('selectors')).toBeDefined();
        });
    });

    it('can uses typeConifg', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules1.txt'),
            selector_config: { location: 'geo' },
            type: 'transform'
        };

        const data = DataEntity.makeArray([
            { hostname: 'www.other.com', location: '33.435967,  -111.867710 ' }, //  true
            { hostname: 'www.other.com', location: '33.435967412341452595678,  -111.8677102345324523452345467456 ' }, //  true
            { hostname: 'www.example.com', location: '22.435967,-150.867710' }  //  false
        ]);

        const test = await opTest.init(config);
        const results =  await test.run(data);

        expect(results.length).toEqual(2);
        expect(results[0]).toEqual({ point: data[0].location });
        expect(results[1]).toEqual({ point: data[1].location });
    });

    it('it can transform matching data with no selector', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules3.txt'),
            type: 'transform'
        };

        const data = DataEntity.makeArray([
           { data: 'someData' },
           { data: 'otherData' },
           {}
        ]);
        const resultSet = data.map(obj => obj.data);
        const test = await opTest.init(config);
        const results =  await test.run(data);

        expect(results.length).toEqual(2);
        _.each(results, (data, index) => {
            expect(DataEntity.isDataEntity(data)).toEqual(true);
            expect(data.other).toEqual(resultSet[index]);
            expect(data.getMetadata('selectors')['*']).toBeDefined();
        });
    });

    it('can work with regex transform queries', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules1.txt'),
            type: 'transform'
        };

        const data = DataEntity.makeArray([
            { some: 'data', someField: 'something' },
            { some: 'data', someField: 'otherthing' },   //  should not return anyting
            { some: 'data' },    //  should not return anyting
        ]);

        const test = await opTest.init(config);
        const results =  await test.run(data);
        //  NOTE:   'regex': 'some.*?$' will give you the entire matched string => wholeRegexResponse
        //  NOTE:   'regex': 'some(.*?)$' will give you the captured part of the string => partRegexResponse

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ wholeRegexResponse: 'something', partRegexResponse: 'thing' });
    });

    it('can extract using start/end', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules1.txt'),
            type: 'transform'
        };

        const data1 = DataEntity.makeArray([
            { some: 'data', bytes: 1200 , myfield: 'http:// google.com?field1=helloThere&other=things' },
        ]);

        const data2 = DataEntity.makeArray([
                { some: 'data', bytes: 1200 , myfield: 'http:// google.com?field1=helloThere' },
        ]);

        const test = await opTest.init(config);
        const results1 =  await test.run(data1);

        expect(results1.length).toEqual(1);
        expect(results1[0]).toEqual({ topfield: { value1: 'helloThere' } });

        const results2 =  await test.run(data2);

        expect(results2.length).toEqual(1);
        expect(results2[0]).toEqual({ topfield: { value1: 'helloThere' } });
    });

    it('can extract using start/end on fields that are arrays', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules10.txt'),
            type: 'transform'
        };
        const urls = [
            'http:// www.example.com/path?field1=blah',
            'http:// www.example.com/path?field2=moreblah',
            'http:// www.example.com/path?field3=evenmoreblah'
        ];

        const data = DataEntity.makeArray([
            { domain: 'example.com', url: urls },
        ]);

        const test = await opTest.init(config);
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ field1: 'blah', field2: 'moreblah', field3: 'evenmoreblah' });
        expect(DataEntity.isDataEntity(results[0])).toEqual(true);
    });

    it('can merge extacted results', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules1.txt'),
            type: 'transform'
        };

        const data = DataEntity.makeArray([
            { hostname: 'www.example.com', pathLat: '/path/tiles/latitude/33.435967', pathLon: '/path/tiles/longitude/-111.867710' }, //  true
            { hostname: 'www.other.com', location: '33.435967,  -111.867710 ' }, //  false
            { hostname: 'www.example.com', location: '22.435967,-150.867710' }  //  false
        ]);

        const test = await opTest.init(config);
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ location: { lat: '33.435967', lon: '-111.867710' } });
    });

    it('can use post process operations', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules2.txt'),
            type: 'transform'
        };

        const data = DataEntity.makeArray([
            { hello: 'world', first: 'John', last: 'Doe' }
        ]);

        const test = await opTest.init(config);
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ full_name: 'John Doe' });
    });

    it('false validations remove the fields', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules2.txt'),
            type: 'transform'
        };

        const data = DataEntity.makeArray([
            { geo: true, lat: '2233', other: 'data' },
            { geo: true, lon: '2233' }
        ]);

        const data2 = DataEntity.makeArray([
            { geo: true, lat: '2233' },
            { geo: true, lon: '2233' }
        ]);

        const test = await opTest.init(config);
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ other: 'data' });

        const results2 =  await test.run(data2);
        expect(results2).toEqual([]);
    });

    it('refs can target the right field', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules4.txt'),
            type: 'transform'
        };

        const data = DataEntity.makeArray([
            { hello: 'world', lat: 23.423, lon: 93.33, first: 'John', last: 'Doe' }, //  all good
            { hello: 'world', lat: 123.423, lon: 93.33, first: 'John', last: 'Doe' }, //  bad geo
            { hello: 'world', lat: 123.423, lon: 93.33, first: 'John', last: 'Doe' }, //  bad geo
            { hello: 'world', lat: 23.423, lon: 93.33, full_name: 3243423 } //  full_name is not string
        ]);

        const resultSet = [
            { location: { lat: 23.423, lon: 93.33 }, first_name: 'John', last_name: 'Doe', full_name: 'John Doe' },
            { first_name: 'John', last_name: 'Doe', full_name: 'John Doe' },
            { first_name: 'John', last_name: 'Doe', full_name: 'John Doe' },
            { location: { lat: 23.423, lon: 93.33 } }
        ];

        const test = await opTest.init(config);
        const results =  await test.run(data);

        _.each(results, (data, index) => {
            expect(DataEntity.isDataEntity(data)).toEqual(true);
            expect(data).toEqual(resultSet[index]);
            expect(data.getMetadata('selectors')).toBeDefined();
        });
    });

    it('can chain selection => transform => selection', async() => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules5.txt'),
            type: 'transform'
        };

        const data = DataEntity.makeArray([
            { hello: 'world',  first: 'John', last: 'Doe' },
            { hello: 'world',  first: 'Jane', last: 'Austin' },
            { hello: 'world',  first: 'Jane', last: 'Doe' },
            { hello: 'world' }
        ]);

        const test = await opTest.init(config);
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ first_name: 'Jane', last_name: 'Doe', full_name: 'Jane Doe' });

        const metaData = results[0].getMetadata();
        expect(metaData.selectors).toEqual({ 'hello:world': true, 'full_name:"Jane Doe"': true });
    });

    it('can chain selection => transform => selection => transform', async() => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules6.txt'),
            type: 'transform'
        };

        const data = DataEntity.makeArray([
            { hello: 'world',  first: 'John', last: 'Doe' },
            { hello: 'world',  first: 'Jane', last: 'Austin' },
            { hello: 'world',  first: 'Jane', last: 'Doe' },
            { hello: 'world' }
        ]);

        const test = await opTest.init(config);
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ name: 'Jane Doe' });

        const metaData = results[0].getMetadata();
        expect(metaData.selectors).toEqual({ 'hello:world': true, 'full_name:"Jane Doe"': true });
    });

    it('validations work with the different ways to configure them', async() => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules7.txt'),
            type: 'transform'
        };

        const config2: WatcherConfig = {
            file_path: getPath('transformRules8.txt'),
            type: 'transform'
        };

        const config3: WatcherConfig = {
            file_path: getPath('transformRules9.txt'),
            type: 'transform'
        };

        const data = [
            { hello: 'world', txt: 'first' },
            { hello: 'world',  txt: 'second' },
            { hello: 'world', txt: 'third' },
            { hello: 'world' }
        ];

        const transformedData = data.map((doc) => {
            if (doc.txt) {
                const txt = Buffer.from(doc.txt).toString('hex');
                return Object.assign({}, doc, { txt });
            }
            return doc;
        });

        const resultsData1 = data.map(doc => ({ hex: doc.txt }));
        const finalResults = data.map(doc => ({ final: doc.txt }));

        const finalData = DataEntity.makeArray(transformedData);

        const test1 = await opTest.init(config);
        const results1 =  await test1.run(finalData);

        expect(results1.length).toEqual(3);
        _.each(results1, (result, ind) => {
            expect(result).toEqual(resultsData1[ind]);
            expect(DataEntity.isDataEntity(result)).toEqual(true);
        });

        const test2 = await opTest.init(config2);
        const results2 =  await test2.run(finalData);

        expect(results2.length).toEqual(3);
        _.each(results2, (result, ind) => {
            expect(result).toEqual(resultsData1[ind]);
            expect(DataEntity.isDataEntity(result)).toEqual(true);
        });

        const test3 = await opTest.init(config3);
        const results3 =  await test3.run(finalData);

        expect(results3.length).toEqual(3);
        _.each(results3, (result, ind) => {
            expect(result).toEqual(finalResults[ind]);
            expect(DataEntity.isDataEntity(result)).toEqual(true);
        });
    });

    it('can target multiple transforms on the same field', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules10.txt'),
            type: 'transform'
        };

        const data = DataEntity.makeArray([
            { domain: 'example.com', url: 'http:// www.example.com/path?field1=blah&field2=moreblah&field3=evenmoreblah' },
            { domain: 'other.com', url: 'http:// www.example.com/path?field1=blah&field2=moreblah&field3=evenmoreblah' },
            { domain: 'example.com', url: 'http:// www.example.com/path?field5=blah&field6=moreblah&field7=evenmoreblah' }
        ]);

        const test = await opTest.init(config);
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ field1: 'blah', field2: 'moreblah', field3: 'evenmoreblah' });
        expect(DataEntity.isDataEntity(results[0])).toEqual(true);
    });

    it('can run', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules11.txt'),
            type: 'transform'
        };

        const config2: WatcherConfig = {
            file_path: getPath('transformRules12.txt'),
            type: 'transform'
        };

        const formatedWord = Buffer.from('evenmoreblah').toString('base64');
        const url = `http:// www.example.com/path?field1=blah&field2=moreblah&field3=${formatedWord}`;

        const data = [
            { domain: 'example.com', url },
            { domain: 'other.com', url },
            { domain: 'example.com', url: 'http:// www.example.com/path?field5=blah&field6=moreblah&field7=evenmoreblah' }
        ];

        const finalData = DataEntity.makeArray(data);

        const test1 = await opTest.init(config);
        const results1 =  await test1.run(finalData);

        expect(results1.length).toEqual(1);
        expect(results1[0]).toEqual({ field3: 'evenmoreblah' });
        expect(DataEntity.isDataEntity(results1[0])).toEqual(true);

        const test2 = await opTest.init(config2);
        const results2 =  await test2.run(finalData);

        expect(results2.length).toEqual(1);
        expect(results2[0]).toEqual({ field3: 'evenmoreblah' });
        expect(DataEntity.isDataEntity(results2[0])).toEqual(true);
    });

    it('it can mutate data in place for transforms', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules13.txt'),
            type: 'transform'
        };

        const data = DataEntity.makeArray([
           { hello: 'world', data: 'someData' },
           { hello: 'world', data: 'otherData' },
           {}
        ]);

        const resultSet =  [
            { hello: 'world', data: 'someData', other: 'someData' },
            { hello: 'world', data: 'otherData', other: 'otherData' }
        ];

        const test = await opTest.init(config);
        const results =  await test.run(data);

        expect(results.length).toEqual(2);
        _.each(results, (data, index) => {
            expect(DataEntity.isDataEntity(data)).toEqual(true);
            expect(data).toEqual(resultSet[index]);
        });
    });

    it('it can transform data if previous transforms had occured', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules14.txt'),
            type: 'transform'
        };

        const date = new Date().toISOString();
        const key = '123456789';

        const data = DataEntity.makeArray([
            { domain: 'example.com', url: 'http:// www.example.com/path?value=blah&value2=moreblah&value3=evenmoreblah' , date, key },
        ]);

        // should not expect anything back
        const data2 = DataEntity.makeArray([
            { domain: 'example.com', hello: 'world', data: 'otherData', date, key },
            {}
        ]);

        // should not expect anything back
        const data3 = DataEntity.makeArray([
            { domain: 'example.com', url: 'http:// www.example.com/path?value=blah&value2=moreblah&value3=evenmoreblah', date },
            {}
        ]);

        const test1 = await opTest.init(config);
        const results1 =  await test1.run(data);

        expect(results1.length).toEqual(1);
        expect(results1[0]).toEqual({
            value: 'blah',
            value2: 'moreblah',
            key,
            date
        });

        const test2 = await opTest.init(config);
        const results2 =  await test2.run(data2);

        expect(results2.length).toEqual(0);
        expect(results2).toEqual([]);

        const test3 = await opTest.init(config);
        const results3 =  await test3.run(data3);

        expect(results3.length).toEqual(1);
        expect(results3[0]).toEqual({
            value: 'blah',
            value2: 'moreblah',
            date
        });
    });

    it('it can transform data if previous transforms had occured with other post_processing', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules15.txt'),
            type: 'transform'
        };

        const date = new Date().toISOString();
        const key = '123456789';

        function encode(str: string) {
            const buff = Buffer.from(str);
            return buff.toString('base64');
        }

        const data = DataEntity.makeArray([
            { host: 'fc2.com', field1: `http://www.example.com/path?field1=${encode(key)}&value2=moreblah&value3=evenmoreblah` , date, key },
            { host: 'fc2.com', key, date },
            { host: 'fc2.com', field1: 'someRandomStr', key, date },
            { host: 'fc2.com', field1: ['someRandomStr', `http://www.example.com/path?field1=${encode(key)}&value2=moreblah&value3=evenmoreblah`], key, date }
        ]);

        // should not expect anything back
        const data2 = DataEntity.makeArray([
            { domain: 'example.com', hello: 'world', data: 'otherData', date, key },
            {}
        ]);

        // should not expect anything back
        const data3 = DataEntity.makeArray([
            { domain: 'example.com', url: 'http://www.example.com/path?value=blah&value2=moreblah&value3=evenmoreblah', date },
            {}
        ]);

        const test1 = await opTest.init(config);
        const results1 =  await test1.run(data);

        expect(results1.length).toEqual(2);
        expect(results1[0]).toEqual({
            field1: key,
            date
        });

        expect(results1[1]).toEqual({
            field1: key,
            date
        });

        const test2 = await opTest.init(config);
        const results2 =  await test2.run(data2);

        expect(results2.length).toEqual(0);
        expect(results2).toEqual([]);

        const test3 = await opTest.init(config);
        const results3 =  await test3.run(data3);

        expect(results3.length).toEqual(0);
        expect(results3).toEqual([]);
    });

    it('it works like the test before but with different config layout', async () => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules16.txt'),
            type: 'transform'
        };

        const date = new Date().toISOString();
        const key = '123456789';

        function encode(str: string) {
            const buff = Buffer.from(str);
            return buff.toString('base64');
        }

        const data = DataEntity.makeArray([
            { host: 'fc2.com', field1: `http://www.example.com/path?field1=${encode(key)}&value2=moreblah&value3=evenmoreblah`, date, key },
            { host: 'fc2.com', key, date },
            { host: 'fc2.com', field1: 'someRandomStr', key, date },
            { host: 'fc2.com', field1: ['someRandomStr', `http://www.example.com/path?field1=${encode(key)}&value2=moreblah&value3=evenmoreblah`], key, date }
        ]);

        // should not expect anything back
        const data2 = DataEntity.makeArray([
            { domain: 'example.com', hello: 'world', data: 'otherData', date, key },
            {}
        ]);

        // should not expect anything back
        const data3 = DataEntity.makeArray([
            { domain: 'example.com', url: 'http://www.example.com/path?value=blah&value2=moreblah&value3=evenmoreblah', date },
            {}
        ]);

        const test1 = await opTest.init(config);
        const results1 =  await test1.run(data);

        expect(results1.length).toEqual(2);
        expect(results1[0]).toEqual({
            field1: key,
            date
        });

        expect(results1[1]).toEqual({
            field1: key,
            date
        });

        const test2 = await opTest.init(config);
        const results2 =  await test2.run(data2);

        expect(results2.length).toEqual(0);
        expect(results2).toEqual([]);

        const test3 = await opTest.init(config);
        const results3 =  await test3.run(data3);

        expect(results3.length).toEqual(0);
        expect(results3).toEqual([]);
    });

    it('chaining configurations sample 1', async() => {
        const config: WatcherConfig = {
            file_path: getPath('transformRules17.txt'),
            type: 'transform'
        };
        const key = '123456789';

        function encode(str: string) {
            const buff = Buffer.from(str);
            return buff.toString('base64');
        }

        const data = DataEntity.makeArray([
            { host: 'example.com', field1: `http://www.example.com/path?field1=${encode(key)}&value2=moreblah&value3=evenmoreblah` },
            { host: 'example.com' },
            { host: 'example.com', field1: 'someRandomStr' },
            { host: 'example.com', field1: ['someRandomStr', `http://www.example.com/path?field1=${encode(key)}&value2=moreblah&value3=evenmoreblah`] }
        ]);

        const test1 = await opTest.init(config);
        const results1 =  await test1.run(data);

        expect(results1.length).toEqual(2);
        expect(results1[0]).toEqual({
            field1: key
        });
        expect(results1[1]).toEqual({
            field1: key,
        });
    });
});
