## Operations

description of all operations available

### Transforms

#### Selector 
This is a filtering operator and determines is the documnet matches a certain criteria to let it pass, otherwise the document is removed from the list.
- selector: `String` = a lucene based query from [xlucene-evaluator](https://github.com/terascope/teraslice/tree/master/packages/xlucene-evaluator)

**Note**
- having multiple extraction configs specify the same selector will bundle all the extractions on the same document. 

rules.txt
```txt
{"selector": "hello:world", "source_field": "first", "target_field": "first_name"}
{"selector": "hello:world", "source_field": "last", "target_field": "last_name"}
```

```js
import { Transform } from 'ts-transforms'

const config = {
    rules: ['/path/to/rulesFile.txt']
};

const data = [ 
    { hello: 'world', first: 'George', last: 'Jungle' },
    { hello: 'world', first: 'John', last: 'Wayne' }, // this will not be extracted from the rulles
];

const transform = new Transform(config);
await transform.init();

const results = transform.run(data);
console.log(results);
/*   [
        { first_name: 'George', last_name: 'Jungle' },
        { first_name: 'John', last_name: 'Wayne' },
    ] 
 */
```


- having no selector specified will act as a catch all and allow every document to pass through

rules.txt
```txt
{"source_field": "first", "target_field": "first_name"}
{"source_field": "last", "target_field": "last_name"}
```

```js
import { Transform } from 'ts-transforms'

const config = {
    rules: ['/path/to/rulesFile.txt']
};

const data = [ 
    { hello: 'world', first: 'George', last: 'Jungle' },
    { other: 'thing', first: 'John', last: 'Wayne' },
];

const transform = new Transform(config);
await transform.init();

const results = transform.run(data);
console.log(results);
/*   [
        { first_name: 'George', last_name: 'Jungle' },
        { first_name: 'John', last_name: 'Wayne' },
    ] 
 */
```

#### Extraction
This is the core transform class used to extract data from incoming records. If nothing can be extracted then null is returned, however if `mutate` is set to true then it will at minimum return the data it was given.

Simple Extraction:
```ts
// rules
{"selector": "transform:me", "source_field": "lat", "target_field": "location.lat"}
{"selector": "transform:me", "source_field": "lon", "target_field": "location.lon"}
{"selector": "transform:me", "source_field": "first", "target_field": "first_name"}

// Incoming Data to transform
[
    { transform: 'me', first: 'John' }
    { transform: 'me', lat: '-21.805149', lon: '-49.089977' }
    { transform: 'me', first: 'John', lat: '-21.805149', lon: '-49.089977' }
]

// Reults

[
    { first_name: 'John' }
    { location: { lat: '-21.805149', lon: '-49.089977' } }
    { first_name: 'John', location: { lat: '-21.805149', lon: '-49.089977' }  }
]

```
- source_field : `String`(required) = this is the field that you will pull/search from. You may search deeply nested fields by using dot notation (ie `person.name` )
- target_field : `String`(required) = this is the field where the result will be put. You may create deely nested object by using dot notation (ie: `location.lat` like in the example above)
- start : `String` (optional) = used to do simple extractions within the source_field. It marks where is the start of the data you wish to extract
- end : `String` (optional) = used to do simple extractions within the source_field. It marks where is the end of the data you wish to extract. NOTE: this is a special syntax of `EOP` which stands for 'end of parameter' this is used for url base extractions where it will take until the next parameter or end of line

```ts
// rules
{ "selector": "domain:example.com", "source_field": "url", "start": "field1=", "end": "EOP", "target_field": "field1" }
{"selector": "transform:me", "source_field": "string", "target_field": "extracting_string", "start": "someStuff(" , "end": ")"}

// Incoming Data to transform
[
    { domain: 'example.com', url: 'https://someurl.com?field1=someData&field2=otherData' }
    { transform: 'me', lat: '-21.805149', lon: '-49.089977' }
    { transform: 'me', first: 'John', lat: '-21.805149', lon: '-49.089977' }
]

// Reults

[
    { first_name: 'John' }
    { location: { lat: '-21.805149', lon: '-49.089977' } }
    { first_name: 'John', location: { lat: '-21.805149', lon: '-49.089977' }  }
]

```
- regex : `String` =
- mutate : `Booelan` =
- multivalue : `Booelan` =

#### Join
This will attempt to join to string values together
- delimiter: `String` =  string char used to join the two strings together
- fields: `Array of Strings` = list of fields that will be joined
// TODO: should this be remove_source
- removeSource: `Boolean` = set to `true` if you wish to remove the origin fields listed in the fields parameter from the record

rules.txt
```txt
{"selector": "hello:world", "post_process": "join", "fields": ["friend1", "friend2"], "delimiter": " & ", "target_field": "all_friends"}

{"selector": "other:thing", "post_process": "join", "fields": ["first", "last"], "delimiter": " ", "target_field": "name", "removeSource": true}
```

```js
import { Transform } from 'ts-transforms'

const config = {
    rules: ['/path/to/rulesFile.txt']
};

const data = [ 
    { hello: 'world', friend1: 'John', friend2: 'Susan' },
    { other: 'thing', first: 'John', last: 'Wayne' },
];

const transform = new Transform(config);
await transform.init();

const results = transform.run(data);
console.log(results);
/*   [
    { hello: 'world', friend1: 'John', friend2: 'Susan', all_friends: 'John & Susan' },
    { other: 'thing', name: 'John Wayne' },   
    ] 
 */
```

#### Base64Decode 
This will attempt to base64 decode the indicated field, and will remove the field on failure

#### UrlDecode 
This will attempt to url decode the indicated field, and will remove the field on failure
- no additional parameters

#### HexDecode 
This will attempt to hex decode the indicated field, and will remove the field on failure
- no additional parameters

#### JsonParse 
This will attempt to parse JSON for the indicated field, and will remove the field on failure
- no additional parameters

#### Lowercase 
This will make sure the field is a string and lowercase it, otherwise it will remove the field it
- no additional parameters

#### Uppercase 
This will make sure the field is a string and uppercase it, otherwise it will remove the field it
- no additional parameters

```sh
$ curl 'localhost:5678/v1'
{
    "arch": "x64",
    "clustering_type": "native",
    "name": "example-cluster",
    "node_version": "v8.12.0",
    "platform": "linux",
    "teraslice_version": "v0.43.0"
}
```

### Validations

#### Geolocation 
#### StringValidation 
#### NumberValidation 
#### BooleanValidation 
#### Url 
#### Email 
#### Ip 
#### MacAddress 
#### Uuid 
#### ISDN 
#### Validator