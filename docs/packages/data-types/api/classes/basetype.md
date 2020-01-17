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

  ↳ [GroupType](grouptype.md)

## Index

### Constructors

* [constructor](basetype.md#constructor)

### Properties

* [config](basetype.md#config)
* [field](basetype.md#field)

### Methods

* [_formatGQLTypeName](basetype.md#_formatgqltypename)
* [_formatGql](basetype.md#protected-_formatgql)
* [toESMapping](basetype.md#abstract-toesmapping)
* [toGraphQL](basetype.md#abstract-tographql)
* [toXlucene](basetype.md#abstract-toxlucene)

## Constructors

###  constructor

\+ **new BaseType**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[BaseType](basetype.md)*

*Defined in [data-types/src/types/base-type.ts:15](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[BaseType](basetype.md)*

## Properties

###  config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Defined in [data-types/src/types/base-type.ts:15](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L15)*

___

###  field

• **field**: *string*

*Defined in [data-types/src/types/base-type.ts:14](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L14)*

## Methods

###  _formatGQLTypeName

▸ **_formatGQLTypeName**(`typeName`: string, `isInput?`: undefined | false | true, `includeField?`: undefined | false | true, `version?`: undefined | number): *string*

*Defined in [data-types/src/types/base-type.ts:46](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`typeName` | string |
`isInput?` | undefined &#124; false &#124; true |
`includeField?` | undefined &#124; false &#124; true |
`version?` | undefined &#124; number |

**Returns:** *string*

___

### `Protected` _formatGql

▸ **_formatGql**(`type`: string, `customType?`: string | Array): *[GraphQLType](../interfaces/graphqltype.md)*

*Defined in [data-types/src/types/base-type.ts:29](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`customType?` | string &#124; Array |

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

### `Abstract` toESMapping

▸ **toESMapping**(`version?`: undefined | number): *[TypeESMapping](../interfaces/typeesmapping.md)*

*Defined in [data-types/src/types/base-type.ts:25](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined &#124; number |

**Returns:** *[TypeESMapping](../interfaces/typeesmapping.md)*

___

### `Abstract` toGraphQL

▸ **toGraphQL**(`typeName?`: undefined | string, `isInput?`: undefined | false | true, `includePrivate?`: undefined | false | true): *[GraphQLType](../interfaces/graphqltype.md)*

*Defined in [data-types/src/types/base-type.ts:26](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`typeName?` | undefined &#124; string |
`isInput?` | undefined &#124; false &#124; true |
`includePrivate?` | undefined &#124; false &#124; true |

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

### `Abstract` toXlucene

▸ **toXlucene**(): *TypeConfig*

*Defined in [data-types/src/types/base-type.ts:27](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L27)*

**Returns:** *TypeConfig*
