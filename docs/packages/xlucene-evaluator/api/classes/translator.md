---
title: Xlucene Evaluator :: Translator
sidebar_label: Translator
---

# Class: Translator

## Hierarchy

* **Translator**

### Index

#### Constructors

* [constructor](translator.md#constructor)

#### Properties

* [logger](translator.md#logger)
* [query](translator.md#query)
* [typeConfig](translator.md#optional-typeconfig)

#### Methods

* [toElasticsearchDSL](translator.md#toelasticsearchdsl)

## Constructors

###  constructor

\+ **new Translator**(`input`: *string | [Parser](parser.md)*, `typeConfig?`: *[TypeConfig](../interfaces/typeconfig.md)*, `logger?`: *`Logger`*): *[Translator](translator.md)*

*Defined in [translator/translator.ts:13](https://github.com/terascope/teraslice/blob/5e4063e2/packages/xlucene-evaluator/src/translator/translator.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string \| [Parser](parser.md) |
`typeConfig?` | [TypeConfig](../interfaces/typeconfig.md) |
`logger?` | `Logger` |

**Returns:** *[Translator](translator.md)*

## Properties

###  logger

• **logger**: *`Logger`*

*Defined in [translator/translator.ts:11](https://github.com/terascope/teraslice/blob/5e4063e2/packages/xlucene-evaluator/src/translator/translator.ts#L11)*

___

###  query

• **query**: *string*

*Defined in [translator/translator.ts:10](https://github.com/terascope/teraslice/blob/5e4063e2/packages/xlucene-evaluator/src/translator/translator.ts#L10)*

___

### `Optional` typeConfig

• **typeConfig**? : *[TypeConfig](../interfaces/typeconfig.md)*

*Defined in [translator/translator.ts:12](https://github.com/terascope/teraslice/blob/5e4063e2/packages/xlucene-evaluator/src/translator/translator.ts#L12)*

## Methods

###  toElasticsearchDSL

▸ **toElasticsearchDSL**(): *`i.ElasticsearchDSLResult`*

*Defined in [translator/translator.ts:28](https://github.com/terascope/teraslice/blob/5e4063e2/packages/xlucene-evaluator/src/translator/translator.ts#L28)*

**Returns:** *`i.ElasticsearchDSLResult`*
