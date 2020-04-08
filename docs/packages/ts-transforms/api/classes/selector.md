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

\+ **new Selector**(`config`: [SelectorConfig](../interfaces/selectorconfig.md), `matcherConfig`: [MatcherConfig](../interfaces/matcherconfig.md)): *[Selector](selector.md)*

*Defined in [operations/lib/transforms/selector.ts:10](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/transforms/selector.ts#L10)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`config` | [SelectorConfig](../interfaces/selectorconfig.md) | - |
`matcherConfig` | [MatcherConfig](../interfaces/matcherconfig.md) |  {} |

**Returns:** *[Selector](selector.md)*

## Properties

###  selector

• **selector**: *string*

*Defined in [operations/lib/transforms/selector.ts:7](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/transforms/selector.ts#L7)*

___

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Defined in [operations/lib/transforms/selector.ts:10](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/transforms/selector.ts#L10)*

## Methods

###  addMetaData

▸ **addMetaData**(`doc`: DataEntity, `selector`: string): *void*

*Defined in [operations/lib/transforms/selector.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/transforms/selector.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`selector` | string |

**Returns:** *void*

___

###  run

▸ **run**(`doc`: DataEntity): *DataEntity | null*

*Defined in [operations/lib/transforms/selector.ts:31](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/operations/lib/transforms/selector.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *DataEntity | null*
