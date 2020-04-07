---
title: TS Transforms: `Extraction`
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

*Defined in [operations/lib/transforms/extraction.ts:120](https://github.com/terascope/teraslice/blob/f95bb5556/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`configArgs` | [ExtractionConfig](../interfaces/extractionconfig.md) &#124; [ExtractionConfig](../interfaces/extractionconfig.md)[] |

**Returns:** *[Extraction](extraction.md)*

## Properties

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Defined in [operations/lib/transforms/extraction.ts:120](https://github.com/terascope/teraslice/blob/f95bb5556/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L120)*

## Methods

###  extractionPhaseRun

▸ **extractionPhaseRun**(`doc`: DataEntity, `results`: object): *void*

*Defined in [operations/lib/transforms/extraction.ts:161](https://github.com/terascope/teraslice/blob/f95bb5556/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L161)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`results` | object |

**Returns:** *void*

___

###  run

▸ **run**(`doc`: DataEntity): *DataEntity | null*

*Defined in [operations/lib/transforms/extraction.ts:143](https://github.com/terascope/teraslice/blob/f95bb5556/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L143)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *DataEntity | null*
