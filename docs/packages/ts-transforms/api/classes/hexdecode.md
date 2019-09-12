---
title: Ts Transforms: `HexDecode`
sidebar_label: HexDecode
---

# Class: HexDecode

## Hierarchy

  * [TransformOpBase](transformopbase.md)

  * **HexDecode**

## Index

### Constructors

* [constructor](hexdecode.md#constructor)

### Properties

* [config](hexdecode.md#config)
* [destination](hexdecode.md#protected-destination)
* [hasTarget](hexdecode.md#protected-hastarget)
* [source](hexdecode.md#protected-source)
* [target](hexdecode.md#protected-target)
* [cardinality](hexdecode.md#static-cardinality)

### Methods

* [decode](hexdecode.md#decode)
* [execute](hexdecode.md#protected-execute)
* [removeField](hexdecode.md#removefield)
* [removeSource](hexdecode.md#removesource)
* [run](hexdecode.md#run)
* [set](hexdecode.md#set)
* [setField](hexdecode.md#setfield)
* [validateConfig](hexdecode.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new HexDecode**(`config`: [PostProcessConfig](../interfaces/postprocessconfig.md)): *[HexDecode](hexdecode.md)*

*Overrides [OperationBase](operationbase.md).[constructor](operationbase.md#constructor)*

*Defined in [operations/lib/transforms/hexdecode.ts:6](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/transforms/hexdecode.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [PostProcessConfig](../interfaces/postprocessconfig.md) |

**Returns:** *[HexDecode](hexdecode.md)*

## Properties

###  config

• **config**: *[OperationConfig](../overview.md#operationconfig)*

*Inherited from [OperationBase](operationbase.md).[config](operationbase.md#config)*

*Defined in [operations/lib/base.ts:10](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/base.ts#L10)*

___

### `Protected` destination

• **destination**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[destination](operationbase.md#protected-destination)*

*Defined in [operations/lib/base.ts:11](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/base.ts#L11)*

___

### `Protected` hasTarget

• **hasTarget**: *boolean*

*Inherited from [OperationBase](operationbase.md).[hasTarget](operationbase.md#protected-hastarget)*

*Defined in [operations/lib/base.ts:12](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/base.ts#L12)*

___

### `Protected` source

• **source**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[source](operationbase.md#protected-source)*

*Defined in [operations/lib/base.ts:8](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/base.ts#L8)*

___

### `Protected` target

• **target**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[target](operationbase.md#protected-target)*

*Defined in [operations/lib/base.ts:9](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/base.ts#L9)*

___

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Inherited from [OperationBase](operationbase.md).[cardinality](operationbase.md#static-cardinality)*

*Defined in [operations/lib/base.ts:14](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/base.ts#L14)*

## Methods

###  decode

▸ **decode**(`data`: string): *string*

*Defined in [operations/lib/transforms/hexdecode.ts:11](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/transforms/hexdecode.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *string*

___

### `Protected` execute

▸ **execute**(`doc`: DataEntity, `fn`: Function): *DataEntity‹object, object›*

*Inherited from [TransformOpBase](transformopbase.md).[execute](transformopbase.md#protected-execute)*

*Defined in [operations/lib/transforms/base.ts:6](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/transforms/base.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`fn` | Function |

**Returns:** *DataEntity‹object, object›*

___

###  removeField

▸ **removeField**(`doc`: DataEntity, `field`: string): *void*

*Inherited from [OperationBase](operationbase.md).[removeField](operationbase.md#removefield)*

*Defined in [operations/lib/base.ts:51](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/base.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`field` | string |

**Returns:** *void*

___

###  removeSource

▸ **removeSource**(`doc`: DataEntity): *void*

*Inherited from [OperationBase](operationbase.md).[removeSource](operationbase.md#removesource)*

*Defined in [operations/lib/base.ts:47](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/base.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *void*

___

###  run

▸ **run**(`record`: DataEntity): *DataEntity | null*

*Overrides [TransformOpBase](transformopbase.md).[run](transformopbase.md#abstract-run)*

*Defined in [operations/lib/transforms/hexdecode.ts:15](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/transforms/hexdecode.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | DataEntity |

**Returns:** *DataEntity | null*

___

###  set

▸ **set**(`doc`: DataEntity, `data`: any): *void*

*Inherited from [OperationBase](operationbase.md).[set](operationbase.md#set)*

*Defined in [operations/lib/base.ts:39](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/base.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`data` | any |

**Returns:** *void*

___

###  setField

▸ **setField**(`doc`: DataEntity, `field`: string, `data`: any): *void*

*Inherited from [OperationBase](operationbase.md).[setField](operationbase.md#setfield)*

*Defined in [operations/lib/base.ts:43](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/base.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`field` | string |
`data` | any |

**Returns:** *void*

___

### `Protected` validateConfig

▸ **validateConfig**(`config`: [OperationConfig](../overview.md#operationconfig)): *void*

*Inherited from [OperationBase](operationbase.md).[validateConfig](operationbase.md#protected-validateconfig)*

*Defined in [operations/lib/base.ts:23](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/base.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OperationConfig](../overview.md#operationconfig) |

**Returns:** *void*
