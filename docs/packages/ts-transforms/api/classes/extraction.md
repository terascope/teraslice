---
title: Ts Transforms: `Extraction`
sidebar_label: Extraction
---

# Class: Extraction

## Hierarchy

* **Extraction**

## Index

### Constructors

* [constructor](extraction.md#constructor)

### Properties

* [cardinality](extraction.md#static-cardinality)

### Methods

* [extractionPhaseRun](extraction.md#extractionphaserun)
* [run](extraction.md#run)

## Constructors

###  constructor

\+ **new Extraction**(`configArgs`: [ExtractionConfig](../interfaces/extractionconfig.md) | [ExtractionConfig](../interfaces/extractionconfig.md)[]): *[Extraction](extraction.md)*

*Defined in [operations/lib/transforms/extraction.ts:102](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L102)*

**Parameters:**

Name | Type |
------ | ------ |
`configArgs` | [ExtractionConfig](../interfaces/extractionconfig.md) \| [ExtractionConfig](../interfaces/extractionconfig.md)[] |

**Returns:** *[Extraction](extraction.md)*

## Properties

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Defined in [operations/lib/transforms/extraction.ts:102](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L102)*

## Methods

###  extractionPhaseRun

▸ **extractionPhaseRun**(`doc`: DataEntity, `results`: object): *void*

*Defined in [operations/lib/transforms/extraction.ts:143](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L143)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`results` | object |

**Returns:** *void*

___

###  run

▸ **run**(`doc`: DataEntity): *DataEntity | null*

*Defined in [operations/lib/transforms/extraction.ts:125](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L125)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *DataEntity | null*
