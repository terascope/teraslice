---
title: Transforms
sidebar_label: Overview
---

> An ETL framework built upon xlucene-evaluator

## Installation

## Dependency Installation

```bash
# Using pnpm
pnpm add ts-transforms
# Using npm
npm install --save ts-transforms
```

## CLI Installation

```bash
# Using pnpm
pnpm add -g ts-transforms
# Using npm
npm install --global ts-transforms
```

## Operations

This library provides a wide array of processing and validations. For an indepth review of each operation please follow the link below.

- [Operations reference](./operations.md)

## Plugins

This library provides a wide array of manipulations/validations etc but you may need a custom operation. You may do so by making a plugin and injecting it.

- [Plugin reference](./plugins.md)

## Usage

There are two different executions: `Matcher` and `Transform`. The former returns the raw matching documents while the later provides additional ETL capabilities

Example rules file: `rulesFile.txt`

```json
{ "selector": "hello:world OR bytes:>=400" }
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

- `configuration` (see below)
- `logger` (optional)

### Configuration Object

| Field   | Type                     | Description                                                                                                                                                                                                                  |
| ------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rules   | `Array` of `Strings`     | A list of file paths leading to rules that will be loaded                                                                                                                                                                    |
| plugins | `Array` of `PluginClass` | An array of plugin classes that will be used                                                                                                                                                                                 |
| types   | `Object`                 | An object with keys specifying if a given field should have type manipulations, please refer to refer to [xlucene-evaluator](https://github.com/terascope/teraslice/tree/master/packages/xlucene-evaluator) for more details |

```ts
interface Config {
    rules: string[];
    plugins?: PluginsClass[];
    types?: {
        [field: string]: string;
    };
}

const configObj: Config = {
    rules: ['path/rules1.txt', 'path/rules2.txt'],
    plugins: [Plugin1, Plugin2]
    types: { _created: 'date' },
}
```

#### Optional logger

```js
import { Logger } from '@terascope/core-utils';
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

To understand how rules apply you will need to understand all the different processing phases

### Selector Phase

This is the first phase. This goes through and collects all selectors. Only data that pass the selectors can have further processing. please refer to [xlucene-evaluator](https://github.com/terascope/teraslice/tree/master/packages/xlucene-evaluator) on all the ways you can write the selector rule. Metadata is attached to the records of which selector is applicable for that record. This is used to funnel it down the processing pipeline for the subsequent phases

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

`rulefile.txt`

```json
{ "source": "data", "target": "final" }
```

```js
import { Transform } from 'ts-transforms'

const config = {
    rules: ['/path/to/rulesFile.txt']
};

const data = [
    { hello: 'world' },
    { something: 'else', data: 'someData' },
    { bytes: 200,  data: 'otherData' },
    { bytes: 500, some: 'thing' }
];

const transform = new Transform(config);
await transform.init();

const results = transform.run(data);
console.log(results);   //   [{ final: 'someData' }, { final: 'otherData' }]

```

### Extraction Phase

This phase will go through all the configurations and apply all the extractions for a given selector. All the transformations for a given selector are merged together to return a single record back

```ts
// rules

{ "selector": "hello:world", "source": "first", "target": "first_name" }
{ "selector": "hello:world", "source": "last", "target": "last_name" }

{ "selector": "some:data", "source": "first", "target": "other_first" }
{ "selector": "some:data", "source": "last", "target": "other_last" }

// Incoming Data to transform
[
    { hello: 'world', first: 'John', last: 'Wayne' },
    { some: 'data', first: 'Abe', last: 'Lincoln' }
]

// Results
/*
  There are extraction rules for 'first' and 'last' key fields, but they have different actions based off the the selectors
*/

[
    { first_name: 'John', last_name: 'Wayne'},
    { other_first: 'Abe', other_last: 'Lincoln'}
]

```

### Post Process Phase

This phase is for any additional processing that needs to occur after extraction. Each `post_process` configuration affects the `target` of the chained configuration if you use the `tags` and `follow` parameters. You can chain multiple times if needed. This phase also includes `validation` operations and can be freely chained to each other.

- **tags** = an array of tags that marks the config and the target with an ID so other configurations can chain off of it
- **tag** = marks the config and the target with an ID so other configurations can chain off of it
- **follow** = marks the config that it is chaining off the tag id

```ts
// rules
{ "selector": "some:value", "source": "field", "target": "newField", "tag": "tag_field" }
{ "follow": "tag_field", "validation": "email", "tag": "valid_email" }
{ "follow": "valid_email", "post_process": "extraction", "start": "@", "end": ".", "output": false, "target": "secondary", "tag": "finalTag" }
{ "follow": "finalTag", "post_process": "array", "target": "final" }

// Incoming Data to transform
[
    { some: 'value', field: 'some@gmail.com' },
    { some: 'value', field: '12398074##&*' },
    { some: 'value', field: 'other@tera.io' },
]

// Results
[
   { newField: 'some@gmail.com', final: ['gmail'] },
   { newField: 'other@tera.io', final: ['tera'] }
]
```

### Output Phase

This is the last phase. This performs final removal of fields marked by `output:false` for transform configurations. This also makes sure that `other_match_required` checks the presence of additional keys

#### File structure

The rules file must be in ldjson format. Which is json data separated by a new line. For matcher, it is still advisable to stick to the ldjson format but it is allowed to specify the selector rules by themselves on each new line

- Transform:

`transformrules.txt`

```json
{ "selector": "host:google.com", "source": "field1", "start": "field1=", "end": "EOP", "target": "field1", "tag": "decodeMe" }
{ "follow": "decodeMe", "post_process": "base64decode" }
{ "source": "date", "target": "date", "other_match_required": true }
```

- Matcher:

`matcherules.txt`

```json
{ "selector": "some:data AND bytes:>=1000" }
{ "selector": "other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z" }
```

is equivalent to:

matcherules_other_format.txt

```lua
some:data AND bytes:>=1000
other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z
```

`NOTE` you can put `#` in the rules file to act as a comment, it must be on a new line

Example:

```sh
{ "selector": "some:data AND bytes:>=1000" }
# some comment about something
{ "selector": "other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z" }
```

## Matcher

This will return all the records that match the selector rule list without any additional record manipulation/validation

Example file: `rulesFile2.txt`

```json
{ "selector": "person.age:[25 TO 35]" }
{ "selector": "ipfield:'192.198.0.0/24'" }
{ "selector": "_created:[2018-10-18T18:13:20.683Z TO *]" }
{ "selector": "key:?abc*]" }
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

```json
{ "selector": "hello:world", "source": "first", "target": "first_name", "tag": "field" }
{ "selector": "hello:world", "source": "last", "target": "last_name", "tag": "field" }
{ "follow": "field", "post_process": "join", "fields": ["first_name", "last_name"], "delimiter": " ", "target": "full_name" }
```

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
- `-d`  data path
- `-t`  types
- `-f`  format
- `-s`  steam batch size

NOTE: in any case that you would specify an object or array, it must be set to a comma deliminated string

```sh
ts-transform -t 'location:geo,_created:date' -r ./rules/path,./otherRules/path -d ./data/path
```

### Piping

You may pipe the data into the cli command and omit `-d`

```sh
curl 'http://localhost:9200/test_index/_search?q=bytes:>=5642500' | ts-transform -r someRules.txt
```

you may also pipe the results to a file for further analysis

```sh
curl 'http://localhost:9200/test_index/_search?q=bytes:>=5642500' | ts-transform -r someRules.txt | tee results.txt
```

to stream large files it must be in ldjson format, this will also stream the output

```sh
cat largeLDJSONFile.txt | ts-transform -f ldjson -r someRules.txt

ts-transform -f ldjson -r someRules.txt -d largeLDJSONFile.txt
```
