---
title: Data Types: `GroupType`
sidebar_label: GroupType
---

# Class: GroupType

## Hierarchy

* [BaseType](basetype.md)

  ↳ **GroupType**

## Index

### Constructors

* [constructor](grouptype.md#constructor)

### Properties

* [config](grouptype.md#config)
* [field](grouptype.md#field)
* [types](grouptype.md#types)
* [version](grouptype.md#version)

### Methods

* [_formatGQLTypeName](grouptype.md#_formatgqltypename)
* [_formatGql](grouptype.md#protected-_formatgql)
* [toESMapping](grouptype.md#toesmapping)
* [toGraphQL](grouptype.md#tographql)
* [toXlucene](grouptype.md#toxlucene)

## Constructors

###  constructor

\+ **new GroupType**(`field`: string, `version`: number, `types`: [NestedTypes](../overview.md#nestedtypes)): *[GroupType](grouptype.md)*

*Overrides [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [data-types/src/types/group-type.ts:9](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/group-type.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`version` | number |
`types` | [NestedTypes](../overview.md#nestedtypes) |

**Returns:** *[GroupType](grouptype.md)*

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

###  types

• **types**: *[NestedTypes](../overview.md#nestedtypes)*

*Defined in [data-types/src/types/group-type.ts:9](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/group-type.ts#L9)*

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

▸ **toESMapping**(`version?`: undefined | number): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [data-types/src/types/group-type.ts:16](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/group-type.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined &#124; number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(`options`: [ToGraphQLOptions](../overview.md#tographqloptions)): *[GraphQLType](../interfaces/graphqltype.md)*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [data-types/src/types/group-type.ts:49](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/group-type.ts#L49)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`options` | [ToGraphQLOptions](../overview.md#tographqloptions) |  {} |

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

###  toXlucene

▸ **toXlucene**(): *XluceneTypeConfig*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [data-types/src/types/group-type.ts:91](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/types/group-type.ts#L91)*

**Returns:** *XluceneTypeConfig*
