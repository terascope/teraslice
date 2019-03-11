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
