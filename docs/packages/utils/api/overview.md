---
title: Utils API
sidebar_label: API
---

### Index

#### Classes

* [Collector](classes/collector.md)
* [DataEntity](classes/dataentity.md)
* [TSError](classes/tserror.md)

#### Interfaces

* [AnyObject](interfaces/anyobject.md)
* [ElasticsearchError](interfaces/elasticsearcherror.md)
* [EncodingConfig](interfaces/encodingconfig.md)
* [Many](interfaces/many.md)
* [PRetryConfig](interfaces/pretryconfig.md)
* [TSErrorConfig](interfaces/tserrorconfig.md)
* [TSErrorContext](interfaces/tserrorcontext.md)

#### Type aliases

* [DataArrayInput](overview.md#dataarrayinput)
* [DataEncoding](overview.md#dataencoding)
* [DataInput](overview.md#datainput)
* [Omit](overview.md#omit)
* [Optional](overview.md#optional)
* [Override](overview.md#override)
* [Overwrite](overview.md#overwrite)
* [Required](overview.md#required)
* [WithoutNil](overview.md#withoutnil)

#### Variables

* [dataEncodings](overview.md#const-dataencodings)
* [isDev](overview.md#const-isdev)
* [isProd](overview.md#const-isprod)
* [isTest](overview.md#const-istest)

#### Functions

* [castArray](overview.md#castarray)
* [concat](overview.md#concat)
* [debugLogger](overview.md#debuglogger)
* [enumerable](overview.md#enumerable)
* [escapeString](overview.md#escapestring)
* [fastAssign](overview.md#fastassign)
* [fastMap](overview.md#fastmap)
* [firstToLower](overview.md#firsttolower)
* [firstToUpper](overview.md#firsttoupper)
* [flatten](overview.md#flatten)
* [getBackoffDelay](overview.md#getbackoffdelay)
* [getErrorStatusCode](overview.md#geterrorstatuscode)
* [getField](overview.md#getfield)
* [getFirst](overview.md#getfirst)
* [getFirstChar](overview.md#getfirstchar)
* [getTypeOf](overview.md#gettypeof)
* [getValidDate](overview.md#getvaliddate)
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
* [makeISODate](overview.md#makeisodate)
* [noop](overview.md#noop)
* [pDelay](overview.md#const-pdelay)
* [pImmediate](overview.md#const-pimmediate)
* [pRetry](overview.md#pretry)
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
* [toInteger](overview.md#tointeger)
* [toNumber](overview.md#tonumber)
* [toSafeString](overview.md#tosafestring)
* [toStatusErrorCode](overview.md#tostatuserrorcode)
* [toString](overview.md#tostring)
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

*Defined in [src/data-entity.ts:233](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/data-entity.ts#L233)*

___

###  DataEncoding

Ƭ **DataEncoding**: *"json"*

*Defined in [src/data-entity.ts:245](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/data-entity.ts#L245)*

available data encoding types

___

###  DataInput

Ƭ **DataInput**: *object | [DataEntity](classes/dataentity.md)*

*Defined in [src/data-entity.ts:232](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/data-entity.ts#L232)*

___

###  Omit

Ƭ **Omit**: *`Pick<T, Exclude<keyof T, K>>`*

*Defined in [src/interfaces.ts:7](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/interfaces.ts#L7)*

Omit the properties available to type.
Useful for excluding properties from a type

**`example`** `Omit<{ a: number, b: number, c: number }, 'b'|'c'> // => { a: 1 }`

___

###  Optional

Ƭ **Optional**: *object*

*Defined in [src/interfaces.ts:39](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/interfaces.ts#L39)*

Like Partial but makes certain properties optional

**`example`** `Optional<{ a: number, b: number }, 'b'>`

#### Type declaration:

___

###  Override

Ƭ **Override**: *object*

*Defined in [src/interfaces.ts:23](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/interfaces.ts#L23)*

Override specific properties on a type

**`example`** `Override<{ a: number, b: number }, { b: string }>`

#### Type declaration:

___

###  Overwrite

Ƭ **Overwrite**: *object & `T2`*

*Defined in [src/interfaces.ts:15](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/interfaces.ts#L15)*

Overwrite a simple type with different properties.
Useful changing and adding additional properties

**`example`** `Overwrite<{ a: number, b: number }, { b?: number }>`

___

###  Required

Ƭ **Required**: *object*

*Defined in [src/interfaces.ts:32](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/interfaces.ts#L32)*

Like Partial but makes certain properties required

**`example`** `Required<{ a: number, b: number }, 'b'>`

#### Type declaration:

___

###  WithoutNil

Ƭ **WithoutNil**: *object*

*Defined in [src/interfaces.ts:44](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/interfaces.ts#L44)*

Without null or undefined properties

#### Type declaration:

## Variables

### `Const` dataEncodings

• **dataEncodings**: *[DataEncoding](overview.md#dataencoding)[]* =  ['json']

*Defined in [src/data-entity.ts:248](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/data-entity.ts#L248)*

A list of supported encoding formats

___

### `Const` isDev

• **isDev**: *boolean* =  NODE_ENV === 'development'

*Defined in [src/misc.ts:5](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/misc.ts#L5)*

___

### `Const` isProd

• **isProd**: *boolean* =  NODE_ENV === 'production'

*Defined in [src/misc.ts:3](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/misc.ts#L3)*

___

### `Const` isTest

• **isTest**: *boolean* =  NODE_ENV === 'test'

*Defined in [src/misc.ts:4](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/misc.ts#L4)*

## Functions

###  castArray

▸ **castArray**<**T**>(`input`: *`T` | `T`[]*): *`T`[]*

*Defined in [src/arrays.ts:9](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/arrays.ts#L9)*

A simplified implemation of lodash castArray

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` \| `T`[] |

**Returns:** *`T`[]*

___

###  concat

▸ **concat**<**T**>(`arr`: *`T` | `T`[]*, `arr1?`: *`T` | `T`[]*): *`T`[]*

*Defined in [src/arrays.ts:18](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/arrays.ts#L18)*

Concat and unique the items in the array
Any non-array value will be converted to an array

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arr` | `T` \| `T`[] |
`arr1?` | `T` \| `T`[] |

**Returns:** *`T`[]*

___

###  debugLogger

▸ **debugLogger**(`testName`: *string*, `param?`: *`debugParam`*, `otherName?`: *undefined | string*): *`Logger`*

*Defined in [src/logger.ts:26](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/logger.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`testName` | string |
`param?` | `debugParam` |
`otherName?` | undefined \| string |

**Returns:** *`Logger`*

___

###  enumerable

▸ **enumerable**(`enabled`: *boolean*): *`(Anonymous function)`*

*Defined in [src/misc.ts:18](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/misc.ts#L18)*

A decorator for making a method enumerable or none-enumerable

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`enabled` | boolean | true |

**Returns:** *`(Anonymous function)`*

___

###  escapeString

▸ **escapeString**(`str`: *string*, `chars`: *string[]*): *string*

*Defined in [src/strings.ts:29](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L29)*

Escape characters in string and avoid double escaping

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`str` | string | "" |
`chars` | string[] | - |

**Returns:** *string*

___

###  fastAssign

▸ **fastAssign**<**T**, **U**>(`target`: *`T`*, `source`: *`U`*): *`T`*

*Defined in [src/utils.ts:76](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L76)*

Perform a shallow clone of an object to another, in the fastest way possible

**Type parameters:**

▪ **T**

▪ **U**

**Parameters:**

Name | Type |
------ | ------ |
`target` | `T` |
`source` | `U` |

**Returns:** *`T`*

___

###  fastMap

▸ **fastMap**<**T**, **U**>(`arr`: *`T`[]*, `fn`: *function*): *`U`[]*

*Defined in [src/arrays.ts:59](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/arrays.ts#L59)*

Map an array faster without sparse array handling

**Type parameters:**

▪ **T**

▪ **U**

**Parameters:**

▪ **arr**: *`T`[]*

▪ **fn**: *function*

▸ (`val`: *`T`*, `index`: *number*): *`U`*

**Parameters:**

Name | Type |
------ | ------ |
`val` | `T` |
`index` | number |

**Returns:** *`U`[]*

___

###  firstToLower

▸ **firstToLower**(`str`: *string*): *string*

*Defined in [src/strings.ts:108](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L108)*

Change first character in string to lower case

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  firstToUpper

▸ **firstToUpper**(`str`: *string*): *string*

*Defined in [src/strings.ts:103](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L103)*

Change first character in string to upper case

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  flatten

▸ **flatten**<**T**>(`val`: *[Many](interfaces/many.md)‹*`T`[]*›*): *`T`[]*

*Defined in [src/arrays.ts:4](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/arrays.ts#L4)*

A native implemation of lodash flatten

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`val` | [Many](interfaces/many.md)‹*`T`[]*› |

**Returns:** *`T`[]*

___

###  getBackoffDelay

▸ **getBackoffDelay**(`current`: *number*, `factor`: *number*, `max`: *number*, `min`: *number*): *number*

*Defined in [src/promises.ts:147](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/promises.ts#L147)*

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

▸ **getErrorStatusCode**(`err`: *any*, `config`: *[TSErrorConfig](interfaces/tserrorconfig.md)*, `defaultCode`: *number*): *number*

*Defined in [src/errors.ts:357](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L357)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`err` | any | - |
`config` | [TSErrorConfig](interfaces/tserrorconfig.md) |  {} |
`defaultCode` | number |  DEFAULT_STATUS_CODE |

**Returns:** *number*

___

###  getField

▸ **getField**<**V**>(`input`: *undefined*, `field`: *string*, `defaultVal?`: *[V]()*): *`V`*

*Defined in [src/utils.ts:132](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L132)*

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

**Returns:** *`V`*

▸ **getField**<**T**, **P**>(`input`: *`T`*, `field`: *`P`*): *`T[P]`*

*Defined in [src/utils.ts:133](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L133)*

**Type parameters:**

▪ **T**: *`__type`*

▪ **P**: *keyof T*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` |
`field` | `P` |

**Returns:** *`T[P]`*

▸ **getField**<**T**, **P**>(`input`: *`T` | undefined*, `field`: *`P`*): *`T[P]`*

*Defined in [src/utils.ts:134](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L134)*

**Type parameters:**

▪ **T**: *`__type`*

▪ **P**: *keyof T*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` \| undefined |
`field` | `P` |

**Returns:** *`T[P]`*

▸ **getField**<**T**, **P**, **V**>(`input`: *`T` | undefined*, `field`: *`P`*, `defaultVal`: *`V`*): *`T[P]` | `V`*

*Defined in [src/utils.ts:135](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L135)*

**Type parameters:**

▪ **T**: *`__type`*

▪ **P**: *keyof T*

▪ **V**

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` \| undefined |
`field` | `P` |
`defaultVal` | `V` |

**Returns:** *`T[P]` | `V`*

▸ **getField**<**T**, **P**, **V**>(`input`: *`T` | undefined*, `field`: *`P`*, `defaultVal`: *`V`*): *`T[P]`*

*Defined in [src/utils.ts:136](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L136)*

**Type parameters:**

▪ **T**: *`__type`*

▪ **P**: *keyof T*

▪ **V**: *`T[P]`*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` \| undefined |
`field` | `P` |
`defaultVal` | `V` |

**Returns:** *`T[P]`*

___

###  getFirst

▸ **getFirst**<**T**>(`input`: *`T` | `T`[]*): *`T`*

*Defined in [src/utils.ts:71](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L71)*

If the input is an array it will return the first item
else if it will return the input

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` \| `T`[] |

**Returns:** *`T`*

___

###  getFirstChar

▸ **getFirstChar**(`input`: *string*): *string*

*Defined in [src/strings.ts:112](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L112)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  getTypeOf

▸ **getTypeOf**(`val`: *any*): *string*

*Defined in [src/utils.ts:44](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L44)*

Determine the type of an input

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *string*

a human friendly string that describes the input

___

###  getValidDate

▸ **getValidDate**(`val`: *any*): *`Date` | false*

*Defined in [src/dates.ts:16](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/dates.ts#L16)*

Check if the data is valid and return if it is

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *`Date` | false*

___

###  isBooleanLike

▸ **isBooleanLike**(`input`: *any*): *boolean*

*Defined in [src/utils.ts:95](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L95)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isElasticsearchError

▸ **isElasticsearchError**(`err`: *any*): *boolean*

*Defined in [src/errors.ts:321](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L321)*

Check is a elasticsearch error

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isEmpty

▸ **isEmpty**(`val?`: *any*): *boolean*

*Defined in [src/utils.ts:9](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L9)*

Check if an input is empty, similar to lodash.isEmpty

**Parameters:**

Name | Type |
------ | ------ |
`val?` | any |

**Returns:** *boolean*

___

###  isError

▸ **isError**(`err`: *any*): *boolean*

*Defined in [src/errors.ts:307](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L307)*

Check if an input has an error compatible api

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isFatalError

▸ **isFatalError**(`err`: *any*): *boolean*

*Defined in [src/errors.ts:298](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L298)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isFunction

▸ **isFunction**(`input`: *any*): *boolean*

*Defined in [src/utils.ts:63](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L63)*

Verify an input is a function

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isInteger

▸ **isInteger**(`val`: *any*): *boolean*

*Defined in [src/numbers.ts:2](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/numbers.ts#L2)*

A simplified implemation of lodash isInteger

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  isNumber

▸ **isNumber**(`input`: *any*): *boolean*

*Defined in [src/numbers.ts:13](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/numbers.ts#L13)*

Check if an input is a number

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isRetryableError

▸ **isRetryableError**(`err`: *any*): *boolean*

*Defined in [src/errors.ts:302](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L302)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isString

▸ **isString**(`val`: *any*): *boolean*

*Defined in [src/strings.ts:2](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L2)*

A simplified implemation of lodash isString

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  isTSError

▸ **isTSError**(`err`: *any*): *boolean*

*Defined in [src/errors.ts:312](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L312)*

Check is a TSError

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isValidDate

▸ **isValidDate**(`val`: *any*): *boolean*

*Defined in [src/dates.ts:9](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/dates.ts#L9)*

A simplified implemation of moment(new Date(val)).isValid()

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  locked

▸ **locked**(): *`(Anonymous function)`*

*Defined in [src/misc.ts:8](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/misc.ts#L8)*

A decorator for locking down a method

**Returns:** *`(Anonymous function)`*

___

###  makeISODate

▸ **makeISODate**(): *string*

*Defined in [src/dates.ts:4](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/dates.ts#L4)*

A helper function for making an ISODate string

**Returns:** *string*

___

###  noop

▸ **noop**(...`args`: *any[]*): *any*

*Defined in [src/utils.ts:123](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L123)*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *any*

___

### `Const` pDelay

▸ **pDelay**(`delay`: *number*): *`Promise<Object>`*

*Defined in [src/promises.ts:172](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/promises.ts#L172)*

promisified setTimeout

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`delay` | number | 1 |

**Returns:** *`Promise<Object>`*

___

### `Const` pImmediate

▸ **pImmediate**(): *`Promise<Object>`*

*Defined in [src/promises.ts:179](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/promises.ts#L179)*

promisified setImmediate

**Returns:** *`Promise<Object>`*

___

###  pRetry

▸ **pRetry**<**T**>(`fn`: *`PromiseFn<T>`*, `options?`: *`Partial<PRetryConfig>`*): *`Promise<T>`*

*Defined in [src/promises.ts:63](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/promises.ts#L63)*

A promise retry fn.

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`fn` | `PromiseFn<T>` |
`options?` | `Partial<PRetryConfig>` |

**Returns:** *`Promise<T>`*

___

###  parseError

▸ **parseError**(`input`: *any*, `withStack`: *boolean*): *string*

*Defined in [src/errors.ts:199](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L199)*

parse input to get error message or stack

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`withStack` | boolean | false |

**Returns:** *string*

___

###  parseErrorInfo

▸ **parseErrorInfo**(`input`: *any*, `config`: *[TSErrorConfig](interfaces/tserrorconfig.md)*): *`ErrorInfo`*

*Defined in [src/errors.ts:130](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L130)*

parse error for info

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`config` | [TSErrorConfig](interfaces/tserrorconfig.md) |  {} |

**Returns:** *`ErrorInfo`*

___

###  parseJSON

▸ **parseJSON**<**T**>(`buf`: *`Buffer` | string*): *`T`*

*Defined in [src/utils.ts:27](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L27)*

JSON encoded buffer into a json object

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`buf` | `Buffer` \| string |

**Returns:** *`T`*

___

###  parseList

▸ **parseList**(`input`: *any*): *string[]*

*Defined in [src/utils.ts:106](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L106)*

Maps an array of strings and and trims the result, or
parses a comma separated list and trims the result

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *string[]*

___

###  parseNumberList

▸ **parseNumberList**(`input`: *any*): *number[]*

*Defined in [src/numbers.ts:35](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/numbers.ts#L35)*

Like parseList, except it returns numbers

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number[]*

___

###  prefixErrorMsg

▸ **prefixErrorMsg**(`input`: *any*, `prefix?`: *undefined | string*, `defaultMsg`: *string*): *string*

*Defined in [src/errors.ts:288](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L288)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`prefix?` | undefined \| string | - |
`defaultMsg` | string | "Unknown Error" |

**Returns:** *string*

___

###  random

▸ **random**(`min`: *number*, `max`: *number*): *number*

*Defined in [src/numbers.ts:8](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/numbers.ts#L8)*

A native implemation of lodash random

**Parameters:**

Name | Type |
------ | ------ |
`min` | number |
`max` | number |

**Returns:** *number*

___

###  startsWith

▸ **startsWith**(`str`: *string*, `val`: *string*): *boolean*

*Defined in [src/strings.ts:71](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L71)*

A native implemation of lodash startsWith

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |
`val` | string |

**Returns:** *boolean*

___

###  stripErrorMessage

▸ **stripErrorMessage**(`error`: *any*, `reason`: *string*, `requireSafe`: *boolean*): *string*

*Defined in [src/errors.ts:374](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L374)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`error` | any | - |
`reason` | string |  DEFAULT_ERR_MSG |
`requireSafe` | boolean | false |

**Returns:** *string*

___

###  times

▸ **times**(`n`: *number*): *number[]*

*Defined in [src/arrays.ts:45](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/arrays.ts#L45)*

A native implemation of lodash times

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *number[]*

▸ **times**<**T**>(`n`: *number*, `fn`: *function*): *`T`[]*

*Defined in [src/arrays.ts:46](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/arrays.ts#L46)*

**Type parameters:**

▪ **T**

**Parameters:**

▪ **n**: *number*

▪ **fn**: *function*

▸ (`index`: *number*): *`T`*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *`T`[]*

___

###  toBoolean

▸ **toBoolean**(`input`: *any*): *boolean*

*Defined in [src/utils.ts:89](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L89)*

Convert any input into a boolean, this will work with stringified boolean

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  toInteger

▸ **toInteger**(`input`: *any*): *number | false*

*Defined in [src/numbers.ts:25](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/numbers.ts#L25)*

Convert any input to a integer, return false if unable to convert input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number | false*

___

###  toNumber

▸ **toNumber**(`input`: *any*): *number*

*Defined in [src/numbers.ts:18](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/numbers.ts#L18)*

Convert any input to a number, return Number.NaN if unable to convert input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number*

___

###  toSafeString

▸ **toSafeString**(`input`: *string*): *string*

*Defined in [src/strings.ts:88](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L88)*

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

▸ **toStatusErrorCode**(`input`: *string | undefined*): *string*

*Defined in [src/errors.ts:256](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L256)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string \| undefined |

**Returns:** *string*

___

###  toString

▸ **toString**(`val`: *any*): *string*

*Defined in [src/strings.ts:7](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L7)*

Safely convert any input to a string

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *string*

___

###  trim

▸ **trim**(`input`: *any*): *string*

*Defined in [src/strings.ts:66](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L66)*

safely trim an input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *string*

___

###  trimAndToLower

▸ **trimAndToLower**(`input?`: *undefined | string*): *string*

*Defined in [src/strings.ts:19](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L19)*

safely trim and to lower a input, useful for string comparison

**Parameters:**

Name | Type |
------ | ------ |
`input?` | undefined \| string |

**Returns:** *string*

___

###  trimAndToUpper

▸ **trimAndToUpper**(`input?`: *undefined | string*): *string*

*Defined in [src/strings.ts:24](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L24)*

safely trim and to lower a input, useful for string comparison

**Parameters:**

Name | Type |
------ | ------ |
`input?` | undefined \| string |

**Returns:** *string*

___

###  truncate

▸ **truncate**(`str`: *string*, `len`: *number*): *string*

*Defined in [src/strings.ts:76](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L76)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |
`len` | number |

**Returns:** *string*

___

###  tryParseJSON

▸ **tryParseJSON**(`input`: *any*): *any*

*Defined in [src/utils.ts:18](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/utils.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *any*

___

###  unescapeString

▸ **unescapeString**(`str`: *string*): *string*

*Defined in [src/strings.ts:47](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/strings.ts#L47)*

Unescape characters in string and avoid double escaping

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`str` | string | "" |

**Returns:** *string*

___

###  uniq

▸ **uniq**<**T**>(`arr`: *`T`[]*): *`T`[]*

*Defined in [src/arrays.ts:40](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/arrays.ts#L40)*

A native implemation of lodash uniq

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arr` | `T`[] |

**Returns:** *`T`[]*

___

###  waterfall

▸ **waterfall**(`input`: *any*, `fns`: *`PromiseFn`[]*, `addBreak`: *boolean*): *`Promise<any>`*

*Defined in [src/promises.ts:190](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/promises.ts#L190)*

Async waterfall function

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`fns` | `PromiseFn`[] | - |
`addBreak` | boolean | false |

**Returns:** *`Promise<any>`*

___

###  withoutNil

▸ **withoutNil**<**T**>(`input`: *`T`*): *[WithoutNil](overview.md#withoutnil)‹*`T`*›*

*Defined in [src/arrays.ts:26](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/arrays.ts#L26)*

Build a new object without null or undefined values (shallow)

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type |
------ | ------ |
`input` | `T` |

**Returns:** *[WithoutNil](overview.md#withoutnil)‹*`T`*›*
