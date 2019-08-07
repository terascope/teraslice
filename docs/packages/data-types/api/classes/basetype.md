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

  * [IpRangeType](iprangetype.md)

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

  * [Domain](domain.md)

  * [KeywordCaseInsensitive](keywordcaseinsensitive.md)

  * [KeywordTokensCaseInsensitive](keywordtokenscaseinsensitive.md)

  * [KeywordPathAnalyzer](keywordpathanalyzer.md)

  * [NgramTokens](ngramtokens.md)

  * [Boundary](boundary.md)

## Index

### Constructors

* [constructor](basetype.md#constructor)

### Properties

* [config](basetype.md#protected-config)
* [field](basetype.md#protected-field)

### Methods

* [_formatGql](basetype.md#protected-_formatgql)
* [toESMapping](basetype.md#abstract-toesmapping)
* [toGraphQL](basetype.md#abstract-tographql)
* [toXlucene](basetype.md#abstract-toxlucene)

## Constructors

###  constructor

\+ **new BaseType**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[BaseType](basetype.md)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[BaseType](basetype.md)*

## Properties

### `Protected` config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: string, `customType?`: undefined | string): *object*

*Defined in [types/versions/base-type.ts:19](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`customType?` | undefined \| string |

**Returns:** *object*

___

### `Abstract` toESMapping

▸ **toESMapping**(`version?`: undefined | number): *[TypeESMapping](../interfaces/typeesmapping.md)*

*Defined in [types/versions/base-type.ts:15](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined \| number |

**Returns:** *[TypeESMapping](../interfaces/typeesmapping.md)*

___

### `Abstract` toGraphQL

▸ **toGraphQL**(): *[GraphQLType](../interfaces/graphqltype.md)*

*Defined in [types/versions/base-type.ts:16](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L16)*

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

### `Abstract` toXlucene

▸ **toXlucene**(): *`TypeConfig`*

*Defined in [types/versions/base-type.ts:17](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L17)*

**Returns:** *`TypeConfig`*
