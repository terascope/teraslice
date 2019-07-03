---
title: Ts Transforms :: Join
sidebar_label: Join
---

# Class: Join

## Hierarchy

  * [TransformOpBase](transformopbase.md)

  * **Join**

### Index

#### Constructors

* [constructor](join.md#constructor)

#### Properties

* [config](join.md#config)
* [destination](join.md#protected-destination)
* [hasTarget](join.md#protected-hastarget)
* [source](join.md#protected-source)
* [target](join.md#protected-target)
* [cardinality](join.md#static-cardinality)

#### Methods

* [decode](join.md#protected-decode)
* [removeField](join.md#removefield)
* [removeSource](join.md#removesource)
* [run](join.md#run)
* [set](join.md#set)
* [setField](join.md#setfield)
* [validateConfig](join.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new Join**(`config`: *[PostProcessConfig](../interfaces/postprocessconfig.md)*): *[Join](join.md)*

*Overrides [TransformOpBase](transformopbase.md).[constructor](transformopbase.md#constructor)*

*Defined in [operations/lib/transforms/join.ts:10](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/transforms/join.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [PostProcessConfig](../interfaces/postprocessconfig.md) |

**Returns:** *[Join](join.md)*

## Properties

###  config

• **config**: *[OperationConfig](../overview.md#operationconfig)*

*Inherited from [OperationBase](operationbase.md).[config](operationbase.md#config)*

*Defined in [operations/lib/base.ts:9](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/base.ts#L9)*

___

### `Protected` destination

• **destination**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[destination](operationbase.md#protected-destination)*

*Defined in [operations/lib/base.ts:10](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/base.ts#L10)*

___

### `Protected` hasTarget

• **hasTarget**: *boolean*

*Inherited from [OperationBase](operationbase.md).[hasTarget](operationbase.md#protected-hastarget)*

*Defined in [operations/lib/base.ts:11](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/base.ts#L11)*

___

### `Protected` source

• **source**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[source](operationbase.md#protected-source)*

*Defined in [operations/lib/base.ts:7](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/base.ts#L7)*

___

### `Protected` target

• **target**: *string | string[]*

*Inherited from [OperationBase](operationbase.md).[target](operationbase.md#protected-target)*

*Defined in [operations/lib/base.ts:8](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/base.ts#L8)*

___

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "many-to-one"

*Overrides [OperationBase](operationbase.md).[cardinality](operationbase.md#static-cardinality)*

*Defined in [operations/lib/transforms/join.ts:10](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/transforms/join.ts#L10)*

## Methods

### `Protected` decode

▸ **decode**(`doc`: *`DataEntity`*, `decodeFn`: *`Function`*): *`DataEntity<object>`*

*Inherited from [TransformOpBase](transformopbase.md).[decode](transformopbase.md#protected-decode)*

*Defined in [operations/lib/transforms/base.ts:12](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/transforms/base.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |
`decodeFn` | `Function` |

**Returns:** *`DataEntity<object>`*

___

###  removeField

▸ **removeField**(`doc`: *`DataEntity`*, `field`: *string*): *void*

*Inherited from [OperationBase](operationbase.md).[removeField](operationbase.md#removefield)*

*Defined in [operations/lib/base.ts:50](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/base.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |
`field` | string |

**Returns:** *void*

___

###  removeSource

▸ **removeSource**(`doc`: *`DataEntity`*): *void*

*Inherited from [OperationBase](operationbase.md).[removeSource](operationbase.md#removesource)*

*Defined in [operations/lib/base.ts:46](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/base.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *void*

___

###  run

▸ **run**(`doc`: *`DataEntity`*): *`DataEntity` | null*

*Overrides [TransformOpBase](transformopbase.md).[run](transformopbase.md#abstract-run)*

*Defined in [operations/lib/transforms/join.ts:39](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/transforms/join.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *`DataEntity` | null*

___

###  set

▸ **set**(`doc`: *`DataEntity`*, `data`: *any*): *void*

*Inherited from [OperationBase](operationbase.md).[set](operationbase.md#set)*

*Defined in [operations/lib/base.ts:38](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/base.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |
`data` | any |

**Returns:** *void*

___

###  setField

▸ **setField**(`doc`: *`DataEntity`*, `field`: *string*, `data`: *any*): *void*

*Inherited from [OperationBase](operationbase.md).[setField](operationbase.md#setfield)*

*Defined in [operations/lib/base.ts:42](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/base.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |
`field` | string |
`data` | any |

**Returns:** *void*

___

### `Protected` validateConfig

▸ **validateConfig**(`config`: *[PostProcessConfig](../interfaces/postprocessconfig.md)*): *void*

*Overrides [OperationBase](operationbase.md).[validateConfig](operationbase.md#protected-validateconfig)*

*Defined in [operations/lib/transforms/join.ts:23](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/transforms/join.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [PostProcessConfig](../interfaces/postprocessconfig.md) |

**Returns:** *void*
