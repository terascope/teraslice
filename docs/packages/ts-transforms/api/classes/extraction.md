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

*Defined in [operations/lib/transforms/extraction.ts:121](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`configArgs` | [ExtractionConfig](../interfaces/extractionconfig.md) &#124; [ExtractionConfig](../interfaces/extractionconfig.md)[] |

**Returns:** *[Extraction](extraction.md)*

## Properties

### `Static` cardinality

▪ **cardinality**: *[InputOutputCardinality](../overview.md#inputoutputcardinality)* = "one-to-one"

*Defined in [operations/lib/transforms/extraction.ts:121](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L121)*

## Methods

###  extractionPhaseRun

▸ **extractionPhaseRun**(`doc`: DataEntity, `results`: object): *void*

*Defined in [operations/lib/transforms/extraction.ts:162](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L162)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |
`results` | object |

**Returns:** *void*

___

###  run

▸ **run**(`doc`: DataEntity): *DataEntity | null*

*Defined in [operations/lib/transforms/extraction.ts:144](https://github.com/terascope/teraslice/blob/d8feecc03/packages/ts-transforms/src/operations/lib/transforms/extraction.ts#L144)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | DataEntity |

**Returns:** *DataEntity | null*
