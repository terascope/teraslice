---
title: Ts Transforms: `MakeArray`
sidebar_label: MakeArray
---

# Class: MakeArray

## Hierarchy

  * [TransformOpBase](transformopbase.md)

  * **MakeArray**

## Index

### Constructors

* [constructor](makearray.md#constructor)

### Properties

* [config](makearray.md#config)
* [destination](makearray.md#protected-destination)
* [hasTarget](makearray.md#protected-hastarget)
* [source](makearray.md#protected-source)
* [target](makearray.md#protected-target)
* [cardinality](makearray.md#static-cardinality)

### Methods

* [execute](makearray.md#protected-execute)
* [removeField](makearray.md#removefield)
* [removeSource](makearray.md#removesource)
* [run](makearray.md#run)
* [set](makearray.md#set)
* [setField](makearray.md#setfield)
* [validateConfig](makearray.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new MakeArray**(`config`: [PostProcessConfig](../interfaces/postprocessconfig.md)): *[MakeArray](makearray.md)*

*Overrides [OperationBase](operationbase.md).[constructor](operationbase.md#constructor)*

*Defined in [operations/lib/transforms/array.ts:9](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/transforms/array.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [PostProcessConfig](../interfaces/postprocessconfig.md) |

**Returns:** *[MakeArray](makearray.md)*

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

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "many-to-one"

*Overrides [OperationBase](operationbase.md).[cardinality](operationbase.md#static-cardinality)*

*Defined in [operations/lib/transforms/array.ts:9](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/transforms/array.ts#L9)*

## Methods

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

▸ **run**(`doc`: DataEntity): *DataEntity | null*

*Overrides [TransformOpBase](transformopbase.md).[run](transformopbase.md#abstract-run)*

*Defined in [operations/lib/transforms/array.ts:33](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/transforms/array.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

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

▸ **validateConfig**(`config`: [PostProcessConfig](../interfaces/postprocessconfig.md)): *void*

*Overrides [OperationBase](operationbase.md).[validateConfig](operationbase.md#protected-validateconfig)*

*Defined in [operations/lib/transforms/array.ts:17](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/transforms/array.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [PostProcessConfig](../interfaces/postprocessconfig.md) |

**Returns:** *void*
