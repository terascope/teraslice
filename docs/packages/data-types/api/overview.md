---
title: Data Types API Overview
sidebar_label: API
---

#### Classes

* [BaseType](classes/basetype.md)
* [BooleanType](classes/booleantype.md)
* [Boundary](classes/boundary.md)
* [Byte](classes/byte.md)
* [DataType](classes/datatype.md)
* [DateType](classes/datetype.md)
* [Double](classes/double.md)
* [Float](classes/float.md)
* [GeoType](classes/geotype.md)
* [Hostname](classes/hostname.md)
* [Integer](classes/integer.md)
* [IpType](classes/iptype.md)
* [Keyword](classes/keyword.md)
* [KeywordCaseInsensitive](classes/keywordcaseinsensitive.md)
* [KeywordTokens](classes/keywordtokens.md)
* [KeywordTokensCaseInsensitive](classes/keywordtokenscaseinsensitive.md)
* [Long](classes/long.md)
* [NgramTokens](classes/ngramtokens.md)
* [ObjectType](classes/objecttype.md)
* [Short](classes/short.md)
* [Text](classes/text.md)
* [TypesManager](classes/typesmanager.md)

#### Interfaces

* [DataTypeManager](interfaces/datatypemanager.md)
* [ESMapSettings](interfaces/esmapsettings.md)
* [ESMapping](interfaces/esmapping.md)
* [GraphQLArgs](interfaces/graphqlargs.md)
* [GraphQLType](interfaces/graphqltype.md)
* [GraphQlResults](interfaces/graphqlresults.md)
* [MappingConfiguration](interfaces/mappingconfiguration.md)

#### Type aliases

* [AvailableType](overview.md#availabletype)
* [AvailableVersion](overview.md#availableversion)
* [DataTypeConfig](overview.md#datatypeconfig)
* [DataTypeMapping](overview.md#datatypemapping)
* [ESTypeMapping](overview.md#estypemapping)
* [ElasticSearchTypes](overview.md#elasticsearchtypes)
* [Type](overview.md#type)
* [TypeConfigFields](overview.md#typeconfigfields)

#### Variables

* [AvailableTypes](overview.md#const-availabletypes)
* [AvailableVersions](overview.md#const-availableversions)
* [GraphQLDataType](overview.md#const-graphqldatatype)
* [LATEST_VERSION](overview.md#const-latest_version)

#### Functions

* [formatSchema](overview.md#formatschema)

#### Object literals

* [mapping](overview.md#const-mapping)

## Type aliases

###  AvailableType

Ƭ **AvailableType**: *"Boolean" | "Date" | "Geo" | "IP" | "Byte" | "Double" | "Float" | "Integer" | "Keyword" | "Long" | "Short" | "Text" | "KeywordTokens" | "Hostname" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "NgramTokens" | "Boundary" | "Object"*

*Defined in [interfaces.ts:46](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L46)*

___

###  AvailableVersion

Ƭ **AvailableVersion**: *`1`*

*Defined in [interfaces.ts:89](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L89)*

___

###  DataTypeConfig

Ƭ **DataTypeConfig**: *object*

*Defined in [interfaces.ts:109](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L109)*

#### Type declaration:

___

###  DataTypeMapping

Ƭ **DataTypeMapping**: *object*

*Defined in [interfaces.ts:101](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L101)*

#### Type declaration:

___

###  ESTypeMapping

Ƭ **ESTypeMapping**: *`PropertyESTypeMapping` | `BasicESTypeMapping`*

*Defined in [interfaces.ts:114](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L114)*

___

###  ElasticSearchTypes

Ƭ **ElasticSearchTypes**: *"long" | "integer" | "short" | "byte" | "double" | "float" | "keyword" | "text" | "boolean" | "ip" | "geo_point" | "object"*

*Defined in [interfaces.ts:32](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L32)*

___

###  Type

Ƭ **Type**: *object*

*Defined in [interfaces.ts:92](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L92)*

#### Type declaration:

___

###  TypeConfigFields

Ƭ **TypeConfigFields**: *object*

*Defined in [interfaces.ts:105](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L105)*

#### Type declaration:

● \[▪ **key**: *string*\]: [Type](overview.md#type)

## Variables

### `Const` AvailableTypes

• **AvailableTypes**: *[AvailableType](overview.md#availabletype)[]* =  [
    'Boolean',
    'Date',
    'Geo',
    'IP',
    'Byte',
    'Double',
    'Float',
    'Integer',
    'Keyword',
    'Long',
    'Short',
    'Text',
    'KeywordTokens',
    'Hostname',
    'KeywordCaseInsensitive',
    'KeywordTokensCaseInsensitive',
    'NgramTokens',
    'Boundary',
    'Object',
]

*Defined in [interfaces.ts:67](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L67)*

___

### `Const` AvailableVersions

• **AvailableVersions**: *[AvailableVersion](overview.md#availableversion)[]* =  [1]

*Defined in [interfaces.ts:90](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L90)*

___

### `Const` GraphQLDataType

• **GraphQLDataType**: *`GraphQLScalarType`* =  new GraphQLScalarType({
    name: 'GraphQLDataType',
    description: 'Scalar type for data type configs',
    serialize,
    parseValue,
    parseLiteral,
})

*Defined in [graphql-helper.ts:51](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/graphql-helper.ts#L51)*

___

### `Const` LATEST_VERSION

• **LATEST_VERSION**: *[AvailableVersion](overview.md#availableversion)* = 1

*Defined in [types/index.ts:20](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/types/index.ts#L20)*

## Functions

###  formatSchema

▸ **formatSchema**(`schemaStr`: *string*): *string*

*Defined in [graphql-helper.ts:59](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/graphql-helper.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`schemaStr` | string |

**Returns:** *string*

## Object literals

### `Const` mapping

### ▪ **mapping**: *object*

*Defined in [types/versions/mapping.ts:23](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/types/versions/mapping.ts#L23)*

▪ **1**: *object*

*Defined in [types/versions/mapping.ts:24](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/types/versions/mapping.ts#L24)*

* **Boolean**: *[BooleanType](classes/booleantype.md)* =  BooleanV1

* **Boundary**: *[Boundary](classes/boundary.md)* =  BoundaryV1

* **Byte**: *[Byte](classes/byte.md)* =  ByteV1

* **Date**: *[DateType](classes/datetype.md)* =  DateV1

* **Double**: *[Double](classes/double.md)* =  DoubleV1

* **Float**: *[Float](classes/float.md)* =  FloatV1

* **Geo**: *[GeoType](classes/geotype.md)* =  GeoV1

* **Hostname**: *[Hostname](classes/hostname.md)* =  HostnameV1

* **IP**: *[IpType](classes/iptype.md)* =  IPV1

* **Integer**: *[Integer](classes/integer.md)* =  IntegerV1

* **Keyword**: *[Keyword](classes/keyword.md)* =  KeywordV1

* **KeywordCaseInsensitive**: *[KeywordCaseInsensitive](classes/keywordcaseinsensitive.md)* =  KeywordCaseInsensitiveV1

* **KeywordTokens**: *[KeywordTokens](classes/keywordtokens.md)* =  KeywordTokensV1

* **KeywordTokensCaseInsensitive**: *[KeywordTokensCaseInsensitive](classes/keywordtokenscaseinsensitive.md)* =  KeywordTokensCaseInsensitiveV1

* **Long**: *[Long](classes/long.md)* =  LongV1

* **NgramTokens**: *[NgramTokens](classes/ngramtokens.md)* =  NgramTokensV1

* **Object**: *[ObjectType](classes/objecttype.md)* =  ObjectV1

* **Short**: *[Short](classes/short.md)* =  ShortV1

* **Text**: *[Text](classes/text.md)* =  TextV1

