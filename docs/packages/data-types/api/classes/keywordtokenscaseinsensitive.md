---
title: Data Types: `KeywordTokensCaseInsensitive`
sidebar_label: KeywordTokensCaseInsensitive
---

# Class: KeywordTokensCaseInsensitive

## Hierarchy

* [BaseType](basetype.md)

  * **KeywordTokensCaseInsensitive**

## Index

### Constructors

* [constructor](keywordtokenscaseinsensitive.md#constructor)

### Properties

* [config](keywordtokenscaseinsensitive.md#protected-config)
* [field](keywordtokenscaseinsensitive.md#protected-field)

### Methods

* [_formatGql](keywordtokenscaseinsensitive.md#protected-_formatgql)
* [toESMapping](keywordtokenscaseinsensitive.md#toesmapping)
* [toGraphQL](keywordtokenscaseinsensitive.md#tographql)
* [toXlucene](keywordtokenscaseinsensitive.md#toxlucene)

## Constructors

###  constructor

\+ **new KeywordTokensCaseInsensitive**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[KeywordTokensCaseInsensitive](keywordtokenscaseinsensitive.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[KeywordTokensCaseInsensitive](keywordtokenscaseinsensitive.md)*

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

*Defined in [types/versions/v1/keyword-tokens-case-insensitive.ts:6](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/v1/keyword-tokens-case-insensitive.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`_version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/keyword-tokens-case-insensitive.ts:30](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/v1/keyword-tokens-case-insensitive.ts#L30)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/keyword-tokens-case-insensitive.ts:34](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/v1/keyword-tokens-case-insensitive.ts#L34)*

**Returns:** *object*
