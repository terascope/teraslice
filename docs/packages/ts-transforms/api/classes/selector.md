---
title: TS Transforms: `Selector`
sidebar_label: Selector
---

# Class: Selector

## Hierarchy

* **Selector**

## Index

### Constructors

* [constructor](selector.md#constructor)

### Properties

* [selector](selector.md#selector)
* [cardinality](selector.md#static-cardinality)

### Methods

* [addMetaData](selector.md#addmetadata)
* [run](selector.md#run)

## Constructors

###  constructor

\+ **new Selector**(`config`: [SelectorConfig](../interfaces/selectorconfig.md), `types?`: XluceneTypeConfig): *[Selector](selector.md)*

*Defined in [operations/lib/transforms/selector.ts:11](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/transforms/selector.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [SelectorConfig](../interfaces/selectorconfig.md) |
`types?` | XluceneTypeConfig |

**Returns:** *[Selector](selector.md)*

## Properties

###  selector

• **selector**: *string*

*Defined in [operations/lib/transforms/selector.ts:8](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/transforms/selector.ts#L8)*

___

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Defined in [operations/lib/transforms/selector.ts:11](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/transforms/selector.ts#L11)*

## Methods

###  addMetaData

▸ **addMetaData**(`doc`: DataEntity, `selector`: string): *void*

*Defined in [operations/lib/transforms/selector.ts:24](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/transforms/selector.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`selector` | string |

**Returns:** *void*

___

###  run

▸ **run**(`doc`: DataEntity): *DataEntity | null*

*Defined in [operations/lib/transforms/selector.ts:33](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/operations/lib/transforms/selector.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *DataEntity | null*
