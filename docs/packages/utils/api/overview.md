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
* [Diff](overview.md#diff)
* [EntityMetadataValue](overview.md#entitymetadatavalue)
* [Filter](overview.md#filter)
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
* [ValueOf](overview.md#valueof)
* [WithoutNil](overview.md#withoutnil)
* [_DataEntityMetadata](overview.md#_dataentitymetadata)
* [_DataEntityMetadataType](overview.md#_dataentitymetadatatype)

### Variables

* [__ENTITY_METADATA_KEY](overview.md#const-__entity_metadata_key)
* [__IS_DATAENTITY_KEY](overview.md#const-__is_dataentity_key)
* [dataEncodings](overview.md#const-dataencodings)
* [geoJSONTypes](overview.md#const-geojsontypes)
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
* [getFirstKey](overview.md#getfirstkey)
* [getFirstValue](overview.md#getfirstvalue)
* [getFullErrorStack](overview.md#getfullerrorstack)
* [getLonAndLat](overview.md#getlonandlat)
* [getTypeOf](overview.md#gettypeof)
* [getUnixTime](overview.md#getunixtime)
* [getValidDate](overview.md#getvaliddate)
* [getWordParts](overview.md#getwordparts)
* [has](overview.md#has)
* [inNumberRange](overview.md#innumberrange)
* [includes](overview.md#includes)
* [isBoolean](overview.md#isboolean)
* [isBooleanLike](overview.md#isbooleanlike)
* [isBuffer](overview.md#isbuffer)
* [isDataEntity](overview.md#isdataentity)
* [isElasticsearchError](overview.md#iselasticsearcherror)
* [isEmail](overview.md#isemail)
* [isEmpty](overview.md#isempty)
* [isError](overview.md#iserror)
* [isFatalError](overview.md#isfatalerror)
* [isFunction](overview.md#isfunction)
* [isGeoJSON](overview.md#isgeojson)
* [isGeoShapeMultiPolygon](overview.md#isgeoshapemultipolygon)
* [isGeoShapePoint](overview.md#isgeoshapepoint)
* [isGeoShapePolygon](overview.md#isgeoshapepolygon)
* [isInteger](overview.md#isinteger)
* [isMacAddress](overview.md#ismacaddress)
* [isNil](overview.md#const-isnil)
* [isNotNil](overview.md#const-isnotnil)
* [isNumber](overview.md#isnumber)
* [isRetryableError](overview.md#isretryableerror)
* [isSimpleObject](overview.md#issimpleobject)
* [isString](overview.md#isstring)
* [isTSError](overview.md#istserror)
* [isValidDate](overview.md#isvaliddate)
* [isValidDateInstance](overview.md#isvaliddateinstance)
* [isValidKey](overview.md#isvalidkey)
* [isWildCardString](overview.md#iswildcardstring)
* [jsonToBuffer](overview.md#jsontobuffer)
* [locked](overview.md#locked)
* [logError](overview.md#logerror)
* [makeISODate](overview.md#makeisodate)
* [makeMetadata](overview.md#makemetadata)
* [match](overview.md#match)
* [matchAll](overview.md#matchall)
* [matchWildcard](overview.md#matchwildcard)
* [memoize](overview.md#memoize)
* [noop](overview.md#noop)
* [pDefer](overview.md#pdefer)
* [pDelay](overview.md#pdelay)
* [pImmediate](overview.md#pimmediate)
* [pRace](overview.md#prace)
* [pRaceWithTimeout](overview.md#pracewithtimeout)
* [pRetry](overview.md#pretry)
* [pWhile](overview.md#pwhile)
* [parseError](overview.md#parseerror)
* [parseErrorInfo](overview.md#parseerrorinfo)
* [parseGeoDistance](overview.md#parsegeodistance)
* [parseGeoDistanceUnit](overview.md#parsegeodistanceunit)
* [parseGeoPoint](overview.md#parsegeopoint)
* [parseJSON](overview.md#parsejson)
* [parseList](overview.md#parselist)
* [parseNumberList](overview.md#parsenumberlist)
* [prefixErrorMsg](overview.md#prefixerrormsg)
* [random](overview.md#random)
* [startsWith](overview.md#startswith)
* [stripErrorMessage](overview.md#striperrormessage)
* [times](overview.md#times)
* [toBoolean](overview.md#toboolean)
* [toCamelCase](overview.md#tocamelcase)
* [toHumanTime](overview.md#tohumantime)
* [toInteger](overview.md#tointeger)
* [toKebabCase](overview.md#tokebabcase)
* [toNumber](overview.md#tonumber)
* [toPascalCase](overview.md#topascalcase)
* [toSafeString](overview.md#tosafestring)
* [toSnakeCase](overview.md#tosnakecase)
* [toStatusErrorCode](overview.md#tostatuserrorcode)
* [toString](overview.md#tostring)
* [toTitleCase](overview.md#totitlecase)
* [trackTimeout](overview.md#tracktimeout)
* [trim](overview.md#trim)
* [trimAndToLower](overview.md#trimandtolower)
* [trimAndToUpper](overview.md#trimandtoupper)
* [truncate](overview.md#truncate)
* [tryParseJSON](overview.md#tryparsejson)
* [unescapeString](overview.md#unescapestring)
* [uniq](overview.md#uniq)
* [waterfall](overview.md#waterfall)
* [wildCardToRegex](overview.md#wildcardtoregex)
* [withoutNil](overview.md#withoutnil)

## Type aliases

###  DataArrayInput

Ƭ **DataArrayInput**: *[DataInput](overview.md#datainput) | [DataInput](overview.md#datainput)[]*

*Defined in [packages/utils/src/entities/data-entity.ts:386](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L386)*

___

###  DataEntityMetadataValue

Ƭ **DataEntityMetadataValue**: *"_createTime" | "_ingestTime" | "_processTime" | "_eventTime" | "_key" | keyof M | string | number*

*Defined in [packages/utils/src/entities/interfaces.ts:12](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/interfaces.ts#L12)*

___

###  DataInput

Ƭ **DataInput**: *Record‹string, any› | [DataEntity](classes/dataentity.md)*

*Defined in [packages/utils/src/entities/data-entity.ts:385](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L385)*

___

###  Diff

Ƭ **Diff**: *T extends U ? never : T*

*Defined in [packages/utils/src/interfaces.ts:76](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/interfaces.ts#L76)*

Remove types from T that are assignable to U

___

###  EntityMetadataValue

Ƭ **EntityMetadataValue**:

*Defined in [packages/utils/src/entities/interfaces.ts:18](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/interfaces.ts#L18)*

___

###  Filter

Ƭ **Filter**: *T extends U ? T : never*

*Defined in [packages/utils/src/interfaces.ts:81](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/interfaces.ts#L81)*

Remove types from T that are NOT assignable to U

___

###  FormatRegexResult

Ƭ **FormatRegexResult**: *[string, string | undefined]*

*Defined in [packages/utils/src/strings.ts:276](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L276)*

___

###  Omit

Ƭ **Omit**: *Pick‹T, Exclude‹keyof T, K››*

*Defined in [packages/utils/src/interfaces.ts:7](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/interfaces.ts#L7)*

Omit the properties available to type.
Useful for excluding properties from a type

**`example`** `Omit<{ a: number, b: number, c: number }, 'b'|'c'> // => { a: 1 }`

___

###  Optional

Ƭ **Optional**: *object*

*Defined in [packages/utils/src/interfaces.ts:41](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/interfaces.ts#L41)*

Like Partial but makes certain properties optional

**`example`** `Optional<{ a: number, b: number }, 'b'>`

#### Type declaration:

___

###  Override

Ƭ **Override**: *object*

*Defined in [packages/utils/src/interfaces.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/interfaces.ts#L23)*

Override specific properties on a type

**`example`** `Override<{ a: number, b: number }, { b: string }>`

#### Type declaration:

___

###  Overwrite

Ƭ **Overwrite**: *object & T2*

*Defined in [packages/utils/src/interfaces.ts:15](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/interfaces.ts#L15)*

Overwrite a simple type with different properties.
Useful changing and adding additional properties

**`example`** `Overwrite<{ a: number, b: number }, { b?: number }>`

___

###  PWhileOptions

Ƭ **PWhileOptions**: *object*

*Defined in [packages/utils/src/promises.ts:174](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/promises.ts#L174)*

#### Type declaration:

___

###  PartialDeep

Ƭ **PartialDeep**: *object*

*Defined in [packages/utils/src/interfaces.ts:69](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/interfaces.ts#L69)*

A deep partial object

#### Type declaration:

___

###  Required

Ƭ **Required**: *object*

*Defined in [packages/utils/src/interfaces.ts:32](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/interfaces.ts#L32)*

Like Partial but makes certain properties required

**`example`** `Required<{ a: number, b: number }, 'b'>`

#### Type declaration:

___

###  TYPE_ENTITY_METADATA_KEY

Ƭ **TYPE_ENTITY_METADATA_KEY**: *"___EntityMetadata"*

*Defined in [packages/utils/src/entities/interfaces.ts:4](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/interfaces.ts#L4)*

___

###  TYPE_IS_DATAENTITY_KEY

Ƭ **TYPE_IS_DATAENTITY_KEY**: *"__isDataEntity"*

*Defined in [packages/utils/src/entities/interfaces.ts:3](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/interfaces.ts#L3)*

___

###  ValueOf

Ƭ **ValueOf**: *T[keyof T]*

*Defined in [packages/utils/src/interfaces.ts:86](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/interfaces.ts#L86)*

Get the types object (the opposite of keyof)

___

###  WithoutNil

Ƭ **WithoutNil**: *object*

*Defined in [packages/utils/src/interfaces.ts:48](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/interfaces.ts#L48)*

Without null or undefined properties

#### Type declaration:

___

###  _DataEntityMetadata

Ƭ **_DataEntityMetadata**: *M & [DataEntityMetadata](interfaces/dataentitymetadata.md) & [AnyObject](interfaces/anyobject.md)*

*Defined in [packages/utils/src/entities/interfaces.ts:10](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/interfaces.ts#L10)*

___

###  _DataEntityMetadataType

Ƭ **_DataEntityMetadataType**: *[DataEntityMetadata](interfaces/dataentitymetadata.md) | [AnyObject](interfaces/anyobject.md)*

*Defined in [packages/utils/src/entities/interfaces.ts:9](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/interfaces.ts#L9)*

## Variables

### `Const` __ENTITY_METADATA_KEY

• **__ENTITY_METADATA_KEY**: *[TYPE_ENTITY_METADATA_KEY](overview.md#type_entity_metadata_key)* = "___EntityMetadata"

*Defined in [packages/utils/src/entities/interfaces.ts:7](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/interfaces.ts#L7)*

___

### `Const` __IS_DATAENTITY_KEY

• **__IS_DATAENTITY_KEY**: *[TYPE_IS_DATAENTITY_KEY](overview.md#type_is_dataentity_key)* = "__isDataEntity"

*Defined in [packages/utils/src/entities/interfaces.ts:6](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/interfaces.ts#L6)*

___

### `Const` dataEncodings

• **dataEncodings**: *keyof DataEncoding[]* =  Object.values(DataEncoding)

*Defined in [packages/utils/src/entities/interfaces.ts:74](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/interfaces.ts#L74)*

A list of supported encoding formats

___

### `Const` geoJSONTypes

• **geoJSONTypes**: *string[]* =  Object.keys(GeoShapeType).map((key) => key.toLowerCase())

*Defined in [packages/utils/src/geo.ts:20](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/geo.ts#L20)*

___

### `Const` isDev

• **isDev**: *boolean* =  NODE_ENV === 'development'

*Defined in [packages/utils/src/misc.ts:5](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/misc.ts#L5)*

___

### `Const` isProd

• **isProd**: *boolean* =  NODE_ENV === 'production'

*Defined in [packages/utils/src/misc.ts:3](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/misc.ts#L3)*

___

### `Const` isTest

• **isTest**: *boolean* =  NODE_ENV === 'test'

*Defined in [packages/utils/src/misc.ts:4](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/misc.ts#L4)*

## Functions

###  castArray

▸ **castArray**<**T**>(`input`: T | T[]): *T[]*

*Defined in [packages/utils/src/arrays.ts:18](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/arrays.ts#L18)*

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

*Defined in [packages/utils/src/arrays.ts:77](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/arrays.ts#L77)*

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

*Defined in [packages/utils/src/arrays.ts:28](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/arrays.ts#L28)*

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

*Defined in [packages/utils/src/misc.ts:21](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/misc.ts#L21)*

A decorator making changing the changing configurable property

**Parameters:**

Name | Type |
------ | ------ |
`value` | boolean |

**Returns:** *_configurable*

___

###  createCoreMetadata

▸ **createCoreMetadata**<**M**>(): *i._DataEntityMetadata‹M›*

*Defined in [packages/utils/src/entities/utils.ts:32](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/utils.ts#L32)*

**Type parameters:**

▪ **M**: *i._DataEntityMetadataType*

**Returns:** *i._DataEntityMetadata‹M›*

___

###  createMetadata

▸ **createMetadata**<**M**>(`metadata`: M): *i._DataEntityMetadata‹M›*

*Defined in [packages/utils/src/entities/utils.ts:21](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/utils.ts#L21)*

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

*Defined in [packages/utils/src/logger.ts:26](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/logger.ts#L26)*

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

*Defined in [packages/utils/src/entities/utils.ts:5](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/utils.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`entity` | any |

**Returns:** *void*

___

###  ensureBuffer

▸ **ensureBuffer**(`input`: string | Buffer, `encoding`: BufferEncoding): *Buffer*

*Defined in [packages/utils/src/utils.ts:77](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L77)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | string &#124; Buffer | - |
`encoding` | BufferEncoding | "utf8" |

**Returns:** *Buffer*

___

###  enumerable

▸ **enumerable**(`enabled`: boolean): *_enumerable*

*Defined in [packages/utils/src/misc.ts:32](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/misc.ts#L32)*

A decorator for making a method enumerable or none-enumerable

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`enabled` | boolean | true |

**Returns:** *_enumerable*

___

###  escapeString

▸ **escapeString**(`input`: string | number): *string*

*Defined in [packages/utils/src/strings.ts:32](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L32)*

Escape characters in string and avoid double escaping

**Parameters:**

Name | Type |
------ | ------ |
`input` | string &#124; number |

**Returns:** *string*

___

###  fastAssign

▸ **fastAssign**<**T**, **U**>(`target`: T, `source`: U): *T*

*Defined in [packages/utils/src/objects.ts:32](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/objects.ts#L32)*

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

*Defined in [packages/utils/src/objects.ts:27](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/objects.ts#L27)*

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

*Defined in [packages/utils/src/arrays.ts:64](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/arrays.ts#L64)*

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

*Defined in [packages/utils/src/strings.ts:266](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L266)*

Change first character in string to lower case

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  firstToUpper

▸ **firstToUpper**(`str`: string): *string*

*Defined in [packages/utils/src/strings.ts:260](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L260)*

Change first character in string to upper case

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  flatten

▸ **flatten**<**T**>(`val`: [Many](interfaces/many.md)‹T[]›): *T[]*

*Defined in [packages/utils/src/arrays.ts:4](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/arrays.ts#L4)*

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

*Defined in [packages/utils/src/arrays.ts:8](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/arrays.ts#L8)*

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

*Defined in [packages/utils/src/strings.ts:278](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L278)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *[FormatRegexResult](overview.md#formatregexresult)*

___

###  getBackoffDelay

▸ **getBackoffDelay**(`current`: number, `factor`: number, `max`: number, `min`: number): *number*

*Defined in [packages/utils/src/promises.ts:248](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/promises.ts#L248)*

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

*Defined in [packages/utils/src/errors.ts:415](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L415)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`err` | any | - |
`config` | [TSErrorConfig](interfaces/tserrorconfig.md) |  {} |
`defaultCode` | number |  DEFAULT_STATUS_CODE |

**Returns:** *number*

___

###  getField

▸ **getField**<**V**>(`input`: undefined, `field`: string, `defaultVal?`: V): *V*

*Defined in [packages/utils/src/utils.ts:146](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L146)*

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
`defaultVal?` | V |

**Returns:** *V*

▸ **getField**<**T**, **P**>(`input`: T, `field`: P): *T[P]*

*Defined in [packages/utils/src/utils.ts:151](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L151)*

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

*Defined in [packages/utils/src/utils.ts:155](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L155)*

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

*Defined in [packages/utils/src/utils.ts:159](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L159)*

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

*Defined in [packages/utils/src/utils.ts:164](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L164)*

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

*Defined in [packages/utils/src/utils.ts:169](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L169)*

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

*Defined in [packages/utils/src/arrays.ts:109](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/arrays.ts#L109)*

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

*Defined in [packages/utils/src/strings.ts:271](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L271)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  getFirstKey

▸ **getFirstKey**<**T**>(`input`: T): *keyof T | undefined*

*Defined in [packages/utils/src/objects.ts:10](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/objects.ts#L10)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T |

**Returns:** *keyof T | undefined*

___

###  getFirstValue

▸ **getFirstValue**<**T**>(`input`: object): *T | undefined*

*Defined in [packages/utils/src/objects.ts:7](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/objects.ts#L7)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | object |

**Returns:** *T | undefined*

___

###  getFullErrorStack

▸ **getFullErrorStack**(`err`: any): *string*

*Defined in [packages/utils/src/errors.ts:151](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L151)*

Use following the chain of caused by stack of an error.
Don't use this when logging the error, only when sending it

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *string*

___

###  getLonAndLat

▸ **getLonAndLat**(`input`: any, `throwInvalid`: boolean): *[number, number] | null*

*Defined in [packages/utils/src/geo.ts:64](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/geo.ts#L64)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`throwInvalid` | boolean | true |

**Returns:** *[number, number] | null*

___

###  getTypeOf

▸ **getTypeOf**(`val`: any): *string*

*Defined in [packages/utils/src/utils.ts:50](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L50)*

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

*Defined in [packages/utils/src/dates.ts:30](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/dates.ts#L30)*

Ensure unix time

**Parameters:**

Name | Type |
------ | ------ |
`val?` | string &#124; number &#124; Date |

**Returns:** *number | false*

___

###  getValidDate

▸ **getValidDate**(`val`: any): *Date | false*

*Defined in [packages/utils/src/dates.ts:14](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/dates.ts#L14)*

Check if the data is valid and return if it is

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *Date | false*

___

###  getWordParts

▸ **getWordParts**(`input`: string): *string[]*

*Defined in [packages/utils/src/strings.ts:157](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L157)*

Split a string and get the word parts

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string[]*

___

###  has

▸ **has**(`data`: object | undefined, `key`: string | number | symbol): *boolean*

*Defined in [packages/utils/src/objects.ts:15](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/objects.ts#L15)*

Check in input has a key

**Parameters:**

Name | Type |
------ | ------ |
`data` | object &#124; undefined |
`key` | string &#124; number &#124; symbol |

**Returns:** *boolean*

___

###  inNumberRange

▸ **inNumberRange**(`input`: number, `args`: object): *boolean*

*Defined in [packages/utils/src/numbers.ts:59](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/numbers.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | number |
`args` | object |

**Returns:** *boolean*

___

###  includes

▸ **includes**(`input`: any, `key`: string): *boolean*

*Defined in [packages/utils/src/arrays.ts:95](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/arrays.ts#L95)*

Safely check if an array, object, map, set has a key

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`key` | string |

**Returns:** *boolean*

___

###  isBoolean

▸ **isBoolean**(`input`: any): *input is boolean*

*Defined in [packages/utils/src/utils.ts:104](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L104)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is boolean*

___

###  isBooleanLike

▸ **isBooleanLike**(`input`: any): *boolean*

*Defined in [packages/utils/src/utils.ts:109](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L109)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isBuffer

▸ **isBuffer**(`input`: any): *input is Buffer*

*Defined in [packages/utils/src/utils.ts:73](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is Buffer*

___

###  isDataEntity

▸ **isDataEntity**(`input`: any): *boolean*

*Defined in [packages/utils/src/entities/utils.ts:48](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/utils.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isElasticsearchError

▸ **isElasticsearchError**(`err`: any): *err is ElasticsearchError*

*Defined in [packages/utils/src/errors.ts:379](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L379)*

Check is a elasticsearch error

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *err is ElasticsearchError*

___

###  isEmail

▸ **isEmail**(`input`: any): *boolean*

*Defined in [packages/utils/src/strings.ts:346](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L346)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isEmpty

▸ **isEmpty**<**T**>(`val?`: T): *val is undefined*

*Defined in [packages/utils/src/utils.ts:14](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L14)*

Check if an input is empty, similar to lodash.isEmpty

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`val?` | T |

**Returns:** *val is undefined*

___

###  isError

▸ **isError**(`err`: any): *err is Error*

*Defined in [packages/utils/src/errors.ts:365](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L365)*

Check if an input has an error compatible api

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *err is Error*

___

###  isFatalError

▸ **isFatalError**(`err`: any): *boolean*

*Defined in [packages/utils/src/errors.ts:356](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L356)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isFunction

▸ **isFunction**(`input`: any): *input is Function*

*Defined in [packages/utils/src/utils.ts:69](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L69)*

Verify an input is a function

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is Function*

___

###  isGeoJSON

▸ **isGeoJSON**(`input`: any): *boolean*

*Defined in [packages/utils/src/geo.ts:22](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/geo.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isGeoShapeMultiPolygon

▸ **isGeoShapeMultiPolygon**(`input`: JoinGeoShape): *input is GeoShapeMultiPolygon*

*Defined in [packages/utils/src/geo.ts:38](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/geo.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | JoinGeoShape |

**Returns:** *input is GeoShapeMultiPolygon*

___

###  isGeoShapePoint

▸ **isGeoShapePoint**(`input`: JoinGeoShape): *input is GeoShapePoint*

*Defined in [packages/utils/src/geo.ts:28](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/geo.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | JoinGeoShape |

**Returns:** *input is GeoShapePoint*

___

###  isGeoShapePolygon

▸ **isGeoShapePolygon**(`input`: JoinGeoShape): *input is GeoShapePolygon*

*Defined in [packages/utils/src/geo.ts:33](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/geo.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | JoinGeoShape |

**Returns:** *input is GeoShapePolygon*

___

###  isInteger

▸ **isInteger**(`val`: any): *val is number*

*Defined in [packages/utils/src/numbers.ts:2](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/numbers.ts#L2)*

A simplified implemation of lodash isInteger

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *val is number*

___

###  isMacAddress

▸ **isMacAddress**(`input`: any, `args?`: MACAddress): *boolean*

*Defined in [packages/utils/src/strings.ts:355](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L355)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | MACAddress |

**Returns:** *boolean*

___

### `Const` isNil

▸ **isNil**(`input`: any): *boolean*

*Defined in [packages/utils/src/utils.ts:10](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

### `Const` isNotNil

▸ **isNotNil**(`input`: any): *boolean*

*Defined in [packages/utils/src/utils.ts:11](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isNumber

▸ **isNumber**(`input`: any): *input is number*

*Defined in [packages/utils/src/numbers.ts:13](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/numbers.ts#L13)*

Check if an input is a number

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is number*

___

###  isRetryableError

▸ **isRetryableError**(`err`: any): *boolean*

*Defined in [packages/utils/src/errors.ts:360](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L360)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isSimpleObject

▸ **isSimpleObject**(`input`: any): *input is object*

*Defined in [packages/utils/src/objects.ts:47](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/objects.ts#L47)*

Similar to is-plain-object but works better when clone deeping a DataEntity

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is object*

___

###  isString

▸ **isString**(`val`: any): *val is string*

*Defined in [packages/utils/src/strings.ts:5](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L5)*

A simplified implemation of lodash isString

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *val is string*

___

###  isTSError

▸ **isTSError**(`err`: any): *err is TSError*

*Defined in [packages/utils/src/errors.ts:370](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L370)*

Check is a TSError

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *err is TSError*

___

###  isValidDate

▸ **isValidDate**(`val`: any): *boolean*

*Defined in [packages/utils/src/dates.ts:9](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/dates.ts#L9)*

A simplified implemation of moment(new Date(val)).isValid()

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  isValidDateInstance

▸ **isValidDateInstance**(`val`: Date): *boolean*

*Defined in [packages/utils/src/dates.ts:25](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/dates.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`val` | Date |

**Returns:** *boolean*

___

###  isValidKey

▸ **isValidKey**(`key`: any): *key is string | number*

*Defined in [packages/utils/src/entities/utils.ts:41](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/utils.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | any |

**Returns:** *key is string | number*

___

###  isWildCardString

▸ **isWildCardString**(`term`: string): *boolean*

*Defined in [packages/utils/src/strings.ts:322](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L322)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *boolean*

___

###  jsonToBuffer

▸ **jsonToBuffer**(`input`: any): *Buffer*

*Defined in [packages/utils/src/entities/utils.ts:37](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/utils.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *Buffer*

___

###  locked

▸ **locked**(): *_locked*

*Defined in [packages/utils/src/misc.ts:8](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/misc.ts#L8)*

A decorator for locking down a method

**Returns:** *_locked*

___

###  logError

▸ **logError**(`logger`: Logger, `err`: any, ...`messages`: any[]): *void*

*Defined in [packages/utils/src/errors.ts:217](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L217)*

Safely log an error (with the error first Logger syntax)

**Parameters:**

Name | Type |
------ | ------ |
`logger` | Logger |
`err` | any |
`...messages` | any[] |

**Returns:** *void*

___

###  makeISODate

▸ **makeISODate**(): *string*

*Defined in [packages/utils/src/dates.ts:4](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/dates.ts#L4)*

A helper function for making an ISODate string

**Returns:** *string*

___

###  makeMetadata

▸ **makeMetadata**<**M**>(`metadata?`: M | undefined): *i._DataEntityMetadata‹M›*

*Defined in [packages/utils/src/entities/utils.ts:25](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/utils.ts#L25)*

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

*Defined in [packages/utils/src/strings.ts:286](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L286)*

**Parameters:**

Name | Type |
------ | ------ |
`regexp` | string |
`value` | string |

**Returns:** *null | string*

___

###  matchAll

▸ **matchAll**(`regexp`: string, `value`: string): *string[] | null*

*Defined in [packages/utils/src/strings.ts:297](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L297)*

**Parameters:**

Name | Type |
------ | ------ |
`regexp` | string |
`value` | string |

**Returns:** *string[] | null*

___

###  matchWildcard

▸ **matchWildcard**(`wildCard`: string, `value`: string): *boolean*

*Defined in [packages/utils/src/strings.ts:338](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L338)*

**Parameters:**

Name | Type |
------ | ------ |
`wildCard` | string |
`value` | string |

**Returns:** *boolean*

___

###  memoize

▸ **memoize**<**T**>(`fn`: T): *T*

*Defined in [packages/utils/src/utils.ts:202](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L202)*

A replacement for lodash memoize

**Type parameters:**

▪ **T**: *MemoizeFn*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | T |

**Returns:** *T*

___

###  noop

▸ **noop**(...`_args`: any[]): *any*

*Defined in [packages/utils/src/utils.ts:137](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L137)*

**Parameters:**

Name | Type |
------ | ------ |
`..._args` | any[] |

**Returns:** *any*

___

###  pDefer

▸ **pDefer**(): *object*

*Defined in [packages/utils/src/promises.ts:348](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/promises.ts#L348)*

An alternative to Bluebird.defer: http://bluebirdjs.com/docs/api/deferred-migration.html
Considered bad practice in most cases, use the Promise constructor

**Returns:** *object*

___

###  pDelay

▸ **pDelay**<**T**>(`delay`: number, `arg?`: T): *Promise‹T›*

*Defined in [packages/utils/src/promises.ts:14](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/promises.ts#L14)*

promisified setTimeout

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`delay` | number | 1 |
`arg?` | T | - |

**Returns:** *Promise‹T›*

___

###  pImmediate

▸ **pImmediate**<**T**>(`arg?`: T): *Promise‹T›*

*Defined in [packages/utils/src/promises.ts:21](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/promises.ts#L21)*

promisified setImmediate

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arg?` | T |

**Returns:** *Promise‹T›*

___

###  pRace

▸ **pRace**(`promises`: Promise‹any›[], `logError?`: undefined | function): *Promise‹any›*

*Defined in [packages/utils/src/promises.ts:292](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/promises.ts#L292)*

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

*Defined in [packages/utils/src/promises.ts:317](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/promises.ts#L317)*

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

*Defined in [packages/utils/src/promises.ts:83](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/promises.ts#L83)*

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

*Defined in [packages/utils/src/promises.ts:188](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/promises.ts#L188)*

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

*Defined in [packages/utils/src/errors.ts:255](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L255)*

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

*Defined in [packages/utils/src/errors.ts:163](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L163)*

parse error for info

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`config` | [TSErrorConfig](interfaces/tserrorconfig.md) |  {} |

**Returns:** *ErrorInfo*

___

###  parseGeoDistance

▸ **parseGeoDistance**(`str`: string): *GeoDistanceObj*

*Defined in [packages/utils/src/geo.ts:43](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/geo.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *GeoDistanceObj*

___

###  parseGeoDistanceUnit

▸ **parseGeoDistanceUnit**(`input`: string): *GeoDistanceUnit*

*Defined in [packages/utils/src/geo.ts:56](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/geo.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *GeoDistanceUnit*

___

###  parseGeoPoint

▸ **parseGeoPoint**(`point`: GeoPointInput): *GeoPoint*

*Defined in [packages/utils/src/geo.ts:86](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/geo.ts#L86)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | GeoPointInput |

**Returns:** *GeoPoint*

▸ **parseGeoPoint**(`point`: GeoPointInput, `throwInvalid`: true): *GeoPoint*

*Defined in [packages/utils/src/geo.ts:87](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/geo.ts#L87)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | GeoPointInput |
`throwInvalid` | true |

**Returns:** *GeoPoint*

▸ **parseGeoPoint**(`point`: GeoPointInput, `throwInvalid`: false): *GeoPoint | null*

*Defined in [packages/utils/src/geo.ts:88](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/geo.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | GeoPointInput |
`throwInvalid` | false |

**Returns:** *GeoPoint | null*

___

###  parseJSON

▸ **parseJSON**<**T**>(`buf`: Buffer | string): *T*

*Defined in [packages/utils/src/utils.ts:33](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L33)*

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

*Defined in [packages/utils/src/utils.ts:120](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L120)*

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

*Defined in [packages/utils/src/numbers.ts:35](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/numbers.ts#L35)*

Like parseList, except it returns numbers

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number[]*

___

###  prefixErrorMsg

▸ **prefixErrorMsg**(`input`: any, `prefix?`: undefined | string, `defaultMsg`: string): *string*

*Defined in [packages/utils/src/errors.ts:346](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L346)*

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

*Defined in [packages/utils/src/numbers.ts:8](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/numbers.ts#L8)*

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

*Defined in [packages/utils/src/strings.ts:61](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L61)*

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

*Defined in [packages/utils/src/errors.ts:436](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L436)*

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

*Defined in [packages/utils/src/arrays.ts:56](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/arrays.ts#L56)*

A native implemation of lodash times

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *number[]*

▸ **times**<**T**>(`n`: number, `fn`: function): *T[]*

*Defined in [packages/utils/src/arrays.ts:57](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/arrays.ts#L57)*

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

*Defined in [packages/utils/src/utils.ts:96](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L96)*

Convert any input into a boolean, this will work with stringified boolean

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  toCamelCase

▸ **toCamelCase**(`input`: string): *string*

*Defined in [packages/utils/src/strings.ts:201](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L201)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toHumanTime

▸ **toHumanTime**(`ms`: number): *string*

*Defined in [packages/utils/src/dates.ts:54](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/dates.ts#L54)*

converts smaller than a week milliseconds to human readable time

**Parameters:**

Name | Type |
------ | ------ |
`ms` | number |

**Returns:** *string*

___

###  toInteger

▸ **toInteger**(`input`: any): *number | false*

*Defined in [packages/utils/src/numbers.ts:25](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/numbers.ts#L25)*

Convert any input to a integer, return false if unable to convert input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number | false*

___

###  toKebabCase

▸ **toKebabCase**(`input`: string): *string*

*Defined in [packages/utils/src/strings.ts:215](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L215)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toNumber

▸ **toNumber**(`input`: any): *number*

*Defined in [packages/utils/src/numbers.ts:18](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/numbers.ts#L18)*

Convert any input to a number, return Number.NaN if unable to convert input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number*

___

###  toPascalCase

▸ **toPascalCase**(`input`: string): *string*

*Defined in [packages/utils/src/strings.ts:208](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L208)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toSafeString

▸ **toSafeString**(`input`: string): *string*

*Defined in [packages/utils/src/strings.ts:234](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L234)*

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

###  toSnakeCase

▸ **toSnakeCase**(`input`: string): *string*

*Defined in [packages/utils/src/strings.ts:219](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L219)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toStatusErrorCode

▸ **toStatusErrorCode**(`input`: string | undefined): *string*

*Defined in [packages/utils/src/errors.ts:314](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L314)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string &#124; undefined |

**Returns:** *string*

___

###  toString

▸ **toString**(`val`: any): *string*

*Defined in [packages/utils/src/strings.ts:10](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L10)*

Safely convert any input to a string

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *string*

___

###  toTitleCase

▸ **toTitleCase**(`input`: string): *string*

*Defined in [packages/utils/src/strings.ts:223](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L223)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  trackTimeout

▸ **trackTimeout**(`timeoutMs`: number): *(Anonymous function)*

*Defined in [packages/utils/src/dates.ts:41](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/dates.ts#L41)*

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

*Defined in [packages/utils/src/strings.ts:56](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L56)*

safely trim an input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *string*

___

###  trimAndToLower

▸ **trimAndToLower**(`input?`: undefined | string): *string*

*Defined in [packages/utils/src/strings.ts:22](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L22)*

safely trim and to lower a input, useful for string comparison

**Parameters:**

Name | Type |
------ | ------ |
`input?` | undefined &#124; string |

**Returns:** *string*

___

###  trimAndToUpper

▸ **trimAndToUpper**(`input?`: undefined | string): *string*

*Defined in [packages/utils/src/strings.ts:27](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L27)*

safely trim and to lower a input, useful for string comparison

**Parameters:**

Name | Type |
------ | ------ |
`input?` | undefined &#124; string |

**Returns:** *string*

___

###  truncate

▸ **truncate**(`str`: string, `len`: number): *string*

*Defined in [packages/utils/src/strings.ts:66](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |
`len` | number |

**Returns:** *string*

___

###  tryParseJSON

▸ **tryParseJSON**(`input`: any): *any*

*Defined in [packages/utils/src/utils.ts:24](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/utils.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *any*

___

###  unescapeString

▸ **unescapeString**(`str`: string): *string*

*Defined in [packages/utils/src/strings.ts:37](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L37)*

Unescape characters in string and avoid double escaping

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`str` | string | "" |

**Returns:** *string*

___

###  uniq

▸ **uniq**<**T**>(`arr`: T[] | Set‹T›): *T[]*

*Defined in [packages/utils/src/arrays.ts:50](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/arrays.ts#L50)*

A native implemation of lodash uniq

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arr` | T[] &#124; Set‹T› |

**Returns:** *T[]*

___

###  waterfall

▸ **waterfall**(`input`: any, `fns`: PromiseFn[], `addBreak`: boolean): *Promise‹any›*

*Defined in [packages/utils/src/promises.ts:281](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/promises.ts#L281)*

Async waterfall function

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`fns` | PromiseFn[] | - |
`addBreak` | boolean | false |

**Returns:** *Promise‹any›*

___

###  wildCardToRegex

▸ **wildCardToRegex**(`term`: string): *RegExp*

*Defined in [packages/utils/src/strings.ts:329](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/strings.ts#L329)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *RegExp*

___

###  withoutNil

▸ **withoutNil**<**T**>(`input`: T): *[WithoutNil](overview.md#withoutnil)‹T›*

*Defined in [packages/utils/src/arrays.ts:36](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/arrays.ts#L36)*

Build a new object without null or undefined values (shallow)

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type |
------ | ------ |
`input` | T |

**Returns:** *[WithoutNil](overview.md#withoutnil)‹T›*
