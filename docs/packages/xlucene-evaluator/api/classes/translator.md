---
title: xLucene Evaluator: `Translator`
sidebar_label: Translator
---

# Class: Translator

## Hierarchy

* **Translator**

## Index

### Constructors

* [constructor](translator.md#constructor)

### Properties

* [logger](translator.md#logger)
* [query](translator.md#query)
* [typeConfig](translator.md#optional-typeconfig)

### Methods

* [toElasticsearchDSL](translator.md#toelasticsearchdsl)

## Constructors

###  constructor

\+ **new Translator**(`input`: string | [Parser](parser.md), `options`: i.TranslatorOptions): *[Translator](translator.md)*

*Defined in [translator/translator.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/translator.ts#L17)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | string &#124; [Parser](parser.md) | - |
`options` | i.TranslatorOptions |  {} |

**Returns:** *[Translator](translator.md)*

## Properties

###  logger

• **logger**: *Logger*

*Defined in [translator/translator.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/translator.ts#L12)*

___

###  query

• **query**: *string*

*Defined in [translator/translator.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/translator.ts#L11)*

___

### `Optional` typeConfig

• **typeConfig**? : *[TypeConfig](../interfaces/typeconfig.md)*

*Defined in [translator/translator.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/translator.ts#L13)*

## Methods

###  toElasticsearchDSL

▸ **toElasticsearchDSL**(`opts`: i.ElasticsearchDSLOptions): *i.ElasticsearchDSLResult*

*Defined in [translator/translator.ts:47](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/translator.ts#L47)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`opts` | i.ElasticsearchDSLOptions |  {} |

**Returns:** *i.ElasticsearchDSLResult*
