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

*Defined in [data-types/src/types/group-type.ts:9](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/group-type.ts#L9)*

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

*Defined in [data-types/src/types/base-type.ts:15](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L15)*

___

###  field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#field)*

*Defined in [data-types/src/types/base-type.ts:14](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L14)*

___

###  types

• **types**: *[NestedTypes](../overview.md#nestedtypes)*

*Defined in [data-types/src/types/group-type.ts:8](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/group-type.ts#L8)*

___

###  version

• **version**: *number*

*Defined in [data-types/src/types/group-type.ts:9](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/group-type.ts#L9)*

## Methods

###  _formatGQLTypeName

▸ **_formatGQLTypeName**(`typeName`: string, `isInput?`: undefined | false | true, `includeField?`: undefined | false | true, `version?`: undefined | number): *string*

*Inherited from [BaseType](basetype.md).[_formatGQLTypeName](basetype.md#_formatgqltypename)*

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

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [data-types/src/types/base-type.ts:29](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L29)*

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

*Defined in [data-types/src/types/group-type.ts:17](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/group-type.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined &#124; number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(`typeName?`: undefined | string, `isInput?`: undefined | false | true, `includePrivate?`: undefined | false | true): *[GraphQLType](../interfaces/graphqltype.md)*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [data-types/src/types/group-type.ts:50](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/group-type.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`typeName?` | undefined &#124; string |
`isInput?` | undefined &#124; false &#124; true |
`includePrivate?` | undefined &#124; false &#124; true |

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

###  toXlucene

▸ **toXlucene**(): *TypeConfig*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [data-types/src/types/group-type.ts:89](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/group-type.ts#L89)*

**Returns:** *TypeConfig*
