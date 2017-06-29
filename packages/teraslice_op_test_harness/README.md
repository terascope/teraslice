# Teraslice Operation Test Harness

This project provides a number of mock objects, data sources and functions to
help you implement tests of your Teraslice operations.  But first, to start off,
require your processor and then pass in your processor name as an argument to
the harness module as shown below.  The code examples below assume you are using
the harness in a `spec/` or `test/` subdirectory and your processor is
implemented in `../index`.

```javascript
var processor = require('../index');
var harness = require('teraslice_op_test_harness')('dupedoc');
```

Now, you can access functionality using the `harness` object.

## Mock Objects

The testing harness provides a number of mocked resources that are needing when
testing a Teraslice processor or operation.  The first few resources you will
need are a `context`, an `op`, and a `jobConfig`.  These are needed when you
create your processor and you can use the standard mock resources like this:

```javascript
var processor = require('../index');
var harness = require('teraslice_op_test_harness')('dupedoc');
var myProcessor = processor.newProcessor(
    harness.context,
    harness.op,
    harness.jobConfig);
```

If you want to override the default operations on your processor, you can do so
by setting new properties on `op`.  Note that depending on your use case you may
want to clone `harness.op` to avoid impacting other tests as shown below.

```javascript
var processor = require('../index');
var harness = require('teraslice_op_test_harness')('dupedoc');
var op = _.cloneDeep(harness.op);
// setting processors percentage argument to 100
op.percentage = 100;

var myProcessor = processor.newProcessor(
    harness.context,
    op,
    harness.jobConfig);
```

The other resource you're likely to need is a mock logging object.  When calling
your processor, the first argument is the data and the second argument is the
`sliceLogger`, which must behave like a bunyan compatible logger.  The
`fakeLogger.logger` object serves that purpose as shown below.

```javascript
var _ = require('lodash');
var processor = require('../index');
var harness = require('teraslice_op_test_harness')('dupedoc');
var sliceLogger = harness.fakeLogger.logger;
var myProcessor = processor.newProcessor(
    harness.context,
    harness.op,
    harness.jobConfig);

myProcessor([], sliceLogger)
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
var harness = require('teraslice_op_test_harness')('dupedoc');
var sliceLogger = harness.fakeLogger.logger;
var myProcessor = processor.newProcessor(
    harness.context,
    harness.op,
    harness.jobConfig);

myProcessor(harness.data.simple, sliceLogger)
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
var harness = require('teraslice_op_test_harness')('dupedoc');

// Run the tests provided by the harness
harness.runProcessorSpecs(processor);
```
