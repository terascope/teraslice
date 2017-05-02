# Custom Operations

It is possible to implement custom operations and utilize them in your Teraslice
jobs.

The first step to utilizing custom operations is to configure your Teraslice
nodes to point to the directory containing your custom code, this is done by
setting the `ops_directory` setting in the `teraslice` section of your
configuration file as shown below.

```yaml
...
teraslice:
    ops_directory: '/app/source/examples/ops/'
...
```

This directory must contain a `package.json`, a `processors` directory with your
custom processor code, and the `node_modules` required by your custom code.  It
will look something like this:

```
.
├── node_modules
│   └── lodash
├── package.json
└── processors
    └── count.js
```

A job configuration that makes use of a custom operator would simply call the
operator just like any other operator, as shown below:

```json
{
    "name": "Update Rate Test",
    "lifecycle": "once",
    "workers": 1,
    "operations": [{
            "_op": "elasticsearch_data_generator",
            "size": 5000
        },
        {
            "_op": "count"
        },
        {
            "_op": "elasticsearch_index_selector",
            "index": "update-test-1",
            "type": "events"
        },
        {
            "_op": "elasticsearch_bulk",
            "size": 5000
        }
    ]
}
```

The `count` operator used above simply logs the execution of the operator and
counts the number of records passed in with the data object, it could be
implemented as shown below:

```js
'use strict';

function newProcessor(context, opConfig, jobConfig) {
    var logger = context.foundation.makeLogger('count', 'count', {
        module: 'count',
    });

    return function(data) {
        logger.info('Inside custom processor \'count\'');
        logger.info('Number of items in data: ' + Object.keys(data).length);
        return data;
    };
}

// FIXME: Help me describe this.
function schema() {
    return {};
}

module.exports = {
    newProcessor: newProcessor,
    schema: schema,
};
```
