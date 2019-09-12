---
title: Data Types: `KeywordPathAnalyzer`
sidebar_label: KeywordPathAnalyzer
---

# Class: KeywordPathAnalyzer

## Hierarchy

* [BaseType](basetype.md)

  * **KeywordPathAnalyzer**

## Index

### Constructors

* [constructor](keywordpathanalyzer.md#constructor)

### Properties

* [config](keywordpathanalyzer.md#protected-config)
* [field](keywordpathanalyzer.md#protected-field)

### Methods

* [_formatGql](keywordpathanalyzer.md#protected-_formatgql)
* [toESMapping](keywordpathanalyzer.md#toesmapping)
* [toGraphQL](keywordpathanalyzer.md#tographql)
* [toXlucene](keywordpathanalyzer.md#toxlucene)

## Constructors

###  constructor

\+ **new KeywordPathAnalyzer**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[KeywordPathAnalyzer](keywordpathanalyzer.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[KeywordPathAnalyzer](keywordpathanalyzer.md)*

## Properties

### `Protected` config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: string, `customType?`: undefined | string): *object*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:21](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`customType?` | undefined \| string |

**Returns:** *object*

___

###  toESMapping

▸ **toESMapping**(`_version?`: undefined | number): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/keyword-path-analyzer.ts:6](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/v1/keyword-path-analyzer.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`_version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/keyword-path-analyzer.ts:34](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/v1/keyword-path-analyzer.ts#L34)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/keyword-path-analyzer.ts:38](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/v1/keyword-path-analyzer.ts#L38)*

**Returns:** *object*
