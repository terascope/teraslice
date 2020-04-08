---
title: Teraslice Messaging: `Message`
sidebar_label: Message
---

# Interface: Message

## Hierarchy

* **Message**

  ↳ [ExecutionAnalyticsMessage](executionanalyticsmessage.md)

## Index

### Properties

* [error](message.md#optional-error)
* [eventName](message.md#eventname)
* [from](message.md#from)
* [id](message.md#id)
* [payload](message.md#payload)
* [respondBy](message.md#respondby)
* [response](message.md#optional-response)
* [to](message.md#to)
* [volatile](message.md#optional-volatile)

## Properties

### `Optional` error

• **error**? : *[ResponseError](../overview.md#responseerror)*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:53](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/interfaces.ts#L53)*

___

###  eventName

• **eventName**: *string*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:48](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/interfaces.ts#L48)*

___

###  from

• **from**: *string*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:46](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/interfaces.ts#L46)*

___

###  id

• **id**: *string*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:45](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/interfaces.ts#L45)*

___

###  payload

• **payload**: *[Payload](payload.md)*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:49](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/interfaces.ts#L49)*

___

###  respondBy

• **respondBy**: *number*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:50](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/interfaces.ts#L50)*

___

### `Optional` response

• **response**? : *undefined | false | true*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:51](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/interfaces.ts#L51)*

___

###  to

• **to**: *string*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:47](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/interfaces.ts#L47)*

___

### `Optional` volatile

• **volatile**? : *undefined | false | true*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:52](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/interfaces.ts#L52)*
