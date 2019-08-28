---
title: Utils API Overview
sidebar_label: API
---

## Index

### Enumerations

* [DataEncoding](enums/dataencoding.md)

### Classes

* [BigMap](classes/bigmap.md)
* [Collector](classes/collector.md)
* [DataEntity](classes/dataentity.md)
* [TSError](classes/tserror.md)

### Interfaces

* [AnyObject](interfaces/anyobject.md)
* [DataEntityMetadata](interfaces/dataentitymetadata.md)
* [ElasticsearchError](interfaces/elasticsearcherror.md)
* [EncodingConfig](interfaces/encodingconfig.md)
* [Many](interfaces/many.md)
* [PRetryConfig](interfaces/pretryconfig.md)
* [TSErrorConfig](interfaces/tserrorconfig.md)
* [TSErrorContext](interfaces/tserrorcontext.md)

### Type aliases

* [DataArrayInput](overview.md#dataarrayinput)
* [DataInput](overview.md#datainput)
* [FormatRegexResult](overview.md#formatregexresult)
* [Omit](overview.md#omit)
* [Optional](overview.md#optional)
* [Override](overview.md#override)
* [Overwrite](overview.md#overwrite)
* [PWhileOptions](overview.md#pwhileoptions)
* [Required](overview.md#required)
* [TYPE_IS_ENTITY_KEY](overview.md#type_is_entity_key)
* [TYPE_METADATA_KEY](overview.md#type_metadata_key)
* [TYPE_RAWDATA_KEY](overview.md#type_rawdata_key)
* [WithoutNil](overview.md#withoutnil)

### Variables

* [IS_ENTITY_KEY](overview.md#const-is_entity_key)
* [METADATA_KEY](overview.md#const-metadata_key)
* [RAWDATA_KEY](overview.md#const-rawdata_key)
* [dataEncodings](overview.md#const-dataencodings)
* [isDev](overview.md#const-isdev)
* [isProd](overview.md#const-isprod)
* [isTest](overview.md#const-istest)

### Functions

* [castArray](overview.md#castarray)
* [chunk](overview.md#chunk)
* [concat](overview.md#concat)
* [debugLogger](overview.md#debuglogger)
* [ensureBuffer](overview.md#ensurebuffer)
* [enumerable](overview.md#enumerable)
* [escapeString](overview.md#escapestring)
* [fastAssign](overview.md#fastassign)
* [fastCloneDeep](overview.md#fastclonedeep)
* [fastMap](overview.md#fastmap)
* [firstToLower](overview.md#firsttolower)
* [firstToUpper](overview.md#firsttoupper)
* [flatten](overview.md#flatten)
* [formatRegex](overview.md#formatregex)
* [getBackoffDelay](overview.md#getbackoffdelay)
* [getErrorStatusCode](overview.md#geterrorstatuscode)
* [getField](overview.md#getfield)
* [getFirst](overview.md#getfirst)
* [getFirstChar](overview.md#getfirstchar)
* [getFullErrorStack](overview.md#getfullerrorstack)
* [getTypeOf](overview.md#gettypeof)
* [getValidDate](overview.md#getvaliddate)
* [has](overview.md#has)
* [includes](overview.md#includes)
* [isBooleanLike](overview.md#isbooleanlike)
* [isElasticsearchError](overview.md#iselasticsearcherror)
* [isEmpty](overview.md#isempty)
* [isError](overview.md#iserror)
* [isFatalError](overview.md#isfatalerror)
* [isFunction](overview.md#isfunction)
* [isInteger](overview.md#isinteger)
* [isNumber](overview.md#isnumber)
* [isRetryableError](overview.md#isretryableerror)
* [isString](overview.md#isstring)
* [isTSError](overview.md#istserror)
* [isValidDate](overview.md#isvaliddate)
* [locked](overview.md#locked)
* [makeDataEntityObj](overview.md#makedataentityobj)
* [makeISODate](overview.md#makeisodate)
* [makeMetadata](overview.md#makemetadata)
* [match](overview.md#match)
* [matchAll](overview.md#matchall)
* [noop](overview.md#noop)
* [pDelay](overview.md#const-pdelay)
* [pImmediate](overview.md#const-pimmediate)
* [pRace](overview.md#prace)
* [pRaceWithTimeout](overview.md#pracewithtimeout)
* [pRetry](overview.md#pretry)
* [pWhile](overview.md#pwhile)
* [parseError](overview.md#parseerror)
* [parseErrorInfo](overview.md#parseerrorinfo)
* [parseJSON](overview.md#parsejson)
* [parseList](overview.md#parselist)
* [parseNumberList](overview.md#parsenumberlist)
* [prefixErrorMsg](overview.md#prefixerrormsg)
* [random](overview.md#random)
* [startsWith](overview.md#startswith)
* [stripErrorMessage](overview.md#striperrormessage)
* [times](overview.md#times)
* [toBoolean](overview.md#toboolean)
* [toHumanTime](overview.md#tohumantime)
* [toInteger](overview.md#tointeger)
* [toNumber](overview.md#tonumber)
* [toSafeString](overview.md#tosafestring)
* [toStatusErrorCode](overview.md#tostatuserrorcode)
* [toString](overview.md#tostring)
* [trackTimeout](overview.md#tracktimeout)
* [trim](overview.md#trim)
* [trimAndToLower](overview.md#trimandtolower)
* [trimAndToUpper](overview.md#trimandtoupper)
* [truncate](overview.md#truncate)
* [tryParseJSON](overview.md#tryparsejson)
* [unescapeString](overview.md#unescapestring)
* [uniq](overview.md#uniq)
* [waterfall](overview.md#waterfall)
* [withoutNil](overview.md#withoutnil)

## Type aliases

###  DataArrayInput

Ƭ **DataArrayInput**: *[DataInput](overview.md#datainput) | [DataInput](overview.md#datainput)[]*

*Defined in [entities/data-entity.ts:229](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/data-entity.ts#L229)*

___

###  DataInput

Ƭ **DataInput**: *object | [DataEntity](classes/dataentity.md)*

*Defined in [entities/data-entity.ts:228](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/data-entity.ts#L228)*

___

###  FormatRegexResult

Ƭ **FormatRegexResult**: *[string, string | undefined]*

*Defined in [strings.ts:117](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L117)*

___

###  Omit

Ƭ **Omit**: *Pick‹T, Exclude‹keyof T, K››*

*Defined in [interfaces.ts:7](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/interfaces.ts#L7)*

Omit the properties available to type.
Useful for excluding properties from a type

**`example`** `Omit<{ a: number, b: number, c: number }, 'b'|'c'> // => { a: 1 }`

___

###  Optional

Ƭ **Optional**: *object*

*Defined in [interfaces.ts:41](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/interfaces.ts#L41)*

Like Partial but makes certain properties optional

**`example`** `Optional<{ a: number, b: number }, 'b'>`

#### Type declaration:

___

###  Override

Ƭ **Override**: *object*

*Defined in [interfaces.ts:23](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/interfaces.ts#L23)*

Override specific properties on a type

**`example`** `Override<{ a: number, b: number }, { b: string }>`

#### Type declaration:

___

###  Overwrite

Ƭ **Overwrite**: *object & T2*

*Defined in [interfaces.ts:15](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/interfaces.ts#L15)*

Overwrite a simple type with different properties.
Useful changing and adding additional properties

**`example`** `Overwrite<{ a: number, b: number }, { b?: number }>`

___

###  PWhileOptions

Ƭ **PWhileOptions**: *object*

*Defined in [promises.ts:170](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/promises.ts#L170)*

#### Type declaration:

___

###  Required

Ƭ **Required**: *object*

*Defined in [interfaces.ts:32](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/interfaces.ts#L32)*

Like Partial but makes certain properties required

**`example`** `Required<{ a: number, b: number }, 'b'>`

#### Type declaration:

___

###  TYPE_IS_ENTITY_KEY

Ƭ **TYPE_IS_ENTITY_KEY**: *"__isDataEntity"*

*Defined in [entities/interfaces.ts:1](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/interfaces.ts#L1)*

___

###  TYPE_METADATA_KEY

Ƭ **TYPE_METADATA_KEY**: *"___DataEntityMetadata"*

*Defined in [entities/interfaces.ts:2](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/interfaces.ts#L2)*

___

###  TYPE_RAWDATA_KEY

Ƭ **TYPE_RAWDATA_KEY**: *"___DataEntityRawData"*

*Defined in [entities/interfaces.ts:3](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/interfaces.ts#L3)*

___

###  WithoutNil

Ƭ **WithoutNil**: *object*

*Defined in [interfaces.ts:48](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/interfaces.ts#L48)*

Without null or undefined properties

#### Type declaration:

## Variables

### `Const` IS_ENTITY_KEY

• **IS_ENTITY_KEY**: *[TYPE_IS_ENTITY_KEY](overview.md#type_is_entity_key)* = "__isDataEntity"

*Defined in [entities/interfaces.ts:5](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/interfaces.ts#L5)*

___

### `Const` METADATA_KEY

• **METADATA_KEY**: *[TYPE_METADATA_KEY](overview.md#type_metadata_key)* = "___DataEntityMetadata"

*Defined in [entities/interfaces.ts:6](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/interfaces.ts#L6)*

___

### `Const` RAWDATA_KEY

• **RAWDATA_KEY**: *[TYPE_RAWDATA_KEY](overview.md#type_rawdata_key)* = "___DataEntityRawData"

*Defined in [entities/interfaces.ts:7](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/interfaces.ts#L7)*

___

### `Const` dataEncodings

• **dataEncodings**: *keyof DataEncoding[]* =  Object.values(DataEncoding)

*Defined in [entities/interfaces.ts:47](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/interfaces.ts#L47)*

A list of supported encoding formats

___

### `Const` isDev

• **isDev**: *boolean* =  NODE_ENV === 'development'

*Defined in [misc.ts:5](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/misc.ts#L5)*

___

### `Const` isProd

• **isProd**: *boolean* =  NODE_ENV === 'production'

*Defined in [misc.ts:3](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/misc.ts#L3)*

___

### `Const` isTest

• **isTest**: *boolean* =  NODE_ENV === 'test'

*Defined in [misc.ts:4](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/misc.ts#L4)*

## Functions

###  castArray

▸ **castArray**<**T**>(`input`: T | T[]): *T[]*

*Defined in [arrays.ts:10](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/arrays.ts#L10)*

A simplified implemation of lodash castArray

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T \| T[] |

**Returns:** *T[]*

___

###  chunk

▸ **chunk**<**T**>(`dataArray`: T[] | Set‹T›, `size`: number): *T[][]*

*Defined in [arrays.ts:73](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/arrays.ts#L73)*

Chunk an array into specific sizes

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`dataArray` | T[] \| Set‹T› |
`size` | number |

**Returns:** *T[][]*

___

###  concat

▸ **concat**<**T**>(`arr`: T | T[], `arr1?`: T | T[]): *T[]*

*Defined in [arrays.ts:19](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/arrays.ts#L19)*

Concat and unique the items in the array
Any non-array value will be converted to an array

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arr` | T \| T[] |
`arr1?` | T \| T[] |

**Returns:** *T[]*

___

###  debugLogger

▸ **debugLogger**(`testName`: string, `param?`: debugParam, `otherName?`: undefined | string): *Logger*

*Defined in [logger.ts:26](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/logger.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`testName` | string |
`param?` | debugParam |
`otherName?` | undefined \| string |

**Returns:** *Logger*

___

###  ensureBuffer

▸ **ensureBuffer**(`input`: string | Buffer, `encoding`: BufferEncoding): *Buffer*

*Defined in [utils.ts:73](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L73)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | string \| Buffer | - |
`encoding` | BufferEncoding | "utf8" |

**Returns:** *Buffer*

___

###  enumerable

▸ **enumerable**(`enabled`: boolean): *_enumerable*

*Defined in [misc.ts:22](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/misc.ts#L22)*

A decorator for making a method enumerable or none-enumerable

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`enabled` | boolean | true |

**Returns:** *_enumerable*

___

###  escapeString

▸ **escapeString**(`str`: string, `chars`: string[]): *string*

*Defined in [strings.ts:30](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L30)*

Escape characters in string and avoid double escaping

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`str` | string | "" |
`chars` | string[] | - |

**Returns:** *string*

___

###  fastAssign

▸ **fastAssign**<**T**, **U**>(`target`: T, `source`: U): *T*

*Defined in [objects.ts:19](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/objects.ts#L19)*

Perform a shallow clone of an object to another, in the fastest way possible

**Type parameters:**

▪ **T**

▪ **U**

**Parameters:**

Name | Type |
------ | ------ |
`target` | T |
`source` | U |

**Returns:** *T*

___

###  fastCloneDeep

▸ **fastCloneDeep**<**T**>(`input`: T): *T*

*Defined in [objects.ts:14](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/objects.ts#L14)*

A clone deep using `JSON.parse(JSON.stringify(input))`

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T |

**Returns:** *T*

___

###  fastMap

▸ **fastMap**<**T**, **U**>(`arr`: T[], `fn`: function): *U[]*

*Defined in [arrays.ts:60](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/arrays.ts#L60)*

Map an array faster without sparse array handling

**Type parameters:**

▪ **T**

▪ **U**

**Parameters:**

▪ **arr**: *T[]*

▪ **fn**: *function*

▸ (`val`: T, `index`: number): *U*

**Parameters:**

Name | Type |
------ | ------ |
`val` | T |
`index` | number |

**Returns:** *U[]*

___

###  firstToLower

▸ **firstToLower**(`str`: string): *string*

*Defined in [strings.ts:109](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L109)*

Change first character in string to lower case

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  firstToUpper

▸ **firstToUpper**(`str`: string): *string*

*Defined in [strings.ts:104](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L104)*

Change first character in string to upper case

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  flatten

▸ **flatten**<**T**>(`val`: [Many](interfaces/many.md)‹T[]›): *T[]*

*Defined in [arrays.ts:5](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/arrays.ts#L5)*

A native implemation of lodash flatten

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`val` | [Many](interfaces/many.md)‹T[]› |

**Returns:** *T[]*

___

###  formatRegex

▸ **formatRegex**(`str`: string): *[FormatRegexResult](overview.md#formatregexresult)*

*Defined in [strings.ts:119](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L119)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *[FormatRegexResult](overview.md#formatregexresult)*

___

###  getBackoffDelay

▸ **getBackoffDelay**(`current`: number, `factor`: number, `max`: number, `min`: number): *number*

*Defined in [promises.ts:244](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/promises.ts#L244)*

Get backoff delay that will safe to retry and is slightly staggered

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`current` | number | - |
`factor` | number | 2 |
`max` | number | 60000 |
`min` | number | 500 |

**Returns:** *number*

___

###  getErrorStatusCode

▸ **getErrorStatusCode**(`err`: any, `config`: [TSErrorConfig](interfaces/tserrorconfig.md), `defaultCode`: number): *number*

*Defined in [errors.ts:388](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/errors.ts#L388)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`err` | any | - |
`config` | [TSErrorConfig](interfaces/tserrorconfig.md) |  {} |
`defaultCode` | number |  DEFAULT_STATUS_CODE |

**Returns:** *number*

___

###  getField

▸ **getField**<**V**>(`input`: undefined, `field`: string, `defaultVal?`: [V]()): *V*

*Defined in [utils.ts:120](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L120)*

A typesafe get function (will always return the correct type)

**IMPORTANT** This does not behave like lodash.get,
it does not deal with dot notation (nested fields)
and it will use the default when dealing with OR statements

**Type parameters:**

▪ **V**

**Parameters:**

Name | Type |
------ | ------ |
`input` | undefined |
`field` | string |
`defaultVal?` | [V]() |

**Returns:** *V*

▸ **getField**<**T**, **P**>(`input`: T, `field`: P): *T[P]*

*Defined in [utils.ts:125](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L125)*

**Type parameters:**

▪ **T**: *__type*

▪ **P**: *keyof T*

**Parameters:**

Name | Type |
------ | ------ |
`input` | T |
`field` | P |

**Returns:** *T[P]*

▸ **getField**<**T**, **P**>(`input`: T | undefined, `field`: P): *T[P]*

*Defined in [utils.ts:129](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L129)*

**Type parameters:**

▪ **T**: *__type*

▪ **P**: *keyof T*

**Parameters:**

Name | Type |
------ | ------ |
`input` | T \| undefined |
`field` | P |

**Returns:** *T[P]*

▸ **getField**<**T**, **P**>(`input`: T | undefined, `field`: P, `defaultVal`: never[]): *T[P]*

*Defined in [utils.ts:133](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L133)*

**Type parameters:**

▪ **T**: *__type*

▪ **P**: *keyof T*

**Parameters:**

Name | Type |
------ | ------ |
`input` | T \| undefined |
`field` | P |
`defaultVal` | never[] |

**Returns:** *T[P]*

▸ **getField**<**T**, **P**, **V**>(`input`: T | undefined, `field`: P, `defaultVal`: V): *T[P] | V*

*Defined in [utils.ts:138](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L138)*

**Type parameters:**

▪ **T**: *__type*

▪ **P**: *keyof T*

▪ **V**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T \| undefined |
`field` | P |
`defaultVal` | V |

**Returns:** *T[P] | V*

▸ **getField**<**T**, **P**, **V**>(`input`: T | undefined, `field`: P, `defaultVal`: V): *T[P]*

*Defined in [utils.ts:143](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L143)*

**Type parameters:**

▪ **T**: *__type*

▪ **P**: *keyof T*

▪ **V**: *T[P]*

**Parameters:**

Name | Type |
------ | ------ |
`input` | T \| undefined |
`field` | P |
`defaultVal` | V |

**Returns:** *T[P]*

___

###  getFirst

▸ **getFirst**<**T**>(`input`: T | T[]): *T*

*Defined in [arrays.ts:105](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/arrays.ts#L105)*

If the input is an array it will return the first item
else if it will return the input

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T \| T[] |

**Returns:** *T*

___

###  getFirstChar

▸ **getFirstChar**(`input`: string): *string*

*Defined in [strings.ts:113](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L113)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  getFullErrorStack

▸ **getFullErrorStack**(`err`: any): *string*

*Defined in [errors.ts:142](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/errors.ts#L142)*

Use following the chain of caused by stack of an error.
Don't use this when logging the error, only when sending it

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *string*

___

###  getTypeOf

▸ **getTypeOf**(`val`: any): *string*

*Defined in [utils.ts:46](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L46)*

Determine the type of an input

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *string*

a human friendly string that describes the input

___

###  getValidDate

▸ **getValidDate**(`val`: any): *Date | false*

*Defined in [dates.ts:16](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/dates.ts#L16)*

Check if the data is valid and return if it is

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *Date | false*

___

###  has

▸ **has**(`data`: object, `key`: any): *boolean*

*Defined in [objects.ts:7](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/objects.ts#L7)*

Check in input has a key

**Parameters:**

Name | Type |
------ | ------ |
`data` | object |
`key` | any |

**Returns:** *boolean*

___

###  includes

▸ **includes**(`input`: any, `key`: string): *boolean*

*Defined in [arrays.ts:91](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/arrays.ts#L91)*

Safely check if an array, object, map, set has a key

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`key` | string |

**Returns:** *boolean*

___

###  isBooleanLike

▸ **isBooleanLike**(`input`: any): *boolean*

*Defined in [utils.ts:83](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isElasticsearchError

▸ **isElasticsearchError**(`err`: any): *boolean*

*Defined in [errors.ts:352](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/errors.ts#L352)*

Check is a elasticsearch error

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isEmpty

▸ **isEmpty**(`val?`: any): *boolean*

*Defined in [utils.ts:11](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L11)*

Check if an input is empty, similar to lodash.isEmpty

**Parameters:**

Name | Type |
------ | ------ |
`val?` | any |

**Returns:** *boolean*

___

###  isError

▸ **isError**(`err`: any): *boolean*

*Defined in [errors.ts:338](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/errors.ts#L338)*

Check if an input has an error compatible api

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isFatalError

▸ **isFatalError**(`err`: any): *boolean*

*Defined in [errors.ts:329](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/errors.ts#L329)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isFunction

▸ **isFunction**(`input`: any): *boolean*

*Defined in [utils.ts:62](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L62)*

Verify an input is a function

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isInteger

▸ **isInteger**(`val`: any): *boolean*

*Defined in [numbers.ts:2](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/numbers.ts#L2)*

A simplified implemation of lodash isInteger

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  isNumber

▸ **isNumber**(`input`: any): *boolean*

*Defined in [numbers.ts:13](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/numbers.ts#L13)*

Check if an input is a number

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isRetryableError

▸ **isRetryableError**(`err`: any): *boolean*

*Defined in [errors.ts:333](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/errors.ts#L333)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isString

▸ **isString**(`val`: any): *boolean*

*Defined in [strings.ts:3](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L3)*

A simplified implemation of lodash isString

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  isTSError

▸ **isTSError**(`err`: any): *boolean*

*Defined in [errors.ts:343](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/errors.ts#L343)*

Check is a TSError

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isValidDate

▸ **isValidDate**(`val`: any): *boolean*

*Defined in [dates.ts:9](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/dates.ts#L9)*

A simplified implemation of moment(new Date(val)).isValid()

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  locked

▸ **locked**(): *_locked*

*Defined in [misc.ts:8](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/misc.ts#L8)*

A decorator for locking down a method

**Returns:** *_locked*

___

###  makeDataEntityObj

▸ **makeDataEntityObj**<**T**, **M**>(`entity`: T, `metadata`: M): *void*

*Defined in [entities/utils.ts:3](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/utils.ts#L3)*

**Type parameters:**

▪ **T**: *object*

▪ **M**: *[DataEntityMetadata](interfaces/dataentitymetadata.md)*

**Parameters:**

Name | Type |
------ | ------ |
`entity` | T |
`metadata` | M |

**Returns:** *void*

___

###  makeISODate

▸ **makeISODate**(): *string*

*Defined in [dates.ts:4](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/dates.ts#L4)*

A helper function for making an ISODate string

**Returns:** *string*

___

###  makeMetadata

▸ **makeMetadata**<**M**>(`metadata?`: [M]()): *[DataEntityMetadata](interfaces/dataentitymetadata.md)*

*Defined in [entities/utils.ts:26](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/utils.ts#L26)*

**Type parameters:**

▪ **M**: *object*

**Parameters:**

Name | Type |
------ | ------ |
`metadata?` | [M]() |

**Returns:** *[DataEntityMetadata](interfaces/dataentitymetadata.md)*

___

###  match

▸ **match**(`regexp`: string, `value`: string): *null | string*

*Defined in [strings.ts:127](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L127)*

**Parameters:**

Name | Type |
------ | ------ |
`regexp` | string |
`value` | string |

**Returns:** *null | string*

___

###  matchAll

▸ **matchAll**(`regexp`: string, `str`: string): *string[] | null*

*Defined in [strings.ts:135](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L135)*

**Parameters:**

Name | Type |
------ | ------ |
`regexp` | string |
`str` | string |

**Returns:** *string[] | null*

___

###  noop

▸ **noop**(...`_args`: any[]): *any*

*Defined in [utils.ts:111](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L111)*

**Parameters:**

Name | Type |
------ | ------ |
`..._args` | any[] |

**Returns:** *any*

___

### `Const` pDelay

▸ **pDelay**(`delay`: number): *Promise‹unknown›*

*Defined in [promises.ts:14](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/promises.ts#L14)*

promisified setTimeout

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`delay` | number | 1 |

**Returns:** *Promise‹unknown›*

___

### `Const` pImmediate

▸ **pImmediate**(): *Promise‹unknown›*

*Defined in [promises.ts:19](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/promises.ts#L19)*

promisified setImmediate

**Returns:** *Promise‹unknown›*

___

###  pRace

▸ **pRace**(`promises`: Promise‹any›[], `logError?`: undefined | function): *Promise‹any›*

*Defined in [promises.ts:288](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/promises.ts#L288)*

Run multiple promises at once, and resolve/reject when the first completes

**Parameters:**

Name | Type |
------ | ------ |
`promises` | Promise‹any›[] |
`logError?` | undefined \| function |

**Returns:** *Promise‹any›*

___

###  pRaceWithTimeout

▸ **pRaceWithTimeout**(`promises`: Promise‹any›[] | Promise‹any›, `timeout`: number, `logError?`: undefined | function): *Promise‹any›*

*Defined in [promises.ts:313](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/promises.ts#L313)*

Similar to pRace but with

**Parameters:**

Name | Type |
------ | ------ |
`promises` | Promise‹any›[] \| Promise‹any› |
`timeout` | number |
`logError?` | undefined \| function |

**Returns:** *Promise‹any›*

___

###  pRetry

▸ **pRetry**<**T**>(`fn`: PromiseFn‹T›, `options?`: Partial‹[PRetryConfig](interfaces/pretryconfig.md)›): *Promise‹T›*

*Defined in [promises.ts:79](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/promises.ts#L79)*

A promise retry fn.

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`fn` | PromiseFn‹T› |
`options?` | Partial‹[PRetryConfig](interfaces/pretryconfig.md)› |

**Returns:** *Promise‹T›*

___

###  pWhile

▸ **pWhile**(`fn`: PromiseFn, `options`: [PWhileOptions](overview.md#pwhileoptions)): *Promise‹void›*

*Defined in [promises.ts:184](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/promises.ts#L184)*

Run a function until it returns true or throws an error

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`fn` | PromiseFn | - |
`options` | [PWhileOptions](overview.md#pwhileoptions) |  {} |

**Returns:** *Promise‹void›*

___

###  parseError

▸ **parseError**(`input`: any, `withStack`: boolean): *string*

*Defined in [errors.ts:228](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/errors.ts#L228)*

parse input to get error message or stack

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`withStack` | boolean | false |

**Returns:** *string*

___

###  parseErrorInfo

▸ **parseErrorInfo**(`input`: any, `config`: [TSErrorConfig](interfaces/tserrorconfig.md)): *ErrorInfo*

*Defined in [errors.ts:154](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/errors.ts#L154)*

parse error for info

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`config` | [TSErrorConfig](interfaces/tserrorconfig.md) |  {} |

**Returns:** *ErrorInfo*

___

###  parseJSON

▸ **parseJSON**<**T**>(`buf`: Buffer | string): *T*

*Defined in [utils.ts:29](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L29)*

JSON encoded buffer into a json object

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`buf` | Buffer \| string |

**Returns:** *T*

___

###  parseList

▸ **parseList**(`input`: any): *string[]*

*Defined in [utils.ts:94](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L94)*

Maps an array of strings and and trims the result, or
parses a comma separated list and trims the result

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *string[]*

___

###  parseNumberList

▸ **parseNumberList**(`input`: any): *number[]*

*Defined in [numbers.ts:35](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/numbers.ts#L35)*

Like parseList, except it returns numbers

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number[]*

___

###  prefixErrorMsg

▸ **prefixErrorMsg**(`input`: any, `prefix?`: undefined | string, `defaultMsg`: string): *string*

*Defined in [errors.ts:319](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/errors.ts#L319)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`prefix?` | undefined \| string | - |
`defaultMsg` | string | "Unknown Error" |

**Returns:** *string*

___

###  random

▸ **random**(`min`: number, `max`: number): *number*

*Defined in [numbers.ts:8](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/numbers.ts#L8)*

A native implemation of lodash random

**Parameters:**

Name | Type |
------ | ------ |
`min` | number |
`max` | number |

**Returns:** *number*

___

###  startsWith

▸ **startsWith**(`str`: string, `val`: string): *boolean*

*Defined in [strings.ts:72](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L72)*

A native implemation of lodash startsWith

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |
`val` | string |

**Returns:** *boolean*

___

###  stripErrorMessage

▸ **stripErrorMessage**(`error`: any, `reason`: string, `requireSafe`: boolean): *string*

*Defined in [errors.ts:409](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/errors.ts#L409)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`error` | any | - |
`reason` | string |  DEFAULT_ERR_MSG |
`requireSafe` | boolean | false |

**Returns:** *string*

___

###  times

▸ **times**(`n`: number): *number[]*

*Defined in [arrays.ts:46](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/arrays.ts#L46)*

A native implemation of lodash times

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *number[]*

▸ **times**<**T**>(`n`: number, `fn`: function): *T[]*

*Defined in [arrays.ts:47](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/arrays.ts#L47)*

**Type parameters:**

▪ **T**

**Parameters:**

▪ **n**: *number*

▪ **fn**: *function*

▸ (`index`: number): *T*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *T[]*

___

###  toBoolean

▸ **toBoolean**(`input`: any): *boolean*

*Defined in [utils.ts:67](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L67)*

Convert any input into a boolean, this will work with stringified boolean

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  toHumanTime

▸ **toHumanTime**(`ms`: number): *string*

*Defined in [dates.ts:39](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/dates.ts#L39)*

converts smaller than a week milliseconds to human readable time

**Parameters:**

Name | Type |
------ | ------ |
`ms` | number |

**Returns:** *string*

___

###  toInteger

▸ **toInteger**(`input`: any): *number | false*

*Defined in [numbers.ts:25](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/numbers.ts#L25)*

Convert any input to a integer, return false if unable to convert input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number | false*

___

###  toNumber

▸ **toNumber**(`input`: any): *number*

*Defined in [numbers.ts:18](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/numbers.ts#L18)*

Convert any input to a number, return Number.NaN if unable to convert input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number*

___

###  toSafeString

▸ **toSafeString**(`input`: string): *string*

*Defined in [strings.ts:89](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L89)*

Make a string url/elasticsearch safe.
safeString converts the string to lower case,
removes any invalid characters,
and replaces whitespace with _ (if it exists in the string) or -
Warning this may reduce the str length

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toStatusErrorCode

▸ **toStatusErrorCode**(`input`: string | undefined): *string*

*Defined in [errors.ts:287](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/errors.ts#L287)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string \| undefined |

**Returns:** *string*

___

###  toString

▸ **toString**(`val`: any): *string*

*Defined in [strings.ts:8](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L8)*

Safely convert any input to a string

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *string*

___

###  trackTimeout

▸ **trackTimeout**(`timeoutMs`: number): *(Anonymous function)*

*Defined in [dates.ts:26](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/dates.ts#L26)*

track a timeout to see if it expires

**Parameters:**

Name | Type |
------ | ------ |
`timeoutMs` | number |

**Returns:** *(Anonymous function)*

a function that will returns false if the time elapsed

___

###  trim

▸ **trim**(`input`: any): *string*

*Defined in [strings.ts:67](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L67)*

safely trim an input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *string*

___

###  trimAndToLower

▸ **trimAndToLower**(`input?`: undefined | string): *string*

*Defined in [strings.ts:20](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L20)*

safely trim and to lower a input, useful for string comparison

**Parameters:**

Name | Type |
------ | ------ |
`input?` | undefined \| string |

**Returns:** *string*

___

###  trimAndToUpper

▸ **trimAndToUpper**(`input?`: undefined | string): *string*

*Defined in [strings.ts:25](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L25)*

safely trim and to lower a input, useful for string comparison

**Parameters:**

Name | Type |
------ | ------ |
`input?` | undefined \| string |

**Returns:** *string*

___

###  truncate

▸ **truncate**(`str`: string, `len`: number): *string*

*Defined in [strings.ts:77](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |
`len` | number |

**Returns:** *string*

___

###  tryParseJSON

▸ **tryParseJSON**(`input`: any): *any*

*Defined in [utils.ts:20](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/utils.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *any*

___

###  unescapeString

▸ **unescapeString**(`str`: string): *string*

*Defined in [strings.ts:48](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/strings.ts#L48)*

Unescape characters in string and avoid double escaping

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`str` | string | "" |

**Returns:** *string*

___

###  uniq

▸ **uniq**<**T**>(`arr`: T[]): *T[]*

*Defined in [arrays.ts:41](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/arrays.ts#L41)*

A native implemation of lodash uniq

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arr` | T[] |

**Returns:** *T[]*

___

###  waterfall

▸ **waterfall**(`input`: any, `fns`: PromiseFn[], `addBreak`: boolean): *Promise‹any›*

*Defined in [promises.ts:277](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/promises.ts#L277)*

Async waterfall function

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`fns` | PromiseFn[] | - |
`addBreak` | boolean | false |

**Returns:** *Promise‹any›*

___

###  withoutNil

▸ **withoutNil**<**T**>(`input`: T): *[WithoutNil](overview.md#withoutnil)‹T›*

*Defined in [arrays.ts:27](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/arrays.ts#L27)*

Build a new object without null or undefined values (shallow)

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type |
------ | ------ |
`input` | T |

**Returns:** *[WithoutNil](overview.md#withoutnil)‹T›*
