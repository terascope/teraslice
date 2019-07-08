---
title: Teraslice Messaging: `SocketEmitter`
sidebar_label: SocketEmitter
---

# Interface: SocketEmitter

## Hierarchy

* **SocketEmitter**

### Index

#### Methods

* [emit](socketemitter.md#emit)
* [on](socketemitter.md#on)

## Methods

###  emit

▸ **emit**(`eventName`: *string*, `msg`: *[Message](message.md)*): *void*

*Defined in [messenger/interfaces.ts:123](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/interfaces.ts#L123)*

**Parameters:**

Name | Type |
------ | ------ |
`eventName` | string |
`msg` | [Message](message.md) |

**Returns:** *void*

___

###  on

▸ **on**(`eventName`: *string*, `fn`: *function*): *void*

*Defined in [messenger/interfaces.ts:122](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/interfaces.ts#L122)*

**Parameters:**

▪ **eventName**: *string*

▪ **fn**: *function*

▸ (`msg`: *[Message](message.md)*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`msg` | [Message](message.md) |

**Returns:** *void*
