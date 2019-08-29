---
title: Ts Transforms: `Sha2Encode`
sidebar_label: Sha2Encode
---

# Class: Sha2Encode

## Hierarchy

  * [TransformOpBase](transformopbase.md)

  * **Sha2Encode**

## Index

### Constructors

* [constructor](sha2encode.md#constructor)

### Properties

* [config](sha2encode.md#config)
* [destination](sha2encode.md#protected-destination)
* [encode](sha2encode.md#encode)
* [hasTarget](sha2encode.md#protected-hastarget)
* [hash](sha2encode.md#hash)
* [source](sha2encode.md#protected-source)
* [target](sha2encode.md#protected-target)
* [cardinality](sha2encode.md#static-cardinality)

### Methods

* [execute](sha2encode.md#protected-execute)
* [removeField](sha2encode.md#removefield)
* [removeSource](sha2encode.md#removesource)
* [run](sha2encode.md#run)
* [set](sha2encode.md#set)
* [setField](sha2encode.md#setfield)
* [validateConfig](sha2encode.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new Sha2Encode**(`config`: [PostProcessConfig](../interfaces/postprocessconfig.md)): *[Sha2Encode](sha2encode.md)*

*Overrides [OperationBase](operationbase.md).[constructor](operationbase.md#constructor)*

*Defined in [operations/lib/transforms/sha2encode.ts:9](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/transforms/sha2encode.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [PostProcessConfig](../interfaces/postprocessconfig.md) |

**Returns:** *[Sha2Encode](sha2encode.md)*

## Properties

###  config

• **config**: *[OperationConfig](../overview.md#operationconfig)*

*Inherited from [OperationBase](operationbase.md).[config](operationbase.md#config)*

*Defined in [operations/lib/base.ts:9](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/base.ts#L9)*

___

### `Protected` destination

• **destination**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[destination](operationbase.md#protected-destination)*

*Defined in [operations/lib/base.ts:10](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/base.ts#L10)*

___

###  encode

• **encode**: *function*

*Defined in [operations/lib/transforms/sha2encode.ts:9](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/transforms/sha2encode.ts#L9)*

#### Type declaration:

▸ (`str`: string): *string*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

___

### `Protected` hasTarget

• **hasTarget**: *boolean*

*Inherited from [OperationBase](operationbase.md).[hasTarget](operationbase.md#protected-hastarget)*

*Defined in [operations/lib/base.ts:11](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/base.ts#L11)*

___

###  hash

• **hash**: *string*

*Defined in [operations/lib/transforms/sha2encode.ts:8](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/transforms/sha2encode.ts#L8)*

___

### `Protected` source

• **source**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[source](operationbase.md#protected-source)*

*Defined in [operations/lib/base.ts:7](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/base.ts#L7)*

___

### `Protected` target

• **target**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[target](operationbase.md#protected-target)*

*Defined in [operations/lib/base.ts:8](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/base.ts#L8)*

___

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Inherited from [OperationBase](operationbase.md).[cardinality](operationbase.md#static-cardinality)*

*Defined in [operations/lib/base.ts:13](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/base.ts#L13)*

## Methods

### `Protected` execute

▸ **execute**(`doc`: DataEntity, `fn`: Function): *DataEntity‹object›*

*Inherited from [TransformOpBase](transformopbase.md).[execute](transformopbase.md#protected-execute)*

*Defined in [operations/lib/transforms/base.ts:6](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/transforms/base.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`fn` | Function |

**Returns:** *DataEntity‹object›*

___

###  removeField

▸ **removeField**(`doc`: DataEntity, `field`: string): *void*

*Inherited from [OperationBase](operationbase.md).[removeField](operationbase.md#removefield)*

*Defined in [operations/lib/base.ts:50](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/base.ts#L50)*

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

*Defined in [operations/lib/base.ts:46](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/base.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *void*

___

###  run

▸ **run**(`record`: DataEntity): *DataEntity | null*

*Overrides [TransformOpBase](transformopbase.md).[run](transformopbase.md#abstract-run)*

*Defined in [operations/lib/transforms/sha2encode.ts:19](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/transforms/sha2encode.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | DataEntity |

**Returns:** *DataEntity | null*

___

###  set

▸ **set**(`doc`: DataEntity, `data`: any): *void*

*Inherited from [OperationBase](operationbase.md).[set](operationbase.md#set)*

*Defined in [operations/lib/base.ts:38](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/base.ts#L38)*

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

*Defined in [operations/lib/base.ts:42](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/base.ts#L42)*

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

*Defined in [operations/lib/base.ts:22](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/base.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OperationConfig](../overview.md#operationconfig) |

**Returns:** *void*
