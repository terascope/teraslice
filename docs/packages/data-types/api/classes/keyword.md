---
title: Data Types :: Keyword
sidebar_label: Keyword
---

# Class: Keyword

## Hierarchy

* [BaseType](basetype.md)

  * **Keyword**

### Index

#### Constructors

* [constructor](keyword.md#constructor)

#### Properties

* [config](keyword.md#protected-config)
* [field](keyword.md#protected-field)

#### Methods

* [_formatGql](keyword.md#protected-_formatgql)
* [toESMapping](keyword.md#toesmapping)
* [toGraphQL](keyword.md#tographql)
* [toXlucene](keyword.md#toxlucene)

## Constructors

###  constructor

\+ **new Keyword**(`field`: *string*, `config`: *[Type](../overview.md#type)*): *[Keyword](keyword.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [Type](../overview.md#type) |

**Returns:** *[Keyword](keyword.md)*

## Properties

### `Protected` config

• **config**: *[Type](../overview.md#type)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: *string*): *string*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:19](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/types/versions/base-type.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |

**Returns:** *string*

___

###  toESMapping

▸ **toESMapping**(`version?`: *undefined | number*): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/keyword.ts:6](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/types/versions/v1/keyword.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/keyword.ts:10](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/types/versions/v1/keyword.ts#L10)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/keyword.ts:14](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/types/versions/v1/keyword.ts#L14)*

**Returns:** *object*
