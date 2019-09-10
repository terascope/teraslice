---
title: Data Types: `TypesManager`
sidebar_label: TypesManager
---

# Class: TypesManager

## Hierarchy

* **TypesManager**

## Index

### Constructors

* [constructor](typesmanager.md#constructor)

### Properties

* [version](typesmanager.md#version)

### Methods

* [getType](typesmanager.md#gettype)
* [getTypes](typesmanager.md#gettypes)

## Constructors

###  constructor

\+ **new TypesManager**(`version`: [AvailableVersion](../overview.md#availableversion)): *[TypesManager](typesmanager.md)*

*Defined in [types/index.ts:7](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/index.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`version` | [AvailableVersion](../overview.md#availableversion) |

**Returns:** *[TypesManager](typesmanager.md)*

## Properties

###  version

• **version**: *[AvailableVersion](../overview.md#availableversion)*

*Defined in [types/index.ts:7](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/index.ts#L7)*

## Methods

###  getType

▸ **getType**(`field`: string, `type`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[BaseType](basetype.md)*

*Defined in [types/index.ts:22](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/index.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`type` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[BaseType](basetype.md)*

___

###  getTypes

▸ **getTypes**(`fields`: [TypeConfigFields](../overview.md#typeconfigfields)): *[BaseType](basetype.md)[]*

*Defined in [types/index.ts:14](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/index.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`fields` | [TypeConfigFields](../overview.md#typeconfigfields) |

**Returns:** *[BaseType](basetype.md)[]*
