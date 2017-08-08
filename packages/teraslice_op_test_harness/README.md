# Teraslice Operation Test Harness

This project provides a processor execution function called `run()`, test data
sources and common test functions to help you implement tests of your Teraslice
operations.

To start using it, require your processor and then pass it in as an argument to
the harness module as shown below.  The code examples below assume you are using
the harness in a `spec/` or `test/` subdirectory and your processor is
implemented in `../index.js`, adjust paths accordingly.

```javascript
var processor = require('../index');
var harness = require('teraslice_op_test_harness')(processor);
```

Now, you can access functionality using the `harness` object.

## Processor Execution Function - `run()`

The testing harness provides a function `run()`, that will run your processor on
the data you have passed in to the run function.  The `run()` function returns
the output data from your processor so you can confirm that it behaved the way
you expected.  Generally speaking, using `harness.run()` looks like the example
below. The second argument passed to `run()`, `opConfig` is optional.

```javascript
var processor = require('../index');
var harness = require('teraslice_op_test_harness')(processor);

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

```javascript
var processor = require('../index');
var harness = require('teraslice_op_test_harness')(processor);

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

```javascript
var processor = require('../index');
var harness = require('teraslice_op_test_harness')(processor);

describe('The data doubles when', function() {
    var opConfig = {percentage: 100};

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

## Multiple calls to the same processor instance

If you need to test a processor that maintains some type of state across slices you can create a processor instance and then call the process function independently.

```javascript
var processor = require('../index');
var harness = require('teraslice_op_test_harness')(processor);

describe('The data doubles when', function() {
    var opConfig = {percentage: 100};

    it('using simple data and percentage is 100', function() {
        var processor = harness.getProcessor(opConfig);

        // First call on the processor can use the input to setup state
        harness.process(processor, harness.data.simple)

        // Second call is using the same processor so if you setup state
        // it should still exist.
        expect(harness.process(processor, harness.data.simple)).toEqual(newData);
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

```javascript
var processor = require('../index');
var harness = require('teraslice_op_test_harness')(processor);

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

```javascript
'use strict';

var processor = require('../index');
var harness = require('teraslice_op_test_harness')(processor);

// Run the tests provided by the harness
harness.runProcessorSpecs(processor);
```
