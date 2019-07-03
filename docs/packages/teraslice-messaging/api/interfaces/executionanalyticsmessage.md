---
title: Teraslice Messaging :: ExecutionAnalyticsMessage
sidebar_label: ExecutionAnalyticsMessage
---

# Interface: ExecutionAnalyticsMessage

## Hierarchy

* [Message](message.md)

  * **ExecutionAnalyticsMessage**

### Index

#### Properties

* [error](executionanalyticsmessage.md#optional-error)
* [eventName](executionanalyticsmessage.md#eventname)
* [from](executionanalyticsmessage.md#from)
* [id](executionanalyticsmessage.md#id)
* [kind](executionanalyticsmessage.md#kind)
* [payload](executionanalyticsmessage.md#payload)
* [respondBy](executionanalyticsmessage.md#respondby)
* [response](executionanalyticsmessage.md#optional-response)
* [stats](executionanalyticsmessage.md#stats)
* [to](executionanalyticsmessage.md#to)
* [volatile](executionanalyticsmessage.md#optional-volatile)

## Properties

### `Optional` error

• **error**? : *[ResponseError](../overview.md#responseerror)*

*Inherited from [Message](message.md).[error](message.md#optional-error)*

*Defined in [messenger/interfaces.ts:54](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-messaging/src/messenger/interfaces.ts#L54)*

___

###  eventName

• **eventName**: *string*

*Inherited from [Message](message.md).[eventName](message.md#eventname)*

*Defined in [messenger/interfaces.ts:49](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-messaging/src/messenger/interfaces.ts#L49)*

___

###  from

• **from**: *string*

*Inherited from [Message](message.md).[from](message.md#from)*

*Defined in [messenger/interfaces.ts:47](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-messaging/src/messenger/interfaces.ts#L47)*

___

###  id

• **id**: *string*

*Inherited from [Message](message.md).[id](message.md#id)*

*Defined in [messenger/interfaces.ts:46](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-messaging/src/messenger/interfaces.ts#L46)*

___

###  kind

• **kind**: *string*

*Defined in [cluster-master/interfaces.ts:58](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L58)*

___

###  payload

• **payload**: *[Payload](payload.md)*

*Inherited from [Message](message.md).[payload](message.md#payload)*

*Defined in [messenger/interfaces.ts:50](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-messaging/src/messenger/interfaces.ts#L50)*

___

###  respondBy

• **respondBy**: *number*

*Inherited from [Message](message.md).[respondBy](message.md#respondby)*

*Defined in [messenger/interfaces.ts:51](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-messaging/src/messenger/interfaces.ts#L51)*

___

### `Optional` response

• **response**? : *undefined | false | true*

*Inherited from [Message](message.md).[response](message.md#optional-response)*

*Defined in [messenger/interfaces.ts:52](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-messaging/src/messenger/interfaces.ts#L52)*

___

###  stats

• **stats**: *[ExecutionAnalytics](executionanalytics.md)*

*Defined in [cluster-master/interfaces.ts:59](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L59)*

___

###  to

• **to**: *string*

*Inherited from [Message](message.md).[to](message.md#to)*

*Defined in [messenger/interfaces.ts:48](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-messaging/src/messenger/interfaces.ts#L48)*

___

### `Optional` volatile

• **volatile**? : *undefined | false | true*

*Inherited from [Message](message.md).[volatile](message.md#optional-volatile)*

*Defined in [messenger/interfaces.ts:53](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/teraslice-messaging/src/messenger/interfaces.ts#L53)*

