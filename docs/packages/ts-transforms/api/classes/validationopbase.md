---
title: Ts Transforms: `ValidationOpBase`
sidebar_label: ValidationOpBase
---

# Class: ValidationOpBase <**T**>

## Type parameters

▪ **T**

## Hierarchy

* [OperationBase](operationbase.md)

  * **ValidationOpBase**

  * [Geolocation](geolocation.md)

  * [StringValidation](stringvalidation.md)

  * [NumberValidation](numbervalidation.md)

  * [BooleanValidation](booleanvalidation.md)

  * [Url](url.md)

  * [Email](email.md)

  * [Ip](ip.md)

  * [MacAddress](macaddress.md)

  * [Uuid](uuid.md)

  * [ISDN](isdn.md)

  * [Validator](validator.md)

## Index

### Constructors

* [constructor](validationopbase.md#constructor)

### Properties

* [config](validationopbase.md#config)
* [destination](validationopbase.md#protected-destination)
* [hasTarget](validationopbase.md#protected-hastarget)
* [source](validationopbase.md#protected-source)
* [target](validationopbase.md#protected-target)
* [cardinality](validationopbase.md#static-cardinality)

### Methods

* [normalize](validationopbase.md#optional-normalize)
* [removeField](validationopbase.md#removefield)
* [removeSource](validationopbase.md#removesource)
* [run](validationopbase.md#run)
* [set](validationopbase.md#set)
* [setField](validationopbase.md#setfield)
* [validate](validationopbase.md#abstract-validate)
* [validateConfig](validationopbase.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new ValidationOpBase**(`config`: any): *[ValidationOpBase](validationopbase.md)*

*Overrides [OperationBase](operationbase.md).[constructor](operationbase.md#constructor)*

*Defined in [operations/lib/validations/base.ts:6](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/validations/base.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *[ValidationOpBase](validationopbase.md)*

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

### `Optional` normalize

▸ **normalize**(`data`: any, `_doc`: DataEntity): *any*

*Defined in [operations/lib/validations/base.ts:15](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/validations/base.ts#L15)*

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

*Defined in [operations/lib/validations/base.ts:17](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/validations/base.ts#L17)*

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

### `Abstract` validate

▸ **validate**(`data`: T | null | undefined): *boolean*

*Defined in [operations/lib/validations/base.ts:13](https://github.com/terascope/teraslice/blob/0ae31df4/packages/ts-transforms/src/operations/lib/validations/base.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | T \| null \| undefined |

**Returns:** *boolean*

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
