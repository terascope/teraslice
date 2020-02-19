---
title: Data Types: `Long`
sidebar_label: Long
---

# Class: Long

## Hierarchy

* [BaseType](basetype.md)

  ↳ **Long**

## Index

### Constructors

* [constructor](long.md#constructor)

### Properties

* [config](long.md#config)
* [field](long.md#field)
* [version](long.md#version)

### Methods

* [_formatGQLTypeName](long.md#_formatgqltypename)
* [_formatGql](long.md#protected-_formatgql)
* [toESMapping](long.md#toesmapping)
* [toGraphQL](long.md#tographql)
* [toXlucene](long.md#toxlucene)

## Constructors

###  constructor

\+ **new Long**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig), `version`: number): *[Long](long.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [data-types/src/types/base-type.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/base-type.ts#L23)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`field` | string | - |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) | - |
`version` | number | 1 |

**Returns:** *[Long](long.md)*

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

*Defined in [data-types/src/types/v1/long.ts:6](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/v1/long.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`_version?` | undefined &#124; number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *[GraphQLType](../interfaces/graphqltype.md)*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [data-types/src/types/v1/long.ts:10](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/v1/long.ts#L10)*

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [data-types/src/types/v1/long.ts:14](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/v1/long.ts#L14)*

**Returns:** *object*
