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
* [EmptyObject](interfaces/emptyobject.md)
* [EncodingConfig](interfaces/encodingconfig.md)
* [ListOfRecursiveArraysOrValues](interfaces/listofrecursivearraysorvalues.md)
* [Many](interfaces/many.md)
* [PRetryConfig](interfaces/pretryconfig.md)
* [RecursiveArray](interfaces/recursivearray.md)
* [TSErrorConfig](interfaces/tserrorconfig.md)
* [TSErrorContext](interfaces/tserrorcontext.md)

### Type aliases

* [DataArrayInput](overview.md#dataarrayinput)
* [DataEntityMetadataValue](overview.md#dataentitymetadatavalue)
* [DataInput](overview.md#datainput)
* [EntityMetadataValue](overview.md#entitymetadatavalue)
* [FormatRegexResult](overview.md#formatregexresult)
* [Omit](overview.md#omit)
* [Optional](overview.md#optional)
* [Override](overview.md#override)
* [Overwrite](overview.md#overwrite)
* [PWhileOptions](overview.md#pwhileoptions)
* [PartialDeep](overview.md#partialdeep)
* [Required](overview.md#required)
* [TYPE_ENTITY_METADATA_KEY](overview.md#type_entity_metadata_key)
* [TYPE_IS_DATAENTITY_KEY](overview.md#type_is_dataentity_key)
* [WithoutNil](overview.md#withoutnil)
* [_DataEntityMetadata](overview.md#_dataentitymetadata)
* [_DataEntityMetadataType](overview.md#_dataentitymetadatatype)

### Variables

* [__ENTITY_METADATA_KEY](overview.md#const-__entity_metadata_key)
* [__IS_DATAENTITY_KEY](overview.md#const-__is_dataentity_key)
* [dataEncodings](overview.md#const-dataencodings)
* [isDev](overview.md#const-isdev)
* [isProd](overview.md#const-isprod)
* [isTest](overview.md#const-istest)

### Functions

* [castArray](overview.md#castarray)
* [chunk](overview.md#chunk)
* [concat](overview.md#concat)
* [configurable](overview.md#configurable)
* [createCoreMetadata](overview.md#createcoremetadata)
* [createMetadata](overview.md#createmetadata)
* [debugLogger](overview.md#debuglogger)
* [defineEntityProperties](overview.md#defineentityproperties)
* [ensureBuffer](overview.md#ensurebuffer)
* [enumerable](overview.md#enumerable)
* [escapeString](overview.md#escapestring)
* [fastAssign](overview.md#fastassign)
* [fastCloneDeep](overview.md#fastclonedeep)
* [fastMap](overview.md#fastmap)
* [firstToLower](overview.md#firsttolower)
* [firstToUpper](overview.md#firsttoupper)
* [flatten](overview.md#flatten)
* [flattenDeep](overview.md#flattendeep)
* [formatRegex](overview.md#formatregex)
* [getBackoffDelay](overview.md#getbackoffdelay)
* [getErrorStatusCode](overview.md#geterrorstatuscode)
* [getField](overview.md#getfield)
* [getFirst](overview.md#getfirst)
* [getFirstChar](overview.md#getfirstchar)
* [getFullErrorStack](overview.md#getfullerrorstack)
* [getTypeOf](overview.md#gettypeof)
* [getUnixTime](overview.md#getunixtime)
* [getValidDate](overview.md#getvaliddate)
* [has](overview.md#has)
* [includes](overview.md#includes)
* [isBoolean](overview.md#isboolean)
* [isBooleanLike](overview.md#isbooleanlike)
* [isBuffer](overview.md#isbuffer)
* [isDataEntity](overview.md#isdataentity)
* [isElasticsearchError](overview.md#iselasticsearcherror)
* [isEmpty](overview.md#isempty)
* [isError](overview.md#iserror)
* [isFatalError](overview.md#isfatalerror)
* [isFunction](overview.md#isfunction)
* [isInteger](overview.md#isinteger)
* [isNumber](overview.md#isnumber)
* [isRetryableError](overview.md#isretryableerror)
* [isSimpleObject](overview.md#issimpleobject)
* [isString](overview.md#isstring)
* [isTSError](overview.md#istserror)
* [isValidDate](overview.md#isvaliddate)
* [isValidDateInstance](overview.md#isvaliddateinstance)
* [isValidKey](overview.md#isvalidkey)
* [jsonToBuffer](overview.md#jsontobuffer)
* [locked](overview.md#locked)
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

*Defined in [entities/data-entity.ts:387](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/data-entity.ts#L387)*

___

###  DataEntityMetadataValue

Ƭ **DataEntityMetadataValue**: *"_createTime" | "_ingestTime" | "_processTime" | "_eventTime" | "_key" | keyof M | string | number*

*Defined in [entities/interfaces.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/interfaces.ts#L12)*

___

###  DataInput

Ƭ **DataInput**: *Record‹string, any› | [DataEntity](classes/dataentity.md)*

*Defined in [entities/data-entity.ts:386](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/data-entity.ts#L386)*

___

###  EntityMetadataValue

Ƭ **EntityMetadataValue**: *EntityMetadataValue<M, K>*

*Defined in [entities/interfaces.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/interfaces.ts#L18)*

___

###  FormatRegexResult

Ƭ **FormatRegexResult**: *[string, string | undefined]*

*Defined in [strings.ts:105](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L105)*

___

###  Omit

Ƭ **Omit**: *Pick‹T, Exclude‹keyof T, K››*

*Defined in [interfaces.ts:7](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/interfaces.ts#L7)*

Omit the properties available to type.
Useful for excluding properties from a type

**`example`** `Omit<{ a: number, b: number, c: number }, 'b'|'c'> // => { a: 1 }`

___

###  Optional

Ƭ **Optional**: *object*

*Defined in [interfaces.ts:41](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/interfaces.ts#L41)*

Like Partial but makes certain properties optional

**`example`** `Optional<{ a: number, b: number }, 'b'>`

#### Type declaration:

___

###  Override

Ƭ **Override**: *object*

*Defined in [interfaces.ts:23](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/interfaces.ts#L23)*

Override specific properties on a type

**`example`** `Override<{ a: number, b: number }, { b: string }>`

#### Type declaration:

___

###  Overwrite

Ƭ **Overwrite**: *object & T2*

*Defined in [interfaces.ts:15](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/interfaces.ts#L15)*

Overwrite a simple type with different properties.
Useful changing and adding additional properties

**`example`** `Overwrite<{ a: number, b: number }, { b?: number }>`

___

###  PWhileOptions

Ƭ **PWhileOptions**: *object*

*Defined in [promises.ts:170](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/promises.ts#L170)*

#### Type declaration:

___

###  PartialDeep

Ƭ **PartialDeep**: *object*

*Defined in [interfaces.ts:69](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/interfaces.ts#L69)*

A deep partial object

#### Type declaration:

___

###  Required

Ƭ **Required**: *object*

*Defined in [interfaces.ts:32](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/interfaces.ts#L32)*

Like Partial but makes certain properties required

**`example`** `Required<{ a: number, b: number }, 'b'>`

#### Type declaration:

___

###  TYPE_ENTITY_METADATA_KEY

Ƭ **TYPE_ENTITY_METADATA_KEY**: *"___EntityMetadata"*

*Defined in [entities/interfaces.ts:4](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/interfaces.ts#L4)*

___

###  TYPE_IS_DATAENTITY_KEY

Ƭ **TYPE_IS_DATAENTITY_KEY**: *"__isDataEntity"*

*Defined in [entities/interfaces.ts:3](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/interfaces.ts#L3)*

___

###  WithoutNil

Ƭ **WithoutNil**: *object*

*Defined in [interfaces.ts:48](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/interfaces.ts#L48)*

Without null or undefined properties

#### Type declaration:

___

###  _DataEntityMetadata

Ƭ **_DataEntityMetadata**: *M & [DataEntityMetadata](interfaces/dataentitymetadata.md) & [AnyObject](interfaces/anyobject.md)*

*Defined in [entities/interfaces.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/interfaces.ts#L10)*

___

###  _DataEntityMetadataType

Ƭ **_DataEntityMetadataType**: *[DataEntityMetadata](interfaces/dataentitymetadata.md) | [AnyObject](interfaces/anyobject.md)*

*Defined in [entities/interfaces.ts:9](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/interfaces.ts#L9)*

## Variables

### `Const` __ENTITY_METADATA_KEY

• **__ENTITY_METADATA_KEY**: *[TYPE_ENTITY_METADATA_KEY](overview.md#type_entity_metadata_key)* = "___EntityMetadata"

*Defined in [entities/interfaces.ts:7](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/interfaces.ts#L7)*

___

### `Const` __IS_DATAENTITY_KEY

• **__IS_DATAENTITY_KEY**: *[TYPE_IS_DATAENTITY_KEY](overview.md#type_is_dataentity_key)* = "__isDataEntity"

*Defined in [entities/interfaces.ts:6](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/interfaces.ts#L6)*

___

### `Const` dataEncodings

• **dataEncodings**: *keyof DataEncoding[]* =  Object.values(DataEncoding)

*Defined in [entities/interfaces.ts:74](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/interfaces.ts#L74)*

A list of supported encoding formats

___

### `Const` isDev

• **isDev**: *boolean* =  NODE_ENV === 'development'

*Defined in [misc.ts:5](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/misc.ts#L5)*

___

### `Const` isProd

• **isProd**: *boolean* =  NODE_ENV === 'production'

*Defined in [misc.ts:3](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/misc.ts#L3)*

___

### `Const` isTest

• **isTest**: *boolean* =  NODE_ENV === 'test'

*Defined in [misc.ts:4](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/misc.ts#L4)*

## Functions

###  castArray

▸ **castArray**<**T**>(`input`: T | T[]): *T[]*

*Defined in [arrays.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/arrays.ts#L18)*

A simplified implemation of lodash castArray

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T &#124; T[] |

**Returns:** *T[]*

___

###  chunk

▸ **chunk**<**T**>(`dataArray`: T[] | Set‹T›, `size`: number): *T[][]*

*Defined in [arrays.ts:81](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/arrays.ts#L81)*

Chunk an array into specific sizes

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`dataArray` | T[] &#124; Set‹T› |
`size` | number |

**Returns:** *T[][]*

___

###  concat

▸ **concat**<**T**>(`arr`: T | T[], `arr1?`: T | T[]): *T[]*

*Defined in [arrays.ts:27](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/arrays.ts#L27)*

Concat and unique the items in the array
Any non-array value will be converted to an array

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arr` | T &#124; T[] |
`arr1?` | T &#124; T[] |

**Returns:** *T[]*

___

###  configurable

▸ **configurable**(`value`: boolean): *_configurable*

*Defined in [misc.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/misc.ts#L21)*

A decorator making changing the changing configurable property

**Parameters:**

Name | Type |
------ | ------ |
`value` | boolean |

**Returns:** *_configurable*

___

###  createCoreMetadata

▸ **createCoreMetadata**<**M**>(): *i._DataEntityMetadata‹M›*

*Defined in [entities/utils.ts:32](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/utils.ts#L32)*

**Type parameters:**

▪ **M**: *i._DataEntityMetadataType*

**Returns:** *i._DataEntityMetadata‹M›*

___

###  createMetadata

▸ **createMetadata**<**M**>(`metadata`: M): *i._DataEntityMetadata‹M›*

*Defined in [entities/utils.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/utils.ts#L21)*

**Type parameters:**

▪ **M**

**Parameters:**

Name | Type |
------ | ------ |
`metadata` | M |

**Returns:** *i._DataEntityMetadata‹M›*

___

###  debugLogger

▸ **debugLogger**(`testName`: string, `param?`: debugParam, `otherName?`: undefined | string): *Logger*

*Defined in [logger.ts:26](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/logger.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`testName` | string |
`param?` | debugParam |
`otherName?` | undefined &#124; string |

**Returns:** *Logger*

___

###  defineEntityProperties

▸ **defineEntityProperties**(`entity`: any): *void*

*Defined in [entities/utils.ts:5](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/utils.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`entity` | any |

**Returns:** *void*

___

###  ensureBuffer

▸ **ensureBuffer**(`input`: string | Buffer, `encoding`: BufferEncoding): *Buffer*

*Defined in [utils.ts:77](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L77)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | string &#124; Buffer | - |
`encoding` | BufferEncoding | "utf8" |

**Returns:** *Buffer*

___

###  enumerable

▸ **enumerable**(`enabled`: boolean): *_enumerable*

*Defined in [misc.ts:32](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/misc.ts#L32)*

A decorator for making a method enumerable or none-enumerable

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`enabled` | boolean | true |

**Returns:** *_enumerable*

___

###  escapeString

▸ **escapeString**(`input`: string | number): *string*

*Defined in [strings.ts:31](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L31)*

Escape characters in string and avoid double escaping

**Parameters:**

Name | Type |
------ | ------ |
`input` | string &#124; number |

**Returns:** *string*

___

###  fastAssign

▸ **fastAssign**<**T**, **U**>(`target`: T, `source`: U): *T*

*Defined in [objects.ts:25](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/objects.ts#L25)*

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

*Defined in [objects.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/objects.ts#L20)*

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

*Defined in [arrays.ts:68](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/arrays.ts#L68)*

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

*Defined in [strings.ts:97](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L97)*

Change first character in string to lower case

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  firstToUpper

▸ **firstToUpper**(`str`: string): *string*

*Defined in [strings.ts:92](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L92)*

Change first character in string to upper case

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  flatten

▸ **flatten**<**T**>(`val`: [Many](interfaces/many.md)‹T[]›): *T[]*

*Defined in [arrays.ts:4](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/arrays.ts#L4)*

A native implemation of lodash flatten

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`val` | [Many](interfaces/many.md)‹T[]› |

**Returns:** *T[]*

___

###  flattenDeep

▸ **flattenDeep**<**T**>(`val`: [ListOfRecursiveArraysOrValues](interfaces/listofrecursivearraysorvalues.md)‹T›): *T[]*

*Defined in [arrays.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/arrays.ts#L8)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`val` | [ListOfRecursiveArraysOrValues](interfaces/listofrecursivearraysorvalues.md)‹T› |

**Returns:** *T[]*

___

###  formatRegex

▸ **formatRegex**(`str`: string): *[FormatRegexResult](overview.md#formatregexresult)*

*Defined in [strings.ts:107](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L107)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *[FormatRegexResult](overview.md#formatregexresult)*

___

###  getBackoffDelay

▸ **getBackoffDelay**(`current`: number, `factor`: number, `max`: number, `min`: number): *number*

*Defined in [promises.ts:244](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/promises.ts#L244)*

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

*Defined in [errors.ts:396](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L396)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`err` | any | - |
`config` | [TSErrorConfig](interfaces/tserrorconfig.md) |  {} |
`defaultCode` | number |  DEFAULT_STATUS_CODE |

**Returns:** *number*

___

###  getField

▸ **getField**<**V**>(`input`: undefined, `field`: string, `defaultVal?`: [V](undefined)): *V*

*Defined in [utils.ts:129](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L129)*

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
`defaultVal?` | [V](undefined) |

**Returns:** *V*

▸ **getField**<**T**, **P**>(`input`: T, `field`: P): *T[P]*

*Defined in [utils.ts:134](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L134)*

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

*Defined in [utils.ts:138](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L138)*

**Type parameters:**

▪ **T**: *__type*

▪ **P**: *keyof T*

**Parameters:**

Name | Type |
------ | ------ |
`input` | T &#124; undefined |
`field` | P |

**Returns:** *T[P]*

▸ **getField**<**T**, **P**>(`input`: T | undefined, `field`: P, `defaultVal`: never[]): *T[P]*

*Defined in [utils.ts:142](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L142)*

**Type parameters:**

▪ **T**: *__type*

▪ **P**: *keyof T*

**Parameters:**

Name | Type |
------ | ------ |
`input` | T &#124; undefined |
`field` | P |
`defaultVal` | never[] |

**Returns:** *T[P]*

▸ **getField**<**T**, **P**, **V**>(`input`: T | undefined, `field`: P, `defaultVal`: V): *T[P] | V*

*Defined in [utils.ts:147](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L147)*

**Type parameters:**

▪ **T**: *__type*

▪ **P**: *keyof T*

▪ **V**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T &#124; undefined |
`field` | P |
`defaultVal` | V |

**Returns:** *T[P] | V*

▸ **getField**<**T**, **P**, **V**>(`input`: T | undefined, `field`: P, `defaultVal`: V): *T[P]*

*Defined in [utils.ts:152](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L152)*

**Type parameters:**

▪ **T**: *__type*

▪ **P**: *keyof T*

▪ **V**: *T[P]*

**Parameters:**

Name | Type |
------ | ------ |
`input` | T &#124; undefined |
`field` | P |
`defaultVal` | V |

**Returns:** *T[P]*

___

###  getFirst

▸ **getFirst**<**T**>(`input`: T | T[]): *T*

*Defined in [arrays.ts:113](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/arrays.ts#L113)*

If the input is an array it will return the first item
else if it will return the input

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T &#124; T[] |

**Returns:** *T*

___

###  getFirstChar

▸ **getFirstChar**(`input`: string): *string*

*Defined in [strings.ts:101](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  getFullErrorStack

▸ **getFullErrorStack**(`err`: any): *string*

*Defined in [errors.ts:150](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L150)*

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

*Defined in [utils.ts:46](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L46)*

Determine the type of an input

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *string*

a human friendly string that describes the input

___

###  getUnixTime

▸ **getUnixTime**(`val?`: string | number | Date): *number | false*

*Defined in [dates.ts:30](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/dates.ts#L30)*

Ensure unix time

**Parameters:**

Name | Type |
------ | ------ |
`val?` | string &#124; number &#124; Date |

**Returns:** *number | false*

___

###  getValidDate

▸ **getValidDate**(`val`: any): *Date | false*

*Defined in [dates.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/dates.ts#L14)*

Check if the data is valid and return if it is

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *Date | false*

___

###  has

▸ **has**(`data`: object, `key`: string | number | symbol): *boolean*

*Defined in [objects.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/objects.ts#L8)*

Check in input has a key

**Parameters:**

Name | Type |
------ | ------ |
`data` | object |
`key` | string &#124; number &#124; symbol |

**Returns:** *boolean*

___

###  includes

▸ **includes**(`input`: any, `key`: string): *boolean*

*Defined in [arrays.ts:99](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/arrays.ts#L99)*

Safely check if an array, object, map, set has a key

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`key` | string |

**Returns:** *boolean*

___

###  isBoolean

▸ **isBoolean**(`input`: any): *boolean*

*Defined in [utils.ts:87](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L87)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isBooleanLike

▸ **isBooleanLike**(`input`: any): *boolean*

*Defined in [utils.ts:92](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L92)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isBuffer

▸ **isBuffer**(`input`: any): *boolean*

*Defined in [utils.ts:73](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isDataEntity

▸ **isDataEntity**(`input`: any): *boolean*

*Defined in [entities/utils.ts:48](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/utils.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isElasticsearchError

▸ **isElasticsearchError**(`err`: any): *boolean*

*Defined in [errors.ts:360](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L360)*

Check is a elasticsearch error

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isEmpty

▸ **isEmpty**(`val?`: any): *boolean*

*Defined in [utils.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L11)*

Check if an input is empty, similar to lodash.isEmpty

**Parameters:**

Name | Type |
------ | ------ |
`val?` | any |

**Returns:** *boolean*

___

###  isError

▸ **isError**(`err`: any): *boolean*

*Defined in [errors.ts:346](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L346)*

Check if an input has an error compatible api

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isFatalError

▸ **isFatalError**(`err`: any): *boolean*

*Defined in [errors.ts:337](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L337)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isFunction

▸ **isFunction**(`input`: any): *boolean*

*Defined in [utils.ts:62](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L62)*

Verify an input is a function

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isInteger

▸ **isInteger**(`val`: any): *boolean*

*Defined in [numbers.ts:2](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/numbers.ts#L2)*

A simplified implemation of lodash isInteger

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  isNumber

▸ **isNumber**(`input`: any): *boolean*

*Defined in [numbers.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/numbers.ts#L13)*

Check if an input is a number

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isRetryableError

▸ **isRetryableError**(`err`: any): *boolean*

*Defined in [errors.ts:341](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L341)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isSimpleObject

▸ **isSimpleObject**(`input`: any): *boolean*

*Defined in [objects.ts:40](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/objects.ts#L40)*

Similar to is-plain-object but works better when clone deeping a DataEntity

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isString

▸ **isString**(`val`: any): *boolean*

*Defined in [strings.ts:4](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L4)*

A simplified implemation of lodash isString

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  isTSError

▸ **isTSError**(`err`: any): *boolean*

*Defined in [errors.ts:351](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L351)*

Check is a TSError

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isValidDate

▸ **isValidDate**(`val`: any): *boolean*

*Defined in [dates.ts:9](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/dates.ts#L9)*

A simplified implemation of moment(new Date(val)).isValid()

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  isValidDateInstance

▸ **isValidDateInstance**(`val`: Date): *boolean*

*Defined in [dates.ts:25](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/dates.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`val` | Date |

**Returns:** *boolean*

___

###  isValidKey

▸ **isValidKey**(`key`: any): *boolean*

*Defined in [entities/utils.ts:41](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/utils.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | any |

**Returns:** *boolean*

___

###  jsonToBuffer

▸ **jsonToBuffer**(`input`: any): *Buffer*

*Defined in [entities/utils.ts:37](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/utils.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *Buffer*

___

###  locked

▸ **locked**(): *_locked*

*Defined in [misc.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/misc.ts#L8)*

A decorator for locking down a method

**Returns:** *_locked*

___

###  makeISODate

▸ **makeISODate**(): *string*

*Defined in [dates.ts:4](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/dates.ts#L4)*

A helper function for making an ISODate string

**Returns:** *string*

___

###  makeMetadata

▸ **makeMetadata**<**M**>(`metadata?`: M | undefined): *i._DataEntityMetadata‹M›*

*Defined in [entities/utils.ts:25](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/entities/utils.ts#L25)*

**Type parameters:**

▪ **M**: *i._DataEntityMetadataType*

**Parameters:**

Name | Type |
------ | ------ |
`metadata?` | M &#124; undefined |

**Returns:** *i._DataEntityMetadata‹M›*

___

###  match

▸ **match**(`regexp`: string, `value`: string): *null | string*

*Defined in [strings.ts:115](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L115)*

**Parameters:**

Name | Type |
------ | ------ |
`regexp` | string |
`value` | string |

**Returns:** *null | string*

___

###  matchAll

▸ **matchAll**(`regexp`: string, `str`: string): *string[] | null*

*Defined in [strings.ts:123](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L123)*

**Parameters:**

Name | Type |
------ | ------ |
`regexp` | string |
`str` | string |

**Returns:** *string[] | null*

___

###  noop

▸ **noop**(...`_args`: any[]): *any*

*Defined in [utils.ts:120](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`..._args` | any[] |

**Returns:** *any*

___

### `Const` pDelay

▸ **pDelay**(`delay`: number): *Promise‹unknown›*

*Defined in [promises.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/promises.ts#L14)*

promisified setTimeout

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`delay` | number | 1 |

**Returns:** *Promise‹unknown›*

___

### `Const` pImmediate

▸ **pImmediate**(): *Promise‹unknown›*

*Defined in [promises.ts:19](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/promises.ts#L19)*

promisified setImmediate

**Returns:** *Promise‹unknown›*

___

###  pRace

▸ **pRace**(`promises`: Promise‹any›[], `logError?`: undefined | function): *Promise‹any›*

*Defined in [promises.ts:288](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/promises.ts#L288)*

Run multiple promises at once, and resolve/reject when the first completes

**Parameters:**

Name | Type |
------ | ------ |
`promises` | Promise‹any›[] |
`logError?` | undefined &#124; function |

**Returns:** *Promise‹any›*

___

###  pRaceWithTimeout

▸ **pRaceWithTimeout**(`promises`: Promise‹any›[] | Promise‹any›, `timeout`: number, `logError?`: undefined | function): *Promise‹any›*

*Defined in [promises.ts:313](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/promises.ts#L313)*

Similar to pRace but with

**Parameters:**

Name | Type |
------ | ------ |
`promises` | Promise‹any›[] &#124; Promise‹any› |
`timeout` | number |
`logError?` | undefined &#124; function |

**Returns:** *Promise‹any›*

___

###  pRetry

▸ **pRetry**<**T**>(`fn`: PromiseFn‹T›, `options?`: Partial‹[PRetryConfig](interfaces/pretryconfig.md)›): *Promise‹T›*

*Defined in [promises.ts:79](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/promises.ts#L79)*

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

*Defined in [promises.ts:184](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/promises.ts#L184)*

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

*Defined in [errors.ts:236](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L236)*

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

*Defined in [errors.ts:162](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L162)*

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

*Defined in [utils.ts:29](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L29)*

JSON encoded buffer into a json object

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`buf` | Buffer &#124; string |

**Returns:** *T*

___

###  parseList

▸ **parseList**(`input`: any): *string[]*

*Defined in [utils.ts:103](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L103)*

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

*Defined in [numbers.ts:35](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/numbers.ts#L35)*

Like parseList, except it returns numbers

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number[]*

___

###  prefixErrorMsg

▸ **prefixErrorMsg**(`input`: any, `prefix?`: undefined | string, `defaultMsg`: string): *string*

*Defined in [errors.ts:327](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L327)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`prefix?` | undefined &#124; string | - |
`defaultMsg` | string | "Unknown Error" |

**Returns:** *string*

___

###  random

▸ **random**(`min`: number, `max`: number): *number*

*Defined in [numbers.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/numbers.ts#L8)*

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

*Defined in [strings.ts:60](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L60)*

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

*Defined in [errors.ts:417](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L417)*

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

*Defined in [arrays.ts:54](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/arrays.ts#L54)*

A native implemation of lodash times

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *number[]*

▸ **times**<**T**>(`n`: number, `fn`: function): *T[]*

*Defined in [arrays.ts:55](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/arrays.ts#L55)*

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

*Defined in [utils.ts:67](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L67)*

Convert any input into a boolean, this will work with stringified boolean

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  toHumanTime

▸ **toHumanTime**(`ms`: number): *string*

*Defined in [dates.ts:54](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/dates.ts#L54)*

converts smaller than a week milliseconds to human readable time

**Parameters:**

Name | Type |
------ | ------ |
`ms` | number |

**Returns:** *string*

___

###  toInteger

▸ **toInteger**(`input`: any): *number | false*

*Defined in [numbers.ts:25](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/numbers.ts#L25)*

Convert any input to a integer, return false if unable to convert input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number | false*

___

###  toNumber

▸ **toNumber**(`input`: any): *number*

*Defined in [numbers.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/numbers.ts#L18)*

Convert any input to a number, return Number.NaN if unable to convert input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number*

___

###  toSafeString

▸ **toSafeString**(`input`: string): *string*

*Defined in [strings.ts:77](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L77)*

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

*Defined in [errors.ts:295](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L295)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string &#124; undefined |

**Returns:** *string*

___

###  toString

▸ **toString**(`val`: any): *string*

*Defined in [strings.ts:9](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L9)*

Safely convert any input to a string

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *string*

___

###  trackTimeout

▸ **trackTimeout**(`timeoutMs`: number): *(Anonymous function)*

*Defined in [dates.ts:41](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/dates.ts#L41)*

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

*Defined in [strings.ts:55](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L55)*

safely trim an input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *string*

___

###  trimAndToLower

▸ **trimAndToLower**(`input?`: undefined | string): *string*

*Defined in [strings.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L21)*

safely trim and to lower a input, useful for string comparison

**Parameters:**

Name | Type |
------ | ------ |
`input?` | undefined &#124; string |

**Returns:** *string*

___

###  trimAndToUpper

▸ **trimAndToUpper**(`input?`: undefined | string): *string*

*Defined in [strings.ts:26](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L26)*

safely trim and to lower a input, useful for string comparison

**Parameters:**

Name | Type |
------ | ------ |
`input?` | undefined &#124; string |

**Returns:** *string*

___

###  truncate

▸ **truncate**(`str`: string, `len`: number): *string*

*Defined in [strings.ts:65](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L65)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |
`len` | number |

**Returns:** *string*

___

###  tryParseJSON

▸ **tryParseJSON**(`input`: any): *any*

*Defined in [utils.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/utils.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *any*

___

###  unescapeString

▸ **unescapeString**(`str`: string): *string*

*Defined in [strings.ts:36](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/strings.ts#L36)*

Unescape characters in string and avoid double escaping

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`str` | string | "" |

**Returns:** *string*

___

###  uniq

▸ **uniq**<**T**>(`arr`: T[]): *T[]*

*Defined in [arrays.ts:49](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/arrays.ts#L49)*

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

*Defined in [promises.ts:277](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/promises.ts#L277)*

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

*Defined in [arrays.ts:35](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/arrays.ts#L35)*

Build a new object without null or undefined values (shallow)

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type |
------ | ------ |
`input` | T |

**Returns:** *[WithoutNil](overview.md#withoutnil)‹T›*
