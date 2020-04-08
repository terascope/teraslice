---
title: TS Transforms: `UrlEncode`
sidebar_label: UrlEncode
---

# Class: UrlEncode

## Hierarchy

  ↳ [TransformOpBase](transformopbase.md)

  ↳ **UrlEncode**

## Index

### Constructors

* [constructor](urlencode.md#constructor)

### Properties

* [config](urlencode.md#config)
* [destination](urlencode.md#protected-destination)
* [hasTarget](urlencode.md#protected-hastarget)
* [source](urlencode.md#protected-source)
* [target](urlencode.md#protected-target)
* [cardinality](urlencode.md#static-cardinality)

### Methods

* [encode](urlencode.md#encode)
* [execute](urlencode.md#protected-execute)
* [removeField](urlencode.md#removefield)
* [removeSource](urlencode.md#removesource)
* [run](urlencode.md#run)
* [set](urlencode.md#set)
* [setField](urlencode.md#setfield)
* [validateConfig](urlencode.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new UrlEncode**(`config`: [PostProcessConfig](../interfaces/postprocessconfig.md)): *[UrlEncode](urlencode.md)*

*Overrides [OperationBase](operationbase.md).[constructor](operationbase.md#constructor)*

*Defined in [operations/lib/transforms/urlencode.ts:5](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/transforms/urlencode.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [PostProcessConfig](../interfaces/postprocessconfig.md) |

**Returns:** *[UrlEncode](urlencode.md)*

## Properties

###  config

• **config**: *[OperationConfig](../overview.md#operationconfig)*

*Inherited from [OperationBase](operationbase.md).[config](operationbase.md#config)*

*Defined in [operations/lib/base.ts:9](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/base.ts#L9)*

___

### `Protected` destination

• **destination**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[destination](operationbase.md#protected-destination)*

*Defined in [operations/lib/base.ts:10](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/base.ts#L10)*

___

### `Protected` hasTarget

• **hasTarget**: *boolean*

*Inherited from [OperationBase](operationbase.md).[hasTarget](operationbase.md#protected-hastarget)*

*Defined in [operations/lib/base.ts:11](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/base.ts#L11)*

___

### `Protected` source

• **source**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[source](operationbase.md#protected-source)*

*Defined in [operations/lib/base.ts:7](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/base.ts#L7)*

___

### `Protected` target

• **target**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[target](operationbase.md#protected-target)*

*Defined in [operations/lib/base.ts:8](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/base.ts#L8)*

___

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Inherited from [OperationBase](operationbase.md).[cardinality](operationbase.md#static-cardinality)*

*Defined in [operations/lib/base.ts:13](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/base.ts#L13)*

## Methods

###  encode

▸ **encode**(`data`: string): *string*

*Defined in [operations/lib/transforms/urlencode.ts:10](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/transforms/urlencode.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *string*

___

### `Protected` execute

▸ **execute**(`doc`: DataEntity, `fn`: Function): *DataEntity‹object, __type›*

*Inherited from [TransformOpBase](transformopbase.md).[execute](transformopbase.md#protected-execute)*

*Defined in [operations/lib/transforms/base.ts:5](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/transforms/base.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`fn` | Function |

**Returns:** *DataEntity‹object, __type›*

___

###  removeField

▸ **removeField**(`doc`: DataEntity, `field`: string): *void*

*Inherited from [OperationBase](operationbase.md).[removeField](operationbase.md#removefield)*

*Defined in [operations/lib/base.ts:50](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/base.ts#L50)*

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

*Defined in [operations/lib/base.ts:46](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/base.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *void*

___

###  run

▸ **run**(`record`: DataEntity): *DataEntity*

*Overrides [TransformOpBase](transformopbase.md).[run](transformopbase.md#abstract-run)*

*Defined in [operations/lib/transforms/urlencode.ts:14](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/transforms/urlencode.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | DataEntity |

**Returns:** *DataEntity*

___

###  set

▸ **set**(`doc`: DataEntity, `data`: any): *void*

*Inherited from [OperationBase](operationbase.md).[set](operationbase.md#set)*

*Defined in [operations/lib/base.ts:38](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/base.ts#L38)*

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

*Defined in [operations/lib/base.ts:42](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/base.ts#L42)*

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

*Defined in [operations/lib/base.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/base.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OperationConfig](../overview.md#operationconfig) |

**Returns:** *void*
