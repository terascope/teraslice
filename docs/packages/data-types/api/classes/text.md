---
title: Data Types :: Text
sidebar_label: Text
---

# Class: Text

## Hierarchy

* [BaseType](basetype.md)

  * **Text**

### Index

#### Constructors

* [constructor](text.md#constructor)

#### Properties

* [config](text.md#protected-config)
* [field](text.md#protected-field)

#### Methods

* [_formatGql](text.md#protected-_formatgql)
* [toESMapping](text.md#toesmapping)
* [toGraphQL](text.md#tographql)
* [toXlucene](text.md#toxlucene)

## Constructors

###  constructor

\+ **new Text**(`field`: *string*, `config`: *[Type](../overview.md#type)*): *[Text](text.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [Type](../overview.md#type) |

**Returns:** *[Text](text.md)*

## Properties

### `Protected` config

• **config**: *[Type](../overview.md#type)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: *string*): *string*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:19](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/data-types/src/types/versions/base-type.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |

**Returns:** *string*

___

###  toESMapping

▸ **toESMapping**(`version?`: *undefined | number*): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/text.ts:6](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/data-types/src/types/versions/v1/text.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/text.ts:10](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/data-types/src/types/versions/v1/text.ts#L10)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/text.ts:14](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/data-types/src/types/versions/v1/text.ts#L14)*

**Returns:** *object*
