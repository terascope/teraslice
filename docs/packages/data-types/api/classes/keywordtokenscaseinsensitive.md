---
title: Data Types: `KeywordTokensCaseInsensitive`
sidebar_label: KeywordTokensCaseInsensitive
---

# Class: KeywordTokensCaseInsensitive

## Hierarchy

* [BaseType](basetype.md)

  ↳ **KeywordTokensCaseInsensitive**

## Index

### Constructors

* [constructor](keywordtokenscaseinsensitive.md#constructor)

### Properties

* [config](keywordtokenscaseinsensitive.md#config)
* [field](keywordtokenscaseinsensitive.md#field)
* [version](keywordtokenscaseinsensitive.md#version)

### Methods

* [_formatGQLTypeName](keywordtokenscaseinsensitive.md#_formatgqltypename)
* [_formatGql](keywordtokenscaseinsensitive.md#protected-_formatgql)
* [toESMapping](keywordtokenscaseinsensitive.md#toesmapping)
* [toGraphQL](keywordtokenscaseinsensitive.md#tographql)
* [toXlucene](keywordtokenscaseinsensitive.md#toxlucene)

## Constructors

###  constructor

\+ **new KeywordTokensCaseInsensitive**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig), `version`: number): *[KeywordTokensCaseInsensitive](keywordtokenscaseinsensitive.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/base-type.ts:23](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L23)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`field` | string | - |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) | - |
`version` | number | 1 |

**Returns:** *[KeywordTokensCaseInsensitive](keywordtokenscaseinsensitive.md)*

## Properties

###  config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#config)*

*Defined in [types/base-type.ts:22](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L22)*

___

###  field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#field)*

*Defined in [types/base-type.ts:21](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L21)*

___

###  version

• **version**: *number*

*Inherited from [BaseType](basetype.md).[version](basetype.md#version)*

*Defined in [types/base-type.ts:23](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L23)*

## Methods

###  _formatGQLTypeName

▸ **_formatGQLTypeName**(`typeName`: string, `isInput?`: undefined | false | true, `inputSuffix`: string): *string*

*Inherited from [BaseType](basetype.md).[_formatGQLTypeName](basetype.md#_formatgqltypename)*

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

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/base-type.ts:35](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`customType?` | string &#124; Array |

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

###  toESMapping

▸ **toESMapping**(`_version?`: undefined | number): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/v1/keyword-tokens-case-insensitive.ts:5](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/v1/keyword-tokens-case-insensitive.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`_version?` | undefined &#124; number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *[GraphQLType](../interfaces/graphqltype.md)*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/v1/keyword-tokens-case-insensitive.ts:28](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/v1/keyword-tokens-case-insensitive.ts#L28)*

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/v1/keyword-tokens-case-insensitive.ts:32](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/v1/keyword-tokens-case-insensitive.ts#L32)*

**Returns:** *object*
