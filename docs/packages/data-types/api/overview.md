---
title: Data Types API Overview
sidebar_label: API
---

## Index

### Classes

* [AnyType](classes/anytype.md)
* [BaseType](classes/basetype.md)
* [BooleanType](classes/booleantype.md)
* [Boundary](classes/boundary.md)
* [Byte](classes/byte.md)
* [DataType](classes/datatype.md)
* [DateType](classes/datetype.md)
* [Domain](classes/domain.md)
* [Double](classes/double.md)
* [Float](classes/float.md)
* [GeoJSON](classes/geojson.md)
* [GeoPointType](classes/geopointtype.md)
* [GeoType](classes/geotype.md)
* [GroupType](classes/grouptype.md)
* [Hostname](classes/hostname.md)
* [IPType](classes/iptype.md)
* [Integer](classes/integer.md)
* [IpRangeType](classes/iprangetype.md)
* [Keyword](classes/keyword.md)
* [KeywordCaseInsensitive](classes/keywordcaseinsensitive.md)
* [KeywordPathAnalyzer](classes/keywordpathanalyzer.md)
* [KeywordTokens](classes/keywordtokens.md)
* [KeywordTokensCaseInsensitive](classes/keywordtokenscaseinsensitive.md)
* [Long](classes/long.md)
* [NgramTokens](classes/ngramtokens.md)
* [NumberClass](classes/numberclass.md)
* [ObjectType](classes/objecttype.md)
* [Short](classes/short.md)
* [StringClass](classes/stringclass.md)
* [Text](classes/text.md)

### Interfaces

* [ESMappingOptions](interfaces/esmappingoptions.md)
* [GraphQLType](interfaces/graphqltype.md)
* [IBaseType](interfaces/ibasetype.md)
* [TypeESMapping](interfaces/typeesmapping.md)

### Type aliases

* [AvailableType](overview.md#availabletype)
* [AvailableVersion](overview.md#availableversion)
* [DataTypeConfig](overview.md#datatypeconfig)
* [DataTypeMapping](overview.md#datatypemapping)
* [FieldTypeConfig](overview.md#fieldtypeconfig)
* [GetGroupTypeArg](overview.md#getgrouptypearg)
* [GetTypeArg](overview.md#gettypearg)
* [GraphQLOptions](overview.md#graphqloptions)
* [GraphQLTypeReferences](overview.md#graphqltypereferences)
* [GraphQLTypesResult](overview.md#graphqltypesresult)
* [GroupedFields](overview.md#groupedfields)
* [MergeGraphQLOptions](overview.md#mergegraphqloptions)
* [NestedTypes](overview.md#nestedtypes)
* [ToGraphQLOptions](overview.md#tographqloptions)
* [TypeConfigFields](overview.md#typeconfigfields)

### Variables

* [AvailableTypes](overview.md#const-availabletypes)
* [AvailableVersions](overview.md#const-availableversions)
* [GraphQLDataType](overview.md#const-graphqldatatype)
* [LATEST_VERSION](overview.md#const-latest_version)

### Functions

* [concatUniqueStrings](overview.md#concatuniquestrings)
* [formatGQLComment](overview.md#formatgqlcomment)
* [formatGQLType](overview.md#formatgqltype)
* [formatSchema](overview.md#formatschema)
* [getGroupedFields](overview.md#getgroupedfields)
* [getType](overview.md#gettype)
* [getTypes](overview.md#gettypes)
* [joinStrings](overview.md#joinstrings)
* [validateDataTypeConfig](overview.md#validatedatatypeconfig)
* [validateField](overview.md#validatefield)

### Object literals

* [mapping](overview.md#const-mapping)

## Type aliases

###  AvailableType

Ƭ **AvailableType**: *"Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text" | "String" | "Number" | "Any"*

*Defined in [interfaces.ts:36](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L36)*

___

###  AvailableVersion

Ƭ **AvailableVersion**: *1*

*Defined in [interfaces.ts:95](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L95)*

___

###  DataTypeConfig

Ƭ **DataTypeConfig**: *object*

*Defined in [interfaces.ts:138](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L138)*

#### Type declaration:

___

###  DataTypeMapping

Ƭ **DataTypeMapping**: *object*

*Defined in [interfaces.ts:132](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L132)*

#### Type declaration:

___

###  FieldTypeConfig

Ƭ **FieldTypeConfig**: *object*

*Defined in [interfaces.ts:98](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L98)*

#### Type declaration:

___

###  GetGroupTypeArg

Ƭ **GetGroupTypeArg**: *object*

*Defined in [types/index.ts:64](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/types/index.ts#L64)*

#### Type declaration:

___

###  GetTypeArg

Ƭ **GetTypeArg**: *object*

*Defined in [types/index.ts:94](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/types/index.ts#L94)*

#### Type declaration:

___

###  GraphQLOptions

Ƭ **GraphQLOptions**: *object*

*Defined in [interfaces.ts:13](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L13)*

#### Type declaration:

___

###  GraphQLTypeReferences

Ƭ **GraphQLTypeReferences**: *object & object*

*Defined in [interfaces.ts:32](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L32)*

___

###  GraphQLTypesResult

Ƭ **GraphQLTypesResult**: *object*

*Defined in [interfaces.ts:7](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L7)*

#### Type declaration:

___

###  GroupedFields

Ƭ **GroupedFields**: *Record‹string, string[]›*

*Defined in [interfaces.ts:5](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L5)*

An object of base fields with their child fields

___

###  MergeGraphQLOptions

Ƭ **MergeGraphQLOptions**: *object*

*Defined in [interfaces.ts:23](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L23)*

#### Type declaration:

___

###  NestedTypes

Ƭ **NestedTypes**: *object*

*Defined in [types/group-type.ts:5](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/types/group-type.ts#L5)*

#### Type declaration:

* \[ **field**: *string*\]: [BaseType](classes/basetype.md)

___

###  ToGraphQLOptions

Ƭ **ToGraphQLOptions**: *object*

*Defined in [types/base-type.ts:13](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/types/base-type.ts#L13)*

#### Type declaration:

___

###  TypeConfigFields

Ƭ **TypeConfigFields**: *object*

*Defined in [interfaces.ts:134](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L134)*

#### Type declaration:

* \[ **key**: *string*\]: [FieldTypeConfig](overview.md#fieldtypeconfig)

## Variables

### `Const` AvailableTypes

• **AvailableTypes**: *[AvailableType](overview.md#availabletype)[]* =  [
    'Boolean',
    'Boundary',
    'Byte',
    'Date',
    'Domain',
    'Double',
    'Float',
    'Geo',
    'GeoPoint',
    'GeoJSON',
    'Hostname',
    'Integer',
    'IPRange',
    'IP',
    'KeywordCaseInsensitive',
    'KeywordTokensCaseInsensitive',
    'KeywordPathAnalyzer',
    'KeywordTokens',
    'Keyword',
    'Long',
    'NgramTokens',
    'Object',
    'Short',
    'Text',
    'String',
    'Number',
    'Any'
]

*Defined in [interfaces.ts:65](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L65)*

___

### `Const` AvailableVersions

• **AvailableVersions**: *keyof AvailableVersion[]* =  [1]

*Defined in [interfaces.ts:96](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/interfaces.ts#L96)*

___

### `Const` GraphQLDataType

• **GraphQLDataType**: *GraphQLScalarType‹›* =  new GraphQLScalarType({
    name: 'GraphQLDataType',
    description: 'Scalar type for data type configs',
    serialize,
    parseValue,
    parseLiteral,
})

*Defined in [graphql-helper.ts:61](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/graphql-helper.ts#L61)*

___

### `Const` LATEST_VERSION

• **LATEST_VERSION**: *[AvailableVersion](overview.md#availableversion)* = 1

*Defined in [types/index.ts:9](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/types/index.ts#L9)*

## Functions

###  concatUniqueStrings

▸ **concatUniqueStrings**(...`values`: ConcatStrType[]): *string[]*

*Defined in [utils.ts:6](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/utils.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`...values` | ConcatStrType[] |

**Returns:** *string[]*

___

###  formatGQLComment

▸ **formatGQLComment**(`desc?`: undefined | string, `prefix?`: undefined | string): *string*

*Defined in [graphql-helper.ts:83](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/graphql-helper.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`desc?` | undefined &#124; string |
`prefix?` | undefined &#124; string |

**Returns:** *string*

___

###  formatGQLType

▸ **formatGQLType**(`type`: string, `desc?`: undefined | string): *string*

*Defined in [types/base-type.ts:67](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/types/base-type.ts#L67)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`desc?` | undefined &#124; string |

**Returns:** *string*

___

###  formatSchema

▸ **formatSchema**(`schemaStr`: string, `removeScalars`: boolean): *string*

*Defined in [graphql-helper.ts:69](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/graphql-helper.ts#L69)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`schemaStr` | string | - |
`removeScalars` | boolean | false |

**Returns:** *string*

___

###  getGroupedFields

▸ **getGroupedFields**(`fields`: [TypeConfigFields](overview.md#typeconfigfields)): *[GroupedFields](overview.md#groupedfields)*

*Defined in [types/index.ts:11](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/types/index.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`fields` | [TypeConfigFields](overview.md#typeconfigfields) |

**Returns:** *[GroupedFields](overview.md#groupedfields)*

___

###  getType

▸ **getType**(`__namedParameters`: object): *[BaseType](classes/basetype.md)*

*Defined in [types/index.ts:100](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/types/index.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`__namedParameters` | object |

**Returns:** *[BaseType](classes/basetype.md)*

___

###  getTypes

▸ **getTypes**(`fields`: [TypeConfigFields](overview.md#typeconfigfields), `groupedFields`: [GroupedFields](overview.md#groupedfields), `version`: 1): *[BaseType](classes/basetype.md)[]*

*Defined in [types/index.ts:31](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/types/index.ts#L31)*

Instaniate all of the types for the group

**`todo`** support multiple levels deep nesting

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`fields` | [TypeConfigFields](overview.md#typeconfigfields) | - |
`groupedFields` | [GroupedFields](overview.md#groupedfields) | - |
`version` | 1 |  LATEST_VERSION |

**Returns:** *[BaseType](classes/basetype.md)[]*

___

###  joinStrings

▸ **joinStrings**(...`values`: ConcatStrType[]): *string*

*Defined in [utils.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/utils.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`...values` | ConcatStrType[] |

**Returns:** *string*

___

###  validateDataTypeConfig

▸ **validateDataTypeConfig**(`config`: [DataTypeConfig](overview.md#datatypeconfig)): *[DataTypeConfig](overview.md#datatypeconfig)*

*Defined in [utils.ts:26](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/utils.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [DataTypeConfig](overview.md#datatypeconfig) |

**Returns:** *[DataTypeConfig](overview.md#datatypeconfig)*

___

###  validateField

▸ **validateField**(`field`: any): *boolean*

*Defined in [utils.ts:63](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/utils.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | any |

**Returns:** *boolean*

## Object literals

### `Const` mapping

### ▪ **mapping**: *object*

*Defined in [types/mapping.ts:31](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/types/mapping.ts#L31)*

▪ **1**: *object*

*Defined in [types/mapping.ts:32](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/types/mapping.ts#L32)*

* **Any**: *[AnyType](classes/anytype.md)* =  AnyV1

* **Boolean**: *[BooleanType](classes/booleantype.md)* =  BooleanV1

* **Boundary**: *[Boundary](classes/boundary.md)* =  BoundaryV1

* **Byte**: *[Byte](classes/byte.md)* =  ByteV1

* **Date**: *[DateType](classes/datetype.md)* =  DateV1

* **Domain**: *[Domain](classes/domain.md)* =  DomainV1

* **Double**: *[Double](classes/double.md)* =  DoubleV1

* **Float**: *[Float](classes/float.md)* =  FloatV1

* **Geo**: *[GeoType](classes/geotype.md)* =  GeoV1

* **GeoJSON**: *[GeoJSON](classes/geojson.md)* =  GeoJSONV1

* **GeoPoint**: *[GeoPointType](classes/geopointtype.md)* =  GeoPointV1

* **Hostname**: *[Hostname](classes/hostname.md)* =  HostnameV1

* **IP**: *[IPType](classes/iptype.md)* =  IPV1

* **IPRange**: *[IpRangeType](classes/iprangetype.md)* =  IPRangeV1

* **Integer**: *[Integer](classes/integer.md)* =  IntegerV1

* **Keyword**: *[Keyword](classes/keyword.md)* =  KeywordV1

* **KeywordCaseInsensitive**: *[KeywordCaseInsensitive](classes/keywordcaseinsensitive.md)* =  KeywordCaseInsensitiveV1

* **KeywordPathAnalyzer**: *[KeywordPathAnalyzer](classes/keywordpathanalyzer.md)* =  KeywordPathAnalyzerV1

* **KeywordTokens**: *[KeywordTokens](classes/keywordtokens.md)* =  KeywordTokensV1

* **KeywordTokensCaseInsensitive**: *[KeywordTokensCaseInsensitive](classes/keywordtokenscaseinsensitive.md)* =  KeywordTokensCaseInsensitiveV1

* **Long**: *[Long](classes/long.md)* =  LongV1

* **NgramTokens**: *[NgramTokens](classes/ngramtokens.md)* =  NgramTokensV1

* **Number**: *[NumberClass](classes/numberclass.md)* =  NumberV1

* **Object**: *[ObjectType](classes/objecttype.md)* =  ObjectV1

* **Short**: *[Short](classes/short.md)* =  ShortV1

* **String**: *[StringClass](classes/stringclass.md)* =  StringV1

* **Text**: *[Text](classes/text.md)* =  TextV1
