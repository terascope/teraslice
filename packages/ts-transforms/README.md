# transforms

> An ETL framework built upon xlucene-evaluator

# Installation

## Dependency Installation

```bash
# Using yarn
yarn add ts-transforms
# Using npm
npm install --save ts-transforms
```

# CLI Installation

```bash
# Using yarn
yarn global add ts-transforms
# Using npm
npm install --global ts-transforms
```

# Usage

Example file: `rulesFile.txt`
```
{"selector": "hello:world OR bytes:>=400"}
```

Example code:
```js
import { Matcher } from 'ts-transforms'

const config = {
    rules: ['/path/to/rulesFile.txt']
};

const data = [ 
    { hello: 'world' },
    { something: 'else' }
    { bytes: 200 },
    { bytes: 500, other: 'things' }
];

const matcher = new Matcher(config);
await matcher.init();

const results = matcher.run(data);
console.log(results);   //   [{ hello: 'world' }, { bytes: 500, other: 'things'}]   

```

## Configuration
The Matcher/Transform class takes a configuration object and an optional logger (bunyan based) as a second argument

- configuration object
- optional logger

#### Configuration Object

| Field | Type | Description |
| ----- | ---- | ----------- |
| type | `String` | Must be set to either `matcher` or `transform`|
| rules | `Array` of `Strings` | A list of file paths leading to rules that will be loaded |
| types | `Object` | An object with keys specifying if a given field should have type manipulations, please refer to `xlucene-evaluator` for more details |

```ts
interface Config {
    type: string;
    rules: string[];
    plugins?: string[];
    types?: {
        [field: string]: string;
    };
}

const configObj: Config = {
    type: 'transform',
    rules: ['path/rules1.txt', 'path/rules2.txt'],
    plugins: ['path/plugins']
    types: { _created: 'date' },
}
```

#### Optional logger

```js
import { Logger } from '@terascope/utils';
import { Transform } from 'ts-transforms'

const logger = new Logger({ name: 'ts-transforms' })
const manager = new Transform(configObj, logger);

```

If you do not specify a logger a debug logger will be used. No logs will be given unless you specifiy it when running the code or exporting it as shown below

```sh
DEBUG='*ts-transform*' ts-transform ...
    OR
export DEBUG='*ts-transform*'
```

## Rules

- **selector** = the criteria to see if a document matches, please refer to [xlucene-evaluator](https://github.com/terascope/teraslice/tree/master/packages/xlucene-evaluator) on all the ways you can write the selector rule

```txt
# will match any document that has a key of "some" and a value of "thing"
{ "selector": "some:thing" }
```

```js
import { Transform } from 'ts-transforms'

const config = {
    rules: ['/path/to/rulesFile.txt']
};

const data = [ 
    { hello: 'world' },
    { something: 'else' }
    { bytes: 200 },
    { bytes: 500, some: 'thing' }
];

const transform = new Transform(config);
await transform.init();

const results = transform.run(data);
console.log(results);   //   [{ bytes: 500, other: 'things'}]   

```
If you do not specify a selector and it's not a post_process or validation then it will act as a catch all

rulefile.txt
```
{ "source_field": "data", "target_field": "final" }
```

```js
import { Transform } from 'ts-transforms'

const config = {
    rules: ['/path/to/rulesFile.txt']
};

const data = [ 
    { hello: 'world' },
    { something: 'else', data: 'someData' }
    { bytes: 200,  data: 'otherData' },
    { bytes: 500, some: 'thing' }
];

const transform = new Transform(config);
await transform.init();

const results = transform.run(data);
console.log(results);   //   [{ final: 'someData' }, { final: 'otherData' }]   

```
- **source_field** = the field on the record on which you will extract data from
- **target_field** = the key name that will be used to set the extracted data
- **tag** = marks the config and the target_field with an ID so other configurations can chain off of it
- **follows** = marks the config that it is chaining off the tag id
- **validation** = marks the config to have a validation check on the target_field
- **post_process** = marks the config to do additional actions after the first extractions


#### File structure
The rules file must be in ldjson format. Which is json data separated by a new line. For matcher, it is still advisable to stick to the ldjson format but it is allowed to specify the selector rules by themselves on each new line

- Transform:
transformrules.txt
```
{ "selector": "host:fc2.com", "source_field": "field1", "start": "field1=", "end": "EOP", "target_field": "field1", "post_process": "base64decode" }
{ "source_field": "date", "target_field": "date", "other_match_required": true }
```

- Matcher: 
matcherules.txt

```
{ "selector": "some:data AND bytes:>=1000"}
{ "selector": "other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z" }
```
is equivalent to:

matcherules_other_format.txt
```
some:data AND bytes:>=1000
other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z
```
`NOTE` you can put `#` in the rules file to act as a comment, it must be on a new line

Example:
```sh

{ "selector": "some:data AND bytes:>=1000"}
# some comment about something
{ "selector": "other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z" }
```

## Matcher
This will return all the records that match the selector rule list without any additional record manipulation/validation

Example file: `rulesFile2.txt`
```
{"selector": "person.age:[25 TO 35]"}
{"selector": "ipfield:"192.198.0.0/24"}
{"selector": "_created:[2018-10-18T18:13:20.683Z TO *]"}
{"selector": "key:?abc*]"}
```

Example code:
```js
import { Matcher } from 'ts-transforms'

const config = {
    rules: ['/path/to/rulesFile2.txt'],
    type: 'matcher'
    types: { ipfield: 'ip', _created: 'date' }
};

const data = [ 
    { ipfield: '192.198.0.1' };
    { person: { age: 33 },
    { person: { age: 55 },
    { _created: '2018-10-19T20:14:25.773Z'},
    { _created: '2018-10-16T02:11:14.333Z'},
    { key : 'zabcde' },
    { key : 'abcccde' },
    { bytes: 500, other: 'things' }
];

const matcher = new Matcher(config);
await matcher.init();

const results = matcher.run(data);
console.log(results);   
/* 
[ 
    { ipfield: '192.198.0.1' };
    { person: { age: 33 },
    { _created: '2018-10-19T20:14:25.773Z'}
    { key : 'zabcde' },
]
*/
```

`NOTE`: even if you give transform rules to a matcher, it will only return unaltered matching docs

## Transform
This will not only select for matching records based on the selector but it can allow additional transformation/validation of the data to produce an new result

Example rules file:
```txt
{"selector": "hello:world", "source_field": "first", "target_field": "first_name"}
{"selector": "hello:world", "source_field": "last", "target_field": "last_name"}
{"selector": "hello:world", "post_process": "join", "fields": ["first_name", "last_name"], "delimiter": " ", "target_field": "full_name"}
```

code
```js
import { Transform } from 'ts-transforms'

const config = {
    rules: ['/path/to/rulesFile.txt'],
};

const data = [ { hello: 'world', first: 'John', last: 'Doe' }]

const transform = new Transform(config);
await transform.init();

const results = transform.run(data);

console.log(results);   //   [ { full_name: 'John Doe' }]   

```


## CLI
To help facilitate the construction of rules and the application of data there is a cli avaiable to help. The final results are piped out to stdout which can be piped to anything

NOTE: if you did not install globally, you can reach still call it by executing `./bin/ts-transform` at project root instead of `ts-transform`

Example
```sh
ts-transform -t location:geo -r ./rules/path -d ./data/path
```

for help you can call `ts-transform -h` for further assitance

Most of the command arguments have a direct correlcation with the configuration:

- `-r`  rules path
- `-p`  plugins path
- `-d`  data path or uri
- `-t`  types

NOTE: in any case that you would specify an object or array, it must be set to a comma deliminated string

```sh
ts-transform -t location:geo,_created:date -r ./rules/path,./otherRules/path -d ./data/path
```

#### Fetching data from a uri
If you specify a uri then it is expected the the returning data from that endpoint to be formatted in a certain way. It may either be a direct elasticsearch database response, an array of data or an object that has a results field that has the array of data (teraserver compatability reasons)

Uri Response Types:
```js
{ hits: { hits: [{ _source: { some: 'data'} }] }
[{ some: 'data'}]
{ results: [{ some: 'data'}] }
```

Example
```sh
ts-transform -r someRules.txt -d 'http://localhost:9200/test_index/_search?q=bytes:>=5642500'
```

#### Piping
You may pipe the data into the cli command and omit `-d`

Equivalent:
```sh
ts-transform -r someRules.txt -d 'http://localhost:9200/test_index/_search?q=bytes:>=5642500'

curl 'http://localhost:9200/test_index/_search?q=bytes:>=5642500' | ts-transform -r someRules.txt
```

you may also pipe the results to a file for further analysis

```sh
curl 'http://localhost:9200/test_index/_search?q=bytes:>=5642500' | ts-transform -r someRules.txt | tee results.txt
```

## Plugins
This library provides a wide array of manipulations/validations etc but you may need a custom operation. You may do so by making a plugin and injecting it

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

```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE) licensed.
