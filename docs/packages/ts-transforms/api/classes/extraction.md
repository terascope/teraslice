---
title: Ts Transforms: `Extraction`
sidebar_label: Extraction
---

# Class: Extraction

## Hierarchy

* **Extraction**

### Index

#### Constructors

* [constructor](extraction.md#constructor)

#### Properties

* [cardinality](extraction.md#static-cardinality)

#### Methods

* [extractRun](extraction.md#extractrun)
* [run](extraction.md#run)

## Constructors

###  constructor

\+ **new Extraction**(`configArgs`: *[ExtractionConfig](../interfaces/extractionconfig.md) | [ExtractionConfig](../interfaces/extractionconfig.md)[]*): *[Extraction](extraction.md)*

*Defined in [operations/lib/transforms/extraction.ts:104](https://github.com/terascope/teraslice/blob/a2250fb9/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L104)*

**Parameters:**

Name | Type |
------ | ------ |
`configArgs` | [ExtractionConfig](../interfaces/extractionconfig.md) \| [ExtractionConfig](../interfaces/extractionconfig.md)[] |

**Returns:** *[Extraction](extraction.md)*

## Properties

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Defined in [operations/lib/transforms/extraction.ts:104](https://github.com/terascope/teraslice/blob/a2250fb9/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L104)*

## Methods

###  extractRun

▸ **extractRun**(`doc`: *`DataEntity`*, `results`: *object*): *void*

*Defined in [operations/lib/transforms/extraction.ts:145](https://github.com/terascope/teraslice/blob/a2250fb9/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L145)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |
`results` | object |

**Returns:** *void*

___

###  run

▸ **run**(`doc`: *`DataEntity`*): *`DataEntity` | null*

*Defined in [operations/lib/transforms/extraction.ts:128](https://github.com/terascope/teraslice/blob/a2250fb9/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L128)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *`DataEntity` | null*
