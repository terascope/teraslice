---
title: TS Transforms: `BooleanValidation`
sidebar_label: BooleanValidation
---

# Class: BooleanValidation

## Hierarchy

  ↳ [ValidationOpBase](validationopbase.md)‹any›

  ↳ **BooleanValidation**

## Index

### Constructors

* [constructor](booleanvalidation.md#constructor)

### Properties

* [config](booleanvalidation.md#config)
* [destination](booleanvalidation.md#protected-destination)
* [hasTarget](booleanvalidation.md#protected-hastarget)
* [source](booleanvalidation.md#protected-source)
* [target](booleanvalidation.md#protected-target)
* [cardinality](booleanvalidation.md#static-cardinality)

### Methods

* [normalize](booleanvalidation.md#normalize)
* [removeField](booleanvalidation.md#removefield)
* [removeSource](booleanvalidation.md#removesource)
* [run](booleanvalidation.md#run)
* [set](booleanvalidation.md#set)
* [setField](booleanvalidation.md#setfield)
* [validate](booleanvalidation.md#validate)
* [validateBoolean](booleanvalidation.md#validateboolean)
* [validateConfig](booleanvalidation.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new BooleanValidation**(`config`: [PostProcessConfig](../interfaces/postprocessconfig.md)): *[BooleanValidation](booleanvalidation.md)*

*Overrides [ValidationOpBase](validationopbase.md).[constructor](validationopbase.md#constructor)*

*Defined in [operations/lib/validations/boolean.ts:5](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/validations/boolean.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [PostProcessConfig](../interfaces/postprocessconfig.md) |

**Returns:** *[BooleanValidation](booleanvalidation.md)*

## Properties

###  config

• **config**: *[OperationConfig](../overview.md#operationconfig)*

*Inherited from [OperationBase](operationbase.md).[config](operationbase.md#config)*

*Defined in [operations/lib/base.ts:9](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/base.ts#L9)*

___

### `Protected` destination

• **destination**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[destination](operationbase.md#protected-destination)*

*Defined in [operations/lib/base.ts:10](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/base.ts#L10)*

___

### `Protected` hasTarget

• **hasTarget**: *boolean*

*Inherited from [OperationBase](operationbase.md).[hasTarget](operationbase.md#protected-hastarget)*

*Defined in [operations/lib/base.ts:11](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/base.ts#L11)*

___

### `Protected` source

• **source**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[source](operationbase.md#protected-source)*

*Defined in [operations/lib/base.ts:7](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/base.ts#L7)*

___

### `Protected` target

• **target**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[target](operationbase.md#protected-target)*

*Defined in [operations/lib/base.ts:8](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/base.ts#L8)*

___

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Inherited from [OperationBase](operationbase.md).[cardinality](operationbase.md#static-cardinality)*

*Defined in [operations/lib/base.ts:13](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/base.ts#L13)*

## Methods

###  normalize

▸ **normalize**(`data`: any): *boolean*

*Overrides [ValidationOpBase](validationopbase.md).[normalize](validationopbase.md#optional-normalize)*

*Defined in [operations/lib/validations/boolean.ts:23](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/validations/boolean.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | any |

**Returns:** *boolean*

___

###  removeField

▸ **removeField**(`doc`: DataEntity, `field`: string): *void*

*Inherited from [OperationBase](operationbase.md).[removeField](operationbase.md#removefield)*

*Defined in [operations/lib/base.ts:50](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/base.ts#L50)*

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

*Defined in [operations/lib/base.ts:46](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/base.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *void*

___

###  run

▸ **run**(`doc`: DataEntity): *DataEntity*

*Inherited from [ValidationOpBase](validationopbase.md).[run](validationopbase.md#run)*

*Defined in [operations/lib/validations/base.ts:16](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/validations/base.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *DataEntity*

___

###  set

▸ **set**(`doc`: DataEntity, `data`: any): *void*

*Inherited from [OperationBase](operationbase.md).[set](operationbase.md#set)*

*Defined in [operations/lib/base.ts:38](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/base.ts#L38)*

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

*Defined in [operations/lib/base.ts:42](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/base.ts#L42)*

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

*Defined in [operations/lib/validations/boolean.ts:18](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/validations/boolean.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *boolean*

___

###  validateBoolean

▸ **validateBoolean**(`field`: any): *[BoolValidationResult](../interfaces/boolvalidationresult.md)*

*Defined in [operations/lib/validations/boolean.ts:10](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/validations/boolean.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | any |

**Returns:** *[BoolValidationResult](../interfaces/boolvalidationresult.md)*

___

### `Protected` validateConfig

▸ **validateConfig**(`config`: [OperationConfig](../overview.md#operationconfig)): *void*

*Inherited from [OperationBase](operationbase.md).[validateConfig](operationbase.md#protected-validateconfig)*

*Defined in [operations/lib/base.ts:22](https://github.com/terascope/teraslice/blob/78714a985/packages/ts-transforms/src/operations/lib/base.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OperationConfig](../overview.md#operationconfig) |

**Returns:** *void*
