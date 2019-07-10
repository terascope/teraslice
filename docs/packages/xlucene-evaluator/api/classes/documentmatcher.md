---
title: Xlucene Evaluator: `DocumentMatcher`
sidebar_label: DocumentMatcher
---

# Class: DocumentMatcher

## Hierarchy

* **DocumentMatcher**

### Index

#### Constructors

* [constructor](documentmatcher.md#constructor)

#### Properties

* [typeConfig](documentmatcher.md#typeconfig)

#### Methods

* [match](documentmatcher.md#match)

## Constructors

###  constructor

\+ **new DocumentMatcher**(`luceneStr`: *string*, `typeConfig?`: *[TypeConfig](../interfaces/typeconfig.md)*): *[DocumentMatcher](documentmatcher.md)*

*Defined in [document-matcher/index.ts:13](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/index.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`luceneStr` | string |
`typeConfig?` | [TypeConfig](../interfaces/typeconfig.md) |

**Returns:** *[DocumentMatcher](documentmatcher.md)*

## Properties

###  typeConfig

• **typeConfig**: *[TypeConfig](../interfaces/typeconfig.md) | undefined*

*Defined in [document-matcher/index.ts:13](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/index.ts#L13)*

## Methods

###  match

▸ **match**(`doc`: *object*): *boolean*

*Defined in [document-matcher/index.ts:21](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/index.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | object |

**Returns:** *boolean*
