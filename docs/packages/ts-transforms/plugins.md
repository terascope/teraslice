---
title: Transform Plugins
sidebar_label: Plugins
---

> General Plugin Structure, generally the transform/validation operation would be in a seperate file

PluginFile.ts
```ts

import { DataEntity } from '@terascope/utils';
import { OperationConfig, TransformOpBase } from 'ts-transforms';

class Double extends TransformOpBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity) {
        doc[this.source] = doc[this.source] * 2;
        return doc;
    }
}

export default class Plugin {
    init() {
        return {
            noop: NoOp,
            double: Double
        };
    }
}
```

`NOTE`: it is important to know that the key of the object returned from init will be the name that must be used in the rules and the value is the actual class


pluginRules.txt
```
{ "selector": "size:2", "source_field": "size", "target_field": "height", "tag": "pluginTag" }
{ "follow": "pluginTag", "post_process": "double" }
```


You insert an array of plugin classes at init
```ts

import Plugins from 'PluginFile';
import { Transform } from 'ts-transforms'

const config = {
    rules: ['/path/to/pluginRules.txt'],
    type: 'transform'
};

const data = [{ size: 2 }];

const transform = new Transform(config);
await transform.init([Plugins]);

const results = transform.run(data);

console.log(results) // [{ height: 4 }]

```

#### Transform Operations
It is important to inherit from the TransformOpBase class if at all possible as it does some normailization and validation. You can of course do things as you would like. You can also override the validateConfig method if you have another specific way to do so.

The returning class must have a `run` method which is called by the framework and is given an object (DataEntity, which is just an object with a way to set and manipulate metadata transparently)

Errors must not interupt the pipeline

The configuration `source_field` and `target_field` are set to `this.source` and `this.target` respectively

Example
```ts
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { TransformOpBase, OperationConfig } from 'ts-transforms';

export default class JsonParse extends TransformOpBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity {
        const field = _.get(doc, this.source);
        try {
            const json = JSON.parse(field);
            _.set(doc, this.target, json);
            _.unset(doc, this.source);
        } catch (err) {
            _.unset(doc, this.source);
        }
        return doc;
    }
}

```

#### Validation Operations
It is important to inherit from the ValidationOpBase class if at all possible as it does some normailization, validation and other important framework behaviour especially in regards to how `output:false` works.

The returning class must have a `run` method (which is done through the ValidationOpBase class). If you are using the base class then you need to specify a `validate` method which takes in the value of the source key and must return a boolen if it is valid. You may also specify a `normalize` method which will alter the data before it hits the `validate` method. This will also normalize the output record itself

The configuration `source_field` and `target_field` are set to `this.source` and `this.target` respectively

Example
```ts
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import validator from 'validator';
import { ValidationOpBase, OperationConfig } from 'ts-transforms';

export default class MacAddress extends ValidationOpBase<any> {
    private case: 'lowercase' | 'uppercase';
    private preserveColons: boolean;

    constructor(config: OperationConfig) {
        super(config);
        this.case = config.case || 'lowercase';
        this.preserveColons = config.preserve_colons || false;
    }

    normalize(data: any, _doc: DataEntity) {
        let results = data;
        if (typeof data !== 'string') throw new Error('data must be a string');
        if (this.case === 'lowercase') results = results.toLowerCase();
        if (this.case === 'uppercase') results = results.toUpperCase();
        if (!this.preserveColons) results = results.replace(/:/gi, '');
        return results;
    }

    validate(data: string) {
        const options = { no_colons: !this.preserveColons };
        if (!validator.isMACAddress(data, options)) return false;
        return true;
    }
}


#### Operation Cardinality
Each operation is designed for a specify task. These operations work either work on a single input, several inputs (like the join operator) and return a single output. To differentiate the operators and to determine at validation time if the operator can take in multiple outputs each class must have a static varialble labeling what it is meant to do. The options are either `one-to-one` or `many-to-one`. If by using the tag/follow rules a `one-to-one` has several inputs then it will be cloned as many times as there are inputs so that each operation will have a single input. A `many-to-one` will take multiple outputs and set it at `source_fields` (note that it is the plural form). If you inherit from the base clase then it will default to `one-to-one`.


```js
// the none inherited version of a plugin
export default class Double {
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(config) {
        this.config = config;
    }

    run(doc: DataEntity) {
        // @ts-ignore
        doc[this.config.source_field] = doc[this.config.source_field] * 2;
        return doc;
    }
}
```

``` js

import _ from 'lodash';

export default class MakeArray {

    static cardinality = 'many-to-one';

    constructor(config:) {
        // this will look for the fields config or look for the multi input located at source_fields
        const fields = config.fields || config.source_fields;
        this.fields = fields;
        this.target = config.target_field;
    }


    run(doc) {
        const results = [];
        this.fields.forEach(field => {
            const data = _.get(doc, field);
            if (data) results.push(data);
        });
        if (results.length > 0) _.set(doc, this.target, results);
        return doc;
    }
}


```