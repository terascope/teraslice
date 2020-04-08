---
title: Teraslice Messaging: `SocketEmitter`
sidebar_label: SocketEmitter
---

# Interface: SocketEmitter

## Hierarchy

* **SocketEmitter**

## Index

### Methods

* [emit](socketemitter.md#emit)
* [on](socketemitter.md#on)

## Methods

###  emit

▸ **emit**(`eventName`: string, `msg`: [Message](message.md)): *void*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:120](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/interfaces.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`eventName` | string |
`msg` | [Message](message.md) |

**Returns:** *void*

___

###  on

▸ **on**(`eventName`: string, `fn`: function): *void*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:119](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/interfaces.ts#L119)*

**Parameters:**

▪ **eventName**: *string*

▪ **fn**: *function*

▸ (`msg`: [Message](message.md)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`msg` | [Message](message.md) |

**Returns:** *void*
