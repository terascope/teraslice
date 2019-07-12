---
title: Data Access: `StreamAccess`
sidebar_label: StreamAccess
---

# Class: StreamAccess <**T**>

Using a DataAccess ACL, filter access to specific
records and fields

**`todo`** implement this

## Type parameters

▪ **T**: *object*

## Hierarchy

* **StreamAccess**

### Index

#### Constructors

* [constructor](streamaccess.md#constructor)

#### Methods

* [filter](streamaccess.md#filter)

## Constructors

###  constructor

\+ **new StreamAccess**(`acl`: [DataAccessConfig](../interfaces/dataaccessconfig.md)): *[StreamAccess](streamaccess.md)*

*Defined in [stream-access.ts:9](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/stream-access.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`acl` | [DataAccessConfig](../interfaces/dataaccessconfig.md) |

**Returns:** *[StreamAccess](streamaccess.md)*

## Methods

###  filter

▸ **filter**(`incoming`: `T`[]): *`T`[]*

*Defined in [stream-access.ts:14](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/stream-access.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`incoming` | `T`[] |

**Returns:** *`T`[]*
