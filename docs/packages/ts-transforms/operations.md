---
title: Transform Operations
sidebar_label: Operations
---

> All transform operations available

## Transforms
transform globals: config parameters that may be put on any transform configurations
- output : `Boolean`(optional) = if set to true then the `target_field` listed in the configuration will be removed in the final output phase. This is used to clean up any intermediate or source values from the final output

Example:
```ts
// rules
/* here we extract the field value and stick it on the first_name and last_name keys and we mark them as output false so they are not in the final results
*/
{ "selector": "hello:world", "source_field": "first", "target_field": "first_name", "output": false, "tag": "joinFields" }
{ "selector": "hello:world", "source_field": "last", "target_field": "last_name", "output": false, "tag": "joinFields" }
{ "follow": "joinFields", "post_process": "join","fields": ["first_name", "last_name"],"delimiter": " ","target_field": "full_name" }

// Incoming Data to transform
[{ hello: 'world', first: 'John', last: 'Wayne' }]

// Results

[{ full_name: 'John Wayne' }]

```

- other_match_required : `Booelan`(optional) = If set to true, then it conditionaly extracts the field. The condition is that there must be other successful extracted keys that make it all the way to the output phase. There has to be at least one key on the resulting object that did not come from a `other_match_required` configuration. This is used to pass along certain fields/metadata if another field passes extraction/validation etc. You can also specify a `selector` on the same configuration with `other_match_required` to make sure that logic is only applied to a particular rule pipline.

Example:
```ts
// rules
/* here we extract the url, date and key value. date and key WILL NOT BE EXTRACTED  if there was no succesfull extraction of value or value2
*/
{ "selector": "domain:example.com", "source_field": "url", "start": "value=", "end": "EOP", "target_field": "value" }
{ "selector": "domain:example.com", "source_field": "url", "start": "value2=", "end": "EOP", "target_field": "value2" }
{ "source_field": "date", "target_field": "date", "other_match_required": true }
{ "source_field": "key", "target_field": "key", "other_match_required": true }

{ "selector": "select:me", "source_field": "first", "target_field": "target" }

{ "selector": "select:me", "source_field": "other", "target_field": "field", "other_match_required": true }


// Incoming Data to transform
[
    { domain: 'example.com', url: 'http:// www.example.com/path?value=blah&value2=moreblah&value3=evenmoreblah' , date: '2019-01-29T14:29:27.097Z', key: '123456789' },
    // Note that this next data object has date and key but no url to extract so it does not pass
    { domain: 'example.com', some: 'otherField' , date: '2019-01-29T14:29:27.097Z', key: '123456789' },

    { select: 'me', first: 'someData', other: 'otherData' , date: '2019-01-29T14:29:27.097Z', key: '123456789' },
    // Note that this next data object has date, key and other but no first field to extract so it does not pass
    { select: 'me', first: 'someData', other: 'otherData' , date: '2019-01-29T14:29:27.097Z', key: '123456789' },
]

// Results:
/*
    since there was no url for to extract for the second object, date and key were dropped. Since it then became an empty object it was subsequently removed since there was no succesful extraction. Hence only one result object was returned.
*/

[
    {
        value: 'blah',
        value2: 'moreblah',
        key: '123456789',
        date: '2019-01-29T14:29:27.097Z'
    },
    {
        target: 'someData',
        field: 'otherData', // specific extraction
        key: '123456789',  // this was a general extraction
        date: '2019-01-29T14:29:27.097Z' // this was a general extraction

    }
]

```


### selector
This is a filtering operator and determines is the documnet matches a certain criteria to let it pass, otherwise the document is removed from the list. This can also be used as a post_process rule to further filter data after initial extractions and post processing.

- selector: `String` = a lucene based query from [xlucene-evaluator](https://github.com/terascope/teraslice/tree/master/packages/xlucene-evaluator)

**Note**
- having multiple extraction configs specify the same selector will bundle all the extractions on the same document.

rules.txt
```json
{ "selector": "hello:world", "source_field": "first", "target_field": "first_name" }
{ "selector": "hello:world", "source_field": "last", "target_field": "last_name" }
```

```js
import { Transform } from 'ts-transforms'

const config = {
    rules: ['/path/to/rulesFile.txt']
};

const data = [
    { hello: 'world', first: 'George', last: 'Jungle' },
    { hello: 'world', first: 'John', last: 'Wayne' }, // this will not pass through the selectors from the rules
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
```json
{ "source_field": "first", "target_field": "first_name" }
{ "source_field": "last", "target_field": "last_name" }
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

Can use as a post_process to further filter results

```ts
// rules
{ "source_field": "first", "target_field": "first_name", "tag": "filterMe" }
{ "source_field": "last", "target_field": "last_name", "tag": "filterMe"}
{ "follow": "filterMe", "post_process": "selector", "selector": "first_name:Jane" }


// Incoming Data to transform
[
    { first: 'John', last: 'Doe' },
    { first: 'Jane', last: 'Austin' },
    { first: 'Some', last: 'Person' }
]

// Results

[
    { first_name: 'Jane', last_name: 'Austin' }
]
```

### extraction
This is the core transform class used to extract data from incoming records. A new object containing all succesful extractions will be returned. If nothing can be extracted then null is returned. This can also be used as a post_process for further extractions.

Simple Extraction:
```ts
// rules
{ "selector": "transform:me", "source_field": "lat", "target_field": "location.lat" }
{ "selector": "transform:me", "source_field": "lon", "target_field": "location.lon" }
{ "selector": "transform:me", "source_field": "first", "target_field": "first_name" }

// Incoming Data to transform
[
    { transform: 'me', first: 'John' }
    { transform: 'me', lat: '-21.805149', lon: '-49.089977' }
    { transform: 'me', first: 'John', lat: '-21.805149', lon: '-49.089977' }
]

// Results

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
Example:
```ts
// rules
{ "selector": "domain:example.com", "source_field": "url", "start": "field1=", "end": "EOP", "target_field": "field1" }
{ "selector": "transform:me", "source_field": "string", "target_field": "extracting_string", "start": "someStuff(" , "end": ")" }

// Incoming Data to transform
[
    { domain: 'example.com', url: 'https://someurl.com?field1=someData&field2=otherData' }
    { transform: 'me', string: 'someStuff(stringData)orOtherThings' }
]

// Results

[
    { field1: 'someData' }
    { extracting_string: 'stringData' }
]

```
- regex : `String`(optional) = instead of `start` and `end` you may specify a regex query that will be used to extract the data
Example:
```ts
// rules
{ "selector": "hostname:www.example.com", "source_field": "pathLat", "regex": "/path/tiles/latitude/(.*?)$", "target_field": "location.lat" }
{ "selector": "hostname:www.example.com", "source_field": "pathLon", "regex": "/path/tiles/longitude/(.*?)$", "target_field": "location.lon" }

// Incoming Data to transform
[
    { hostname: 'example.com', pathLon: '/path/tiles/latitude/74.2342', pathLat: '/path/tiles/longitude/123.5332' }

]

// Results

[
    { location: { lat:'74.2342', lon: '123.5332' } }
]

```
- multivalue : `Boolean`(optional) = by default values extracted from arrays will have array results, while everything else will be extracted as is. If you set this value to false then the extracted value from the array will be set as a singular value, and not as an array. NOTE: if the rule just transfers fields and no additional extraction logic takes place then it directly transfers the value as is and ignores if multivalue is set to false.

Example:
```ts
// rules
{ "selector": "first:rule", "source_field": "otherField", "target_field": "otherField", "multivalue": false }
{ "selector": "second:rule", "source_field": "someField", "target_field": "otherField", "start": "data=", "end": "EOP" }
{ "selector": "third:rule", "source_field": "someField", "target_field": "otherField", "start": "data=", "end": "EOP", "multivalue": false }

// Incoming Data to transform
[
    { first: 'rule', someField: 'data=value' },
    { first: 'rule', someField: ['data=value', 'data=other'] },
    { second: 'rule', someField: 'data=value' },
    { second: 'rule', someField: ['data=value', 'data=other'] },
    { third: 'rule', someField: 'data=value' },
    { third: 'rule', someField: ['data=value', 'data=other'] }
]

// Results

[
    // the first rule is just a direct transfer
    { otherField: 'data=value' },
    { otherField: ['data=value', 'data=other'] },
    // second rule maintains array => array and singular => singular
    { otherField: 'value' },
    { otherField: ['value', 'other'] },
    //third rule extracts and only returns the first matching value
    { otherField: 'value' },
    { otherField: 'value' }
]

```
- mutate : `Boolean`(optional) = when set to false, a new object will be created with only the fields from the post_process extractions. NOTE this is only applicable as a post_process extraction rule. Defaults to true.

Example:
```ts
// rules
{ "selector": "rule:one", "source_field": "first", "target_field": "first_name", "tag": "first" }
{ "selector": "rule:one", "source_field": "last", "target_field": "last_name", "tag": "first"}
{ "follow": "first", "post_process": "extraction", "source_field": "first_name", "target_field": "post_extraction" }


{ "selector": "rule:two", "source_field": "first", "target_field": "first_name", "tag": "second" }
{ "selector": "rule:two", "source_field": "last", "target_field": "last_name", "tag": "second"}
{ "follow": "second", "post_process": "extraction", "source_field": "first_name", "target_field": "post_extraction", "mutate": false}
// Incoming Data to transform
[
    { rule: 'one' ,first: 'John', last: 'Doe' },
    { rule: 'two' ,first: 'John', last: 'Doe' },
]

// Results

[
    // first rule by default has mutate:true
    { first_name: 'John', last_name: 'Doe', post_extraction: 'John' }
    // second rule has mutate:false so only final extraction results from post_process are returned
    { post_extraction: 'John' }
]
```

More examples:
```ts
// rules

{ "selector": "selectfield:value", "source_field": "url", "start": "field1=", "end": "EOP", "target_field": "myfield1", "output": false, "tag": "tag1" }
{ "selector": "selectfield:value", "source_field": "url", "start": "field2=", "end": "EOP", "target_field": "myfield2", "output": false, "tag": "tag1" }
{ "follow": "tag1", "post_process": "array", "target_field": "myfield" }

// Incoming Data to transform
[
    { selectfield: 'value', url: `http://www.example.com/path?field1=someBlah&field2=moreblah&field3=evenmoreblah` }
]

// Results

[{ myfield: ['someBlah', 'moreblah'] }]

```


### join
This will attempt to join to string values together (this is a `many-to-one` operation)
- delimiter: `String`(required) =  string char used to join the two strings together
- fields: `Array of Strings`(optional) = list of fields that will be joined, if not specified then it will rely on all the tags it follows and use that

rules.txt
```json
{ "selector": "hello:world", "source_field": "first", "target_field": "first_name", "output": false, "tag": "joinFields" }
{ "selector": "hello:world", "source_field": "last", "target_field": "last_name", "output": false, "tag": "joinFields" }

# since fields is not set it will look at the target_fields of the tags it follows  => ["first_name", "last_name"]
{ "follow": "joinFields", "post_process": "join","delimiter": " ","target_field": "full_name" }

```

```js
import { Transform } from 'ts-transforms'

const config = {
    rules: ['/path/to/rulesFile.txt']
};

const data = [
    { other: 'thing', friend1: 'John', friend2: 'Susan' },
    { hello: 'world', first: 'John', last: 'Wayne' },
];

const transform = new Transform(config);
await transform.init();

const results = transform.run(data);
console.log(results);
/* NOTE if you want to remove friend1,friend2 and first, last then you will need
to extract them to another field and put output:false on those extracted fields
 */
/*   [
        {  full_name: 'John Wayne' },
    ]
 */
```

### array
This will take all inputs and create an array
- fields: `Array of Strings`(optional) = list of fields that will be joined, if not specified then it will rely on all the tags it follows and use that

``` js
// rules

{ "selector": "hello:world", "source_field": "field1", "target_field": "value1", "output": false, "tag": "values" }
{ "selector": "hello:world", "source_field": "field2", "target_field": "value2", "output": false, "tag": "values" }
{ "follow": "values", "post_process": "array", "target_field": "results" }

// Incoming data
[
    { hello: 'world', field1: 'hello', field2: 'world' },
    { field: 'null' },
]


// Results

[
    { results: ['hello', 'world'] }
]
```


### base64decode
This will attempt to base64 decode the indicated field, and will remove the field on failure

### urldecode
This will attempt to url decode the indicated field, and will remove the field on failure
- no additional parameters

### hexdecode
This will attempt to hex decode the indicated field, and will remove the field on failure
- no additional parameters

### jsonparse
This will attempt to parse JSON for the indicated field, and will remove the field on failure
- no additional parameters

### lowercase
This will make sure the field is a string and lowercase it, otherwise it will remove the field it
- no additional parameters

### uppercase
This will make sure the field is a string and uppercase it, otherwise it will remove the field it
- no additional parameters


## Validations
this provides a list of validation operations. If the field failed a validation check then that field is removed from the final output
- output : `Booelan` = **NOTE** this does not remove the field !! if `output` is set to false then it will invert the validation and become a logical operator of `NOT`. For example, if you use the `numeric` validator, it would remove anyting that **was not** a number. If you specify `output:false` then it would remove anything that was a number.

### geolocation
This will check if the field is a valid geolocation. For this validation the data may be a string or an object. If it is an object it must have either the keys `lat` and `lon` or `latitude` and `longitude`. If it is a string it is expected to be written as `latitude,longitude`

- no additional parameters

```js
// ok values:
'53.2344,127.342'
{
    lat: 53.2344,
    lon: 127.342
}
{
    latitude: 53.2344,
    longitude: 127.342
}

```
### string
Checks to see if this value is a string, if not then it will be removed.

**NOTE**  This attempts to convert anything to a string type, JSON.stringify for objects automatically. This will not do so in future versions.

- length: `Number`(optional) = if set then it will check the length of the new value. If the length of the string does not equal this parameter then it is dropped
- min: `Number`(optional) = if set then it checks that the new string value has a minimal length (inclusive) of this parameter, if not it is removed
- max: `Number`(optional) = if set then it checks that the new string value has a maximal length (inclusive) of this parameter, if not it is removed

### number
Checks to see if this value is a number, if not then it will be removed.

**NOTE**  This attempts to convert anything to a number type automatically. This will not do so in future versions.

- no additional parameters

### boolean
Checks to see if this value is a boolean, if not then it will be removed.

**NOTE**  This attempts to convert anything to a boolean type automatically. This will not do so in future versions. (ie 'true', 1, true => true,  'false', 0, false => false )

- no additional parameters

### url
Checks to see if this is a valid url
- no additional parameters

### email
Checks to see if this is a valid email
- no additional parameters

### ip
Checks to see if this is a valid ip
- no additional parameters

### macaddress
Checks to see if this is a valid mac address.

**NOTE**  This attempts to remove colons and lowercase the string characters.
**NOTE**  This normalization and parameters may change in the future to be its own post_process operation.

- case: `String`(optional) = may be set to `lowercase` or `uppercase` which will normalize the characters
- preserve_colons: `Boolean`(optional) = defaults to false, set to true so that it keeps colons in place

### uuid
Checks to see if this is a valid uuid.

**NOTE**  This attempts to lowercase the string characters.
**NOTE**  This normalization and parameters may change in the future to be its own post_process operation.

- case: `String`(optional) = may be set to `lowercase` or `uppercase` which will normalize the characters

### isdn
Checks to see if this is a valid phone number, it must include the country code and the full national number. It uses the [awesome-phonenumber](https://www.npmjs.com/package/awesome-phonenumber) package to validate and format

**NOTE**  This attempts to remove any hypens and parens from the string characters.
- no additional parameters

### contains
check if the string contains what is specified in the param `value`.

- value: `String`(require) = the value which is used to check the string

Example:
```ts
// rules

{ "selector": "some:value", "source_field": "field", "target_field": "newField", "tag": "tag_field" }
{ "follow": "tag_field", "validation": "contains", "value": "null", "output": false}

// Incoming Data to transform
[
   { some: 'value', field: 'null', other: 'data' },
   { some: 'value', field: 'fieldData', other: 'data' }
]

// Results, removes the 'newField' with the 'null' value

[
    { some: 'value', other: 'data' },
    { some: 'value', newField: 'fieldData', other: 'data' }
]

```
### equals
check if the string equals what is specified in the param `value`.

- value: `String`(required) = the value which is used to check the string

### alpha
check if the string contains only letters (a-zA-Z)

- value: `String`(optional) = defines which locale to use, defaults to `en-US`. Available locals: ['ar', 'ar-AE', 'ar-BH', 'ar-DZ', 'ar-EG', 'ar-IQ', 'ar-JO', 'ar-KW', 'ar-LB', 'ar-LY', 'ar-MA', 'ar-QA', 'ar-QM', 'ar-SA', 'ar-SD', 'ar-SY', 'ar-TN', 'ar-YE', 'bg-BG', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-AU', 'en-GB', 'en-HK', 'en-IN', 'en-NZ', 'en-US', 'en-ZA', 'en-ZM', 'es-ES', 'fr-FR', 'hu-HU', 'it-IT', 'ku-IQ', 'nb-NO', 'nl-NL', 'nn-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ru-RU', 'sl-SI', 'sk-SK', 'sr-RS', 'sr-RS@latin', 'sv-SE', 'tr-TR', 'uk-UA']


### alphanumeric
check if the string contains only letters and numbers.

- value: `String`(optional) = defines which locale to use, defaults to `en-US`. Available locals: ['ar', 'ar-AE', 'ar-BH', 'ar-DZ', 'ar-EG', 'ar-IQ', 'ar-JO', 'ar-KW', 'ar-LB', 'ar-LY', 'ar-MA', 'ar-QA', 'ar-QM', 'ar-SA', 'ar-SD', 'ar-SY', 'ar-TN', 'ar-YE', 'bg-BG', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-AU', 'en-GB', 'en-HK', 'en-IN', 'en-NZ', 'en-US', 'en-ZA', 'en-ZM', 'es-ES', 'fr-FR', 'hu-HU', 'it-IT', 'ku-IQ', 'nb-NO', 'nl-NL', 'nn-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ru-RU', 'sl-SI', 'sk-SK', 'sr-RS', 'sr-RS@latin', 'sv-SE', 'tr-TR', 'uk-UA']

### ascii
check if the string contains ASCII chars only.
- no additional parameters

### base64
check if a string is base64 encoded.
- no additional parameters

### before:
check if the string is a date that's before the specified date in the param `value`.
- value: `String`(required) = date used to check against the values

### bytelength
check if the string's length (in UTF-8 bytes) falls in a range.

- min: `Number`(optional) = if set then it checks that the value has a minimal byte (inclusive) of this parameter, if not it is removed, defaults to 0
- max: `Number`(optional) = if set then it checks that the value has a maximal byte length (inclusive) of this parameter, if not it is removed

### creditcard
check if the string is a credit card.
- no additional parameters

### currency
check if the string is a valid currency amount.

- symbol: `Number`(optional) = defaults to'$'
- require_symbol: `Boolean`(optional) = defaults to false
- allow_space_after_symbol: `Boolean`(optional) = defaults to false
- symbol_after_digits: `Boolean`(optional) = defaults to false
- allow_negatives: `Boolean`(optional) = defaults to true
- parens_for_negatives: `Boolean`(optional) = defaults to false
- negative_sign_before_digits: `Boolean`(optional) = defaults to false,
- negative_sign_after_digits: `Boolean`(optional) = defaults to false,
- allow_negative_sign_placeholder: `Boolean`(optional) = defaults to false,
- thousands_separator: `String`(optional) = defaults to ','
- decimal_separator: `String`(optional) = defaults to '.'
- allow_decimal: `Boolean`(optional) = defaults to true
- require_decimal: `Boolean`(optional) = defaults to false
- digits_after_decimal: defaults to [2], Note: The array digits_after_decimal is filled with the exact number of digits allowed not a range, for example a range 1 to 3 will be given as [1, 2, 3].
- allow_space_after_digits: `Boolean`(optional) = defaults to false,

### decimal
check if the string represents a decimal number, such as 0.1, .3, 1.1, 1.00003, 4.0, etc

- force_decimal: `Boolean`(optional) = defaults to false
- decimal_digits: `String`(optional) = defaults to '1,'. is given as a range like '1,3', a specific value like '3' or min like '1,'.
- locale: `String`(optional) = defines which locale to use, defaults to `en-US`. Available locals: ['ar', 'ar-AE', 'ar-BH', 'ar-DZ', 'ar-EG', 'ar-IQ', 'ar-JO', 'ar-KW', 'ar-LB', 'ar-LY', 'ar-MA', 'ar-QA', 'ar-QM', 'ar-SA', 'ar-SD', 'ar-SY', 'ar-TN', 'ar-YE', 'bg-BG', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-AU', 'en-GB', 'en-HK', 'en-IN', 'en-NZ', 'en-US', 'en-ZA', 'en-ZM', 'es-ES', 'fr-FR', 'hu-HU', 'it-IT', 'ku-IQ', 'nb-NO', 'nl-NL', 'nn-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ru-RU', 'sl-SI', 'sk-SK', 'sr-RS', 'sr-RS@latin', 'sv-SE', 'tr-TR', 'uk-UA']

### divisibleby
check if the string is a number that's divisible by whats provided in the param `value`.

- value: `Number`(required) = number used to divide against the values

### empty
check if the string has a length of zero.

- ignore_whitespace: `Boolean`(optional) = defaults to false

### fqdn
check if the string is a fully qualified domain name (e.g. domain.com).

- require_tld: `Boolean`(optional) = defaults to true
- allow_underscores: `Boolean`(optional) = defaults to false
- allow_trailing_dot: `Boolean`(optional) = defaults to false

### float
check if the string is a float.

- min: `Number`(optional) = if set then it checks that the value is greater than what is set (inclusive) of this parameter, if not it is removed
- max: `Number`(optional) = if set then it checks that the value is less than what is set (inclusive) of this parameter, if not it is removed
- gt : `Number`(optional) = same as min but not inclusive
- lt : `Number`(optional) = same as max but not inclusive
- locale: `String`(optional) = defines which locale to use, itdetermine the decimal separator. defaults to `en-US`. Available locals: ['ar', 'ar-AE', 'ar-BH', 'ar-DZ', 'ar-EG', 'ar-IQ', 'ar-JO', 'ar-KW', 'ar-LB', 'ar-LY', 'ar-MA', 'ar-QA', 'ar-QM', 'ar-SA', 'ar-SD', 'ar-SY', 'ar-TN', 'ar-YE', 'bg-BG', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-AU', 'en-GB', 'en-HK', 'en-IN', 'en-NZ', 'en-US', 'en-ZA', 'en-ZM', 'es-ES', 'fr-FR', 'hu-HU', 'it-IT', 'ku-IQ', 'nb-NO', 'nl-NL', 'nn-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ru-RU', 'sl-SI', 'sk-SK', 'sr-RS', 'sr-RS@latin', 'sv-SE', 'tr-TR', 'uk-UA']

### hash
check if the string is a hash of type algorithm.

- value: `String`(required) = Algorithm is one of ['md4', 'md5', 'sha1', 'sha256', 'sha384', 'sha512', 'ripemd128', 'ripemd160', 'tiger128', 'tiger160', 'tiger192', 'crc32', 'crc32b']

### hexcolor
check if the string is a hexadecimal color.
- no additional parameters

### hexadecimal
check if the string is a hexadecimal number.
- no additional parameters

### identitycard
check if the string is a valid identity card code.

- value: `String`(optional) = locale is one of ['ES'] OR 'any'. If 'any' is used, function will check if any of the locals match. defaults to 'any'

### iprange
check if the string is an IP Range(version 4 only).
- no additional parameters

### isbn
check if the string is an ISBN (version 10 or 13).

- value: `String`(optional) = which version to use, defaults to '10'

### issn
check if the string is an ISSN.

- case_sensitive: `Boolean`(optional) = defaults to false. If case_sensitive is true, ISSNs with a lowercase 'x' as the check digit are rejected.
- require_hyphen: `Boolean`(optional) = defaults to false

### isin
check if the string is an ISIN (stock/security identifier).
- no additional parameters

### iso8601
check if the string is a valid ISO 8601 date;
- strict: `Boolean`(optional) = for additional checks for valid dates, e.g. invalidates dates like 2009-02-29 set this to `true`, defaults to `false`

### rfc3339
check if the string is a valid RFC 3339 date.
- no additional parameters

### iso31661alpha2
check if the string is a valid ISO 3166-1 alpha-2 officially assigned country code.
- no additional parameters

### iso31661alpha3
check if the string is a valid ISO 3166-1 alpha-3 officially assigned country code.
- no additional parameters

### isrc
check if the string is a ISRC.
- no additional parameters

### in
check if the string is in a array/object of specified in the param `value`.
- value: `Array of Strings or Object`(required) = list of strings that are allowed

### int
check if the string is an integer.

- min: `Number`(optional) = if set then it checks that the value is greater than what is set (inclusive) of this parameter, if not it is removed
- max: `Number`(optional) = if set then it checks that the value is less than what is set (inclusive) of this parameter, if not it is removed
- gt : `Number`(optional) = same as min but not inclusive
- lt : `Number`(optional) = same as max but not inclusive
- allow_leading_zeroes: `Boolean`(optional) = defaults to true, which when set to false will disallow integer values with leading zeroes

### jwt
check if the string is an integer.
- no additional parameters

### latlong
check if the string is a valid latitude-longitude coordinate in the format lat,long or lat, long.

- no additional parameters

### length
check if the string's length falls in a range.

- min: `Number`(optional) = if set then it checks that the value's length is greater than what is set (inclusive) of this parameter, if not it is removed
- max: `Number`(optional) = if set then it checks that the value length is less than (inclusive) of this parameter, if not it is removed

### md5
check if the string is a MD5 hash.
- no additional parameters

### mimetype
check if the string matches to a valid MIME type format
- no additional parameters

### numeric
check if the string contains only numbers.

- no_symbols: `Boolean`(optional) = defaults to false. If no_symbols is true, the validator will reject numeric strings that feature a symbol (e.g. +, -, or .).

### port
check if the string is a valid port number.
- no additional parameters

### postalcode
check if the string is a postal code,

- value: `String`(required) = locale is one of [ 'AD', 'AT', 'AU', 'BE', 'BG', 'CA', 'CH', 'CZ', 'DE', 'DK', 'DZ', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU', 'IL', 'IN', 'IS', 'IT', 'JP', 'KE', 'LI', 'LT', 'LU', 'LV', 'MX', 'NL', 'NO', 'PL', 'PT', 'RO', 'RU', 'SA', 'SE', 'SI', 'TN', 'TW', 'UA', 'US', 'ZA', 'ZM' ] OR 'any'. If 'any' is used, function will check if any of the locals match.

### matches
check if string matches the pattern.

- value: `String`(required) = a regex to match against (ie. /foo/i))
