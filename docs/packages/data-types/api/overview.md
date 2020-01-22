---
title: Data Types API Overview
sidebar_label: API
---

## Index

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
* [ObjectType](classes/objecttype.md)
* [Short](classes/short.md)
* [Text](classes/text.md)

### Interfaces

* [ESIndexSettings](interfaces/esindexsettings.md)
* [ESMapping](interfaces/esmapping.md)
* [ESMappingOptions](interfaces/esmappingoptions.md)
* [ESTypeMappings](interfaces/estypemappings.md)
* [GraphQLType](interfaces/graphqltype.md)
* [IBaseType](interfaces/ibasetype.md)
* [TypeESMapping](interfaces/typeesmapping.md)

### Type aliases

* [AvailableType](overview.md#availabletype)
* [AvailableVersion](overview.md#availableversion)
* [DataTypeConfig](overview.md#datatypeconfig)
* [DataTypeMapping](overview.md#datatypemapping)
* [ESTypeMapping](overview.md#estypemapping)
* [ElasticSearchTypes](overview.md#elasticsearchtypes)
* [FieldTypeConfig](overview.md#fieldtypeconfig)
* [GetGroupTypeArg](overview.md#getgrouptypearg)
* [GetTypeArg](overview.md#gettypearg)
* [GraphQLOptions](overview.md#graphqloptions)
* [GraphQLTypeReferences](overview.md#graphqltypereferences)
* [GraphQLTypesResult](overview.md#graphqltypesresult)
* [MergeGraphQLOptions](overview.md#mergegraphqloptions)
* [NestedTypes](overview.md#nestedtypes)
* [PropertyESTypeMapping](overview.md#propertyestypemapping)
* [PropertyESTypes](overview.md#propertyestypes)
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
* [getTypes](overview.md#gettypes)
* [joinStrings](overview.md#joinstrings)
* [validateDataTypeConfig](overview.md#validatedatatypeconfig)
* [validateField](overview.md#validatefield)

### Object literals

* [mapping](overview.md#const-mapping)

## Type aliases

###  AvailableType

Ƭ **AvailableType**: *"Boolean" | "Boundary" | "Byte" | "Date" | "Domain" | "Double" | "Float" | "Geo" | "GeoPoint" | "GeoJSON" | "Hostname" | "Integer" | "IPRange" | "IP" | "KeywordCaseInsensitive" | "KeywordTokensCaseInsensitive" | "KeywordPathAnalyzer" | "KeywordTokens" | "Keyword" | "Long" | "NgramTokens" | "Object" | "Short" | "Text"*

*Defined in [data-types/src/interfaces.ts:48](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L48)*

___

###  AvailableVersion

Ƭ **AvailableVersion**: *1*

*Defined in [data-types/src/interfaces.ts:101](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L101)*

___

###  DataTypeConfig

Ƭ **DataTypeConfig**: *object*

*Defined in [data-types/src/interfaces.ts:144](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L144)*

#### Type declaration:

___

###  DataTypeMapping

Ƭ **DataTypeMapping**: *object*

*Defined in [data-types/src/interfaces.ts:138](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L138)*

#### Type declaration:

___

###  ESTypeMapping

Ƭ **ESTypeMapping**: *[PropertyESTypeMapping](overview.md#propertyestypemapping) | FieldsESTypeMapping | BasicESTypeMapping*

*Defined in [data-types/src/interfaces.ts:154](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L154)*

___

###  ElasticSearchTypes

Ƭ **ElasticSearchTypes**: *"long" | "integer" | "short" | "byte" | "double" | "float" | "keyword" | "text" | "boolean" | "ip" | "ip_range" | "date" | "geo_point" | "geo_shape" | "object"*

*Defined in [data-types/src/interfaces.ts:31](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L31)*

___

###  FieldTypeConfig

Ƭ **FieldTypeConfig**: *object*

*Defined in [data-types/src/interfaces.ts:104](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L104)*

#### Type declaration:

___

###  GetGroupTypeArg

Ƭ **GetGroupTypeArg**: *object*

*Defined in [data-types/src/types/index.ts:51](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/index.ts#L51)*

#### Type declaration:

___

###  GetTypeArg

Ƭ **GetTypeArg**: *object*

*Defined in [data-types/src/types/index.ts:81](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/index.ts#L81)*

#### Type declaration:

___

###  GraphQLOptions

Ƭ **GraphQLOptions**: *object*

*Defined in [data-types/src/interfaces.ts:10](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L10)*

#### Type declaration:

___

###  GraphQLTypeReferences

Ƭ **GraphQLTypeReferences**: *object & object*

*Defined in [data-types/src/interfaces.ts:27](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L27)*

___

###  GraphQLTypesResult

Ƭ **GraphQLTypesResult**: *object*

*Defined in [data-types/src/interfaces.ts:4](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L4)*

#### Type declaration:

___

###  MergeGraphQLOptions

Ƭ **MergeGraphQLOptions**: *object*

*Defined in [data-types/src/interfaces.ts:19](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L19)*

#### Type declaration:

___

###  NestedTypes

Ƭ **NestedTypes**: *object*

*Defined in [data-types/src/types/group-type.ts:5](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/group-type.ts#L5)*

#### Type declaration:

* \[ **field**: *string*\]: [BaseType](classes/basetype.md)

___

###  PropertyESTypeMapping

Ƭ **PropertyESTypeMapping**: *object*

*Defined in [data-types/src/interfaces.ts:173](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L173)*

#### Type declaration:

___

###  PropertyESTypes

Ƭ **PropertyESTypes**: *FieldsESTypeMapping | BasicESTypeMapping*

*Defined in [data-types/src/interfaces.ts:172](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L172)*

___

###  TypeConfigFields

Ƭ **TypeConfigFields**: *object*

*Defined in [data-types/src/interfaces.ts:140](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L140)*

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
]

*Defined in [data-types/src/interfaces.ts:74](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L74)*

___

### `Const` AvailableVersions

• **AvailableVersions**: *keyof AvailableVersion[]* =  [1]

*Defined in [data-types/src/interfaces.ts:102](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/interfaces.ts#L102)*

___

### `Const` GraphQLDataType

• **GraphQLDataType**: *GraphQLScalarType‹›* =  new GraphQLScalarType({
    name: 'GraphQLDataType',
    description: 'Scalar type for data type configs',
    serialize,
    parseValue,
    parseLiteral,
})

*Defined in [data-types/src/graphql-helper.ts:62](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/graphql-helper.ts#L62)*

___

### `Const` LATEST_VERSION

• **LATEST_VERSION**: *[AvailableVersion](overview.md#availableversion)* = 1

*Defined in [data-types/src/types/index.ts:7](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/index.ts#L7)*

## Functions

###  concatUniqueStrings

▸ **concatUniqueStrings**(...`values`: ConcatStrType[]): *string[]*

*Defined in [data-types/src/utils.ts:6](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/utils.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`...values` | ConcatStrType[] |

**Returns:** *string[]*

___

###  formatGQLComment

▸ **formatGQLComment**(`desc?`: undefined | string, `prefix?`: undefined | string): *string*

*Defined in [data-types/src/graphql-helper.ts:84](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/graphql-helper.ts#L84)*

**Parameters:**

Name | Type |
------ | ------ |
`desc?` | undefined &#124; string |
`prefix?` | undefined &#124; string |

**Returns:** *string*

___

###  formatGQLType

▸ **formatGQLType**(`type`: string, `desc?`: undefined | string): *string*

*Defined in [data-types/src/types/base-type.ts:67](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L67)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`desc?` | undefined &#124; string |

**Returns:** *string*

___

###  formatSchema

▸ **formatSchema**(`schemaStr`: string, `removeScalars`: boolean): *string*

*Defined in [data-types/src/graphql-helper.ts:70](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/graphql-helper.ts#L70)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`schemaStr` | string | - |
`removeScalars` | boolean | false |

**Returns:** *string*

___

###  getTypes

▸ **getTypes**(`fields`: [TypeConfigFields](overview.md#typeconfigfields), `version`: 1): *[BaseType](classes/basetype.md)[]*

*Defined in [data-types/src/types/index.ts:14](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/index.ts#L14)*

Instaniate all of the types for the group

**`todo`** support multiple levels deep nesting

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`fields` | [TypeConfigFields](overview.md#typeconfigfields) | - |
`version` | 1 |  LATEST_VERSION |

**Returns:** *[BaseType](classes/basetype.md)[]*

___

###  joinStrings

▸ **joinStrings**(...`values`: ConcatStrType[]): *string*

*Defined in [data-types/src/utils.ts:22](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/utils.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`...values` | ConcatStrType[] |

**Returns:** *string*

___

###  validateDataTypeConfig

▸ **validateDataTypeConfig**(`config`: [DataTypeConfig](overview.md#datatypeconfig)): *[DataTypeConfig](overview.md#datatypeconfig)*

*Defined in [data-types/src/utils.ts:26](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/utils.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [DataTypeConfig](overview.md#datatypeconfig) |

**Returns:** *[DataTypeConfig](overview.md#datatypeconfig)*

___

###  validateField

▸ **validateField**(`field`: any): *boolean*

*Defined in [data-types/src/utils.ts:63](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/utils.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | any |

**Returns:** *boolean*

## Object literals

### `Const` mapping

### ▪ **mapping**: *object*

*Defined in [data-types/src/types/mapping.ts:28](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/mapping.ts#L28)*

▪ **1**: *object*

*Defined in [data-types/src/types/mapping.ts:29](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/mapping.ts#L29)*

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

* **Object**: *[ObjectType](classes/objecttype.md)* =  ObjectV1

* **Short**: *[Short](classes/short.md)* =  ShortV1

* **Text**: *[Text](classes/text.md)* =  TextV1
