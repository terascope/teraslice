---
title: Data Types: `KeywordCaseInsensitive`
sidebar_label: KeywordCaseInsensitive
---

# Class: KeywordCaseInsensitive

## Hierarchy

* [BaseType](basetype.md)

  ↳ **KeywordCaseInsensitive**

## Index

### Constructors

* [constructor](keywordcaseinsensitive.md#constructor)

### Properties

* [config](keywordcaseinsensitive.md#config)
* [field](keywordcaseinsensitive.md#field)
* [version](keywordcaseinsensitive.md#version)

### Methods

* [_formatGQLTypeName](keywordcaseinsensitive.md#_formatgqltypename)
* [_formatGql](keywordcaseinsensitive.md#protected-_formatgql)
* [toESMapping](keywordcaseinsensitive.md#toesmapping)
* [toGraphQL](keywordcaseinsensitive.md#tographql)
* [toXlucene](keywordcaseinsensitive.md#toxlucene)

## Constructors

###  constructor

\+ **new KeywordCaseInsensitive**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig), `version`: number): *[KeywordCaseInsensitive](keywordcaseinsensitive.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/base-type.ts:23](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/base-type.ts#L23)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`field` | string | - |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) | - |
`version` | number | 1 |

**Returns:** *[KeywordCaseInsensitive](keywordcaseinsensitive.md)*

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

*Defined in [types/v1/keyword-case-insensitive.ts:5](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/v1/keyword-case-insensitive.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`_version?` | undefined &#124; number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *[GraphQLType](../interfaces/graphqltype.md)*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/v1/keyword-case-insensitive.ts:30](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/v1/keyword-case-insensitive.ts#L30)*

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/v1/keyword-case-insensitive.ts:34](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/types/v1/keyword-case-insensitive.ts#L34)*

**Returns:** *object*
