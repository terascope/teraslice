---
title: Teraslice Messaging :: Message
sidebar_label: Message
---

# Interface: Message

## Hierarchy

* **Message**

  * [ExecutionAnalyticsMessage](executionanalyticsmessage.md)

### Index

#### Properties

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

*Defined in [messenger/interfaces.ts:54](https://github.com/terascope/teraslice/blob/6e018493/packages/teraslice-messaging/src/messenger/interfaces.ts#L54)*

___

###  eventName

• **eventName**: *string*

*Defined in [messenger/interfaces.ts:49](https://github.com/terascope/teraslice/blob/6e018493/packages/teraslice-messaging/src/messenger/interfaces.ts#L49)*

___

###  from

• **from**: *string*

*Defined in [messenger/interfaces.ts:47](https://github.com/terascope/teraslice/blob/6e018493/packages/teraslice-messaging/src/messenger/interfaces.ts#L47)*

___

###  id

• **id**: *string*

*Defined in [messenger/interfaces.ts:46](https://github.com/terascope/teraslice/blob/6e018493/packages/teraslice-messaging/src/messenger/interfaces.ts#L46)*

___

###  payload

• **payload**: *[Payload](payload.md)*

*Defined in [messenger/interfaces.ts:50](https://github.com/terascope/teraslice/blob/6e018493/packages/teraslice-messaging/src/messenger/interfaces.ts#L50)*

___

###  respondBy

• **respondBy**: *number*

*Defined in [messenger/interfaces.ts:51](https://github.com/terascope/teraslice/blob/6e018493/packages/teraslice-messaging/src/messenger/interfaces.ts#L51)*

___

### `Optional` response

• **response**? : *undefined | false | true*

*Defined in [messenger/interfaces.ts:52](https://github.com/terascope/teraslice/blob/6e018493/packages/teraslice-messaging/src/messenger/interfaces.ts#L52)*

___

###  to

• **to**: *string*

*Defined in [messenger/interfaces.ts:48](https://github.com/terascope/teraslice/blob/6e018493/packages/teraslice-messaging/src/messenger/interfaces.ts#L48)*

___

### `Optional` volatile

• **volatile**? : *undefined | false | true*

*Defined in [messenger/interfaces.ts:53](https://github.com/terascope/teraslice/blob/6e018493/packages/teraslice-messaging/src/messenger/interfaces.ts#L53)*
