---
title: Data Types: `Keyword`
sidebar_label: Keyword
---

# Class: Keyword

## Hierarchy

* [BaseType](basetype.md)

  ↳ **Keyword**

## Index

### Constructors

* [constructor](keyword.md#constructor)

### Properties

* [config](keyword.md#config)
* [field](keyword.md#field)
* [version](keyword.md#version)

### Methods

* [_formatGQLTypeName](keyword.md#_formatgqltypename)
* [_formatGql](keyword.md#protected-_formatgql)
* [toESMapping](keyword.md#toesmapping)
* [toGraphQL](keyword.md#tographql)
* [toXlucene](keyword.md#toxlucene)

## Constructors

###  constructor

\+ **new Keyword**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig), `version`: number): *[Keyword](keyword.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [data-types/src/types/base-type.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/base-type.ts#L23)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`field` | string | - |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) | - |
`version` | number | 1 |

**Returns:** *[Keyword](keyword.md)*

## Properties

###  config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#config)*

*Defined in [data-types/src/types/base-type.ts:22](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/base-type.ts#L22)*

___

###  field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#field)*

*Defined in [data-types/src/types/base-type.ts:21](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/base-type.ts#L21)*

___

###  version

• **version**: *number*

*Inherited from [BaseType](basetype.md).[version](basetype.md#version)*

*Defined in [data-types/src/types/base-type.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/base-type.ts#L23)*

## Methods

###  _formatGQLTypeName

▸ **_formatGQLTypeName**(`typeName`: string, `isInput?`: undefined | false | true, `inputSuffix`: string): *string*

*Inherited from [BaseType](basetype.md).[_formatGQLTypeName](basetype.md#_formatgqltypename)*

*Defined in [data-types/src/types/base-type.ts:55](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/base-type.ts#L55)*

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

*Defined in [data-types/src/types/base-type.ts:38](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/base-type.ts#L38)*

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

*Defined in [data-types/src/types/v1/keyword.ts:6](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/v1/keyword.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`_version?` | undefined &#124; number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *[GraphQLType](../interfaces/graphqltype.md)*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [data-types/src/types/v1/keyword.ts:10](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/v1/keyword.ts#L10)*

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [data-types/src/types/v1/keyword.ts:17](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/v1/keyword.ts#L17)*

**Returns:** *object*
