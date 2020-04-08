---
title: Data-Mate API Overview
sidebar_label: API
---

## Index

### Classes

* [DocumentMatcher](classes/documentmatcher.md)
* [VariableState](classes/variablestate.md)

### Interfaces

* [ArgsISSNOptions](interfaces/argsissnoptions.md)
* [DocumentMatcherOptions](interfaces/documentmatcheroptions.md)
* [ExtractFieldConfig](interfaces/extractfieldconfig.md)
* [FQDNOptions](interfaces/fqdnoptions.md)
* [HashConfig](interfaces/hashconfig.md)
* [LengthConfig](interfaces/lengthconfig.md)
* [MacAddressConfig](interfaces/macaddressconfig.md)
* [ReplaceLiteralConfig](interfaces/replaceliteralconfig.md)
* [ReplaceRegexConfig](interfaces/replaceregexconfig.md)
* [Repository](interfaces/repository.md)
* [xLuceneQueryResult](interfaces/xlucenequeryresult.md)

### Type aliases

* [ArgSchema](overview.md#argschema)
* [BooleanCB](overview.md#booleancb)
* [CreateJoinQueryOptions](overview.md#createjoinqueryoptions)
* [DateInput](overview.md#dateinput)
* [JoinBy](overview.md#joinby)
* [PostalCodeLocale](overview.md#postalcodelocale)
* [ValidatorHashValues](overview.md#validatorhashvalues)

### Functions

* [buildLogicFn](overview.md#buildlogicfn)
* [compareTermDates](overview.md#comparetermdates)
* [contains](overview.md#contains)
* [copyField](overview.md#copyfield)
* [dateRange](overview.md#daterange)
* [decodeBase64](overview.md#decodebase64)
* [decodeHex](overview.md#decodehex)
* [decodeURL](overview.md#decodeurl)
* [dedupe](overview.md#dedupe)
* [dropFields](overview.md#dropfields)
* [encodeBase64](overview.md#encodebase64)
* [encodeHex](overview.md#encodehex)
* [encodeMD5](overview.md#encodemd5)
* [encodeSHA](overview.md#encodesha)
* [encodeSHA1](overview.md#encodesha1)
* [encodeURL](overview.md#encodeurl)
* [equals](overview.md#equals)
* [every](overview.md#every)
* [exists](overview.md#exists)
* [extract](overview.md#extract)
* [findWildcardField](overview.md#findwildcardfield)
* [formatDate](overview.md#formatdate)
* [geoBoundingBox](overview.md#geoboundingbox)
* [geoDistance](overview.md#geodistance)
* [guard](overview.md#guard)
* [inIPRange](overview.md#iniprange)
* [inNumberRange](overview.md#innumberrange)
* [ipRange](overview.md#iprange)
* [ipTerm](overview.md#ipterm)
* [isASCII](overview.md#isascii)
* [isAlpha](overview.md#isalpha)
* [isAlphanumeric](overview.md#isalphanumeric)
* [isArray](overview.md#isarray)
* [isBase64](overview.md#isbase64)
* [isBoolean](overview.md#isboolean)
* [isBooleanLike](overview.md#isbooleanlike)
* [isCIDR](overview.md#iscidr)
* [isCountryCode](overview.md#iscountrycode)
* [isEmail](overview.md#isemail)
* [isEmpty](overview.md#isempty)
* [isFQDN](overview.md#isfqdn)
* [isGeoJSON](overview.md#isgeojson)
* [isGeoPoint](overview.md#isgeopoint)
* [isGeoShapeMultiPolygon](overview.md#isgeoshapemultipolygon)
* [isGeoShapePoint](overview.md#isgeoshapepoint)
* [isGeoShapePolygon](overview.md#isgeoshapepolygon)
* [isHash](overview.md#ishash)
* [isIP](overview.md#isip)
* [isISDN](overview.md#isisdn)
* [isISO8601](overview.md#isiso8601)
* [isISSN](overview.md#isissn)
* [isInteger](overview.md#isinteger)
* [isJSON](overview.md#isjson)
* [isLength](overview.md#islength)
* [isMACAddress](overview.md#ismacaddress)
* [isMIMEType](overview.md#ismimetype)
* [isNonRoutableIP](overview.md#isnonroutableip)
* [isNumber](overview.md#isnumber)
* [isNumberTuple](overview.md#isnumbertuple)
* [isPostalCode](overview.md#ispostalcode)
* [isRFC3339](overview.md#isrfc3339)
* [isRoutableIP](overview.md#isroutableip)
* [isString](overview.md#isstring)
* [isURL](overview.md#isurl)
* [isUUID](overview.md#isuuid)
* [isValidDate](overview.md#isvaliddate)
* [map](overview.md#map)
* [parseDate](overview.md#parsedate)
* [parseJSON](overview.md#parsejson)
* [regexp](overview.md#regexp)
* [reject](overview.md#reject)
* [renameField](overview.md#renamefield)
* [replaceLiteral](overview.md#replaceliteral)
* [replaceRegex](overview.md#replaceregex)
* [required](overview.md#required)
* [select](overview.md#select)
* [setDefault](overview.md#setdefault)
* [setField](overview.md#setfield)
* [some](overview.md#some)
* [toArray](overview.md#toarray)
* [toBoolean](overview.md#toboolean)
* [toCamelCase](overview.md#tocamelcase)
* [toGeoPoint](overview.md#togeopoint)
* [toISDN](overview.md#toisdn)
* [toISO8601](overview.md#toiso8601)
* [toJSON](overview.md#tojson)
* [toKebabCase](overview.md#tokebabcase)
* [toLowerCase](overview.md#tolowercase)
* [toNumber](overview.md#tonumber)
* [toPascalCase](overview.md#topascalcase)
* [toSnakeCase](overview.md#tosnakecase)
* [toString](overview.md#tostring)
* [toTitleCase](overview.md#totitlecase)
* [toUnixTime](overview.md#tounixtime)
* [toUpperCase](overview.md#touppercase)
* [toXluceneQuery](overview.md#toxlucenequery)
* [trim](overview.md#trim)
* [trimEnd](overview.md#trimend)
* [trimStart](overview.md#trimstart)
* [truncate](overview.md#truncate)
* [wildcard](overview.md#wildcard)

### Object literals

* [repository](overview.md#const-repository)

## Type aliases

###  ArgSchema

Ƭ **ArgSchema**: *Config & object*

*Defined in [data-mate/src/interfaces.ts:3](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/interfaces.ts#L3)*

___

###  BooleanCB

Ƭ **BooleanCB**: *function*

*Defined in [data-mate/src/document-matcher/interfaces.ts:7](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/document-matcher/interfaces.ts#L7)*

#### Type declaration:

▸ (`data`: any): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`data` | any |

___

###  CreateJoinQueryOptions

Ƭ **CreateJoinQueryOptions**: *object*

*Defined in [data-mate/src/transforms/helpers.ts:27](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/helpers.ts#L27)*

#### Type declaration:

___

###  DateInput

Ƭ **DateInput**: *string | number*

*Defined in [data-mate/src/document-matcher/interfaces.ts:8](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/document-matcher/interfaces.ts#L8)*

___

###  JoinBy

Ƭ **JoinBy**: *"AND" | "OR"*

*Defined in [data-mate/src/transforms/helpers.ts:19](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/helpers.ts#L19)*

___

###  PostalCodeLocale

Ƭ **PostalCodeLocale**: *"AD" | "AT" | "AU" | "BE" | "BG" | "BR" | "CA" | "CH" | "CZ" | "DE" | "DK" | "DZ" | "EE" | "ES" | "FI" | "FR" | "GB" | "GR" | "HR" | "HU" | "ID" | "IE" | "IL" | "IN" | "IS" | "IT" | "JP" | "KE" | "LI" | "LT" | "LU" | "LV" | "MX" | "MT" | "NL" | "NO" | "NZ" | "PL" | "PR" | "PT" | "RO" | "RU" | "SA" | "SE" | "SI" | "SK" | "TN" | "TW" | "UA" | "US" | "ZA" | "ZM"*

*Defined in [data-mate/src/validations/interfaces.ts:37](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/interfaces.ts#L37)*

___

###  ValidatorHashValues

Ƭ **ValidatorHashValues**: *"md4" | "md5" | "sha1" | "sha256" | "sha384" | "sha512" | "ripemd128" | "ripemd160" | "tiger128" | "tiger160" | "tiger192" | "crc32" | "crc32b"*

*Defined in [data-mate/src/validations/interfaces.ts:7](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/interfaces.ts#L7)*

## Functions

###  buildLogicFn

▸ **buildLogicFn**(`parser`: Parser, `typeConfig`: xLuceneTypeConfig): *function*

*Defined in [data-mate/src/document-matcher/logic-builder/index.ts:12](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/document-matcher/logic-builder/index.ts#L12)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`parser` | Parser | - |
`typeConfig` | xLuceneTypeConfig |  {} |

**Returns:** *function*

▸ (`data`: any): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`data` | any |

___

###  compareTermDates

▸ **compareTermDates**(`node`: Term): *dateTerm*

*Defined in [data-mate/src/document-matcher/logic-builder/dates.ts:14](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/document-matcher/logic-builder/dates.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | Term |

**Returns:** *dateTerm*

___

###  contains

▸ **contains**(`input`: any, `args`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:708](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L708)*

Validates the input contains the values specified in args,
or that the array of inputs contains the value in args

**`example`** 
expect(FieldValidator.contains('12345', { value: '12345' })).toBe(true);
expect(FieldValidator.contains('hello', { value: 'llo' })).toBe(false);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args` | object |

**Returns:** *boolean*

boolean

___

###  copyField

▸ **copyField**(`record`: AnyObject, `args`: object): *AnyObject*

*Defined in [data-mate/src/transforms/record-transform.ts:143](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/record-transform.ts#L143)*

Will copy a field to another field

**`example`** 
const obj = { hello: 'world', other: 'stuff' };
const config = { from: 'other', to: 'myCopy' };
const results = RecordTransform.copyField(cloneDeep(obj), config);
expect(results).toEqual({ hello: 'world', other: 'stuff', myCopy: 'stuff' });

**Parameters:**

Name | Type |
------ | ------ |
`record` | AnyObject |
`args` | object |

**Returns:** *AnyObject*

object

___

###  dateRange

▸ **dateRange**(`node`: Range): *dateRangeTerm*

*Defined in [data-mate/src/document-matcher/logic-builder/dates.ts:50](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/document-matcher/logic-builder/dates.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | Range |

**Returns:** *dateRangeTerm*

___

###  decodeBase64

▸ **decodeBase64**(`input`: any): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:522](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L522)*

decodes a base64 encoded value
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
const str = 'hello world';
const encoded = encodeBase64(str);

const results = FieldTransform.decodeBase64(encoded)
results === str

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  decodeHex

▸ **decodeHex**(`input`: any): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:618](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L618)*

decodes the hex encoded input
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
const source = 'hello world';
const encoded = encodeHex(source);

expect(FieldTransform.decodeHex(encoded)).toEqual(source);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  decodeURL

▸ **decodeURL**(`input`: StringInput): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:573](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L573)*

decodes a URL encoded value
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
const source = 'HELLO AND GOODBYE';
const encoded = 'HELLO%20AND%20GOODBYE';

expect(FieldTransform.decodeURL(encoded)).toEqual(source);

**Parameters:**

Name | Type |
------ | ------ |
`input` | StringInput |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  dedupe

▸ **dedupe**(`input`: any[]): *null | any[]*

*Defined in [data-mate/src/transforms/field-transform.ts:799](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L799)*

returns an array with only unique values

**`example`** 
const results = FieldTransform.dedupe([1, 2, 2, 3, 3, 3, undefined, 4])
results === [1, 2, 3, undefined, 4]

**Parameters:**

Name | Type |
------ | ------ |
`input` | any[] |

**Returns:** *null | any[]*

returns null if input is null/undefined

___

###  dropFields

▸ **dropFields**(`record`: AnyObject, `args`: object): *AnyObject*

*Defined in [data-mate/src/transforms/record-transform.ts:118](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/record-transform.ts#L118)*

removes fields from a record

**`example`** 

const obj = { hello: 'world', other: 'stuff', last: 'thing' };
const config = { fields: ['other', 'last']} ;
const results = RecordTransform.dropFields(cloneDeep(obj), config);
expect(results).toEqual({ hello: 'world' });

**Parameters:**

Name | Type |
------ | ------ |
`record` | AnyObject |
`args` | object |

**Returns:** *AnyObject*

object

___

###  encodeBase64

▸ **encodeBase64**(`input`: any): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:547](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L547)*

converts a value into a base64 encoded value
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
const str = 'hello world';

const encodedValue = FieldTransform.encodeBase64(str);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  encodeHex

▸ **encodeHex**(`input`: any): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:642](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L642)*

hex encodes the input
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
const source = 'hello world';

FieldTransform.encodeHex(source);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  encodeMD5

▸ **encodeMD5**(`input`: any): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:666](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L666)*

MD5 encodes the input
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
const source = 'hello world';

FieldTransform.encodeMD5(source);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  encodeSHA

▸ **encodeSHA**(`input`: any, `__namedParameters`: object): *null | Buffer‹› & string | Buffer‹› & string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:692](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L692)*

SHA encodes the input to the hash specified
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
const data = 'some string';
FieldTransform.encodeSHA(data { hash: 'sha256', digest: 'hex'})

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`__namedParameters` | object |  {} |

**Returns:** *null | Buffer‹› & string | Buffer‹› & string[]*

returns null if input is null/undefined

___

###  encodeSHA1

▸ **encodeSHA1**(`input`: any): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:720](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L720)*

converts the value to a SHA1 encoded value
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
const source = 'hello world';

FieldTransform.encodeSHA1(source);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  encodeURL

▸ **encodeURL**(`input`: StringInput): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:596](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L596)*

URL encodes a value
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
const source = 'HELLO AND GOODBYE';
const encoded = 'HELLO%20AND%20GOODBYE';

expect(FieldTransform.encodeURL(source)).toEqual(encoded);

**Parameters:**

Name | Type |
------ | ------ |
`input` | StringInput |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  equals

▸ **equals**(`input`: any, `args`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:732](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L732)*

Validates that the input matches the value, of that the input array matches the value provided

**`example`** 
expect(FieldValidator.equals('12345', { value: '12345' })).toBe(true);
expect(FieldValidator.equals('hello', { value: 'llo' })).toBe(false);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args` | object |

**Returns:** *boolean*

boolean

___

###  every

▸ **every**(`input`: any, `__namedParameters`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:1229](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L1229)*

Validates that the function specified returns true for every single value in the list

**`example`** 
expect(FieldValidator.every(['hello', 3, { some: 'obj' }], { fn: 'isString' })).toBe(false);
expect(FieldValidator.every(['hello', 'world'], { fn: 'isString' })).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

boolean

___

###  exists

▸ **exists**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:1174](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L1174)*

Will return false if input is null or undefined

**`example`** 
expect(FieldValidator.exists({ hello: 'world' })).toBe(true);
expect(FieldValidator.exists(null)).toBe(false);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  extract

▸ **extract**(`input`: any, `__namedParameters`: object): *any*

*Defined in [data-mate/src/transforms/field-transform.ts:865](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L865)*

Can extract values from a string input. You may either specify a regex, a jexl expression, or
specify the start and end from which the extraction will take all values inbetween
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
 const results1 = FieldTransform.extract('<hello>', { start: '<', end: '>' });
 expect(results1).toEqual('hello');

const results2 = FieldTransform.extract({ foo: 'bar' }, { jexlExp: '[foo]' });
expect(results2).toEqual(['bar']);

const results3 = FieldTransform.extract('hello', { regex: 'he.*' });
expect(results3).toEqual(['hello']);

const results = FieldTransform.extract('hello', { regex: 'he.*', isMultiValue: false });
expect(results).toEqual('hello');

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *any*

returns null if input is null/undefined

___

###  findWildcardField

▸ **findWildcardField**(`field`: string, `cb`: [BooleanCB](overview.md#booleancb)): *WildcardField*

*Defined in [data-mate/src/document-matcher/logic-builder/string.ts:21](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/document-matcher/logic-builder/string.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`cb` | [BooleanCB](overview.md#booleancb) |

**Returns:** *WildcardField*

___

###  formatDate

▸ **formatDate**(`input`: any, `args`: FormatDateConfig): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:1189](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L1189)*

Function that will format a number or date string to a given date format provided

**`example`** 

const results1 = FieldTransform.formatDate('2020-01-14T20:34:01.034Z', { format: 'MMM do yy' })
results1 === 'Jan 14th 20';

const results2 = FieldTransform.formatDate('March 3, 2019', { format: 'M/d/yyyy' })
results2 === '3/3/2019';

const config =  { format: 'yyyy-MM-dd', resolution: 'seconds' };
const results3 = FieldTransform.formatDate(1581013130, config)
results3 === '2020-02-06';

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | any | - |
`args` | FormatDateConfig |  format is the shape that the date will be, resolution is only needed when input is a number |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  geoBoundingBox

▸ **geoBoundingBox**(`node`: GeoBoundingBox): *(Anonymous function)*

*Defined in [data-mate/src/document-matcher/logic-builder/geo.ts:39](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/document-matcher/logic-builder/geo.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | GeoBoundingBox |

**Returns:** *(Anonymous function)*

___

###  geoDistance

▸ **geoDistance**(`node`: GeoDistance): *(Anonymous function)*

*Defined in [data-mate/src/document-matcher/logic-builder/geo.ts:18](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/document-matcher/logic-builder/geo.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | GeoDistance |

**Returns:** *(Anonymous function)*

___

###  guard

▸ **guard**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:1159](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L1159)*

Will throw if input is null or undefined

**`example`** 
expect(FieldValidator.guard({ hello: 'world' })).toBe(true);
expect(() => FieldValidator.guard(null)).toThrow();

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  inIPRange

▸ **inIPRange**(`input`: any, `args`: object): *any*

*Defined in [data-mate/src/validations/field-validator.ts:472](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L472)*

Validates if the input is within a given range of IP's

**`example`** 
expect(FieldValidator.inIPRange('8.8.8.8', { min: '8.8.8.0', max: '8.8.8.64' })).toBe(true);
expect(FieldValidator.inIPRange('8.8.8.8', { max: '8.8.8.64' })).toBe(true);
expect(FieldValidator.inIPRange('8.8.8.8', { min: '8.8.8.0' })).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args` | object |

**Returns:** *any*

boolean

___

###  inNumberRange

▸ **inNumberRange**(`input`: any, `args`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:575](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L575)*

Will return true if number is between args provided, or that the list
of numbers are between the values

**`example`** 
expect(FieldValidator.inNumberRange(-12, { min: -100, max: 45 })).toBe(true);
expect(FieldValidator.inNumberRange(0, { max: 45 })).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args` | object |

**Returns:** *boolean*

boolean

___

###  ipRange

▸ **ipRange**(`node`: Range): *checkIp*

*Defined in [data-mate/src/document-matcher/logic-builder/ip.ts:90](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/document-matcher/logic-builder/ip.ts#L90)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | Range |

**Returns:** *checkIp*

___

###  ipTerm

▸ **ipTerm**(`node`: Term): *checkIp*

*Defined in [data-mate/src/document-matcher/logic-builder/ip.ts:27](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/document-matcher/logic-builder/ip.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | Term |

**Returns:** *checkIp*

___

###  isASCII

▸ **isASCII**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:803](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L803)*

Validates that the input is ascii chars or a list of ascii chars

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isAlpha

▸ **isAlpha**(`input`: any, `args?`: undefined | object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:756](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L756)*

Validates that the input is alpha or a list of alpha values

**`example`** 
expect(FieldValidator.isAlpha('ThiSisAsTRing')).toBe(true);
expect(FieldValidator.isAlpha('ThisiZĄĆĘŚŁ', { locale: 'pl-Pl' })).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *boolean*

boolean

___

###  isAlphanumeric

▸ **isAlphanumeric**(`input`: any, `args?`: undefined | object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:782](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L782)*

Validates that the input is alphanumeric or a list of alphanumieric values

**`example`** 
expect(FieldValidator.isAlphanumeric('1234')).toBe(true);
expect(FieldValidator.isAlphanumeric('allalpa')).toBe(true);
expect(FieldValidator.isAlphanumeric('فڤقکگ1234', { locale: 'ku-IQ' })).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *boolean*

boolean

___

###  isArray

▸ **isArray**(`input`: any): *input is any[]*

*Defined in [data-mate/src/validations/field-validator.ts:1189](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L1189)*

Validates that the input is an array

**`example`** 
 expect(FieldValidator.isArray(undefined)).toBe(false);
expect(FieldValidator.isArray([1, 2, 3])).toBe(true);
expect(FieldValidator.isArray([])).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is any[]*

boolean

___

###  isBase64

▸ **isBase64**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:824](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L824)*

Validates that the input is a base64 encoded string or a list of base64 encoded strings

**`example`** 
expect(FieldValidator.isBase64('ZWFzdXJlLg==')).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isBoolean

▸ **isBoolean**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:184](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L184)*

Checks to see if input is a boolean.
If given an array, will check if all values are booleans

**`example`** 
expect(FieldValidator.isBoolean('true')).toEqual(false);
expect(FieldValidator.isBoolean(false)).toEqual(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isBooleanLike

▸ **isBooleanLike**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:208](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L208)*

Checks to see if input is a boolean-like value. If an given an array, it will check
to see if all values in the array are boolean-like, does NOT ignore null/undefined values

**`example`** 
expect(FieldValidator.isBooleanLike()).toEqual(true);
expect(FieldValidator.isBooleanLike(null)).toEqual(true);
expect(FieldValidator.isBooleanLike(0)).toEqual(true);
expect(FieldValidator.isBooleanLike('0')).toEqual(true);
expect(FieldValidator.isBooleanLike('false')).toEqual(true);
expect(FieldValidator.isBooleanLike('no')).toEqual(true);
expect(FieldValidator.isBooleanLike(['no', '0', null])).toEqual(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isCIDR

▸ **isCIDR**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:449](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L449)*

Validates that input is a cidr or a list of cidr values

**`example`** 
expect(FieldValidator.isIPCidr('8.8.0.0/12')).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isCountryCode

▸ **isCountryCode**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:933](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L933)*

Validates that input is a valid country code or a list of country codes

**`example`** 
expect(FieldValidator.isCountryCode('IS')).toBe(true);
expect(FieldValidator.isCountryCode('RU')).toBe(true);
expect(FieldValidator.isCountryCode('ru')).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isEmail

▸ **isEmail**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:225](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L225)*

Return true if value is a valid email, or a list of valid emails

**`example`** 
FieldValidator.isEmail('ha3ke5@pawnage.com') === true
FieldValidator.isEmail('user@blah.com/junk.junk?a=<tag value="junk"') === true

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isEmpty

▸ **isEmpty**(`input`: any, `args?`: undefined | object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:850](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L850)*

Validates that the iput is empty

**`example`** 
expect(FieldValidator.isEmpty('')).toBe(true);
expect(FieldValidator.isEmpty(undefined)).toBe(true);
expect(FieldValidator.isEmpty(null)).toBe(true);
expect(FieldValidator.isEmpty({})).toBe(true);
expect(FieldValidator.isEmpty([])).toBe(true);
expect(FieldValidator.isEmpty('     ', { ignoreWhitespace: true })).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *boolean*

boolean

___

###  isFQDN

▸ **isFQDN**(`input`: any, `args?`: [FQDNOptions](interfaces/fqdnoptions.md)): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:872](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L872)*

Validate that the input is a valid domain name, or a list of domian names

**`example`** 

expect(FieldValidator.isFQDN('john.com.uk.bob')).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | [FQDNOptions](interfaces/fqdnoptions.md) |

**Returns:** *boolean*

boolean

___

###  isGeoJSON

▸ **isGeoJSON**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:276](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L276)*

Checks to see if input is a valid geo-json geometry, or a list of geo-json geometeries

**`example`** 
expect(FieldValidator.isGeoJSON('hello')).toEqual(false);

const polygon = {
  type: "Polygon",
  coordinates: [
      [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
  ]
};
expect(FieldValidator.isGeoJSON(polygon)).toEqual(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isGeoPoint

▸ **isGeoPoint**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:246](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L246)*

Checks to see if input is a valid geo-point, or a list of valid geo-points
excluding null/undefined values

**`example`** 
expect(FieldValidator.isGeoPoint('60,80')).toEqual(true);
expect(FieldValidator.isGeoPoint([80, 60])).toEqual(true);
expect(FieldValidator.isGeoPoint({ lat: 60, lon: 80 })).toEqual(true);
expect(FieldValidator.isGeoPoint({ latitude: 60, longitude: 80 })).toEqual(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isGeoShapeMultiPolygon

▸ **isGeoShapeMultiPolygon**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:351](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L351)*

Checks to see if input is a valid geo-json multipolygon or a list of geo-json multipolygons

**`example`** 
expect(FieldValidator.isGeoShapeMultiPolygon(3)).toEqual(false);

const multiPolygon = {
  type: 'MultiPolygon',
  coordinates: [
      [
          [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
      ],
      [
          [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
      ]
  ]
};
expect(FieldValidator.isGeoShapeMultiPolygon(multiPolygon)).toEqual(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isGeoShapePoint

▸ **isGeoShapePoint**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:298](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L298)*

Checks to see if input is a valid geo-json point, or a list of geo-json points

**`example`** 
expect(FieldValidator.isGeoShapePoint(3)).toEqual(false);

const matchingPoint = {
  type: 'Point',
  coordinates: [12, 12]
};
expect(FieldValidator.isGeoShapePoint(matchingPoint)).toEqual(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isGeoShapePolygon

▸ **isGeoShapePolygon**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:322](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L322)*

Checks to see if input is a valid geo-json polygon or a list of geo-json polygons

**`example`** 
expect(FieldValidator.isGeoShapePolygon(3)).toEqual(false);

const polygon = {
  type: 'Polygon',
  coordinates: [
      [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
  ]
};
expect(FieldValidator.isGeoShapePolygon(matchingPoint)).toEqual(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isHash

▸ **isHash**(`input`: any, `args`: [HashConfig](interfaces/hashconfig.md)): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:909](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L909)*

Validates that the input is a hash, or a list of hashes

**`example`** 
const md5Config = { algo: 'md5'};
const sha256Config = { algo: 'sha256' }
const sha1Config = { algo: 'sha1' }

expect(FieldValidator.isHash('6201b3d1815444c87e00963fcf008c1e', md5Config)).toBe(true);
expect(FieldValidator.isHash(
 '85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33',
 sha256Config
)).toBe(true);
expect(FieldValidator.isHash('98fc121ea4c749f2b06e4a768b92ef1c740625a0', sha1Config)).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args` | [HashConfig](interfaces/hashconfig.md) |

**Returns:** *boolean*

boolean

___

###  isIP

▸ **isIP**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:374](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L374)*

Validates that the input is an IP address, or a list of IP addresses

**`example`** 
expect(FieldValidator.isIP('8.8.8.8')).toBe(true);
expect(FieldValidator.isIP('192.172.1.18')).toBe(true);
expect(FieldValidator.isIP('11.0.1.18')).toBe(true);
expect(FieldValidator.isIP('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe(true);
expect(FieldValidator.isIP('fe80::1ff:fe23:4567:890a%eth2')).toBe(true);
expect(FieldValidator.isIP('2001:DB8::1')).toBe(true);
expect(FieldValidator.isIP('172.16.0.1')).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isISDN

▸ **isISDN**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:520](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L520)*

Validates that the input is a valid phone number, or a list of phone numbers

**`example`** 
expect(FieldValidator.isISDN('+18089156800')).toBe(true);
expect(FieldValidator.isISDN('+7-952-5554-602')).toBe(true);
expect(FieldValidator.isISDN('79525554602')).toBe(true);
expect(FieldValidator.isISDN(79525554602)).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isISO8601

▸ **isISO8601**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:955](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L955)*

Checks to see if input is a valid ISO8601 string dates or a list of valid dates

**`example`** 
expect(FieldValidator.isISO8601('2020-01-01T12:03:03.494Z')).toBe(true);
expect(FieldValidator.isISO8601('2020-01-01')).toBe(true);
expect(FieldValidator.isISO8601('2020-01-01T12:03:03')).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isISSN

▸ **isISSN**(`input`: any, `args?`: [ArgsISSNOptions](interfaces/argsissnoptions.md)): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:978](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L978)*

Validates that input is a valid ISSN or a list of valid ISSN

**`example`** 
expect(FieldValidator.isISSN('0378-5955')).toBe(true);
expect(FieldValidator.isISSN('03785955')).toBe(true)
expect(FieldValidator.isISSN('0378-5955', { requireHyphen: true })).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | [ArgsISSNOptions](interfaces/argsissnoptions.md) |

**Returns:** *boolean*

boolean

___

###  isInteger

▸ **isInteger**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:624](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L624)*

Validates that input is a integer or a list of integers

**`example`** 
expect(FieldValidator.isInteger(17.343)).toBe(true);
expect(FieldValidator.isInteger(Infinity)).toBe(false);
expect(FieldValidator.isInteger('1')).toBe(false);
expect(FieldValidator.isInteger(true)).toBe(false);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isJSON

▸ **isJSON**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:1030](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L1030)*

Validates that input is a valid JSON string or a list of valid JSON

**`example`** 
expect(FieldValidator.isJSON('{ "bob": "gibson" }')).toBe(true);
expect(FieldValidator.isJSON('[{ "bob": "gibson" }, { "dizzy": "dean" }]')).toBe(true);
expect(FieldValidator.isJSON('[]')).toBe(true);
expect(FieldValidator.isJSON('{}')).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isLength

▸ **isLength**(`input`: any, `__namedParameters`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:1054](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L1054)*

Check to see if input is a string with given length ranges, or a list of valid string lengths

**`example`** 
expect(FieldValidator.isLength('astring', { size: 7 })).toBe(true);
expect(FieldValidator.isLength('astring', { min: 5, max: 10 })).toBe(true);
expect(FieldValidator.isLength('astring', { size: 5 })).toBe(false);
expect(FieldValidator.isLength('astring', { min: 8 })).toBe(false);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

boolean

___

###  isMACAddress

▸ **isMACAddress**(`input`: any, `args?`: MACAddress): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:555](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L555)*

Validates that the input is a MacAddress, or a list of MacAddresses

**`example`** 
FieldValidator.isMACAddress('001f.f35b.2b1f') === true
FieldValidator.isMACAddress('001ff35b2b1f', { delimiter: 'any' }) === true
FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f', { delimiter: 'colon' }) === true
FieldValidator.isMACAddress('00-1f-f3-5b-2b-1f', { delimiter: 'dash' }) === true
FieldValidator.isMACAddress('001ff35b2b1f', { delimiter: 'none' }) === true
FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f', { delimiter: ['dash', 'colon'] }) === true
FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f', { delimiter: 'dash' }) === false
FieldValidator.isMACAddress('00 1f f3 5b 2b 1f', { delimiter: 'colon' }) === false
FieldValidator.isMACAddress('001ff35b2b1f', { delimiter: 'colon' }) === false
FieldValidator.isMACAddress('001ff35b2b1f', { delimiter: ['dash', 'colon'] }) === false

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | MACAddress |

**Returns:** *boolean*

boolean

___

###  isMIMEType

▸ **isMIMEType**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:1085](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L1085)*

Validates that input is a valid mimeType or a list of mimeTypes

**`example`** 
expect(FieldValidator.isMIMEType('application/javascript')).toBe(true);
expect(FieldValidator.isMIMEType('application/graphql')).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isNonRoutableIP

▸ **isNonRoutableIP**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:425](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L425)*

Validate is input is a non-routable IP, or a list of non-routable IP's

**`example`** 
expect(FieldValidator.isRoutableIP('192.168.0.1')).toBe(true);
expect(FieldValidator.isRoutableIP('2001:db8::1')).toBe(false);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isNumber

▸ **isNumber**(`input`: any): *input is number*

*Defined in [data-mate/src/validations/field-validator.ts:604](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L604)*

Validates that input is a number or a list of numbers

**`example`** 
expect(FieldValidator.isNumber(17.343)).toBe(true);
expect(FieldValidator.isNumber(Infinity)).toBe(true);
expect(FieldValidator.isNumber('1')).toBe(false);
expect(FieldValidator.isNumber(true)).toBe(false);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is number*

boolean

___

###  isNumberTuple

▸ **isNumberTuple**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:1238](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L1238)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isPostalCode

▸ **isPostalCode**(`input`: any, `args`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:1111](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L1111)*

Validates that input is a valid postal code or a list of postal codes

**`example`** 
expect(FieldValidator.isPostalCode('85249', { locale: 'any' })).toBe(true);
expect(FieldValidator.isPostalCode('85249', { locale: 'ES' })).toBe(true);
expect(FieldValidator.isPostalCode('85249', { locale: 'ES' })).toBe(true);
expect(FieldValidator.isPostalCode('852', { locale: 'IS' })).toBe(true);
expect(FieldValidator.isPostalCode('885 49', { locale: 'SE' })).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args` | object |

**Returns:** *boolean*

boolean

___

###  isRFC3339

▸ **isRFC3339**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:1006](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L1006)*

Validates that input is a valid RFC3339 dates or a list of valid RFC3339 dates

**`example`** 
expect(FieldValidator.isRFC3339('2020-01-01T12:05:05.001Z')).toBe(true);
expect(FieldValidator.isRFC3339('2020-01-01 12:05:05.001Z')).toBe(true);
expect(FieldValidator.isRFC3339('2020-01-01T12:05:05Z')).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isRoutableIP

▸ **isRoutableIP**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:401](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L401)*

Validate is input is a routable IP, or a list of routable IP's

**`example`** 
expect(FieldValidator.isRoutableIP('192.168.0.1')).toBe(false);
expect(FieldValidator.isRoutableIP('2001:db8::1')).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isString

▸ **isString**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:644](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L644)*

Validates that input is a string or a list of strings

**`example`** 
expect(FieldValidator.isInteger(17.343)).toBe(false);
expect(FieldValidator.isInteger(Infinity)).toBe(false);
expect(FieldValidator.isInteger('1')).toBe(true);
expect(FieldValidator.isInteger(true)).toBe(false);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isURL

▸ **isURL**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:663](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L663)*

Validates that the input is a url or a list of urls

**`example`** 
expect(FieldValidator.isURL('https://someurl.cc.ru.ch')).toBe(true);
expect(FieldValidator.isURL('ftp://someurl.bom:8080?some=bar&hi=bob')).toBe(true);
expect(FieldValidator.isURL('http://xn--fsqu00a.xn--3lr804guic')).toBe(true)

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isUUID

▸ **isUUID**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:684](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L684)*

Validates that input is a UUID or a list of UUID's

**`example`** 
expect(FieldValidator.isUUID('123e4567-e89b-82d3-f456-426655440000')).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  isValidDate

▸ **isValidDate**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:1139](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L1139)*

Validates that the input is a valid date or a list of valid dates

**`example`** 
expect(FieldValidator.isValidDate('2019-03-17T23:08:59.673Z')).toBe(true);
expect(FieldValidator.isValidDate('2019-03-17')).toBe(true);
expect(FieldValidator.isValidDate('2019-03-17T23:08:59')).toBe(true);
expect(FieldValidator.isValidDate('03/17/2019')).toBe(true);
expect(FieldValidator.isValidDate('03-17-2019')).toBe(true);
expect(FieldValidator.isValidDate('Jan 22, 2012')).toBe(true);
expect(FieldValidator.isValidDate('23 Jan 2012')).toBe(true);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

boolean

___

###  map

▸ **map**(`input`: any[], `args`: object): *null | any[]*

*Defined in [data-mate/src/transforms/field-transform.ts:223](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L223)*

This function is used to map an array of values with any FieldTransform method

**`example`** 
 const array = ['hello', 'world', 'goodbye'];
 const results = FieldTransform.map(array, { fn: 'truncate', options: { size: 3 } }
 results === ['hel', 'wor', 'goo']

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | any[] | an array of any value |
`args` | object | fn any FieldTransform function name, options is an object with any additional parameters needed |

**Returns:** *null | any[]*

returns the mapped values, return null if input is null/undefied

___

###  parseDate

▸ **parseDate**(`input`: any, `args`: ParseDateConfig): *null | Date | null | Date[]*

*Defined in [data-mate/src/transforms/field-transform.ts:1245](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L1245)*

Will use date-fns parse against the input and return a date object

**`example`** 

const result = FieldTransform.parseDate('2020-01-10-00:00', { format: 'yyyy-MM-ddxxx' })
result === new Date('2020-01-10T00:00:00.000Z');

const result = FieldTransform.parseDate('Jan 10, 2020-00:00', { format: 'MMM dd, yyyyxxx' })
result === new Date('2020-01-10T00:00:00.000Z');

const result = FieldTransform.parseDate(1581025950223, { format: 'T' })
result === new Date('2020-02-06T21:52:30.223Z');

const result = FieldTransform.parseDate(1581025950, { format: 't' })
result === new Date('2020-02-06T21:52:30.000Z');

const result = FieldTransform.parseDate('1581025950', { format: 't' })
result === new Date('2020-02-06T21:52:30.000Z');

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args` | ParseDateConfig |

**Returns:** *null | Date | null | Date[]*

returns null if input is null/undefined

___

###  parseJSON

▸ **parseJSON**(`input`: any): *any*

*Defined in [data-mate/src/transforms/field-transform.ts:746](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L746)*

Parses the json input
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
const obj = { hello: 'world' };
const json = JSON.stringify(obj);
const results = FieldTransform.parseJSON(json);
results === obj

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *any*

returns null if input is null/undefined

___

###  regexp

▸ **regexp**(`regexStr`: string): *regexpTerm*

*Defined in [data-mate/src/document-matcher/logic-builder/string.ts:9](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/document-matcher/logic-builder/string.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`regexStr` | string |

**Returns:** *regexpTerm*

___

###  reject

▸ **reject**(`obj`: AnyObject, `args`: DMOptions): *boolean*

*Defined in [data-mate/src/validations/record-validator.ts:131](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/record-validator.ts#L131)*

Will return true if an object DOES NOT match the xLucene expression

**`example`** 
const obj1 = { foo: 'hello', bar: 'stuff' };
const obj2 = { foo: 123412 };
const args = { query: '_exists_:bar' };

const results1 = RecordValidator.reject(obj1, args);
const results2 = RecordValidator.reject(obj2, args);

expect(results1).toEqual(false);
expect(results2).toEqual(true);

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`obj` | AnyObject | - |
`args` | DMOptions |  shape is { query: string, type_config: xLuceneTypeConfig, variables: xLuceneVariables } |

**Returns:** *boolean*

boolean

___

###  renameField

▸ **renameField**(`record`: AnyObject, `args`: object): *AnyObject*

*Defined in [data-mate/src/transforms/record-transform.ts:70](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/record-transform.ts#L70)*

This will migrate a fields value to a new field name

**`example`** 

const obj = { hello: 'world' };
const config = { from: 'hello', to: 'goodbye' };
const results = RecordTransform.renameField(cloneDeep(obj), config);
results === { goodbye: 'world' };

**Parameters:**

Name | Type |
------ | ------ |
`record` | AnyObject |
`args` | object |

**Returns:** *AnyObject*

object

___

###  replaceLiteral

▸ **replaceLiteral**(`input`: StringInput, `__namedParameters`: object): *null | string | any[]*

*Defined in [data-mate/src/transforms/field-transform.ts:1014](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L1014)*

This function replaces the searched value with the replace value

**`example`** 

FieldTransform.replaceLiteral('Hi bob', { search: 'bob', replace: 'mel' }) === 'Hi mel';
FieldTransform.replaceLiteral('Hi Bob', { search: 'bob', replace: 'Mel ' }) ===  'Hi Bob';

**Parameters:**

Name | Type |
------ | ------ |
`input` | StringInput |
`__namedParameters` | object |

**Returns:** *null | string | any[]*

returns null if input is null/undefined

___

###  replaceRegex

▸ **replaceRegex**(`input`: StringInput, `__namedParameters`: object): *null | string | any[]*

*Defined in [data-mate/src/transforms/field-transform.ts:977](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L977)*

This function replaces chars in a string based off the regex value provided

**`example`** 
const config1 =  { regex: 's|e', replace: 'd' };
const results1 = FieldTransform.replaceRegex('somestring', config1)
results1 === 'domestring'

const config2 = { regex: 's|e', replace: 'd', global: true };
const results2 = FieldTransform.replaceRegex('somestring', config)
results2 === 'domddtring'

const config3 = {
  regex: 'm|t', replace: 'W', global: true, ignoreCase: true
};
const results3 = FieldTransform.replaceRegex('soMesTring', config3))
results3 === 'soWesWring'

**Parameters:**

Name | Type |
------ | ------ |
`input` | StringInput |
`__namedParameters` | object |

**Returns:** *null | string | any[]*

returns null if input is null/undefined

___

###  required

▸ **required**(`obj`: AnyObject, `__namedParameters`: object): *boolean*

*Defined in [data-mate/src/validations/record-validator.ts:69](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/record-validator.ts#L69)*

This function will return false if input record does not have all specified keys

**`example`** 
const obj1 = { foo: 'hello', bar: 'stuff' };
const obj2 = { foo: 123412 };
const fields = ['bar'];

const results1 = RecordValidator.required(obj1, { fields });
const results2 = RecordValidator.required(obj2, { fields });

expect(results1).toEqual(true);
expect(results2).toEqual(false);

**Parameters:**

Name | Type |
------ | ------ |
`obj` | AnyObject |
`__namedParameters` | object |

**Returns:** *boolean*

boolean

___

###  select

▸ **select**(`obj`: AnyObject, `args`: DMOptions): *boolean*

*Defined in [data-mate/src/validations/record-validator.ts:100](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/record-validator.ts#L100)*

Will return true if an object matches the xLucene expression

**`example`** 
const obj1 = { foo: 'hello', bar: 'stuff' };
const obj2 = { foo: 123412 };
const args = { query: '_exists_:bar' };

const results1 = RecordValidator.select(obj1, args);
const results2 = RecordValidator.select(obj2, args);

expect(results1).toEqual(true);
expect(results2).toEqual(false);

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`obj` | AnyObject | - |
`args` | DMOptions |  shape is { query: string, type_config: xLuceneTypeConfig, variables: xLuceneVariables } |

**Returns:** *boolean*

boolean

___

###  setDefault

▸ **setDefault**(`input`: any, `args`: object): *any*

*Defined in [data-mate/src/transforms/field-transform.ts:202](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L202)*

This function is used to set a value if input is null or undefined,
otherwise the input value is returned

**`example`** 
const results = FieldTransform.setDefault(undefined, { value: 'someValue' });
results === 'someValue';

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | any | - |
`args` | object | value is what will be given when input is null/undefined |

**Returns:** *any*

___

###  setField

▸ **setField**(`_input`: any, `args`: object): *any*

*Defined in [data-mate/src/transforms/field-transform.ts:245](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L245)*

This function is not meant to be used programatically
please use `RecordTransform.setField` instead

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`_input` | any | This value will be discarded |
`args` | object | - |

**Returns:** *any*

___

###  some

▸ **some**(`input`: any, `__namedParameters`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:1207](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L1207)*

Validates that the function specified returns true at least once on the list of values

**`example`** 
expect(FieldValidator.some(['hello', 3, { some: 'obj' }], { fn: 'isString' })).toBe(true);
expect(FieldValidator.some(['hello', 3, { some: 'obj' }], { fn: 'isBoolean' })).toBe(false);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

boolean

___

###  toArray

▸ **toArray**(`input`: any, `args?`: undefined | object): *string[] | null*

*Defined in [data-mate/src/transforms/field-transform.ts:1045](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L1045)*

Converts a string to an array of characters split by the delimiter provided

**`example`** 
expect(FieldTransform.toArray('astring')).toEqual(['a', 's', 't', 'r', 'i', 'n', 'g']);
expect(FieldTransform.toArray('astring', { delimiter: ',' })).toEqual(['astring']);
expect(FieldTransform.toArray('a-stri-ng', { delimiter: '-' })).toEqual(['a', 'stri', 'ng']);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *string[] | null*

___

###  toBoolean

▸ **toBoolean**(`input`: any): *null | false | true | boolean[]*

*Defined in [data-mate/src/transforms/field-transform.ts:278](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L278)*

Converts values to booleans
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
expect(FieldTransform.toBoolean('0')).toBe(false)
expect(FieldTransform.toBoolean(['foo', 'false', null])).toEqual([true, false]);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *null | false | true | boolean[]*

returns null if input is null/undefined

___

###  toCamelCase

▸ **toCamelCase**(`input`: string): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:1269](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L1269)*

Will convert a string, or an array of strings to camel case;

**`example`** 
expect(FieldTransform.toCamelCase('I need camel case')).toBe('iNeedCamelCase');
expect(FieldTransform.toCamelCase('happyBirthday')).toBe('happyBirthday');
expect(FieldTransform.toCamelCase('what_is_this')).toBe('whatIsThis');

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  toGeoPoint

▸ **toGeoPoint**(`input`: any): *null | GeoPoint | GeoPoint[]*

*Defined in [data-mate/src/transforms/field-transform.ts:821](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L821)*

Converts the value into a geo-point
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
expect(fieldTransform.toGeoPoint('60, 40')).toEqual({ lon: 40, lat: 60 });
expect(fieldTransform.toGeoPoint([40, 60])).toEqual({ lon: 40, lat: 60 });
expect(fieldTransform.toGeoPoint({ lat: 40, lon: 60 })).toEqual({ lon: 60, lat: 40 });
expect(fieldTransform.toGeoPoint({ latitude: 40, longitude: 60 })).toEqual({ lon: 60, lat: 40 })

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *null | GeoPoint | GeoPoint[]*

| { lat: number, lon: number }[] | null }
returns null if input is null/undefined

___

###  toISDN

▸ **toISDN**(`input`: any): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:459](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L459)*

Parses a string or number to a fully validated phone number
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
expect(FieldTransform.toISDN('+33-1-22-33-44-55')).toBe('33122334455');
expect(FieldTransform.toISDN('1(800)FloWErs')).toBe('18003569377');

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | any | string | string[] | number | number[] |

**Returns:** *null | string | string[]*

a fully validated phone number,
returns null if input is null/undefined

___

###  toISO8601

▸ **toISO8601**(`input`: any, `args?`: undefined | object): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:1125](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L1125)*

Converts a date string or number to an ISO date

**`example`** 
expect(FieldTransform.toISO8601('2020-01-01')).toBe('2020-01-01T00:00:00.000Z');

const config = { resolution: 'seconds' };
expect(FieldTransform.toISO8601(1580418907, config)).toBe('2020-01-30T21:15:07.000Z');

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  toJSON

▸ **toJSON**(`input`: any, `__namedParameters`: object): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:772](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L772)*

Converts input to JSON
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
const obj = { hello: 'world' };
const results = FieldTransform.toJSON(obj);
results === '{"hello": "world"}'

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`__namedParameters` | object |  {} |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  toKebabCase

▸ **toKebabCase**(`input`: string): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:1289](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L1289)*

Will convert a string, or an array of strings to kebab case

**`example`** 

expect(FieldTransform.toKebabCase('I need kebab case')).toBe('i-need-kebab-case');
expect(FieldTransform.toKebabCase('happyBirthday')).toBe('happy-birthday');
expect(FieldTransform.toKebabCase('what_is_this')).toBe('what-is-this');
expect(FieldTransform.toKebabCase('this-should-be-kebab')).toBe('this-should-be-kebab');

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  toLowerCase

▸ **toLowerCase**(`input`: StringInput): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:315](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L315)*

Converts strings to lowercase
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
 expect(FieldTransform.toLowerCase('UPPERCASE')).toBe('uppercase');
 expect(FieldTransform.toLowerCase(['MixEd', null, 'UPPER'])).toEqual(['mixed', 'upper']);

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | StringInput | string | string[] |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  toNumber

▸ **toNumber**(`input`: any, `args?`: undefined | object): *any*

*Defined in [data-mate/src/transforms/field-transform.ts:495](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L495)*

Converts a value to a number if possible
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
expect(FieldTransform.toNumber('12321')).toBe(12321);
expect(FieldTransform.toNumber('000011')).toBe(11);
expect(FieldTransform.toNumber('true', { booleanLike: true })).toBe(1);
expect(FieldTransform.toNumber(null, { booleanLike: true })).toBe(0);
expect(FieldTransform.toNumber(null)).toBe(null);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *any*

returns null if input is null/undefined

___

###  toPascalCase

▸ **toPascalCase**(`input`: string): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:1308](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L1308)*

Converts a string, or an array of strings to pascal case

**`example`** 
expect(FieldTransform.toPascalCase('I need pascal case')).toBe('INeedPascalCase');
expect(FieldTransform.toPascalCase('happyBirthday')).toBe('HappyBirthday');
expect(FieldTransform.toPascalCase('what_is_this')).toBe('WhatIsThis');

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  toSnakeCase

▸ **toSnakeCase**(`input`: string): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:1326](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L1326)*

Converts a string, or an array of strings to snake case

**`example`** 
expect(FieldTransform.toSnakeCase('I need snake case')).toBe('i_need_snake_case');
expect(FieldTransform.toSnakeCase('happyBirthday')).toBe('happy_birthday');
expect(FieldTransform.toSnakeCase('what_is_this')).toBe('what_is_this');

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  toString

▸ **toString**(`input`: any): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:260](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L260)*

Converts values to strings
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
 expect(transform.toString(true)).toEqual('true');
expect(FieldTransform.toString([true, undefined, false])).toEqual(['true', 'false']);

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  toTitleCase

▸ **toTitleCase**(`input`: string): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:1344](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L1344)*

Converts a string, or an array of strings to title case

**`example`** 
expect(FieldTransform.toTitleCase('I need some capitols')).toBe('I Need Some Capitols');
expect(FieldTransform.toTitleCase('happyBirthday')).toBe('Happy Birthday');
expect(FieldTransform.toTitleCase('what_is_this')).toBe('What Is This');

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  toUnixTime

▸ **toUnixTime**(`input`: any, `__namedParameters`: object): *null | number | number[]*

*Defined in [data-mate/src/transforms/field-transform.ts:1087](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L1087)*

Converts a given date to its time in milliseconds or seconds

**`example`** 

expect(FieldTransform.toUnixTime('2020-01-01')).toBe(1577836800);
expect(FieldTransform.toUnixTime('Jan 1, 2020 UTC')).toBe(1577836800);
expect(FieldTransform.toUnixTime('2020 Jan, 1 UTC')).toBe(1577836800);

expect(FieldTransform.toUnixTime(1580418907000)).toBe(1580418907);
expect(FieldTransform.toUnixTime(1580418907000, { ms: true })).toBe(1580418907000);

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`__namedParameters` | object |  {} |

**Returns:** *null | number | number[]*

returns null if input is null/undefined

___

###  toUpperCase

▸ **toUpperCase**(`input`: StringInput): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:296](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L296)*

Converts strings to UpperCase
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
 expect(FieldTransform.toUpperCase('lowercase')).toBe('LOWERCASE');
 expect(FieldTransform.toUpperCase(['MixEd', null, 'lower'])).toEqual(['MIXED', 'LOWER']);

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | StringInput | string or string[] |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  toXluceneQuery

▸ **toXluceneQuery**(`input`: AnyObject, `options`: [CreateJoinQueryOptions](overview.md#createjoinqueryoptions)): *[xLuceneQueryResult](interfaces/xlucenequeryresult.md)*

*Defined in [data-mate/src/transforms/helpers.ts:134](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/helpers.ts#L134)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | AnyObject | - |
`options` | [CreateJoinQueryOptions](overview.md#createjoinqueryoptions) |  {} |

**Returns:** *[xLuceneQueryResult](interfaces/xlucenequeryresult.md)*

___

###  trim

▸ **trim**(`input`: StringInput, `args?`: undefined | object): *null | string | null | string | string[][]*

*Defined in [data-mate/src/transforms/field-transform.ts:335](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L335)*

Will trim the input
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
expect(FieldTransform.trim('right    ')).toBe('right');
expect(FieldTransform.trim('fast cars race fast', { char: 'fast' })).toBe(' cars race ');

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | StringInput | string | string[] |
`args?` | undefined &#124; object | - |

**Returns:** *null | string | null | string | string[][]*

returns null if input is null/undefined

___

###  trimEnd

▸ **trimEnd**(`input`: StringInput, `args?`: undefined | object): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:388](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L388)*

Will trim the end of the input
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
expect(FieldTransform.trimEnd('    Hello Bob    ')).toBe('    Hello Bob');
expect(FieldTransform.trimEnd('iiii-wordiwords-iii', { char: 'i' })).toBe('iiii-wordiwords');

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | StringInput | string | string[] |
`args?` | undefined &#124; object | - |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  trimStart

▸ **trimStart**(`input`: StringInput, `args?`: undefined | object): *null | string | string[]*

*Defined in [data-mate/src/transforms/field-transform.ts:360](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L360)*

Will trim the beginning of the input
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
expect(FieldTransform.trimStart('    Hello Bob    ')).toBe('Hello Bob    ');
expect(FieldTransform.trimStart('iiii-wordiwords-iii', { char: 'i' })).toBe('-wordiwords-iii');

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | StringInput | string | string[] |
`args?` | undefined &#124; object | - |

**Returns:** *null | string | string[]*

returns null if input is null/undefined

___

###  truncate

▸ **truncate**(`input`: StringInput, `args`: object): *null | string | any[]*

*Defined in [data-mate/src/transforms/field-transform.ts:416](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L416)*

Will truncate the input to the length of the size given
if given an array it will convert everything in the array excluding null/undefined values

**`example`** 
expect(FieldTransform.truncate('thisisalongstring', { size: 4 })).toBe('this');
expect(FieldTransform.truncate(['hello', null, 'world'], { size: 2 })).toEqual(['he', 'wo']);

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`input` | StringInput | string | string[] |
`args` | object | - |

**Returns:** *null | string | any[]*

returns null if input is null/undefined

___

###  wildcard

▸ **wildcard**(`wildcardStr`: string): *wildcardTerm*

*Defined in [data-mate/src/document-matcher/logic-builder/string.ts:15](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/document-matcher/logic-builder/string.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`wildcardStr` | string |

**Returns:** *wildcardTerm*

## Object literals

### `Const` repository

### ▪ **repository**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L22)*

*Defined in [data-mate/src/transforms/field-transform.ts:21](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L21)*

*Defined in [data-mate/src/transforms/record-transform.ts:6](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/record-transform.ts#L6)*

*Defined in [data-mate/src/validations/record-validator.ts:8](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/record-validator.ts#L8)*

▪ **contains**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:54](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L54)*

* **fn**: *[contains](overview.md#contains)* =  contains

* **config**: *object*

  * **value**: *object*

    * **type**: *"String"* = "String"

▪ **copyField**: *object*

*Defined in [data-mate/src/transforms/record-transform.ts:41](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/record-transform.ts#L41)*

* **fn**: *[copyField](overview.md#copyfield)* =  copyField

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Object' as AvailableType

* **config**: *object*

  * **from**: *object*

    * **type**: *"String"* = "String"

  * **to**: *object*

    * **type**: *"String"* = "String"

▪ **decodeBase64**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:52](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L52)*

* **config**(): *object*

* **fn**: *[decodeBase64](overview.md#decodebase64)* =  decodeBase64

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **decodeHex**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:56](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L56)*

* **config**(): *object*

* **fn**: *[decodeHex](overview.md#decodehex)* =  decodeHex

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **decodeURL**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:54](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L54)*

* **config**(): *object*

* **fn**: *[decodeURL](overview.md#decodeurl)* =  decodeURL

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **dedupe**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:76](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L76)*

* **config**(): *object*

* **fn**: *[dedupe](overview.md#dedupe)* =  dedupe

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Any' as AvailableType

▪ **dropFields**: *object*

*Defined in [data-mate/src/transforms/record-transform.ts:31](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/record-transform.ts#L31)*

* **fn**: *[dropFields](overview.md#dropfields)* =  dropFields

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Object' as AvailableType

* **config**: *object*

  * **fields**: *object*

    * **array**: *true* = true

    * **type**: *"String"* = "String"

▪ **encodeBase64**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:53](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L53)*

* **config**(): *object*

* **fn**: *[encodeBase64](overview.md#encodebase64)* =  encodeBase64

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **encodeHex**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:57](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L57)*

* **config**(): *object*

* **fn**: *[encodeHex](overview.md#encodehex)* =  encodeHex

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **encodeMD5**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:58](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L58)*

* **config**(): *object*

* **fn**: *[encodeMD5](overview.md#encodemd5)* =  encodeMD5

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **encodeSHA**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:59](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L59)*

* **fn**: *[encodeSHA](overview.md#encodesha)* =  encodeSHA

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

* **config**: *object*

  * **digest**: *object*

    * **type**: *"String"* = "String"

  * **hash**: *object*

    * **type**: *"String"* = "String"

▪ **encodeSHA1**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:67](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L67)*

* **config**(): *object*

* **fn**: *[encodeSHA1](overview.md#encodesha1)* =  encodeSHA1

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **encodeURL**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:55](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L55)*

* **config**(): *object*

* **fn**: *[encodeURL](overview.md#encodeurl)* =  encodeURL

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **equals**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:61](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L61)*

* **fn**: *[equals](overview.md#equals)* =  equals

* **config**: *object*

  * **value**: *object*

    * **type**: *"String"* = "String"

▪ **every**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:156](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L156)*

* **fn**: *[every](overview.md#every)* =  every

* **config**: *object*

  * **fn**: *object*

    * **type**: *"String"* = "String"

  * **options**: *object*

    * **type**: *"Object"* = "Object"

▪ **exists**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:146](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L146)*

* **config**(): *object*

* **fn**: *[exists](overview.md#exists)* =  exists

▪ **extract**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:78](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L78)*

* **fn**: *[extract](overview.md#extract)* =  extract

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Any' as AvailableType

* **config**: *object*

  * **end**: *object*

    * **type**: *"String"* = "String"

  * **isMultiValue**: *object*

    * **type**: *"Boolean"* = "Boolean"

  * **jexlExp**: *object*

    * **type**: *"String"* = "String"

  * **regex**: *object*

    * **type**: *"String"* = "String"

  * **start**: *object*

    * **type**: *"String"* = "String"

▪ **formatDate**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:122](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L122)*

* **fn**: *[formatDate](overview.md#formatdate)* =  formatDate

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

* **config**: *object*

  * **format**: *object*

    * **type**: *"String"* = "String"

  * **resolution**: *object*

    * **description**: *string* = "may be set to seconds | milliseconds"

    * **type**: *"String"* = "String"

▪ **guard**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:147](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L147)*

* **config**(): *object*

* **fn**: *[guard](overview.md#guard)* =  guard

▪ **inIPRange**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:136](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L136)*

* **fn**: *[inIPRange](overview.md#iniprange)* =  inIPRange

* **config**: *object*

  * **cidr**: *object*

    * **type**: *"String"* = "String"

  * **max**: *object*

    * **type**: *"String"* = "String"

  * **min**: *object*

    * **type**: *"String"* = "String"

▪ **inNumberRange**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:42](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L42)*

* **fn**: *[inNumberRange](overview.md#innumberrange)* =  inNumberRange

* **config**: *object*

  * **inclusive**: *object*

    * **type**: *"Boolean"* = "Boolean"

  * **max**: *object*

    * **type**: *"Number"* = "Number"

  * **min**: *object*

    * **type**: *"Number"* = "Number"

▪ **isASCII**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:80](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L80)*

* **config**(): *object*

* **fn**: *[isASCII](overview.md#isascii)* =  isASCII

▪ **isAlpha**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:66](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L66)*

* **fn**: *[isAlpha](overview.md#isalpha)* =  isAlpha

* **config**: *object*

  * **locale**: *object*

    * **type**: *"String"* = "String"

▪ **isAlphanumeric**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:73](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L73)*

* **fn**: *[isAlphanumeric](overview.md#isalphanumeric)* =  isAlphanumeric

* **config**: *object*

  * **locale**: *object*

    * **type**: *"String"* = "String"

▪ **isArray**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:148](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L148)*

* **config**(): *object*

* **fn**: *[isArray](overview.md#isarray)* =  isArray

▪ **isBase64**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:81](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L81)*

* **config**(): *object*

* **fn**: *[isBase64](overview.md#isbase64)* =  isBase64

▪ **isBoolean**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:23](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L23)*

* **config**(): *object*

* **fn**: *[isBoolean](overview.md#isboolean)* =  isBoolean

▪ **isBooleanLike**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:24](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L24)*

* **config**(): *object*

* **fn**: *[isBooleanLike](overview.md#isbooleanlike)* =  isBooleanLike

▪ **isCIDR**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:145](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L145)*

* **config**(): *object*

* **fn**: *[isCIDR](overview.md#iscidr)* =  isCIDR

▪ **isCountryCode**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:105](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L105)*

* **config**(): *object*

* **fn**: *[isCountryCode](overview.md#iscountrycode)* =  isCountryCode

▪ **isEmail**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:25](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L25)*

* **config**(): *object*

* **fn**: *[isEmail](overview.md#isemail)* =  isEmail

▪ **isEmpty**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:82](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L82)*

* **fn**: *[isEmpty](overview.md#isempty)* =  isEmpty

* **config**: *object*

  * **ignoreWhitespace**: *object*

    * **type**: *"Boolean"* = "Boolean"

▪ **isFQDN**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:89](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L89)*

* **fn**: *[isFQDN](overview.md#isfqdn)* =  isFQDN

* **config**: *object*

  * **allowTrailingDot**: *object*

    * **type**: *"Boolean"* = "Boolean"

  * **allowUnderscores**: *object*

    * **type**: *"Boolean"* = "Boolean"

  * **requireTld**: *object*

    * **type**: *"Boolean"* = "Boolean"

▪ **isGeoJSON**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:26](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L26)*

* **config**(): *object*

* **fn**: *[isGeoJSON](overview.md#isgeojson)* =  isGeoJSON

▪ **isGeoPoint**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:27](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L27)*

* **config**(): *object*

* **fn**: *[isGeoPoint](overview.md#isgeopoint)* =  isGeoPoint

▪ **isGeoShapeMultiPolygon**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:30](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L30)*

* **config**(): *object*

* **fn**: *[isGeoShapeMultiPolygon](overview.md#isgeoshapemultipolygon)* =  isGeoShapeMultiPolygon

▪ **isGeoShapePoint**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:28](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L28)*

* **config**(): *object*

* **fn**: *[isGeoShapePoint](overview.md#isgeoshapepoint)* =  isGeoShapePoint

▪ **isGeoShapePolygon**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:29](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L29)*

* **config**(): *object*

* **fn**: *[isGeoShapePolygon](overview.md#isgeoshapepolygon)* =  isGeoShapePolygon

▪ **isHash**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:98](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L98)*

* **fn**: *[isHash](overview.md#ishash)* =  isHash

* **config**: *object*

  * **algo**: *object*

    * **type**: *"String"* = "String"

▪ **isIP**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:31](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L31)*

* **config**(): *object*

* **fn**: *[isIP](overview.md#isip)* =  isIP

▪ **isISDN**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:32](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L32)*

* **config**(): *object*

* **fn**: *[isISDN](overview.md#isisdn)* =  isISDN

▪ **isISO8601**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:106](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L106)*

* **config**(): *object*

* **fn**: *[isISO8601](overview.md#isiso8601)* =  isISO8601

▪ **isISSN**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:107](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L107)*

* **fn**: *[isISSN](overview.md#isissn)* =  isISSN

* **config**: *object*

  * **caseSensitive**: *object*

    * **type**: *"Boolean"* = "Boolean"

  * **requireHyphen**: *object*

    * **type**: *"Boolean"* = "Boolean"

▪ **isInteger**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:41](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L41)*

* **config**(): *object*

* **fn**: *[isInteger](overview.md#isinteger)* =  isInteger

▪ **isJSON**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:116](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L116)*

* **config**(): *object*

* **fn**: *[isJSON](overview.md#isjson)* =  isJSON

▪ **isLength**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:117](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L117)*

* **fn**: *[isLength](overview.md#islength)* =  isLength

* **config**: *object*

  * **max**: *object*

    * **type**: *"Number"* = "Number"

  * **min**: *object*

    * **type**: *"Number"* = "Number"

  * **size**: *object*

    * **type**: *"Number"* = "Number"

▪ **isMACAddress**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:33](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L33)*

* **fn**: *[isMACAddress](overview.md#ismacaddress)* =  isMACAddress

* **config**: *object*

  * **delimiter**: *object*

    * **array**: *true* = true

    * **type**: *"String"* = "String"

▪ **isMIMEType**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:126](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L126)*

* **config**(): *object*

* **fn**: *[isMIMEType](overview.md#ismimetype)* =  isMIMEType

▪ **isNonRoutableIP**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:135](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L135)*

* **config**(): *object*

* **fn**: *[isNonRoutableIP](overview.md#isnonroutableip)* =  isNonRoutableIP

▪ **isNumber**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:40](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L40)*

* **config**(): *object*

* **fn**: *[isNumber](overview.md#isnumber)* =  isNumber

▪ **isPostalCode**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:127](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L127)*

* **fn**: *[isPostalCode](overview.md#ispostalcode)* =  isPostalCode

* **config**: *object*

  * **locale**: *object*

    * **type**: *"String"* = "String"

▪ **isRFC3339**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:115](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L115)*

* **config**(): *object*

* **fn**: *[isRFC3339](overview.md#isrfc3339)* =  isRFC3339

▪ **isRoutableIP**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:134](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L134)*

* **config**(): *object*

* **fn**: *[isRoutableIP](overview.md#isroutableip)* =  isRoutableIP

▪ **isString**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:51](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L51)*

* **config**(): *object*

* **fn**: *[isString](overview.md#isstring)* =  isString

▪ **isURL**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:52](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L52)*

* **config**(): *object*

* **fn**: *[isURL](overview.md#isurl)* =  isURL

▪ **isUUID**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:53](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L53)*

* **config**(): *object*

* **fn**: *[isUUID](overview.md#isuuid)* =  isUUID

▪ **map**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:174](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L174)*

* **fn**: *[map](overview.md#map)* =  map

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Any' as AvailableType

* **config**: *object*

  * **fn**: *object*

    * **type**: *"String"* = "String"

  * **options**: *object*

    * **type**: *"Object"* = "Object"

▪ **parseDate**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:130](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L130)*

* **fn**: *[parseDate](overview.md#parsedate)* =  parseDate

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Date' as AvailableType

* **config**: *object*

  * **format**: *object*

    * **type**: *"String"* = "String"

▪ **parseJSON**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:68](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L68)*

* **config**(): *object*

* **fn**: *[parseJSON](overview.md#parsejson)* =  parseJSON

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Any' as AvailableType

▪ **reject**: *object*

*Defined in [data-mate/src/validations/record-validator.ts:32](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/record-validator.ts#L32)*

* **fn**: *[reject](overview.md#reject)* =  reject

* **config**: *object*

  * **query**: *object*

    * **type**: *"String"* = "String"

  * **type_config**: *object*

    * **type**: *"Object"* = "Object"

  * **variables**: *object*

    * **type**: *"Object"* = "Object"

▪ **renameField**: *object*

*Defined in [data-mate/src/transforms/record-transform.ts:7](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/record-transform.ts#L7)*

* **fn**: *[renameField](overview.md#renamefield)* =  renameField

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Object' as AvailableType

* **config**: *object*

  * **from**: *object*

    * **type**: *"String"* = "String"

  * **to**: *object*

    * **type**: *"String"* = "String"

▪ **replaceLiteral**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:99](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L99)*

* **fn**: *[replaceLiteral](overview.md#replaceliteral)* =  replaceLiteral

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

* **config**: *object*

  * **replace**: *object*

    * **type**: *"String"* = "String"

  * **search**: *object*

    * **type**: *"String"* = "String"

▪ **replaceRegex**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:89](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L89)*

* **fn**: *[replaceRegex](overview.md#replaceregex)* =  replaceRegex

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

* **config**: *object*

  * **global**: *object*

    * **type**: *"String"* = "String"

  * **ignore_case**: *object*

    * **type**: *"Boolean"* = "Boolean"

  * **regex**: *object*

    * **type**: *"String"* = "String"

  * **replace**: *object*

    * **type**: *"String"* = "String"

▪ **required**: *object*

*Defined in [data-mate/src/validations/record-validator.ts:9](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/record-validator.ts#L9)*

* **fn**: *[required](overview.md#required)* =  required

* **config**: *object*

  * **fields**: *object*

    * **array**: *true* = true

    * **type**: *"String"* = "String"

▪ **select**: *object*

*Defined in [data-mate/src/validations/record-validator.ts:18](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/record-validator.ts#L18)*

* **fn**: *[select](overview.md#select)* =  select

* **config**: *object*

  * **query**: *object*

    * **type**: *"String"* = "String"

  * **type_config**: *object*

    * **type**: *"Object"* = "Object"

  * **variables**: *object*

    * **type**: *"Object"* = "Object"

▪ **setDefault**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:165](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L165)*

* **fn**: *[setDefault](overview.md#setdefault)* =  setDefault

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Any' as AvailableType

* **config**: *object*

  * **value**: *object*

    * **type**: *"Any"* = "Any"

▪ **setField**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:156](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L156)*

*Defined in [data-mate/src/transforms/record-transform.ts:19](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/record-transform.ts#L19)*

* **fn**: *setField* =  setField

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Object' as AvailableType

* **config**: *object*

  * **field**: *object*

    * **type**: *"String"* = "String"

  * **value**: *object*

    * **type**: *"Any"* = "Any"

▪ **some**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:149](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/validations/field-validator.ts#L149)*

* **fn**: *[some](overview.md#some)* =  some

* **config**: *object*

  * **fn**: *object*

    * **type**: *"String"* = "String"

  * **options**: *object*

    * **type**: *"Object"* = "Object"

▪ **toBoolean**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:27](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L27)*

* **config**(): *object*

* **fn**: *[toBoolean](overview.md#toboolean)* =  toBoolean

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Boolean' as AvailableType

▪ **toCamelCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:151](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L151)*

* **config**(): *object*

* **fn**: *[toCamelCase](overview.md#tocamelcase)* =  toCamelCase

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **toGeoPoint**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:77](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L77)*

* **config**(): *object*

* **fn**: *[toGeoPoint](overview.md#togeopoint)* =  toGeoPoint

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'GeoPoint' as AvailableType

▪ **toISDN**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:44](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L44)*

* **config**(): *object*

* **fn**: *[toISDN](overview.md#toisdn)* =  toISDN

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **toISO8601**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:112](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L112)*

* **fn**: *[toISO8601](overview.md#toiso8601)* =  toISO8601

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

* **config**: *object*

  * **resolution**: *object*

    * **description**: *string* = "may be set to seconds | milliseconds"

    * **type**: *"String"* = "String"

▪ **toJSON**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:69](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L69)*

* **fn**: *[toJSON](overview.md#tojson)* =  toJSON

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

* **config**: *object*

  * **pretty**: *object*

    * **type**: *"Boolean"* = "Boolean"

▪ **toKebabCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:152](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L152)*

* **config**(): *object*

* **fn**: *[toKebabCase](overview.md#tokebabcase)* =  toKebabCase

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **toLowerCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:29](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L29)*

* **config**(): *object*

* **fn**: *[toLowerCase](overview.md#tolowercase)* =  toLowerCase

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **toNumber**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:45](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L45)*

* **fn**: *[toNumber](overview.md#tonumber)* =  toNumber

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Number' as AvailableType

* **config**: *object*

  * **booleanLike**: *object*

    * **type**: *"Boolean"* = "Boolean"

▪ **toPascalCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:153](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L153)*

* **config**(): *object*

* **fn**: *[toPascalCase](overview.md#topascalcase)* =  toPascalCase

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **toSnakeCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:154](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L154)*

* **config**(): *object*

* **fn**: *[toSnakeCase](overview.md#tosnakecase)* =  toSnakeCase

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **toString**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L22)*

* **config**(): *object*

* **fn**: *[toString](overview.md#tostring)* =  toString

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **toTitleCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:155](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L155)*

* **config**(): *object*

* **fn**: *[toTitleCase](overview.md#totitlecase)* =  toTitleCase

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **toUnixTime**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:111](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L111)*

* **config**(): *object*

* **fn**: *[toUnixTime](overview.md#tounixtime)* =  toUnixTime

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'Number' as AvailableType

▪ **toUpperCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:28](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L28)*

* **config**(): *object*

* **fn**: *[toUpperCase](overview.md#touppercase)* =  toUpperCase

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

▪ **trim**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:30](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L30)*

* **fn**: *[trim](overview.md#trim)* =  trim

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

* **config**: *object*

  * **char**: *object*

    * **type**: *"String"* = "String"

▪ **trimEnd**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:144](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L144)*

* **fn**: *[trimEnd](overview.md#trimend)* =  trimEnd

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

* **config**: *object*

  * **char**: *object*

    * **type**: *"String"* = "String"

▪ **trimStart**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:137](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L137)*

* **fn**: *[trimStart](overview.md#trimstart)* =  trimStart

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

* **config**: *object*

  * **char**: *object*

    * **type**: *"String"* = "String"

▪ **truncate**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:37](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/field-transform.ts#L37)*

* **fn**: *[truncate](overview.md#truncate)* =  truncate

* **output_type**: *"String" | "Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "Number" | "Any"* =  'String' as AvailableType

* **config**: *object*

  * **size**: *object*

    * **type**: *"Number"* = "Number"
