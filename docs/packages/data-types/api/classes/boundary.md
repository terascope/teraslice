---
title: Data Types: `Boundary`
sidebar_label: Boundary
---

# Class: Boundary

## Hierarchy

* [BaseType](basetype.md)

  * **Boundary**

### Index

#### Constructors

* [constructor](boundary.md#constructor)

#### Properties

* [config](boundary.md#protected-config)
* [field](boundary.md#protected-field)

#### Methods

* [_formatGql](boundary.md#protected-_formatgql)
* [toESMapping](boundary.md#toesmapping)
* [toGraphQL](boundary.md#tographql)
* [toXlucene](boundary.md#toxlucene)

## Constructors

###  constructor

\+ **new Boundary**(`field`: *string*, `config`: *[Type](../overview.md#type)*): *[Boundary](boundary.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [Type](../overview.md#type) |

**Returns:** *[Boundary](boundary.md)*

## Properties

### `Protected` config

• **config**: *[Type](../overview.md#type)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: *string*): *string*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:19](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/base-type.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |

**Returns:** *string*

___

###  toESMapping

▸ **toESMapping**(`version?`: *undefined | number*): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/boundary.ts:6](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/v1/boundary.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/boundary.ts:19](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/v1/boundary.ts#L19)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/boundary.ts:29](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/v1/boundary.ts#L29)*

**Returns:** *object*
