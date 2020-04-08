---
title: TS Transforms: `StringValidation`
sidebar_label: StringValidation
---

# Class: StringValidation

## Hierarchy

  ↳ [ValidationOpBase](validationopbase.md)‹any›

  ↳ **StringValidation**

## Index

### Constructors

* [constructor](stringvalidation.md#constructor)

### Properties

* [config](stringvalidation.md#config)
* [destination](stringvalidation.md#protected-destination)
* [hasTarget](stringvalidation.md#protected-hastarget)
* [source](stringvalidation.md#protected-source)
* [target](stringvalidation.md#protected-target)
* [cardinality](stringvalidation.md#static-cardinality)

### Methods

* [normalize](stringvalidation.md#normalize)
* [removeField](stringvalidation.md#removefield)
* [removeSource](stringvalidation.md#removesource)
* [run](stringvalidation.md#run)
* [set](stringvalidation.md#set)
* [setField](stringvalidation.md#setfield)
* [validate](stringvalidation.md#validate)
* [validateConfig](stringvalidation.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new StringValidation**(`config`: [PostProcessConfig](../interfaces/postprocessconfig.md)): *[StringValidation](stringvalidation.md)*

*Overrides [ValidationOpBase](validationopbase.md).[constructor](validationopbase.md#constructor)*

*Defined in [operations/lib/validations/string.ts:8](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/validations/string.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [PostProcessConfig](../interfaces/postprocessconfig.md) |

**Returns:** *[StringValidation](stringvalidation.md)*

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

###  normalize

▸ **normalize**(`field`: any): *any*

*Overrides [ValidationOpBase](validationopbase.md).[normalize](validationopbase.md#optional-normalize)*

*Defined in [operations/lib/validations/string.ts:15](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/validations/string.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | any |

**Returns:** *any*

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

▸ **run**(`doc`: DataEntity): *DataEntity*

*Inherited from [ValidationOpBase](validationopbase.md).[run](validationopbase.md#run)*

*Defined in [operations/lib/validations/base.ts:16](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/validations/base.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

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

###  validate

▸ **validate**(`data`: string): *boolean*

*Overrides [ValidationOpBase](validationopbase.md).[validate](validationopbase.md#abstract-validate)*

*Defined in [operations/lib/validations/string.ts:36](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/validations/string.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *boolean*

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
