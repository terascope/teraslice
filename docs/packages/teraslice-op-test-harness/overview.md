---
title: Teraslice Op Test Harness
sidebar_label: Overview
---

> A testing harness to simplify testing Teraslice processors and operations.

**DEPRECRATED**: Use [teraslice-test-harness](../pacakges/teraslice-test-harness) instead.

This project provides a processor execution function called `run()`, test data
sources and common test functions to help you implement tests of your Teraslice
operations.

To start using it, require your processor and then pass it in as an argument to
the harness module as shown below.  The code examples below assume you are using
the harness in a `test/` or `test/` subdirectory and your processor is
implemented in `../index.js`, adjust paths accordingly.

```js
var processor = require('../index');
var harness = require('@terascope/teraslice-op-test-harness')(processor);
```

Now, you can access functionality using the `harness` object.

## Processor Execution Function - `init()`

The manner to instanciate a new instance of your operation is by using init
You make pass in optional clients under the `clients` key but they must follow the format listed in the setClients definition. This will work with both the new and old Job APIs.

```js
const { DataEntity } = require('@terascope/job-components');
const processor = require('../asset/example-op');
const reader = require('../asset/example-reader');

describe('setting up an operation', () => {
    const processorOpTest = opHarness(processor);
    const readerOpTest = opHarness(reader);
    let client;

    class MockClient {
        async get(data) { return data }
    }

    beforeEach(() => {
        client = new MockClient();
        readerOpTest.setClients([
            { client, type: 'elasticsearch', endpoint: 'default' }
        ]);
    });

    it('can make a processor instance', async () => {
        const opConfig = { _op: 'foo', some: 'config' };
        const data = { some: 'data' };
        const pTest = await processorOpTest.init({ opConfig });

        const results = await pTest.run(data);

        expect(Array.isArray(results)).toBe(true);
        expect(DataEntity.is(results[0])).toBe(true);
    });

    it('can make a reader instance', async () => {
        const executionConfig = {
            lifecycle: 'once',
            operations: [{ _op: 'foo', some: 'config' }]
        };
        const data = { some: 'data' };
        const type = 'reader';
        const rTest = await readerOpTest.init({ executionConfig, type });

        const results = await rTest.run(data);

        expect(Array.isArray(results)).toBe(true);
        expect(results[0] instanceof DataEntity).toBe(true);
    });

    it('can make a slicer instance', async () => {
        const executionConfig = {
            lifecycle: 'once',
            operations: [{ _op: 'foo', some: 'config' }]
        };
        // type defaults to slicer
        const sTest = await readerOpTest.init({ executionConfig });

        const results = await sTest.run();

        expect(Array.isArray(results)).toBe(true);
        expect(results[0]).toEqual({ foo: 'bar' });
    });

    it('can make a multiple slicer instances', async () => {
        const executionConfig = {
            lifecycle: 'once',
            slicers: 3,
            operations: [{ _op: 'foo', some: 'config' }]
        };

        // type defaults to slicer
        const sTest = await readerOpTest.init({ executionConfig });

        const results = await sTest.run();

        expect(Array.isArray(results)).toBe(true);
        expect(results[0]).toEqual({ foo: 'bar' });
    });

    it('can return the full metadata of slice', async () => {
        const executionConfig = {
            lifecycle: 'once',
            slicers: 3,
            operations: [{ _op: 'foo', some: 'config' }]
        };

        // type defaults to slicer
        const sTest = await readerOpTest.init({ executionConfig });

        const results = await sTest.run({ fullSlice: true });

        expect(Array.isArray(results)).toBe(true);
        expect(results[0]).toEqual({
            slice_id: 'd994d423-f3a3-411d-8973-4a4ccccd1afd',
            slicer_id: 0,
            slicer_order: 10,
            request: { foo: 'bar' }
        });
    });
})
```

## Processor Execution Function - `setClients()`

This takes an array of client configurations that will be used internally.
The obejct must have a client key and a type key set.

```js
const { DataEntity } = require('@terascope/job-components');
const reader = require('../asset/example-reader');

describe('setting up an operation', () => {
    const opTest = opHarness(reader);
    let client;
    let client2;
    let client3;

    class MockClient {
        async get(data) { return data }
    }

    class OtherClient {
        async get(data) { return 'something else' }
    }

    beforeEach(() => {
        client = new MockClient(); client2 = new MockClient();
        client3 = new MockClient();
        // endpoint defaults to 'default' if not specifed, but showing none the less
        readerOpTest.setClients([
            { client, type: 'elasticsearch', endpoint: 'default' },
            { client: client2, type: 'elasticsearch', endpoint: 'other_connection' },
            { client: client3, type: 'kafka' },
        ])
    });

    it('can make a reader instance', async () => {
        const executionConfig = {
            lifecycle: 'once',
            operations: [{ _op: 'foo', some: 'config' }]
        };
        const data = { some: 'data' };
        const type = 'reader';
        const test = await opTest.init({ executionConfig, type });

        const results = await test.run(data)

        expect(Array.isArray(results)).toBe(true);
        expect(DataEntity.is(results[0])).toBe(true);
    });

    it('can make a slicer instance', async () => {
        const executionConfig = {
            lifecycle: 'once',
            operations: [{ _op: 'foo', some: 'config' }]
        };
        // you can override the clients at init time
        const clients = [{ client: new OtherClient(), type: 'elasticsearch', endpoint: 'default'}]
        // these two ops now have different clients at elasticsearch : default connection
        const test1 = await opTest.init({ executionConfig });
        const test2 = await opTest.init({ executionConfig, clients });

        const [results1, results2 ] = await Promise.all([ test1.run(), test2.run()]);

        expect(Array.isArray(results1)).toBe(true);
        expect(results1[0]).toEqual({ foo: 'bar' });

        expect(Array.isArray(results2)).toBe(true);
        expect(results2[0]).toEqual({ foo: 'bar' });
    });
})
```

## Processor Execution Function `processData()`

This provides a short hand for processors to instantiate a new operation, run some data with it and return the results.

```js
const processor = require('../asset/example-op');

describe('processor operation test', () => {
    const opTest = opHarness(processor);

    it('has a shorthand method', async () => {
        const opConfig = { _op: 'foo', some: 'config' };
        const data = [{ some: 'data' }];
        const results = await processorOpTest.processData(opConfig, data);

        expect(Array.isArray(results)).toBe(true);
        expect(DataEntity.is(results[0])).toBe(true);
    })
})

```

## Processor Execution Function - `run()`  DEPRECIATED

The testing harness provides a function `run()`, that will run your processor on
the data you have passed in to the run function.  The `run()` function returns
the output data from your processor so you can confirm that it behaved the way
you expected.  Generally speaking, using `harness.run()` looks like the example
below. The second argument passed to `run()`, `opConfig` is optional.

```js
var processor = require('../index');
var harness = require('@terascope/teraslice-op-test-harness')(processor);

var data = [];
var opConfig = {option: 3}
console.log(harness.run(data, opConfig));
```

The rest of the examples will be implemented as valid unit tests using the
[jasmine](https://jasmine.github.io) testing framework.  This is a convenient
way for you to develop and test your Teraslice operations without having to run
them in Teraslice directly.

The example below shows a processor that, using the default operation settings,
doesn't change the data in any way:

```js
var processor = require('../index');
var harness = require('@terascope/teraslice-op-test-harness')(processor);

describe('With data in is []', function() {
    it('data out is []', function() {
        var data = [];
        expect(harness.run(data)).toEqual(data);
    });
});
```

If you want to override the default operations used by your processor, you can
do so by passing in an `opConfig` object with the properties you want to change.
They will be merged into the default `opConfig` and validated automatically by
the test harness.  The example below shows the modification of the `percentage`
property on the operator:

```js
var processor = require('../index');
var harness = require('@terascope/teraslice-op-test-harness')(processor);

describe('The data doubles when', function() {
    var opConfig = {
        percentage: 100
    };

    it('using simple data and percentage is 100', function() {
        // prepare the data to test output data against
        var newData = [];
        harness.data.simple.forEach(function(item) {
            newData.push(item, item);
        });

        // run the operator, passing in input data and the overridden opConfig
        expect(harness.run(harness.data.simple, opConfig)).toEqual(newData);
    });
});
```

## Multiple calls to the same processor instance DEPRECIATED

If you need to test a processor that maintains some type of state across slices
you have two options:

### 1 Use `runSlices() -> Promise` DEPRECIATED

This will process all of the given slices, `emulateShutdown()`, then process a
final empty slice to give the processor a chance to flush its state.

```js
var processor = require('../sum');
var harness = require('@terascope/teraslice-op-test-harness')(processor);

describe('Add running total', function() {
    var opConfig = { src_field: 'x', dst_field: 'y' };
    it('works', function() {
        var slices = [ [{ x: 10 }, { x: 11 }], [{ x: 21 }] ];
        harness.runSlices(slices)
            .then((results) => {
                expect(results.length).toEqual(3);
                expect(results[0].y).toEqual([{ x: 10, y: 10 }, { x: 11, y: 21 }]);
                expect(results[1].y).toEqual([{ x: 21, y: 42 }]);
                expect(results[2].y).toEqual([]);
            });
    });
});
```

### 2. Create a processor instance to call `process()` independently DEPRECIATED

```js
var processor = require('../index');
var harness = require('@terascope/teraslice-op-test-harness')(processor);

describe('The data doubles when', function() {
    var opConfig = {
        percentage: 100
    };

    it('using simple data and percentage is 100', function() {
        var processor = harness.getProcessor(opConfig);

        // First call on the processor can use the input to setup state
        harness.run(processor, harness.data.simple)

        // Second call is using the same processor so if you setup state
        // it should still exist.
        expect(harness.run(processor, harness.data.simple)).toEqual(newData);
    });
});
```

## Async/Promise based processors DEPRECIATED

In some scenarios a processor will be asynchronous and needs to return a
promise.

```js
var processor = require('../index');
var harness = require('@terascope/teraslice-op-test-harness')(processor);

describe('The data doubles when', function() {
    var opConfig = {
        percentage: 100
    };

    it('using simple data and percentage is 100', function(done) {
        var processor = harness.getProcessor(opConfig);

        // First call on the processor can use the input to setup state
        harness.runAsync(processor, harness.data.simple)
            .then((result) => {
                    expect(result).toEqual(newData);
                    done();
                });
    });
});
```

## Data Sources

One of the main benefits of the testing harness is that it provides a consistent
set of testing data sources.  All of these objects are properties of the harness
in `data` property.  The following data sources are currently available:

* `data.simple` - A very small and simple array of JSON objects.
* `data.arrayLike` - An array of 10 "log like" JSON documents.
* `data.esLike` - The same 10 documents as `data.arrayLike`, but structured like
  an Elasticsearch query response.

These data sources can be used as the first argument to your processor in tests
as shown below.

```js
var processor = require('../index');
var harness = require('@terascope/teraslice-op-test-harness')(processor);

describe('The data doubles when', function() {
    it('using simple data and percentage is 100', function() {
        expect(harness.run(harness.data.simple)).toEqual(harness.data.simple);
    });
});
```

## Common Tests

The harness also provides a simple set of tests that can be used on any
processor.  These tests will ensure that the processor you have implemented
behaves as expected by Teraslice.

To use these tests, you can simply import the harness, then call,
`runProcessorSpecs()`, passing your processor in as an argument.  I recommend
you implement this as a stand-alone file named `harness_spec.js` in your spec
directory but it could be included at the top of another spec file.  Keeping it
separate might help call out the fact that these specs are different from the
tests you've implemented yourself because they come from somewhere else.

```js
'use strict';

var processor = require('../index');
var harness = require('@terascope/teraslice-op-test-harness')(processor);

// Run the tests provided by the harness
harness.runProcessorSpecs(processor);
```
