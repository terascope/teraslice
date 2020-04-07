---
title: xLucene Translator: `Translator`
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

\+ **new Translator**(`input`: string | Parser, `options`: i.TranslatorOptions): *[Translator](translator.md)*

*Defined in [xlucene-translator/src/translator/translator.ts:25](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/translator.ts#L25)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | string &#124; Parser | - |
`options` | i.TranslatorOptions |  {} |

**Returns:** *[Translator](translator.md)*

## Properties

###  logger

• **logger**: *Logger*

*Defined in [xlucene-translator/src/translator/translator.ts:19](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/translator.ts#L19)*

___

###  query

• **query**: *string*

*Defined in [xlucene-translator/src/translator/translator.ts:18](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/translator.ts#L18)*

___

###  typeConfig

• **typeConfig**: *xLuceneTypeConfig*

*Defined in [xlucene-translator/src/translator/translator.ts:20](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/translator.ts#L20)*

___

###  variables

• **variables**: *xLuceneVariables | undefined*

*Defined in [xlucene-translator/src/translator/translator.ts:21](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/translator.ts#L21)*

## Methods

###  toElasticsearchDSL

▸ **toElasticsearchDSL**(`opts`: ElasticsearchDSLOptions): *ElasticsearchDSLResult*

*Defined in [xlucene-translator/src/translator/translator.ts:55](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/translator.ts#L55)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`opts` | ElasticsearchDSLOptions |  {} |

**Returns:** *ElasticsearchDSLResult*
