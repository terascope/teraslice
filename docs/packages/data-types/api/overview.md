---
title: Data Types API Overview
sidebar_label: API
---

### Classes

* [BaseType](classes/basetype.md)
* [BooleanType](classes/booleantype.md)
* [Boundary](classes/boundary.md)
* [Byte](classes/byte.md)
* [DataType](classes/datatype.md)
* [DateType](classes/datetype.md)
* [Domain](classes/domain.md)
* [Double](classes/double.md)
* [Float](classes/float.md)
* [GeoType](classes/geotype.md)
* [Hostname](classes/hostname.md)
* [Integer](classes/integer.md)
* [IpRangeType](classes/iprangetype.md)
* [IpType](classes/iptype.md)
* [Keyword](classes/keyword.md)
* [KeywordCaseInsensitive](classes/keywordcaseinsensitive.md)
* [KeywordPathAnalyzer](classes/keywordpathanalyzer.md)
* [KeywordTokens](classes/keywordtokens.md)
* [KeywordTokensCaseInsensitive](classes/keywordtokenscaseinsensitive.md)
* [Long](classes/long.md)
* [NgramTokens](classes/ngramtokens.md)
* [ObjectType](classes/objecttype.md)
* [Short](classes/short.md)
* [Text](classes/text.md)
* [TypesManager](classes/typesmanager.md)

### Interfaces

* [ESIndexSettings](interfaces/esindexsettings.md)
* [ESMapping](interfaces/esmapping.md)
* [ESMappingOptions](interfaces/esmappingoptions.md)
* [ESTypeMappings](interfaces/estypemappings.md)
* [GraphQLType](interfaces/graphqltype.md)
* [TypeESMapping](interfaces/typeesmapping.md)

### Type aliases

* [AvailableType](overview.md#availabletype)
* [AvailableVersion](overview.md#availableversion)
* [DataTypeConfig](overview.md#datatypeconfig)
* [DataTypeMapping](overview.md#datatypemapping)
* [ESTypeMapping](overview.md#estypemapping)
* [ElasticSearchTypes](overview.md#elasticsearchtypes)
* [FieldTypeConfig](overview.md#fieldtypeconfig)
* [GraphQLOptions](overview.md#graphqloptions)
* [GraphQLTypeReferences](overview.md#graphqltypereferences)
* [GraphQLTypesResult](overview.md#graphqltypesresult)
* [TypeConfigFields](overview.md#typeconfigfields)

### Variables

* [AvailableTypes](overview.md#const-availabletypes)
* [AvailableVersions](overview.md#const-availableversions)
* [GraphQLDataType](overview.md#const-graphqldatatype)
* [LATEST_VERSION](overview.md#const-latest_version)

### Functions

* [formatSchema](overview.md#formatschema)
* [validateDataTypeConfig](overview.md#validatedatatypeconfig)
* [validateField](overview.md#validatefield)

### Object literals

* [mapping](overview.md#const-mapping)

## Type aliases

###  AvailableType

Ƭ **AvailableType**: *"Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text"*

*Defined in [interfaces.ts:35](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L35)*

___

###  AvailableVersion

Ƭ **AvailableVersion**: *`1`*

*Defined in [interfaces.ts:84](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L84)*

___

###  DataTypeConfig

Ƭ **DataTypeConfig**: *object*

*Defined in [interfaces.ts:104](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L104)*

#### Type declaration:

___

###  DataTypeMapping

Ƭ **DataTypeMapping**: *object*

*Defined in [interfaces.ts:98](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L98)*

#### Type declaration:

___

###  ESTypeMapping

Ƭ **ESTypeMapping**: *`PropertyESTypeMapping` | `FieldsESTypeMapping` | `BasicESTypeMapping`*

*Defined in [interfaces.ts:114](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L114)*

___

###  ElasticSearchTypes

Ƭ **ElasticSearchTypes**: *"long" | "integer" | "short" | "byte" | "double" | "float" | "keyword" | "text" | "boolean" | "ip" | "ip_range" | "date" | "geo_point" | "object"*

*Defined in [interfaces.ts:19](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L19)*

___

###  FieldTypeConfig

Ƭ **FieldTypeConfig**: *object*

*Defined in [interfaces.ts:87](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L87)*

#### Type declaration:

___

###  GraphQLOptions

Ƭ **GraphQLOptions**: *object*

*Defined in [interfaces.ts:10](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L10)*

#### Type declaration:

___

###  GraphQLTypeReferences

Ƭ **GraphQLTypeReferences**: *object & object*

*Defined in [interfaces.ts:15](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L15)*

___

###  GraphQLTypesResult

Ƭ **GraphQLTypesResult**: *object*

*Defined in [interfaces.ts:4](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L4)*

#### Type declaration:

___

###  TypeConfigFields

Ƭ **TypeConfigFields**: *object*

*Defined in [interfaces.ts:100](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L100)*

#### Type declaration:

● \[▪ **key**: *string*\]: [FieldTypeConfig](overview.md#fieldtypeconfig)

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
]

*Defined in [interfaces.ts:59](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L59)*

___

### `Const` AvailableVersions

• **AvailableVersions**: *[AvailableVersion](overview.md#availableversion)[]* =  [1]

*Defined in [interfaces.ts:85](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/interfaces.ts#L85)*

___

### `Const` GraphQLDataType

• **GraphQLDataType**: *`GraphQLScalarType`* =  new GraphQLScalarType({
    name: 'GraphQLDataType',
    description: 'Scalar type for data type configs',
    serialize,
    parseValue,
    parseLiteral,
})

*Defined in [graphql-helper.ts:47](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/graphql-helper.ts#L47)*

___

### `Const` LATEST_VERSION

• **LATEST_VERSION**: *[AvailableVersion](overview.md#availableversion)* = 1

*Defined in [types/index.ts:29](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/index.ts#L29)*

## Functions

###  formatSchema

▸ **formatSchema**(`schemaStr`: string): *string*

*Defined in [graphql-helper.ts:55](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/graphql-helper.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`schemaStr` | string |

**Returns:** *string*

___

###  validateDataTypeConfig

▸ **validateDataTypeConfig**(`config`: [DataTypeConfig](overview.md#datatypeconfig)): *[DataTypeConfig](overview.md#datatypeconfig)*

*Defined in [utils.ts:5](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/utils.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [DataTypeConfig](overview.md#datatypeconfig) |

**Returns:** *[DataTypeConfig](overview.md#datatypeconfig)*

___

###  validateField

▸ **validateField**(`field`: any): *boolean*

*Defined in [utils.ts:42](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/utils.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | any |

**Returns:** *boolean*

## Object literals

### `Const` mapping

### ▪ **mapping**: *object*

*Defined in [types/versions/mapping.ts:26](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/mapping.ts#L26)*

▪ **1**: *object*

*Defined in [types/versions/mapping.ts:27](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/mapping.ts#L27)*

* **Boolean**: *[BooleanType](classes/booleantype.md)* =  BooleanV1

* **Boundary**: *[Boundary](classes/boundary.md)* =  BoundaryV1

* **Byte**: *[Byte](classes/byte.md)* =  ByteV1

* **Date**: *[DateType](classes/datetype.md)* =  DateV1

* **Domain**: *[Domain](classes/domain.md)* =  DomainV1

* **Double**: *[Double](classes/double.md)* =  DoubleV1

* **Float**: *[Float](classes/float.md)* =  FloatV1

* **Geo**: *[GeoType](classes/geotype.md)* =  GeoV1

* **Hostname**: *[Hostname](classes/hostname.md)* =  HostnameV1

* **IP**: *[IpType](classes/iptype.md)* =  IPV1

* **IPRange**: *[IpRangeType](classes/iprangetype.md)* =  IPRangeV1

* **Integer**: *[Integer](classes/integer.md)* =  IntegerV1

* **Keyword**: *[Keyword](classes/keyword.md)* =  KeywordV1

* **KeywordCaseInsensitive**: *[KeywordCaseInsensitive](classes/keywordcaseinsensitive.md)* =  KeywordCaseInsensitiveV1

* **KeywordPathAnalyzer**: *[KeywordPathAnalyzer](classes/keywordpathanalyzer.md)* =  KeywordPathAnalyzerV1

* **KeywordTokens**: *[KeywordTokens](classes/keywordtokens.md)* =  KeywordTokensV1

* **KeywordTokensCaseInsensitive**: *[KeywordTokensCaseInsensitive](classes/keywordtokenscaseinsensitive.md)* =  KeywordTokensCaseInsensitiveV1

* **Long**: *[Long](classes/long.md)* =  LongV1

* **NgramTokens**: *[NgramTokens](classes/ngramtokens.md)* =  NgramTokensV1

* **Object**: *[ObjectType](classes/objecttype.md)* =  ObjectV1

* **Short**: *[Short](classes/short.md)* =  ShortV1

* **Text**: *[Text](classes/text.md)* =  TextV1
