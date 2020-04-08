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
* [Node](classes/node.md)
* [Queue](classes/queue.md)
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
* [FilteredResult](overview.md#filteredresult)
* [Nil](overview.md#nil)
* [Omit](overview.md#omit)
* [Optional](overview.md#optional)
* [Override](overview.md#override)
* [Overwrite](overview.md#overwrite)
* [PWhileOptions](overview.md#pwhileoptions)
* [PartialDeep](overview.md#partialdeep)
* [Required](overview.md#required)
* [TYPE_ENTITY_METADATA_KEY](overview.md#type_entity_metadata_key)
* [TYPE_IS_DATAENTITY_KEY](overview.md#type_is_dataentity_key)
* [Unpacked](overview.md#unpacked)
* [ValueOf](overview.md#valueof)
* [WithoutNil](overview.md#withoutnil)
* [_DataEntityMetadata](overview.md#_dataentitymetadata)
* [_DataEntityMetadataType](overview.md#_dataentitymetadatatype)

### Variables

* [__ENTITY_METADATA_KEY](overview.md#const-__entity_metadata_key)
* [__IS_DATAENTITY_KEY](overview.md#const-__is_dataentity_key)
* [dataEncodings](overview.md#const-dataencodings)
* [geoJSONTypes](overview.md#const-geojsontypes)
* [isCI](overview.md#const-isci)
* [isDev](overview.md#const-isdev)
* [isProd](overview.md#const-isprod)
* [isTest](overview.md#const-istest)

### Functions

* [castArray](overview.md#castarray)
* [chunk](overview.md#chunk)
* [clone](overview.md#clone)
* [cloneDeep](overview.md#clonedeep)
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
* [filterObject](overview.md#filterobject)
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
* [getTime](overview.md#gettime)
* [getTypeOf](overview.md#gettypeof)
* [getUnixTime](overview.md#getunixtime)
* [getValidDate](overview.md#getvaliddate)
* [getWordParts](overview.md#getwordparts)
* [inNumberRange](overview.md#innumberrange)
* [includes](overview.md#includes)
* [isArray](overview.md#isarray)
* [isBoolean](overview.md#isboolean)
* [isBooleanLike](overview.md#isbooleanlike)
* [isBuffer](overview.md#isbuffer)
* [isDataEntity](overview.md#isdataentity)
* [isElasticsearchError](overview.md#iselasticsearcherror)
* [isEmail](overview.md#isemail)
* [isEmpty](overview.md#isempty)
* [isError](overview.md#iserror)
* [isFalsy](overview.md#isfalsy)
* [isFatalError](overview.md#isfatalerror)
* [isFunction](overview.md#isfunction)
* [isGeoJSON](overview.md#isgeojson)
* [isGeoShapeMultiPolygon](overview.md#isgeoshapemultipolygon)
* [isGeoShapePoint](overview.md#isgeoshapepoint)
* [isGeoShapePolygon](overview.md#isgeoshapepolygon)
* [isInteger](overview.md#isinteger)
* [isMacAddress](overview.md#ismacaddress)
* [isNil](overview.md#isnil)
* [isNotNil](overview.md#isnotnil)
* [isNumber](overview.md#isnumber)
* [isPlainObject](overview.md#isplainobject)
* [isRegExp](overview.md#isregexp)
* [isRegExpLike](overview.md#isregexplike)
* [isRetryableError](overview.md#isretryableerror)
* [isSimpleObject](overview.md#issimpleobject)
* [isString](overview.md#isstring)
* [isTSError](overview.md#istserror)
* [isTruthy](overview.md#istruthy)
* [isValidDate](overview.md#isvaliddate)
* [isValidDateInstance](overview.md#isvaliddateinstance)
* [isValidKey](overview.md#isvalidkey)
* [isWildCardString](overview.md#iswildcardstring)
* [jsonToBuffer](overview.md#jsontobuffer)
* [locked](overview.md#locked)
* [logError](overview.md#logerror)
* [makeISODate](overview.md#makeisodate)
* [makeMetadata](overview.md#makemetadata)
* [mapKeys](overview.md#mapkeys)
* [mapValues](overview.md#mapvalues)
* [match](overview.md#match)
* [matchAll](overview.md#matchall)
* [matchWildcard](overview.md#matchwildcard)
* [memoize](overview.md#memoize)
* [noop](overview.md#noop)
* [once](overview.md#once)
* [pDefer](overview.md#pdefer)
* [pDelay](overview.md#pdelay)
* [pImmediate](overview.md#pimmediate)
* [pMap](overview.md#pmap)
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
* [sort](overview.md#sort)
* [sortBy](overview.md#sortby)
* [sortKeys](overview.md#sortkeys)
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
* [trimEnd](overview.md#trimend)
* [trimStart](overview.md#trimstart)
* [truncate](overview.md#truncate)
* [tryParseJSON](overview.md#tryparsejson)
* [unescapeString](overview.md#unescapestring)
* [uniq](overview.md#uniq)
* [uniqBy](overview.md#uniqby)
* [waterfall](overview.md#waterfall)
* [wildCardToRegex](overview.md#wildcardtoregex)
* [withoutNil](overview.md#withoutnil)

## Type aliases

###  DataArrayInput

Ƭ **DataArrayInput**: *[DataInput](overview.md#datainput) | [DataInput](overview.md#datainput)[]*

*Defined in [packages/utils/src/entities/data-entity.ts:391](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/data-entity.ts#L391)*

___

###  DataEntityMetadataValue

Ƭ **DataEntityMetadataValue**: *"_createTime" | "_ingestTime" | "_processTime" | "_eventTime" | "_key" | keyof M | string | number*

*Defined in [packages/utils/src/entities/interfaces.ts:12](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L12)*

___

###  DataInput

Ƭ **DataInput**: *Record‹string, any› | [DataEntity](classes/dataentity.md)*

*Defined in [packages/utils/src/entities/data-entity.ts:390](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/data-entity.ts#L390)*

___

###  Diff

Ƭ **Diff**: *T extends U ? never : T*

*Defined in [packages/utils/src/interfaces.ts:77](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L77)*

Remove types from T that are assignable to U

___

###  EntityMetadataValue

Ƭ **EntityMetadataValue**:

*Defined in [packages/utils/src/entities/interfaces.ts:18](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L18)*

___

###  Filter

Ƭ **Filter**: *T extends U ? T : never*

*Defined in [packages/utils/src/interfaces.ts:82](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L82)*

Remove types from T that are NOT assignable to U

___

###  FilteredResult

Ƭ **FilteredResult**: *object*

*Defined in [packages/utils/src/interfaces.ts:92](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L92)*

Filters the keys of an object (T), by list of included keys (I) and excluded (E)

#### Type declaration:

___

###  Nil

Ƭ **Nil**: *null | undefined*

*Defined in [packages/utils/src/interfaces.ts:45](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L45)*

___

###  Omit

Ƭ **Omit**: *Pick‹T, Exclude‹keyof T, K››*

*Defined in [packages/utils/src/interfaces.ts:7](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L7)*

Omit the properties available to type.
Useful for excluding properties from a type

**`example`** `Omit<{ a: number, b: number, c: number }, 'b'|'c'> // => { a: 1 }`

___

###  Optional

Ƭ **Optional**: *object*

*Defined in [packages/utils/src/interfaces.ts:41](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L41)*

Like Partial but makes certain properties optional

**`example`** `Optional<{ a: number, b: number }, 'b'>`

#### Type declaration:

___

###  Override

Ƭ **Override**: *object*

*Defined in [packages/utils/src/interfaces.ts:23](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L23)*

Override specific properties on a type

**`example`** `Override<{ a: number, b: number }, { b: string }>`

#### Type declaration:

___

###  Overwrite

Ƭ **Overwrite**: *object & T2*

*Defined in [packages/utils/src/interfaces.ts:15](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L15)*

Overwrite a simple type with different properties.
Useful changing and adding additional properties

**`example`** `Overwrite<{ a: number, b: number }, { b?: number }>`

___

###  PWhileOptions

Ƭ **PWhileOptions**: *object*

*Defined in [packages/utils/src/promises.ts:175](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L175)*

#### Type declaration:

___

###  PartialDeep

Ƭ **PartialDeep**: *object*

*Defined in [packages/utils/src/interfaces.ts:70](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L70)*

A deep partial object

#### Type declaration:

___

###  Required

Ƭ **Required**: *object*

*Defined in [packages/utils/src/interfaces.ts:32](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L32)*

Like Partial but makes certain properties required

**`example`** `Required<{ a: number, b: number }, 'b'>`

#### Type declaration:

___

###  TYPE_ENTITY_METADATA_KEY

Ƭ **TYPE_ENTITY_METADATA_KEY**: *"___EntityMetadata"*

*Defined in [packages/utils/src/entities/interfaces.ts:4](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L4)*

___

###  TYPE_IS_DATAENTITY_KEY

Ƭ **TYPE_IS_DATAENTITY_KEY**: *"__isDataEntity"*

*Defined in [packages/utils/src/entities/interfaces.ts:3](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L3)*

___

###  Unpacked

Ƭ **Unpacked**:

*Defined in [packages/utils/src/interfaces.ts:101](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L101)*

From https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-inference-in-conditional-types

___

###  ValueOf

Ƭ **ValueOf**: *T[keyof T]*

*Defined in [packages/utils/src/interfaces.ts:87](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L87)*

Get the types object (the opposite of keyof)

___

###  WithoutNil

Ƭ **WithoutNil**: *object*

*Defined in [packages/utils/src/interfaces.ts:49](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/interfaces.ts#L49)*

Without null or undefined properties

#### Type declaration:

___

###  _DataEntityMetadata

Ƭ **_DataEntityMetadata**: *M & [DataEntityMetadata](interfaces/dataentitymetadata.md) & [AnyObject](interfaces/anyobject.md)*

*Defined in [packages/utils/src/entities/interfaces.ts:10](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L10)*

___

###  _DataEntityMetadataType

Ƭ **_DataEntityMetadataType**: *[DataEntityMetadata](interfaces/dataentitymetadata.md) | [AnyObject](interfaces/anyobject.md)*

*Defined in [packages/utils/src/entities/interfaces.ts:9](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L9)*

## Variables

### `Const` __ENTITY_METADATA_KEY

• **__ENTITY_METADATA_KEY**: *[TYPE_ENTITY_METADATA_KEY](overview.md#type_entity_metadata_key)* = "___EntityMetadata"

*Defined in [packages/utils/src/entities/interfaces.ts:7](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L7)*

___

### `Const` __IS_DATAENTITY_KEY

• **__IS_DATAENTITY_KEY**: *[TYPE_IS_DATAENTITY_KEY](overview.md#type_is_dataentity_key)* = "__isDataEntity"

*Defined in [packages/utils/src/entities/interfaces.ts:6](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L6)*

___

### `Const` dataEncodings

• **dataEncodings**: *keyof DataEncoding[]* =  Object.values(DataEncoding)

*Defined in [packages/utils/src/entities/interfaces.ts:74](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L74)*

A list of supported encoding formats

___

### `Const` geoJSONTypes

• **geoJSONTypes**: *string[]* =  Object.keys(GeoShapeType).map((key) => key.toLowerCase())

*Defined in [packages/utils/src/geo.ts:19](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/geo.ts#L19)*

___

### `Const` isCI

• **isCI**: *boolean* =  process.env.CI === 'true'

*Defined in [packages/utils/src/env.ts:6](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/env.ts#L6)*

___

### `Const` isDev

• **isDev**: *boolean* =  NODE_ENV === 'development'

*Defined in [packages/utils/src/env.ts:5](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/env.ts#L5)*

___

### `Const` isProd

• **isProd**: *boolean* =  NODE_ENV === 'production'

*Defined in [packages/utils/src/env.ts:3](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/env.ts#L3)*

___

### `Const` isTest

• **isTest**: *boolean* =  NODE_ENV === 'test'

*Defined in [packages/utils/src/env.ts:4](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/env.ts#L4)*

## Functions

###  castArray

▸ **castArray**<**T**>(`input`: T | T[]): *T[]*

*Defined in [packages/utils/src/arrays.ts:19](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L19)*

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

*Defined in [packages/utils/src/arrays.ts:126](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L126)*

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

###  clone

▸ **clone**(`input`: any): *boolean*

*Defined in [packages/utils/src/deps.ts:36](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/deps.ts#L36)*

Shallow clone an object

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  cloneDeep

▸ **cloneDeep**<**T**>(`input`: T): *T*

*Defined in [packages/utils/src/deps.ts:68](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/deps.ts#L68)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T |

**Returns:** *T*

___

###  concat

▸ **concat**<**T**>(`arr`: T | T[], `arr1?`: T | T[]): *T[]*

*Defined in [packages/utils/src/arrays.ts:29](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L29)*

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

*Defined in [packages/utils/src/decorators.ts:15](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/decorators.ts#L15)*

A decorator making changing the changing configurable property

**Parameters:**

Name | Type |
------ | ------ |
`value` | boolean |

**Returns:** *_configurable*

___

###  createCoreMetadata

▸ **createCoreMetadata**<**M**>(): *i._DataEntityMetadata‹M›*

*Defined in [packages/utils/src/entities/utils.ts:32](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/utils.ts#L32)*

**Type parameters:**

▪ **M**: *i._DataEntityMetadataType*

**Returns:** *i._DataEntityMetadata‹M›*

___

###  createMetadata

▸ **createMetadata**<**M**>(`metadata`: M): *i._DataEntityMetadata‹M›*

*Defined in [packages/utils/src/entities/utils.ts:21](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/utils.ts#L21)*

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

*Defined in [packages/utils/src/logger.ts:26](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/logger.ts#L26)*

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

*Defined in [packages/utils/src/entities/utils.ts:5](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/utils.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`entity` | any |

**Returns:** *void*

___

###  ensureBuffer

▸ **ensureBuffer**(`input`: string | Buffer, `encoding`: BufferEncoding): *Buffer*

*Defined in [packages/utils/src/buffers.ts:3](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/buffers.ts#L3)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | string &#124; Buffer | - |
`encoding` | BufferEncoding | "utf8" |

**Returns:** *Buffer*

___

###  enumerable

▸ **enumerable**(`enabled`: boolean): *_enumerable*

*Defined in [packages/utils/src/decorators.ts:26](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/decorators.ts#L26)*

A decorator for making a method enumerable or none-enumerable

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`enabled` | boolean | true |

**Returns:** *_enumerable*

___

###  escapeString

▸ **escapeString**(`input`: string | number): *string*

*Defined in [packages/utils/src/deps.ts:105](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/deps.ts#L105)*

Escape characters in string and avoid double escaping

**Parameters:**

Name | Type |
------ | ------ |
`input` | string &#124; number |

**Returns:** *string*

___

###  fastAssign

▸ **fastAssign**<**T**, **U**>(`target`: T, `source`: U): *T*

*Defined in [packages/utils/src/objects.ts:33](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L33)*

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

*Defined in [packages/utils/src/objects.ts:28](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L28)*

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

*Defined in [packages/utils/src/arrays.ts:113](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L113)*

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

###  filterObject

▸ **filterObject**<**T**, **I**, **E**>(`data`: T, `by?`: undefined | object): *[FilteredResult](overview.md#filteredresult)‹T, I, E›*

*Defined in [packages/utils/src/objects.ts:102](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L102)*

Filters the keys of an object, by list of included key and excluded

**Type parameters:**

▪ **T**

▪ **I**: *keyof T*

▪ **E**: *keyof T*

**Parameters:**

Name | Type |
------ | ------ |
`data` | T |
`by?` | undefined &#124; object |

**Returns:** *[FilteredResult](overview.md#filteredresult)‹T, I, E›*

___

###  firstToLower

▸ **firstToLower**(`str`: string): *string*

*Defined in [packages/utils/src/strings.ts:291](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L291)*

Change first character in string to lower case

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  firstToUpper

▸ **firstToUpper**(`str`: string): *string*

*Defined in [packages/utils/src/strings.ts:285](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L285)*

Change first character in string to upper case

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  flatten

▸ **flatten**<**T**>(`val`: [Many](interfaces/many.md)‹T[]›): *T[]*

*Defined in [packages/utils/src/arrays.ts:5](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L5)*

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

*Defined in [packages/utils/src/arrays.ts:9](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L9)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`val` | [ListOfRecursiveArraysOrValues](interfaces/listofrecursivearraysorvalues.md)‹T› |

**Returns:** *T[]*

___

###  formatRegex

▸ **formatRegex**(`input`: RegExp | string, `flags?`: RegexFlag[]): *RegExp*

*Defined in [packages/utils/src/regex.ts:32](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/regex.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | RegExp &#124; string |
`flags?` | RegexFlag[] |

**Returns:** *RegExp*

___

###  getBackoffDelay

▸ **getBackoffDelay**(`current`: number, `factor`: number, `max`: number, `min`: number): *number*

*Defined in [packages/utils/src/promises.ts:249](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L249)*

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

*Defined in [packages/utils/src/errors.ts:416](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L416)*

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

*Defined in [packages/utils/src/objects.ts:135](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L135)*

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

*Defined in [packages/utils/src/objects.ts:140](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L140)*

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

*Defined in [packages/utils/src/objects.ts:144](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L144)*

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

*Defined in [packages/utils/src/objects.ts:148](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L148)*

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

*Defined in [packages/utils/src/objects.ts:153](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L153)*

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

*Defined in [packages/utils/src/objects.ts:158](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L158)*

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

*Defined in [packages/utils/src/arrays.ts:158](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L158)*

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

*Defined in [packages/utils/src/strings.ts:296](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L296)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  getFirstKey

▸ **getFirstKey**<**T**>(`input`: T): *keyof T | undefined*

*Defined in [packages/utils/src/objects.ts:21](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L21)*

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

*Defined in [packages/utils/src/objects.ts:17](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L17)*

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

*Defined in [packages/utils/src/errors.ts:152](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L152)*

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

*Defined in [packages/utils/src/geo.ts:63](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/geo.ts#L63)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`throwInvalid` | boolean | true |

**Returns:** *[number, number] | null*

___

###  getTime

▸ **getTime**(`val?`: string | number | Date): *number | false*

*Defined in [packages/utils/src/dates.ts:30](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/dates.ts#L30)*

Ensure unix time

**Parameters:**

Name | Type |
------ | ------ |
`val?` | string &#124; number &#124; Date |

**Returns:** *number | false*

___

###  getTypeOf

▸ **getTypeOf**(`val`: any): *string*

*Defined in [packages/utils/src/deps.ts:77](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/deps.ts#L77)*

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

*Defined in [packages/utils/src/dates.ts:37](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/dates.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`val?` | string &#124; number &#124; Date |

**Returns:** *number | false*

___

###  getValidDate

▸ **getValidDate**(`val`: any): *Date | false*

*Defined in [packages/utils/src/dates.ts:14](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/dates.ts#L14)*

Check if the data is valid and return if it is

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *Date | false*

___

###  getWordParts

▸ **getWordParts**(`input`: string): *string[]*

*Defined in [packages/utils/src/strings.ts:182](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L182)*

Split a string and get the word parts

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string[]*

___

###  inNumberRange

▸ **inNumberRange**(`input`: number, `args`: object): *boolean*

*Defined in [packages/utils/src/numbers.ts:59](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/numbers.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | number |
`args` | object |

**Returns:** *boolean*

___

###  includes

▸ **includes**(`input`: any, `key`: string): *boolean*

*Defined in [packages/utils/src/arrays.ts:144](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L144)*

Safely check if an array, object, map, set has a key

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`key` | string |

**Returns:** *boolean*

___

###  isArray

▸ **isArray**<**T**>(`input`: any): *input is T[]*

*Defined in [packages/utils/src/arrays.ts:162](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L162)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is T[]*

___

###  isBoolean

▸ **isBoolean**(`input`: any): *input is boolean*

*Defined in [packages/utils/src/booleans.ts:33](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/booleans.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is boolean*

___

###  isBooleanLike

▸ **isBooleanLike**(`input`: any): *boolean*

*Defined in [packages/utils/src/booleans.ts:38](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/booleans.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isBuffer

▸ **isBuffer**(`input`: any): *input is Buffer*

*Defined in [packages/utils/src/buffers.ts:13](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/buffers.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is Buffer*

___

###  isDataEntity

▸ **isDataEntity**(`input`: any): *boolean*

*Defined in [packages/utils/src/entities/utils.ts:48](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/utils.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isElasticsearchError

▸ **isElasticsearchError**(`err`: any): *err is ElasticsearchError*

*Defined in [packages/utils/src/errors.ts:380](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L380)*

Check is a elasticsearch error

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *err is ElasticsearchError*

___

###  isEmail

▸ **isEmail**(`input`: any): *boolean*

*Defined in [packages/utils/src/strings.ts:301](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L301)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isEmpty

▸ **isEmpty**<**T**>(`val?`: T | null | undefined): *val is undefined*

*Defined in [packages/utils/src/empty.ts:12](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/empty.ts#L12)*

Check if an input is empty, similar to lodash.isEmpty

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`val?` | T &#124; null &#124; undefined |

**Returns:** *val is undefined*

___

###  isError

▸ **isError**(`err`: any): *err is Error*

*Defined in [packages/utils/src/errors.ts:366](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L366)*

Check if an input has an error compatible api

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *err is Error*

___

###  isFalsy

▸ **isFalsy**(`input`: any): *boolean*

*Defined in [packages/utils/src/booleans.ts:27](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/booleans.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isFatalError

▸ **isFatalError**(`err`: any): *boolean*

*Defined in [packages/utils/src/errors.ts:357](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L357)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isFunction

▸ **isFunction**(`input`: any): *input is Function*

*Defined in [packages/utils/src/functions.ts:57](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/functions.ts#L57)*

Verify an input is a function

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is Function*

___

###  isGeoJSON

▸ **isGeoJSON**(`input`: any): *boolean*

*Defined in [packages/utils/src/geo.ts:21](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/geo.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isGeoShapeMultiPolygon

▸ **isGeoShapeMultiPolygon**(`input`: JoinGeoShape): *input is GeoShapeMultiPolygon*

*Defined in [packages/utils/src/geo.ts:37](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/geo.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | JoinGeoShape |

**Returns:** *input is GeoShapeMultiPolygon*

___

###  isGeoShapePoint

▸ **isGeoShapePoint**(`input`: JoinGeoShape): *input is GeoShapePoint*

*Defined in [packages/utils/src/geo.ts:27](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/geo.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | JoinGeoShape |

**Returns:** *input is GeoShapePoint*

___

###  isGeoShapePolygon

▸ **isGeoShapePolygon**(`input`: JoinGeoShape): *input is GeoShapePolygon*

*Defined in [packages/utils/src/geo.ts:32](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/geo.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | JoinGeoShape |

**Returns:** *input is GeoShapePolygon*

___

###  isInteger

▸ **isInteger**(`val`: any): *val is number*

*Defined in [packages/utils/src/numbers.ts:2](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/numbers.ts#L2)*

A simplified implemation of lodash isInteger

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *val is number*

___

###  isMacAddress

▸ **isMacAddress**(`input`: any, `args?`: MACAddress): *boolean*

*Defined in [packages/utils/src/strings.ts:310](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L310)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | MACAddress |

**Returns:** *boolean*

___

###  isNil

▸ **isNil**<**T**>(`input`: T | [Nil](overview.md#nil)): *input is Nil*

*Defined in [packages/utils/src/empty.ts:3](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/empty.ts#L3)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T &#124; [Nil](overview.md#nil) |

**Returns:** *input is Nil*

___

###  isNotNil

▸ **isNotNil**<**T**>(`input`: T | [Nil](overview.md#nil)): *boolean*

*Defined in [packages/utils/src/empty.ts:7](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/empty.ts#L7)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T &#124; [Nil](overview.md#nil) |

**Returns:** *boolean*

___

###  isNumber

▸ **isNumber**(`input`: any): *input is number*

*Defined in [packages/utils/src/numbers.ts:13](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/numbers.ts#L13)*

Check if an input is a number

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is number*

___

###  isPlainObject

▸ **isPlainObject**(`input`: any): *boolean*

*Defined in [packages/utils/src/deps.ts:26](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/deps.ts#L26)*

Detect if value is a plain object, that is,
an object created by the Object constructor or one via Object.create(null)

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isRegExp

▸ **isRegExp**(`input`: any): *input is RegExp*

*Defined in [packages/utils/src/regex.ts:1](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/regex.ts#L1)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is RegExp*

___

###  isRegExpLike

▸ **isRegExpLike**(`input`: any, `strict`: boolean): *boolean*

*Defined in [packages/utils/src/regex.ts:9](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/regex.ts#L9)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`strict` | boolean | true |

**Returns:** *boolean*

___

###  isRetryableError

▸ **isRetryableError**(`err`: any): *boolean*

*Defined in [packages/utils/src/errors.ts:361](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L361)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isSimpleObject

▸ **isSimpleObject**(`input`: any): *input is object*

*Defined in [packages/utils/src/objects.ts:8](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L8)*

Similar to is-plain-object but works better when clone deeping a DataEntity

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is object*

___

###  isString

▸ **isString**(`val`: any): *val is string*

*Defined in [packages/utils/src/strings.ts:4](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L4)*

A simplified implemation of lodash isString

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *val is string*

___

###  isTSError

▸ **isTSError**(`err`: any): *err is TSError*

*Defined in [packages/utils/src/errors.ts:371](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L371)*

Check is a TSError

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *err is TSError*

___

###  isTruthy

▸ **isTruthy**(`input`: any): *boolean*

*Defined in [packages/utils/src/booleans.ts:21](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/booleans.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isValidDate

▸ **isValidDate**(`val`: any): *boolean*

*Defined in [packages/utils/src/dates.ts:9](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/dates.ts#L9)*

A simplified implemation of moment(new Date(val)).isValid()

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  isValidDateInstance

▸ **isValidDateInstance**(`val`: Date): *boolean*

*Defined in [packages/utils/src/dates.ts:25](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/dates.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`val` | Date |

**Returns:** *boolean*

___

###  isValidKey

▸ **isValidKey**(`key`: any): *key is string | number*

*Defined in [packages/utils/src/entities/utils.ts:41](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/utils.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | any |

**Returns:** *key is string | number*

___

###  isWildCardString

▸ **isWildCardString**(`term`: string): *boolean*

*Defined in [packages/utils/src/regex.ts:78](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/regex.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *boolean*

___

###  jsonToBuffer

▸ **jsonToBuffer**(`input`: any): *Buffer*

*Defined in [packages/utils/src/entities/utils.ts:37](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/utils.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *Buffer*

___

###  locked

▸ **locked**(): *_locked*

*Defined in [packages/utils/src/decorators.ts:2](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/decorators.ts#L2)*

A decorator for locking down a method

**Returns:** *_locked*

___

###  logError

▸ **logError**(`logger`: Logger, `err`: any, ...`messages`: any[]): *void*

*Defined in [packages/utils/src/errors.ts:218](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L218)*

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

*Defined in [packages/utils/src/dates.ts:4](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/dates.ts#L4)*

A helper function for making an ISODate string

**Returns:** *string*

___

###  makeMetadata

▸ **makeMetadata**<**M**>(`metadata?`: M | undefined): *i._DataEntityMetadata‹M›*

*Defined in [packages/utils/src/entities/utils.ts:25](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/utils.ts#L25)*

**Type parameters:**

▪ **M**: *i._DataEntityMetadataType*

**Parameters:**

Name | Type |
------ | ------ |
`metadata?` | M &#124; undefined |

**Returns:** *i._DataEntityMetadata‹M›*

___

###  mapKeys

▸ **mapKeys**<**T**, **R**>(`input`: T, `fn`: function): *R*

*Defined in [packages/utils/src/objects.ts:76](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L76)*

Map the keys of an object

**Type parameters:**

▪ **T**

▪ **R**

**Parameters:**

▪ **input**: *T*

▪ **fn**: *function*

▸ (`value`: T[keyof T], `key`: keyof T): *any*

**Parameters:**

Name | Type |
------ | ------ |
`value` | T[keyof T] |
`key` | keyof T |

**Returns:** *R*

___

###  mapValues

▸ **mapValues**<**T**, **R**>(`input`: T, `fn`: function): *R*

*Defined in [packages/utils/src/objects.ts:65](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L65)*

Map the values of an object

**Type parameters:**

▪ **T**

▪ **R**

**Parameters:**

▪ **input**: *T*

▪ **fn**: *function*

▸ (`value`: T[keyof T], `key`: keyof T): *any*

**Parameters:**

Name | Type |
------ | ------ |
`value` | T[keyof T] |
`key` | keyof T |

**Returns:** *R*

___

###  match

▸ **match**(`regexp`: string | RegExp, `value`: string): *null | string*

*Defined in [packages/utils/src/regex.ts:47](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/regex.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`regexp` | string &#124; RegExp |
`value` | string |

**Returns:** *null | string*

___

###  matchAll

▸ **matchAll**(`regexp`: RegExp | string, `value`: string): *string[] | null*

*Defined in [packages/utils/src/regex.ts:57](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/regex.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`regexp` | RegExp &#124; string |
`value` | string |

**Returns:** *string[] | null*

___

###  matchWildcard

▸ **matchWildcard**(`wildCard`: string, `value`: string): *boolean*

*Defined in [packages/utils/src/regex.ts:94](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/regex.ts#L94)*

**Parameters:**

Name | Type |
------ | ------ |
`wildCard` | string |
`value` | string |

**Returns:** *boolean*

___

###  memoize

▸ **memoize**<**T**>(`fn`: T): *T*

*Defined in [packages/utils/src/functions.ts:42](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/functions.ts#L42)*

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

*Defined in [packages/utils/src/functions.ts:24](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/functions.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`..._args` | any[] |

**Returns:** *any*

___

###  once

▸ **once**<**T**>(`fn`: T): *_fn*

*Defined in [packages/utils/src/functions.ts:10](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/functions.ts#L10)*

Creates a function that is only invoked once

**Type parameters:**

▪ **T**: *function*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | T |

**Returns:** *_fn*

___

###  pDefer

▸ **pDefer**(): *object*

*Defined in [packages/utils/src/promises.ts:349](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L349)*

An alternative to Bluebird.defer: http://bluebirdjs.com/docs/api/deferred-migration.html
Considered bad practice in most cases, use the Promise constructor

**Returns:** *object*

___

###  pDelay

▸ **pDelay**<**T**>(`delay`: number, `arg?`: T): *Promise‹T›*

*Defined in [packages/utils/src/promises.ts:14](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L14)*

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

*Defined in [packages/utils/src/promises.ts:21](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L21)*

promisified setImmediate

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arg?` | T |

**Returns:** *Promise‹T›*

___

###  pMap

▸ **pMap**<**T**, **R**>(`items`: T[], `fn`: function, `options?`: undefined | object): *Promise‹R[]›*

*Defined in [packages/utils/src/promises.ts:368](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L368)*

Similar to Bluebird.map, with concurrency control

**Type parameters:**

▪ **T**

▪ **R**

**Parameters:**

▪ **items**: *T[]*

▪ **fn**: *function*

▸ (`value`: T, `index`: number): *Promise‹R› | R*

**Parameters:**

Name | Type |
------ | ------ |
`value` | T |
`index` | number |

▪`Optional`  **options**: *undefined | object*

**Returns:** *Promise‹R[]›*

___

###  pRace

▸ **pRace**(`promises`: Promise‹any›[], `logError?`: undefined | function): *Promise‹any›*

*Defined in [packages/utils/src/promises.ts:293](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L293)*

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

*Defined in [packages/utils/src/promises.ts:318](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L318)*

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

*Defined in [packages/utils/src/promises.ts:83](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L83)*

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

*Defined in [packages/utils/src/promises.ts:189](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L189)*

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

*Defined in [packages/utils/src/errors.ts:256](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L256)*

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

*Defined in [packages/utils/src/errors.ts:164](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L164)*

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

*Defined in [packages/utils/src/geo.ts:42](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/geo.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *GeoDistanceObj*

___

###  parseGeoDistanceUnit

▸ **parseGeoDistanceUnit**(`input`: string): *GeoDistanceUnit*

*Defined in [packages/utils/src/geo.ts:55](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/geo.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *GeoDistanceUnit*

___

###  parseGeoPoint

▸ **parseGeoPoint**(`point`: GeoPointInput): *GeoPoint*

*Defined in [packages/utils/src/geo.ts:85](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/geo.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | GeoPointInput |

**Returns:** *GeoPoint*

▸ **parseGeoPoint**(`point`: GeoPointInput, `throwInvalid`: true): *GeoPoint*

*Defined in [packages/utils/src/geo.ts:86](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/geo.ts#L86)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | GeoPointInput |
`throwInvalid` | true |

**Returns:** *GeoPoint*

▸ **parseGeoPoint**(`point`: GeoPointInput, `throwInvalid`: false): *GeoPoint | null*

*Defined in [packages/utils/src/geo.ts:87](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/geo.ts#L87)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | GeoPointInput |
`throwInvalid` | false |

**Returns:** *GeoPoint | null*

___

###  parseJSON

▸ **parseJSON**<**T**>(`buf`: Buffer | string): *T*

*Defined in [packages/utils/src/json.ts:13](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/json.ts#L13)*

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

*Defined in [packages/utils/src/strings.ts:338](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L338)*

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

*Defined in [packages/utils/src/numbers.ts:35](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/numbers.ts#L35)*

Like parseList, except it returns numbers

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number[]*

___

###  prefixErrorMsg

▸ **prefixErrorMsg**(`input`: any, `prefix?`: undefined | string, `defaultMsg`: string): *string*

*Defined in [packages/utils/src/errors.ts:347](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L347)*

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

*Defined in [packages/utils/src/numbers.ts:8](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/numbers.ts#L8)*

A native implemation of lodash random

**Parameters:**

Name | Type |
------ | ------ |
`min` | number |
`max` | number |

**Returns:** *number*

___

###  sort

▸ **sort**<**T**>(`arr`: T[] | Set‹T›, `compare?`: undefined | function): *T[]*

*Defined in [packages/utils/src/arrays.ts:43](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L43)*

Sort an arr or set

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arr` | T[] &#124; Set‹T› |
`compare?` | undefined &#124; function |

**Returns:** *T[]*

___

###  sortBy

▸ **sortBy**<**T**, **V**>(`arr`: T[] | Set‹T›, `fnOrPath`: function | string): *T[]*

*Defined in [packages/utils/src/arrays.ts:58](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L58)*

Sort by path or function that returns the values to sort with

**Type parameters:**

▪ **T**

▪ **V**

**Parameters:**

Name | Type |
------ | ------ |
`arr` | T[] &#124; Set‹T› |
`fnOrPath` | function &#124; string |

**Returns:** *T[]*

___

###  sortKeys

▸ **sortKeys**<**T**>(`input`: T, `options`: object): *T*

*Defined in [packages/utils/src/objects.ts:46](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L46)*

Sort keys on an object

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | T | - |
`options` | object |  {} |

**Returns:** *T*

___

###  startsWith

▸ **startsWith**(`str`: string, `val`: string): *boolean*

*Defined in [packages/utils/src/strings.ts:86](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L86)*

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

*Defined in [packages/utils/src/errors.ts:437](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L437)*

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

*Defined in [packages/utils/src/arrays.ts:105](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L105)*

A native implemation of lodash times

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *number[]*

▸ **times**<**T**>(`n`: number, `fn`: function): *T[]*

*Defined in [packages/utils/src/arrays.ts:106](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L106)*

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

*Defined in [packages/utils/src/booleans.ts:2](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/booleans.ts#L2)*

Convert any input into a boolean, this will work with stringified boolean

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  toCamelCase

▸ **toCamelCase**(`input`: string): *string*

*Defined in [packages/utils/src/strings.ts:226](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L226)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toHumanTime

▸ **toHumanTime**(`ms`: number): *string*

*Defined in [packages/utils/src/dates.ts:60](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/dates.ts#L60)*

converts smaller than a week milliseconds to human readable time

**Parameters:**

Name | Type |
------ | ------ |
`ms` | number |

**Returns:** *string*

___

###  toInteger

▸ **toInteger**(`input`: any): *number | false*

*Defined in [packages/utils/src/numbers.ts:25](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/numbers.ts#L25)*

Convert any input to a integer, return false if unable to convert input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number | false*

___

###  toKebabCase

▸ **toKebabCase**(`input`: string): *string*

*Defined in [packages/utils/src/strings.ts:240](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L240)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toNumber

▸ **toNumber**(`input`: any): *number*

*Defined in [packages/utils/src/numbers.ts:18](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/numbers.ts#L18)*

Convert any input to a number, return Number.NaN if unable to convert input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number*

___

###  toPascalCase

▸ **toPascalCase**(`input`: string): *string*

*Defined in [packages/utils/src/strings.ts:233](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L233)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toSafeString

▸ **toSafeString**(`input`: string): *string*

*Defined in [packages/utils/src/strings.ts:259](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L259)*

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

*Defined in [packages/utils/src/strings.ts:244](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L244)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toStatusErrorCode

▸ **toStatusErrorCode**(`input`: string | undefined): *string*

*Defined in [packages/utils/src/errors.ts:315](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L315)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string &#124; undefined |

**Returns:** *string*

___

###  toString

▸ **toString**(`val`: any): *string*

*Defined in [packages/utils/src/strings.ts:9](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L9)*

Safely convert any input to a string

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *string*

___

###  toTitleCase

▸ **toTitleCase**(`input`: string): *string*

*Defined in [packages/utils/src/strings.ts:248](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L248)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  trackTimeout

▸ **trackTimeout**(`timeoutMs`: number): *(Anonymous function)*

*Defined in [packages/utils/src/dates.ts:47](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/dates.ts#L47)*

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

*Defined in [packages/utils/src/strings.ts:81](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L81)*

safely trim an input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *string*

___

###  trimAndToLower

▸ **trimAndToLower**(`input?`: undefined | string): *string*

*Defined in [packages/utils/src/strings.ts:52](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L52)*

safely trim and to lower a input, useful for string comparison

**Parameters:**

Name | Type |
------ | ------ |
`input?` | undefined &#124; string |

**Returns:** *string*

___

###  trimAndToUpper

▸ **trimAndToUpper**(`input?`: undefined | string): *string*

*Defined in [packages/utils/src/strings.ts:57](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L57)*

safely trim and to lower a input, useful for string comparison

**Parameters:**

Name | Type |
------ | ------ |
`input?` | undefined &#124; string |

**Returns:** *string*

___

###  trimEnd

▸ **trimEnd**(`input`: string, `char`: string): *string*

*Defined in [packages/utils/src/strings.ts:37](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L37)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | string | - |
`char` | string | " " |

**Returns:** *string*

___

###  trimStart

▸ **trimStart**(`input`: string, `char`: string): *string*

*Defined in [packages/utils/src/strings.ts:23](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L23)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | string | - |
`char` | string | " " |

**Returns:** *string*

___

###  truncate

▸ **truncate**(`str`: string, `len`: number): *string*

*Defined in [packages/utils/src/strings.ts:91](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L91)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |
`len` | number |

**Returns:** *string*

___

###  tryParseJSON

▸ **tryParseJSON**(`input`: any): *any*

*Defined in [packages/utils/src/json.ts:4](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/json.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *any*

___

###  unescapeString

▸ **unescapeString**(`str`: string): *string*

*Defined in [packages/utils/src/strings.ts:62](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/strings.ts#L62)*

Unescape characters in string and avoid double escaping

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`str` | string | "" |

**Returns:** *string*

___

###  uniq

▸ **uniq**<**T**>(`arr`: T[] | Set‹T›): *T[]*

*Defined in [packages/utils/src/arrays.ts:37](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L37)*

A native implemation of lodash uniq

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arr` | T[] &#124; Set‹T› |

**Returns:** *T[]*

___

###  uniqBy

▸ **uniqBy**<**T**, **V**>(`values`: T[] | keyof T[], `fnOrPath`: function | string): *T[]*

*Defined in [packages/utils/src/arrays.ts:88](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/arrays.ts#L88)*

Get the unique values by a path or function that returns the unique values

**Type parameters:**

▪ **T**

▪ **V**

**Parameters:**

Name | Type |
------ | ------ |
`values` | T[] &#124; keyof T[] |
`fnOrPath` | function &#124; string |

**Returns:** *T[]*

___

###  waterfall

▸ **waterfall**(`input`: any, `fns`: PromiseFn[], `addBreak`: boolean): *Promise‹any›*

*Defined in [packages/utils/src/promises.ts:282](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L282)*

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

*Defined in [packages/utils/src/regex.ts:85](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/regex.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *RegExp*

___

###  withoutNil

▸ **withoutNil**<**T**>(`input`: T): *[WithoutNil](overview.md#withoutnil)‹T›*

*Defined in [packages/utils/src/objects.ts:87](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/objects.ts#L87)*

Build a new object without null or undefined values (shallow)

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type |
------ | ------ |
`input` | T |

**Returns:** *[WithoutNil](overview.md#withoutnil)‹T›*
