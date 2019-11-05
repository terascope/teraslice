---
title: Data Types: `ObjectType`
sidebar_label: ObjectType
---

# Class: ObjectType

## Hierarchy

* [BaseType](basetype.md)

  ↳ **ObjectType**

## Index

### Constructors

* [constructor](objecttype.md#constructor)

### Properties

* [config](objecttype.md#protected-config)
* [field](objecttype.md#protected-field)

### Methods

* [_formatGql](objecttype.md#protected-_formatgql)
* [toESMapping](objecttype.md#toesmapping)
* [toGraphQL](objecttype.md#tographql)
* [toXlucene](objecttype.md#toxlucene)

## Constructors

###  constructor

\+ **new ObjectType**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[ObjectType](objecttype.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[ObjectType](objecttype.md)*

## Properties

### `Protected` config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: string, `customType?`: undefined | string): *object*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/base-type.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`customType?` | undefined &#124; string |

**Returns:** *object*

___

###  toESMapping

▸ **toESMapping**(`_version?`: undefined | number): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/object.ts:7](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/v1/object.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`_version?` | undefined &#124; number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/object.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/v1/object.ts#L11)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/object.ts:15](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/v1/object.ts#L15)*

**Returns:** *object*
