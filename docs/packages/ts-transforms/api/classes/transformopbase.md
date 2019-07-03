---
title: Ts Transforms :: TransformOpBase
sidebar_label: TransformOpBase
---

# Class: TransformOpBase

## Hierarchy

* [OperationBase](operationbase.md)

  * **TransformOpBase**

  * [Join](join.md)

  * [Base64Decode](base64decode.md)

  * [UrlDecode](urldecode.md)

  * [HexDecode](hexdecode.md)

  * [JsonParse](jsonparse.md)

  * [Lowercase](lowercase.md)

  * [Uppercase](uppercase.md)

  * [MakeArray](makearray.md)

  * [Dedup](dedup.md)

### Index

#### Constructors

* [constructor](transformopbase.md#constructor)

#### Properties

* [config](transformopbase.md#config)
* [destination](transformopbase.md#protected-destination)
* [hasTarget](transformopbase.md#protected-hastarget)
* [source](transformopbase.md#protected-source)
* [target](transformopbase.md#protected-target)
* [cardinality](transformopbase.md#static-cardinality)

#### Methods

* [decode](transformopbase.md#protected-decode)
* [removeField](transformopbase.md#removefield)
* [removeSource](transformopbase.md#removesource)
* [run](transformopbase.md#abstract-run)
* [set](transformopbase.md#set)
* [setField](transformopbase.md#setfield)
* [validateConfig](transformopbase.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new TransformOpBase**(`config`: *any*): *[TransformOpBase](transformopbase.md)*

*Overrides [OperationBase](operationbase.md).[constructor](operationbase.md#constructor)*

*Defined in [operations/lib/transforms/base.ts:6](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/transforms/base.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *[TransformOpBase](transformopbase.md)*

## Properties

###  config

• **config**: *[OperationConfig](../overview.md#operationconfig)*

*Inherited from [OperationBase](operationbase.md).[config](operationbase.md#config)*

*Defined in [operations/lib/base.ts:9](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/base.ts#L9)*

___

### `Protected` destination

• **destination**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[destination](operationbase.md#protected-destination)*

*Defined in [operations/lib/base.ts:10](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/base.ts#L10)*

___

### `Protected` hasTarget

• **hasTarget**: *boolean*

*Inherited from [OperationBase](operationbase.md).[hasTarget](operationbase.md#protected-hastarget)*

*Defined in [operations/lib/base.ts:11](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/base.ts#L11)*

___

### `Protected` source

• **source**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[source](operationbase.md#protected-source)*

*Defined in [operations/lib/base.ts:7](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/base.ts#L7)*

___

### `Protected` target

• **target**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[target](operationbase.md#protected-target)*

*Defined in [operations/lib/base.ts:8](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/base.ts#L8)*

___

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Inherited from [OperationBase](operationbase.md).[cardinality](operationbase.md#static-cardinality)*

*Defined in [operations/lib/base.ts:13](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/base.ts#L13)*

## Methods

### `Protected` decode

▸ **decode**(`doc`: *`DataEntity`*, `decodeFn`: *`Function`*): *`DataEntity<object>`*

*Defined in [operations/lib/transforms/base.ts:12](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/transforms/base.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |
`decodeFn` | `Function` |

**Returns:** *`DataEntity<object>`*

___

###  removeField

▸ **removeField**(`doc`: *`DataEntity`*, `field`: *string*): *void*

*Inherited from [OperationBase](operationbase.md).[removeField](operationbase.md#removefield)*

*Defined in [operations/lib/base.ts:50](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/base.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |
`field` | string |

**Returns:** *void*

___

###  removeSource

▸ **removeSource**(`doc`: *`DataEntity`*): *void*

*Inherited from [OperationBase](operationbase.md).[removeSource](operationbase.md#removesource)*

*Defined in [operations/lib/base.ts:46](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/base.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *void*

___

### `Abstract` run

▸ **run**(`data`: *`DataEntity`*): *null | `DataEntity`*

*Defined in [operations/lib/transforms/base.ts:44](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/transforms/base.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | `DataEntity` |

**Returns:** *null | `DataEntity`*

___

###  set

▸ **set**(`doc`: *`DataEntity`*, `data`: *any*): *void*

*Inherited from [OperationBase](operationbase.md).[set](operationbase.md#set)*

*Defined in [operations/lib/base.ts:38](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/base.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |
`data` | any |

**Returns:** *void*

___

###  setField

▸ **setField**(`doc`: *`DataEntity`*, `field`: *string*, `data`: *any*): *void*

*Inherited from [OperationBase](operationbase.md).[setField](operationbase.md#setfield)*

*Defined in [operations/lib/base.ts:42](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/base.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |
`field` | string |
`data` | any |

**Returns:** *void*

___

### `Protected` validateConfig

▸ **validateConfig**(`config`: *[OperationConfig](../overview.md#operationconfig)*): *void*

*Inherited from [OperationBase](operationbase.md).[validateConfig](operationbase.md#protected-validateconfig)*

*Defined in [operations/lib/base.ts:22](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/operations/lib/base.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OperationConfig](../overview.md#operationconfig) |

**Returns:** *void*

