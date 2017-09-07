# Custom Operations

It is possible to implement custom operations (slicers, readers, and processors)
and utilize them in your Teraslice jobs.

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

// A schema function is required on all operations. It can be used to verify
// that jobs meet the requirements of your custom processor or it can just
// return an empty object if you want to skip this type of validation.
function schema() {
    return {};
}

//optional, used to validate settings within the same op
function op_validation(op) {
    if (op.id_start_key && !op.set_id) {
        throw new Error('elasticsearch_data_generator is mis-configured, id_start_key must be used with set_id parameter, please set the missing parameters')
    }
}

//optional, used to validate settings across different ops
function post_validation(job, sysconfig) {
    var opConfig = getOpConfig(job, 'elasticsearch_data_generator');

    if (opConfig.set_id) {
        var indexSelectorConfig = job.operations.find(function(op) {
            return op._op === 'elasticsearch_index_selector';
        });

        if (!indexSelectorConfig.id_field) {
            throw new Error('elasticsearch_data_generator is mis-configured, set_id must be used in tandem with id_field which is set in elasticsearch_index_selector')
        }

        if (indexSelectorConfig.id_field !== 'id') {
            throw new Error('id_field set in elasticsearch_index_selector must be set to "id" when elasticsearch_data_generator is creating ids')
        }
    }
}

//optional, used to change the slicer queue length 
function setQueueLength(jobConfig){
    // the fully validated job configuration file
    
   // should return a num >= 1
   //or return  'QUEUE_MINIMUM_SIZE' which will make the queue dynamic to the number of workers
}

module.exports = {
  newReader: newReader,
  newSlicer: newSlicer,
  schema, schema,
  op_validation: op_validation,
  post_validation: post_validation,
  setQueueLength: setQueueLength
}

```
