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
* [typeConfig](translator.md#typeconfig)
* [variables](translator.md#variables)

### Methods

* [toElasticsearchDSL](translator.md#toelasticsearchdsl)

## Constructors

###  constructor

\+ **new Translator**(`input`: string | [Parser](parser.md), `options`: i.TranslatorOptions): *[Translator](translator.md)*

*Defined in [packages/xlucene-evaluator/src/translator/translator.ts:18](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/translator.ts#L18)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | string &#124; [Parser](parser.md) | - |
`options` | i.TranslatorOptions |  {} |

**Returns:** *[Translator](translator.md)*

## Properties

###  logger

• **logger**: *Logger*

*Defined in [packages/xlucene-evaluator/src/translator/translator.ts:12](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/translator.ts#L12)*

___

###  query

• **query**: *string*

*Defined in [packages/xlucene-evaluator/src/translator/translator.ts:11](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/translator.ts#L11)*

___

###  typeConfig

• **typeConfig**: *[TypeConfig](../interfaces/typeconfig.md)*

*Defined in [packages/xlucene-evaluator/src/translator/translator.ts:13](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/translator.ts#L13)*

___

###  variables

• **variables**: *[Variables](../interfaces/variables.md) | undefined*

*Defined in [packages/xlucene-evaluator/src/translator/translator.ts:14](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/translator.ts#L14)*

## Methods

###  toElasticsearchDSL

▸ **toElasticsearchDSL**(`opts`: i.ElasticsearchDSLOptions): *i.ElasticsearchDSLResult*

*Defined in [packages/xlucene-evaluator/src/translator/translator.ts:50](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/translator.ts#L50)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`opts` | i.ElasticsearchDSLOptions |  {} |

**Returns:** *i.ElasticsearchDSLResult*
