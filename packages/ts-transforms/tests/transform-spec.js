const opTestHarness  = require ('@terascope/teraslice-op-test-harness');
const { DataEntity } = require ('@terascope/job-components');
const path = require('path');
const Transform = require('../asset/src/transform');
const _ = require('lodash');

xdescribe('can transform matches', () => {

    const transformRules1Path = path.join(__dirname, './fixtures/transformRules1.txt');
    const transformRules2Path = path.join(__dirname, './fixtures/transformRules2.txt');
    const transformRules3Path = path.join(__dirname, './fixtures/transformRules3.txt');
    const transformRules4Path = path.join(__dirname, './fixtures/transformRules4.txt');
    const transformRules5Path = path.join(__dirname, './fixtures/transformRules5.txt');
    const transformRules6Path = path.join(__dirname, './fixtures/transformRules6.txt');

    let opTest;

    beforeEach(() => {
        opTest = opTestHarness({ Processor: Transform.Processor.default, Schema: Transform.Schema.default });
    });

    it('it can transform matching data', async () => {
        const opConfig = {
            _op: 'transform',
            file_path: transformRules1Path,
            selector_config: { _created: 'date' } 
        };

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 200, myfield: 'hello' },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
            { other: 'xabcd', myfield: 'hello' },
            { _created: "2018-12-16T15:16:09.076Z", myfield: 'hello' }
        ]);

        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        _.each(results, (data) => {
            expect(DataEntity.isDataEntity(data)).toEqual(true);
            expect(_.get(data, "topfield.value1")).toEqual('hello');
            expect(data.getMetadata('selectors')).toBeDefined();
        });
    });

    it('can uses typeConifg', async () => {
        const opConfig = {
            _op: 'transform',
            file_path: transformRules1Path,
            selector_config: { location: 'geo' }
        };

        const data = DataEntity.makeArray([
            { hostname: "www.other.com", location: '33.435967,  -111.867710 ' }, // true
            { hostname: "www.example.com", location: '22.435967,-150.867710' }  // false
        ]);

        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ point: data[0].location });
    });

    it('it can transform matching data with no selector', async () => {
        const opConfig = {
            _op: 'transform',
            file_path: transformRules3Path
        };

        const data = DataEntity.makeArray([
           { data: 'someData' },
           { data: 'otherData' },
           {}
        ]);
        const resultSet = data.map(obj => obj.data)
        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);

        expect(results.length).toEqual(2);
        _.each(results, (data, index) => {
            expect(DataEntity.isDataEntity(data)).toEqual(true);
            expect(data.other).toEqual(resultSet[index]);
            expect(data.getMetadata('selectors')['*']).toBeDefined();
        });
    });

    it('can work with regex transform queries', async () => {
        const opConfig = {
            _op: 'transform',
            file_path: transformRules1Path
        };

        const data = DataEntity.makeArray([
            { some: 'data', someField: 'something' },
            { some: 'data', someField: 'otherthing' },   // should not return anyting
            { some: 'data' },    // should not return anyting
        ]);

        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);
        // NOTE:   "regex": "some.*?$" will give you the entire matched string => wholeRegexResponse
        // NOTE:   "regex": "some(.*?)$" will give you the captured part of the string => partRegexResponse

        expect(results.length).toEqual(1)
        expect(results[0]).toEqual({ wholeRegexResponse: 'something', partRegexResponse: 'thing' })
    });

    it('can extract using start/end', async () => {
        const opConfig = {
            _op: 'transform',
            file_path: transformRules1Path
        };

        const data1 = DataEntity.makeArray([
            { some: 'data', bytes: 1200 , myfield: 'http://google.com?field1=helloThere&other=things'},
        ]);

        const data2 = DataEntity.makeArray([
                { some: 'data', bytes: 1200 , myfield: 'http://google.com?field1=helloThere'},
            ]);

        const test = await opTest.init({ opConfig });
        const results1 =  await test.run(data1);

        expect(results1.length).toEqual(1);
        expect(results1[0]).toEqual({ topfield: { value1: 'helloThere' } });

        const results2 =  await test.run(data1);

        expect(results2.length).toEqual(1);
        expect(results2[0]).toEqual({ topfield: { value1: 'helloThere' } });
    });

    it('can merge extacted results', async () => {
        const opConfig = {
            _op: 'transform',
            file_path: transformRules1Path
        };

        const data = DataEntity.makeArray([
            { hostname: "www.example.com", pathLat: '/path/tiles/latitude/33.435967', pathLon: '/path/tiles/longitude/-111.867710' }, // true
            { hostname: "www.other.com", location: '33.435967,  -111.867710 ' }, // false
            { hostname: "www.example.com", location: '22.435967,-150.867710' }  // false
        ]);

        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ location: { lat: '33.435967', lon: '-111.867710' } })
    });

    it('can use post process operations', async () => {
        const opConfig = {
            _op: 'transform',
            file_path: transformRules2Path
        };

        const data = DataEntity.makeArray([
            { hello: 'world', first: 'John', last: 'Doe'}
        ]);

        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ full_name: 'John Doe'})
    });

    it('false validations remove the fields', async () => {
        const opConfig = {
            _op: 'transform',
            file_path: transformRules2Path
        };

        const data = DataEntity.makeArray([
            { geo: true, lat: '2233', other: 'data'},
            { geo: true, lon: '2233'}
        ]);

        const data2 = DataEntity.makeArray([
            { geo: true, lat: '2233'},
            { geo: true, lon: '2233'}
        ]);

        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ other: 'data' });

        const results2 =  await test.run(data2);
        expect(results2).toEqual([]);
    });

    it('refs can target the right field', async () => {
        const opConfig = {
            _op: 'transform',
            file_path: transformRules4Path
        };

        const data = DataEntity.makeArray([
            { hello: 'world', lat: 23.423, lon: 93.33, first: 'John', last: 'Doe' }, // all good
            { hello: 'world', lat: 123.423, lon: 93.33, first: 'John', last: 'Doe' }, // bad geo
            { hello: 'world', lat: 123.423, lon: 93.33, first: 'John', last: 'Doe' }, // bad geo
            { hello: 'world', lat: 23.423, lon: 93.33, full_name: 3243423 } // full_name is not string
        ]);

        const resultSet = [
            { location: { lat: 23.423, lon: 93.33 }, first_name: 'John', last_name: 'Doe', full_name: 'John Doe' },
            { first_name: 'John', last_name: 'Doe', full_name: 'John Doe' },
            { first_name: 'John', last_name: 'Doe', full_name: 'John Doe' },
            { location: { lat: 23.423, lon: 93.33 } } 
        ];

        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);

        _.each(results, (data, index) => {
            expect(DataEntity.isDataEntity(data)).toEqual(true);
            expect(data).toEqual(resultSet[index]);
            expect(data.getMetadata('selectors')).toBeDefined();
        });
    });

    it('can chain selection => transform => selection', async() => {
        const opConfig = {
            _op: 'transform',
            file_path: transformRules5Path
        };

        const data = DataEntity.makeArray([
            { hello: 'world',  first: 'John', last: 'Doe' },
            { hello: 'world',  first: 'Jane', last: 'Austin' },
            { hello: 'world',  first: 'Jane', last: 'Doe' },
            { hello: 'world' }
        ]);

        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ first_name: 'Jane', last_name: 'Doe', full_name: 'Jane Doe' });

        const metaData = results[0].getMetadata();
        expect(metaData.selectors).toEqual({ 'hello:world': true, 'full_name:"Jane Doe"': true });
    });

    it('can chain selection => transform => selection => transform', async() => {
        const opConfig = {
            _op: 'transform',
            file_path: transformRules6Path
        };

        const data = DataEntity.makeArray([
            { hello: 'world',  first: 'John', last: 'Doe' },
            { hello: 'world',  first: 'Jane', last: 'Austin' },
            { hello: 'world',  first: 'Jane', last: 'Doe' },
            { hello: 'world' }
        ]);

        const test = await opTest.init({ opConfig });
        const results =  await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ name: 'Jane Doe' });

        const metaData = results[0].getMetadata();
        expect(metaData.selectors).toEqual({ 'hello:world': true, 'full_name:"Jane Doe"': true });
    });
});
