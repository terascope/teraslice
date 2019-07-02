---
title: Ts Transforms :: OperationBase
sidebar_label: OperationBase
---

# Class: OperationBase

## Hierarchy

* **OperationBase**

  * [TransformOpBase](transformopbase.md)

  * [ValidationOpBase](validationopbase.md)

### Index

#### Constructors

* [constructor](operationbase.md#constructor)

#### Properties

* [config](operationbase.md#config)
* [destination](operationbase.md#protected-destination)
* [hasTarget](operationbase.md#protected-hastarget)
* [source](operationbase.md#protected-source)
* [target](operationbase.md#protected-target)
* [cardinality](operationbase.md#static-cardinality)

#### Methods

* [removeField](operationbase.md#removefield)
* [removeSource](operationbase.md#removesource)
* [set](operationbase.md#set)
* [setField](operationbase.md#setfield)
* [validateConfig](operationbase.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new OperationBase**(`config`: *[OperationConfig](../overview.md#operationconfig)*): *[OperationBase](operationbase.md)*

*Defined in [operations/lib/base.ts:13](https://github.com/terascope/teraslice/blob/6e018493/packages/ts-transforms/src/operations/lib/base.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OperationConfig](../overview.md#operationconfig) |

**Returns:** *[OperationBase](operationbase.md)*

## Properties

###  config

• **config**: *[OperationConfig](../overview.md#operationconfig)*

*Defined in [operations/lib/base.ts:9](https://github.com/terascope/teraslice/blob/6e018493/packages/ts-transforms/src/operations/lib/base.ts#L9)*

___

### `Protected` destination

• **destination**: *string | string[]*

*Defined in [operations/lib/base.ts:10](https://github.com/terascope/teraslice/blob/6e018493/packages/ts-transforms/src/operations/lib/base.ts#L10)*

___

### `Protected` hasTarget

• **hasTarget**: *boolean*

*Defined in [operations/lib/base.ts:11](https://github.com/terascope/teraslice/blob/6e018493/packages/ts-transforms/src/operations/lib/base.ts#L11)*

___

### `Protected` source

• **source**: *string | string[]*

*Defined in [operations/lib/base.ts:7](https://github.com/terascope/teraslice/blob/6e018493/packages/ts-transforms/src/operations/lib/base.ts#L7)*

___

### `Protected` target

• **target**: *string | string[]*

*Defined in [operations/lib/base.ts:8](https://github.com/terascope/teraslice/blob/6e018493/packages/ts-transforms/src/operations/lib/base.ts#L8)*

___

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Defined in [operations/lib/base.ts:13](https://github.com/terascope/teraslice/blob/6e018493/packages/ts-transforms/src/operations/lib/base.ts#L13)*

## Methods

###  removeField

▸ **removeField**(`doc`: *`DataEntity`*, `field`: *string*): *void*

*Defined in [operations/lib/base.ts:50](https://github.com/terascope/teraslice/blob/6e018493/packages/ts-transforms/src/operations/lib/base.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |
`field` | string |

**Returns:** *void*

___

###  removeSource

▸ **removeSource**(`doc`: *`DataEntity`*): *void*

*Defined in [operations/lib/base.ts:46](https://github.com/terascope/teraslice/blob/6e018493/packages/ts-transforms/src/operations/lib/base.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *void*

___

###  set

▸ **set**(`doc`: *`DataEntity`*, `data`: *any*): *void*

*Defined in [operations/lib/base.ts:38](https://github.com/terascope/teraslice/blob/6e018493/packages/ts-transforms/src/operations/lib/base.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |
`data` | any |

**Returns:** *void*

___

###  setField

▸ **setField**(`doc`: *`DataEntity`*, `field`: *string*, `data`: *any*): *void*

*Defined in [operations/lib/base.ts:42](https://github.com/terascope/teraslice/blob/6e018493/packages/ts-transforms/src/operations/lib/base.ts#L42)*

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

*Defined in [operations/lib/base.ts:22](https://github.com/terascope/teraslice/blob/6e018493/packages/ts-transforms/src/operations/lib/base.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OperationConfig](../overview.md#operationconfig) |

**Returns:** *void*
