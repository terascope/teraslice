---
title: Data Types: `BaseType`
sidebar_label: BaseType
---

# Class: BaseType

## Hierarchy

* **BaseType**

  * [BooleanType](booleantype.md)

  * [DateType](datetype.md)

  * [GeoType](geotype.md)

  * [IpType](iptype.md)

  * [Byte](byte.md)

  * [Double](double.md)

  * [Float](float.md)

  * [Integer](integer.md)

  * [Keyword](keyword.md)

  * [Long](long.md)

  * [Short](short.md)

  * [Text](text.md)

  * [ObjectType](objecttype.md)

  * [KeywordTokens](keywordtokens.md)

  * [Hostname](hostname.md)

  * [KeywordCaseInsensitive](keywordcaseinsensitive.md)

  * [KeywordTokensCaseInsensitive](keywordtokenscaseinsensitive.md)

  * [NgramTokens](ngramtokens.md)

  * [Boundary](boundary.md)

### Index

#### Constructors

* [constructor](basetype.md#constructor)

#### Properties

* [config](basetype.md#protected-config)
* [field](basetype.md#protected-field)

#### Methods

* [_formatGql](basetype.md#protected-_formatgql)
* [toESMapping](basetype.md#abstract-toesmapping)
* [toGraphQL](basetype.md#abstract-tographql)
* [toXlucene](basetype.md#abstract-toxlucene)

## Constructors

###  constructor

\+ **new BaseType**(`field`: string, `config`: [Type](../overview.md#type)): *[BaseType](basetype.md)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [Type](../overview.md#type) |

**Returns:** *[BaseType](basetype.md)*

## Properties

### `Protected` config

• **config**: *[Type](../overview.md#type)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: string): *string*

*Defined in [types/versions/base-type.ts:19](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/base-type.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |

**Returns:** *string*

___

### `Abstract` toESMapping

▸ **toESMapping**(`version?`: undefined | number): *[ESMapping](../interfaces/esmapping.md)*

*Defined in [types/versions/base-type.ts:15](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/base-type.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined \| number |

**Returns:** *[ESMapping](../interfaces/esmapping.md)*

___

### `Abstract` toGraphQL

▸ **toGraphQL**(): *[GraphQLType](../interfaces/graphqltype.md)*

*Defined in [types/versions/base-type.ts:16](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/base-type.ts#L16)*

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

### `Abstract` toXlucene

▸ **toXlucene**(): *`TypeConfig`*

*Defined in [types/versions/base-type.ts:17](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/base-type.ts#L17)*

**Returns:** *`TypeConfig`*
