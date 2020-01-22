---
title: Data Types: `IPType`
sidebar_label: IPType
---

# Class: IPType

## Hierarchy

* [BaseType](basetype.md)

  ↳ **IPType**

## Index

### Constructors

* [constructor](iptype.md#constructor)

### Properties

* [config](iptype.md#config)
* [field](iptype.md#field)

### Methods

* [_formatGQLTypeName](iptype.md#_formatgqltypename)
* [_formatGql](iptype.md#protected-_formatgql)
* [toESMapping](iptype.md#toesmapping)
* [toGraphQL](iptype.md#tographql)
* [toXlucene](iptype.md#toxlucene)

## Constructors

###  constructor

\+ **new IPType**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[IPType](iptype.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [data-types/src/types/base-type.ts:15](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/base-type.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[IPType](iptype.md)*

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

▸ **toESMapping**(`_version?`: undefined | number): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [data-types/src/types/v1/ip.ts:6](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/v1/ip.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`_version?` | undefined &#124; number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *[GraphQLType](../interfaces/graphqltype.md)*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [data-types/src/types/v1/ip.ts:10](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/v1/ip.ts#L10)*

**Returns:** *[GraphQLType](../interfaces/graphqltype.md)*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [data-types/src/types/v1/ip.ts:14](https://github.com/terascope/teraslice/blob/78714a985/packages/data-types/src/types/v1/ip.ts#L14)*

**Returns:** *object*
