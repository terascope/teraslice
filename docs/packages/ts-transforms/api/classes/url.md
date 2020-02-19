---
title: TS Transforms: `Url`
sidebar_label: Url
---

# Class: Url

## Hierarchy

  ↳ [ValidationOpBase](validationopbase.md)‹any›

  ↳ **Url**

## Index

### Constructors

* [constructor](url.md#constructor)

### Properties

* [config](url.md#config)
* [destination](url.md#protected-destination)
* [hasTarget](url.md#protected-hastarget)
* [source](url.md#protected-source)
* [target](url.md#protected-target)
* [cardinality](url.md#static-cardinality)

### Methods

* [normalize](url.md#normalize)
* [removeField](url.md#removefield)
* [removeSource](url.md#removesource)
* [run](url.md#run)
* [set](url.md#set)
* [setField](url.md#setfield)
* [validate](url.md#validate)
* [validateConfig](url.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new Url**(`config`: [PostProcessConfig](../interfaces/postprocessconfig.md)): *[Url](url.md)*

*Overrides [ValidationOpBase](validationopbase.md).[constructor](validationopbase.md#constructor)*

*Defined in [operations/lib/validations/url.ts:6](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/validations/url.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [PostProcessConfig](../interfaces/postprocessconfig.md) |

**Returns:** *[Url](url.md)*

## Properties

###  config

• **config**: *[OperationConfig](../overview.md#operationconfig)*

*Inherited from [OperationBase](operationbase.md).[config](operationbase.md#config)*

*Defined in [operations/lib/base.ts:9](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/base.ts#L9)*

___

### `Protected` destination

• **destination**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[destination](operationbase.md#protected-destination)*

*Defined in [operations/lib/base.ts:10](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/base.ts#L10)*

___

### `Protected` hasTarget

• **hasTarget**: *boolean*

*Inherited from [OperationBase](operationbase.md).[hasTarget](operationbase.md#protected-hastarget)*

*Defined in [operations/lib/base.ts:11](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/base.ts#L11)*

___

### `Protected` source

• **source**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[source](operationbase.md#protected-source)*

*Defined in [operations/lib/base.ts:7](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/base.ts#L7)*

___

### `Protected` target

• **target**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[target](operationbase.md#protected-target)*

*Defined in [operations/lib/base.ts:8](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/base.ts#L8)*

___

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Inherited from [OperationBase](operationbase.md).[cardinality](operationbase.md#static-cardinality)*

*Defined in [operations/lib/base.ts:13](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/base.ts#L13)*

## Methods

###  normalize

▸ **normalize**(`data`: any, `_doc`: DataEntity): *string*

*Overrides [ValidationOpBase](validationopbase.md).[normalize](validationopbase.md#optional-normalize)*

*Defined in [operations/lib/validations/url.ts:11](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/validations/url.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | any |
`_doc` | DataEntity |

**Returns:** *string*

___

###  removeField

▸ **removeField**(`doc`: DataEntity, `field`: string): *void*

*Inherited from [OperationBase](operationbase.md).[removeField](operationbase.md#removefield)*

*Defined in [operations/lib/base.ts:50](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/base.ts#L50)*

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

*Defined in [operations/lib/base.ts:46](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/base.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *void*

___

###  run

▸ **run**(`doc`: DataEntity): *DataEntity*

*Inherited from [ValidationOpBase](validationopbase.md).[run](validationopbase.md#run)*

*Defined in [operations/lib/validations/base.ts:16](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/validations/base.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *DataEntity*

___

###  set

▸ **set**(`doc`: DataEntity, `data`: any): *void*

*Inherited from [OperationBase](operationbase.md).[set](operationbase.md#set)*

*Defined in [operations/lib/base.ts:38](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/base.ts#L38)*

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

*Defined in [operations/lib/base.ts:42](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/base.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`field` | string |
`data` | any |

**Returns:** *void*

___

###  validate

▸ **validate**(`doc`: any): *boolean*

*Overrides [ValidationOpBase](validationopbase.md).[validate](validationopbase.md#abstract-validate)*

*Defined in [operations/lib/validations/url.ts:16](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/validations/url.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | any |

**Returns:** *boolean*

___

### `Protected` validateConfig

▸ **validateConfig**(`config`: [OperationConfig](../overview.md#operationconfig)): *void*

*Inherited from [OperationBase](operationbase.md).[validateConfig](operationbase.md#protected-validateconfig)*

*Defined in [operations/lib/base.ts:22](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/base.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OperationConfig](../overview.md#operationconfig) |

**Returns:** *void*
