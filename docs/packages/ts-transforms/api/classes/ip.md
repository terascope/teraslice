---
title: TS Transforms: `Ip`
sidebar_label: Ip
---

# Class: Ip

## Hierarchy

  ↳ [ValidationOpBase](validationopbase.md)‹any›

  ↳ **Ip**

## Index

### Constructors

* [constructor](ip.md#constructor)

### Properties

* [config](ip.md#config)
* [destination](ip.md#protected-destination)
* [hasTarget](ip.md#protected-hastarget)
* [source](ip.md#protected-source)
* [target](ip.md#protected-target)
* [cardinality](ip.md#static-cardinality)

### Methods

* [normalize](ip.md#optional-normalize)
* [removeField](ip.md#removefield)
* [removeSource](ip.md#removesource)
* [run](ip.md#run)
* [set](ip.md#set)
* [setField](ip.md#setfield)
* [validate](ip.md#validate)
* [validateConfig](ip.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new Ip**(`config`: [PostProcessConfig](../interfaces/postprocessconfig.md)): *[Ip](ip.md)*

*Overrides [ValidationOpBase](validationopbase.md).[constructor](validationopbase.md#constructor)*

*Defined in [operations/lib/validations/ip.ts:5](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/validations/ip.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [PostProcessConfig](../interfaces/postprocessconfig.md) |

**Returns:** *[Ip](ip.md)*

## Properties

###  config

• **config**: *[OperationConfig](../overview.md#operationconfig)*

*Inherited from [OperationBase](operationbase.md).[config](operationbase.md#config)*

*Defined in [operations/lib/base.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/base.ts#L10)*

___

### `Protected` destination

• **destination**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[destination](operationbase.md#protected-destination)*

*Defined in [operations/lib/base.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/base.ts#L11)*

___

### `Protected` hasTarget

• **hasTarget**: *boolean*

*Inherited from [OperationBase](operationbase.md).[hasTarget](operationbase.md#protected-hastarget)*

*Defined in [operations/lib/base.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/base.ts#L12)*

___

### `Protected` source

• **source**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[source](operationbase.md#protected-source)*

*Defined in [operations/lib/base.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/base.ts#L8)*

___

### `Protected` target

• **target**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[target](operationbase.md#protected-target)*

*Defined in [operations/lib/base.ts:9](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/base.ts#L9)*

___

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Inherited from [OperationBase](operationbase.md).[cardinality](operationbase.md#static-cardinality)*

*Defined in [operations/lib/base.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/base.ts#L14)*

## Methods

### `Optional` normalize

▸ **normalize**(`data`: any, `_doc`: DataEntity): *any*

*Inherited from [ValidationOpBase](validationopbase.md).[normalize](validationopbase.md#optional-normalize)*

*Defined in [operations/lib/validations/base.ts:15](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/validations/base.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | any |
`_doc` | DataEntity |

**Returns:** *any*

___

###  removeField

▸ **removeField**(`doc`: DataEntity, `field`: string): *void*

*Inherited from [OperationBase](operationbase.md).[removeField](operationbase.md#removefield)*

*Defined in [operations/lib/base.ts:51](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/base.ts#L51)*

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

*Defined in [operations/lib/base.ts:47](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/base.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *void*

___

###  run

▸ **run**(`doc`: DataEntity): *DataEntity*

*Inherited from [ValidationOpBase](validationopbase.md).[run](validationopbase.md#run)*

*Defined in [operations/lib/validations/base.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/validations/base.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *DataEntity*

___

###  set

▸ **set**(`doc`: DataEntity, `data`: any): *void*

*Inherited from [OperationBase](operationbase.md).[set](operationbase.md#set)*

*Defined in [operations/lib/base.ts:39](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/base.ts#L39)*

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

*Defined in [operations/lib/base.ts:43](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/base.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`field` | string |
`data` | any |

**Returns:** *void*

___

###  validate

▸ **validate**(`data`: string): *boolean*

*Overrides [ValidationOpBase](validationopbase.md).[validate](validationopbase.md#abstract-validate)*

*Defined in [operations/lib/validations/ip.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/validations/ip.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *boolean*

___

### `Protected` validateConfig

▸ **validateConfig**(`config`: [OperationConfig](../overview.md#operationconfig)): *void*

*Inherited from [OperationBase](operationbase.md).[validateConfig](operationbase.md#protected-validateconfig)*

*Defined in [operations/lib/base.ts:23](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/base.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OperationConfig](../overview.md#operationconfig) |

**Returns:** *void*
