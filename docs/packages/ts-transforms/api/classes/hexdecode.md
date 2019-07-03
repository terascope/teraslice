---
title: Ts Transforms :: HexDecode
sidebar_label: HexDecode
---

# Class: HexDecode

## Hierarchy

  * [TransformOpBase](transformopbase.md)

  * **HexDecode**

### Index

#### Constructors

* [constructor](hexdecode.md#constructor)

#### Properties

* [config](hexdecode.md#config)
* [destination](hexdecode.md#protected-destination)
* [hasTarget](hexdecode.md#protected-hastarget)
* [source](hexdecode.md#protected-source)
* [target](hexdecode.md#protected-target)
* [cardinality](hexdecode.md#static-cardinality)

#### Methods

* [decode](hexdecode.md#protected-decode)
* [decoderFn](hexdecode.md#decoderfn)
* [removeField](hexdecode.md#removefield)
* [removeSource](hexdecode.md#removesource)
* [run](hexdecode.md#run)
* [set](hexdecode.md#set)
* [setField](hexdecode.md#setfield)
* [validateConfig](hexdecode.md#protected-validateconfig)

## Constructors

###  constructor

\+ **new HexDecode**(`config`: *[PostProcessConfig](../interfaces/postprocessconfig.md)*): *[HexDecode](hexdecode.md)*

*Overrides [TransformOpBase](transformopbase.md).[constructor](transformopbase.md#constructor)*

*Defined in [operations/lib/transforms/hexdecode.ts:7](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/transforms/hexdecode.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [PostProcessConfig](../interfaces/postprocessconfig.md) |

**Returns:** *[HexDecode](hexdecode.md)*

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

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Inherited from [OperationBase](operationbase.md).[cardinality](operationbase.md#static-cardinality)*

*Defined in [operations/lib/base.ts:13](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/base.ts#L13)*

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

###  decoderFn

▸ **decoderFn**(`data`: *string*): *string*

*Defined in [operations/lib/transforms/hexdecode.ts:12](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/transforms/hexdecode.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *string*

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

▸ **run**(`record`: *`DataEntity`*): *`DataEntity` | null*

*Overrides [TransformOpBase](transformopbase.md).[run](transformopbase.md#abstract-run)*

*Defined in [operations/lib/transforms/hexdecode.ts:16](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/transforms/hexdecode.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | `DataEntity` |

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

▸ **validateConfig**(`config`: *[OperationConfig](../overview.md#operationconfig)*): *void*

*Inherited from [OperationBase](operationbase.md).[validateConfig](operationbase.md#protected-validateconfig)*

*Defined in [operations/lib/base.ts:22](https://github.com/terascope/teraslice/blob/5e4063e2/packages/ts-transforms/src/operations/lib/base.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OperationConfig](../overview.md#operationconfig) |

**Returns:** *void*
