---
title: Data Types: `BaseType`
sidebar_label: BaseType
---

# Class: BaseType

## Hierarchy

* **BaseType**

  ↳ [BooleanType](booleantype.md)

  ↳ [DateType](datetype.md)

  ↳ [GeoType](geotype.md)

  ↳ [GeoPointType](geopointtype.md)

  ↳ [GeoJSON](geojson.md)

  ↳ [IPType](iptype.md)

  ↳ [IpRangeType](iprangetype.md)

  ↳ [Byte](byte.md)

  ↳ [Double](double.md)

  ↳ [Float](float.md)

  ↳ [Integer](integer.md)

  ↳ [Keyword](keyword.md)

  ↳ [Long](long.md)

  ↳ [Short](short.md)

  ↳ [Text](text.md)

  ↳ [ObjectType](objecttype.md)

  ↳ [KeywordTokens](keywordtokens.md)

  ↳ [Hostname](hostname.md)

  ↳ [Domain](domain.md)

  ↳ [KeywordCaseInsensitive](keywordcaseinsensitive.md)

  ↳ [KeywordTokensCaseInsensitive](keywordtokenscaseinsensitive.md)

  ↳ [KeywordPathAnalyzer](keywordpathanalyzer.md)

  ↳ [NgramTokens](ngramtokens.md)

  ↳ [Boundary](boundary.md)

  ↳ [StringClass](stringclass.md)

  ↳ [NumberClass](numberclass.md)

  ↳ [AnyType](anytype.md)

  ↳ [GroupType](grouptype.md)

## Index

### Constructors

* [constructor](basetype.md#constructor)

### Properties

* [config](basetype.md#config)
* [field](basetype.md#field)
* [version](basetype.md#version)

### Methods

* [_formatGQLTypeName](basetype.md#_formatgqltypename)
* [_formatGql](basetype.md#protected-_formatgql)
* [toESMapping](basetype.md#abstract-toesmapping)
* [toGraphQL](basetype.md#abstract-tographql)
* [toXlucene](basetype.md#abstract-toxlucene)

## Constructors

###  constructor

\+ **new BaseType**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig), `version`: number): *[BaseType](basetype.md)*

*Defined in [types/base-type.ts:23](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L23)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`field` | string | - |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) | - |
`version` | number | 1 |

**Returns:** *[BaseType](basetype.md)*

## Properties

###  config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Defined in [types/base-type.ts:22](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L22)*

___

###  field

• **field**: *string*

*Defined in [types/base-type.ts:21](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L21)*

___

###  version

• **version**: *number*

*Defined in [types/base-type.ts:23](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L23)*

## Methods

###  _formatGQLTypeName

▸ **_formatGQLTypeName**(`typeName`: string, `isInput?`: undefined | false | true, `inputSuffix`: string): *string*

*Defined in [types/base-type.ts:52](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L52)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`typeName` | string | - |
`isInput?` | undefined &#124; false &#124; true | - |
`inputSuffix` | string | "Input" |

**Returns:** *string*

___

### `Protected` _formatGql

▸ **_formatGql**(`type`: string, `customType?`: string | Array): *[GraphQLType](../interfaces/graphqltype.md)*

*Defined in [types/base-type.ts:35](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`customType?` | string &#124; Array |

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

### `Abstract` toESMapping

▸ **toESMapping**(`version?`: undefined | number): *[TypeESMapping](../interfaces/typeesmapping.md)*

*Defined in [types/base-type.ts:31](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined &#124; number |

**Returns:** *[TypeESMapping](../interfaces/typeesmapping.md)*

___

### `Abstract` toGraphQL

▸ **toGraphQL**(`options?`: [ToGraphQLOptions](../overview.md#tographqloptions)): *[GraphQLType](../interfaces/graphqltype.md)*

*Defined in [types/base-type.ts:32](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`options?` | [ToGraphQLOptions](../overview.md#tographqloptions) |

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

### `Abstract` toXlucene

▸ **toXlucene**(): *xLuceneTypeConfig*

*Defined in [types/base-type.ts:33](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L33)*

**Returns:** *xLuceneTypeConfig*
