---
title: Teraslice Messaging: `Client`
sidebar_label: Client
---

# Class: Client

## Hierarchy

  * [Core](core.md)

  * [Client](client.md)

  * [Client](client.md)

  * **Client**

  * [Client](client.md)

  * [Client](client.md)

### Index

#### Constructors

* [constructor](client.md#constructor)

#### Properties

* [actionTimeout](client.md#protected-actiontimeout)
* [available](client.md#available)
* [clientId](client.md#clientid)
* [clientType](client.md#clienttype)
* [closed](client.md#closed)
* [connectTimeout](client.md#connecttimeout)
* [exId](client.md#exid)
* [hostUrl](client.md#hosturl)
* [logger](client.md#protected-logger)
* [networkLatencyBuffer](client.md#protected-networklatencybuffer)
* [ready](client.md#protected-ready)
* [serverName](client.md#servername)
* [serverShutdown](client.md#protected-servershutdown)
* [socket](client.md#socket)
* [workerId](client.md#workerid)
* [defaultMaxListeners](client.md#static-defaultmaxlisteners)

#### Methods

* [addListener](client.md#addlistener)
* [close](client.md#close)
* [connect](client.md#connect)
* [emit](client.md#emit)
* [eventNames](client.md#eventnames)
* [forceReconnect](client.md#forcereconnect)
* [getMaxListeners](client.md#getmaxlisteners)
* [getTimeout](client.md#gettimeout)
* [getTimeoutWithMax](client.md#gettimeoutwithmax)
* [handleResponse](client.md#protected-handleresponse)
* [handleSendResponse](client.md#protected-handlesendresponse)
* [isClientReady](client.md#isclientready)
* [listenerCount](client.md#listenercount)
* [listeners](client.md#listeners)
* [off](client.md#off)
* [on](client.md#on)
* [onExecutionAnalytics](client.md#onexecutionanalytics)
* [onExecutionFinished](client.md#onexecutionfinished)
* [onExecutionPause](client.md#onexecutionpause)
* [onExecutionResume](client.md#onexecutionresume)
* [onServerShutdown](client.md#onservershutdown)
* [once](client.md#once)
* [onceWithTimeout](client.md#oncewithtimeout)
* [prependListener](client.md#prependlistener)
* [prependOnceListener](client.md#prependoncelistener)
* [rawListeners](client.md#rawlisteners)
* [removeAllListeners](client.md#removealllisteners)
* [removeListener](client.md#removelistener)
* [send](client.md#protected-send)
* [sendAvailable](client.md#sendavailable)
* [sendClusterAnalytics](client.md#sendclusteranalytics)
* [sendExecutionFinished](client.md#sendexecutionfinished)
* [sendSliceComplete](client.md#sendslicecomplete)
* [sendUnavailable](client.md#sendunavailable)
* [setMaxListeners](client.md#setmaxlisteners)
* [shutdown](client.md#shutdown)
* [start](client.md#start)
* [waitForClientReady](client.md#waitforclientready)
* [waitForSlice](client.md#waitforslice)
* [listenerCount](client.md#static-listenercount)

## Constructors

###  constructor

\+ **new Client**(`opts`: *[ClientOptions](../interfaces/clientoptions.md)*): *[Client](client.md)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [messenger/client.ts:18](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`opts` | [ClientOptions](../interfaces/clientoptions.md) |

**Returns:** *[Client](client.md)*

## Properties

### `Protected` actionTimeout

• **actionTimeout**: *number*

*Inherited from [Core](core.md).[actionTimeout](core.md#protected-actiontimeout)*

*Overrides [Core](core.md).[actionTimeout](core.md#protected-actiontimeout)*

*Defined in [messenger/core.ts:12](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/core.ts#L12)*

___

###  available

• **available**: *boolean*

*Overrides [Client](client.md).[available](client.md#available)*

*Defined in [messenger/client.ts:16](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L16)*

___

###  clientId

• **clientId**: *string*

*Overrides [Client](client.md).[clientId](client.md#clientid)*

*Defined in [messenger/client.ts:11](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L11)*

___

###  clientType

• **clientType**: *string*

*Overrides [Client](client.md).[clientType](client.md#clienttype)*

*Defined in [messenger/client.ts:12](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L12)*

___

###  closed

• **closed**: *boolean* = false

*Inherited from [Core](core.md).[closed](core.md#closed)*

*Overrides [Core](core.md).[closed](core.md#closed)*

*Defined in [messenger/core.ts:9](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/core.ts#L9)*

___

###  connectTimeout

• **connectTimeout**: *number*

*Overrides [Client](client.md).[connectTimeout](client.md#connecttimeout)*

*Defined in [messenger/client.ts:14](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L14)*

___

###  exId

• **exId**: *string*

*Defined in [cluster-master/client.ts:6](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/cluster-master/client.ts#L6)*

___

###  hostUrl

• **hostUrl**: *string*

*Overrides [Client](client.md).[hostUrl](client.md#hosturl)*

*Defined in [messenger/client.ts:15](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L15)*

___

### `Protected` logger

• **logger**: *`Logger`*

*Inherited from [Core](core.md).[logger](core.md#protected-logger)*

*Overrides [Core](core.md).[logger](core.md#protected-logger)*

*Defined in [messenger/core.ts:13](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/core.ts#L13)*

___

### `Protected` networkLatencyBuffer

• **networkLatencyBuffer**: *number*

*Inherited from [Core](core.md).[networkLatencyBuffer](core.md#protected-networklatencybuffer)*

*Overrides [Core](core.md).[networkLatencyBuffer](core.md#protected-networklatencybuffer)*

*Defined in [messenger/core.ts:11](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/core.ts#L11)*

___

### `Protected` ready

• **ready**: *boolean*

*Overrides [Client](client.md).[ready](client.md#protected-ready)*

*Defined in [messenger/client.ts:17](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L17)*

___

###  serverName

• **serverName**: *string*

*Overrides [Client](client.md).[serverName](client.md#servername)*

*Defined in [messenger/client.ts:13](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L13)*

___

### `Protected` serverShutdown

• **serverShutdown**: *boolean*

*Overrides [Client](client.md).[serverShutdown](client.md#protected-servershutdown)*

*Defined in [messenger/client.ts:18](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L18)*

___

###  socket

• **socket**: *`Socket`*

*Overrides [Client](client.md).[socket](client.md#socket)*

*Defined in [messenger/client.ts:10](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L10)*

___

###  workerId

• **workerId**: *string*

*Defined in [execution-controller/client.ts:8](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/execution-controller/client.ts#L8)*

___

### `Static` defaultMaxListeners

▪ **defaultMaxListeners**: *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:9

## Methods

###  addListener

▸ **addListener**(`event`: *string | symbol*, `listener`: *function*): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:11

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: *any[]*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  close

▸ **close**(): *void*

*Inherited from [Core](core.md).[close](core.md#close)*

*Overrides [Core](core.md).[close](core.md#close)*

*Defined in [messenger/core.ts:35](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/core.ts#L35)*

**Returns:** *void*

___

###  connect

▸ **connect**(): *`Promise<void>`*

*Overrides [Client](client.md).[connect](client.md#connect)*

*Defined in [messenger/client.ts:86](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L86)*

**Returns:** *`Promise<void>`*

___

###  emit

▸ **emit**(`eventName`: *string*, `msg`: *[ClientEventMessage](../interfaces/clienteventmessage.md)*): *void*

*Overrides [Core](core.md).[emit](core.md#emit)*

*Defined in [messenger/client.ts:229](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L229)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`eventName` | string | - |
`msg` | [ClientEventMessage](../interfaces/clienteventmessage.md) |  { payload: {} } |

**Returns:** *void*

___

###  eventNames

▸ **eventNames**(): *`Array<string | symbol>`*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:24

**Returns:** *`Array<string | symbol>`*

___

###  forceReconnect

▸ **forceReconnect**(): *`Promise<unknown>`*

*Overrides [Client](client.md).[forceReconnect](client.md#forcereconnect)*

*Defined in [messenger/client.ts:265](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L265)*

**Returns:** *`Promise<unknown>`*

___

###  getMaxListeners

▸ **getMaxListeners**(): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:20

**Returns:** *number*

___

###  getTimeout

▸ **getTimeout**(`timeout?`: *undefined | number*): *number*

*Inherited from [Core](core.md).[getTimeout](core.md#gettimeout)*

*Overrides [Core](core.md).[getTimeout](core.md#gettimeout)*

*Defined in [messenger/core.ts:119](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/core.ts#L119)*

**Parameters:**

Name | Type |
------ | ------ |
`timeout?` | undefined \| number |

**Returns:** *number*

___

###  getTimeoutWithMax

▸ **getTimeoutWithMax**(`maxTimeout`: *number*): *number*

*Inherited from [Core](core.md).[getTimeoutWithMax](core.md#gettimeoutwithmax)*

*Overrides [Core](core.md).[getTimeoutWithMax](core.md#gettimeoutwithmax)*

*Defined in [messenger/core.ts:114](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/core.ts#L114)*

**Parameters:**

Name | Type |
------ | ------ |
`maxTimeout` | number |

**Returns:** *number*

___

### `Protected` handleResponse

▸ **handleResponse**(`socket`: *[SocketEmitter](../interfaces/socketemitter.md)*, `eventName`: *string*, `fn`: *[MessageHandler](../interfaces/messagehandler.md)*): *void*

*Inherited from [Core](core.md).[handleResponse](core.md#protected-handleresponse)*

*Overrides [Core](core.md).[handleResponse](core.md#protected-handleresponse)*

*Defined in [messenger/core.ts:62](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/core.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`socket` | [SocketEmitter](../interfaces/socketemitter.md) |
`eventName` | string |
`fn` | [MessageHandler](../interfaces/messagehandler.md) |

**Returns:** *void*

___

### `Protected` handleSendResponse

▸ **handleSendResponse**(`sent`: *[Message](../interfaces/message.md)*): *`Promise<Message | null>`*

*Inherited from [Core](core.md).[handleSendResponse](core.md#protected-handlesendresponse)*

*Overrides [Core](core.md).[handleSendResponse](core.md#protected-handlesendresponse)*

*Defined in [messenger/core.ts:40](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/core.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`sent` | [Message](../interfaces/message.md) |

**Returns:** *`Promise<Message | null>`*

___

###  isClientReady

▸ **isClientReady**(): *boolean*

*Overrides [Core](core.md).[isClientReady](core.md#isclientready)*

*Defined in [messenger/client.ts:234](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L234)*

**Returns:** *boolean*

___

###  listenerCount

▸ **listenerCount**(`type`: *string | symbol*): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:25

**Parameters:**

Name | Type |
------ | ------ |
`type` | string \| symbol |

**Returns:** *number*

___

###  listeners

▸ **listeners**(`event`: *string | symbol*): *`Function`[]*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:21

**Parameters:**

Name | Type |
------ | ------ |
`event` | string \| symbol |

**Returns:** *`Function`[]*

___

###  off

▸ **off**(`event`: *string | symbol*, `listener`: *function*): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:17

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: *any[]*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  on

▸ **on**(`event`: *string | symbol*, `listener`: *function*): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:12

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: *any[]*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  onExecutionAnalytics

▸ **onExecutionAnalytics**(`fn`: *[MessageHandler](../interfaces/messagehandler.md)*): *void*

*Defined in [cluster-master/client.ts:65](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/cluster-master/client.ts#L65)*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | [MessageHandler](../interfaces/messagehandler.md) |

**Returns:** *void*

___

###  onExecutionFinished

▸ **onExecutionFinished**(`fn`: *function*): *void*

*Defined in [execution-controller/client.ts:65](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/execution-controller/client.ts#L65)*

**Parameters:**

▪ **fn**: *function*

▸ (): *void*

**Returns:** *void*

___

###  onExecutionPause

▸ **onExecutionPause**(`fn`: *[MessageHandler](../interfaces/messagehandler.md)*): *void*

*Defined in [cluster-master/client.ts:69](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/cluster-master/client.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | [MessageHandler](../interfaces/messagehandler.md) |

**Returns:** *void*

___

###  onExecutionResume

▸ **onExecutionResume**(`fn`: *[MessageHandler](../interfaces/messagehandler.md)*): *void*

*Defined in [cluster-master/client.ts:73](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/cluster-master/client.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | [MessageHandler](../interfaces/messagehandler.md) |

**Returns:** *void*

___

###  onServerShutdown

▸ **onServerShutdown**(`fn`: *function*): *void*

*Overrides [Client](client.md).[onServerShutdown](client.md#onservershutdown)*

*Defined in [messenger/client.ts:76](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L76)*

**Parameters:**

▪ **fn**: *function*

▸ (): *void*

**Returns:** *void*

___

###  once

▸ **once**(`event`: *string | symbol*, `listener`: *function*): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:13

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: *any[]*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  onceWithTimeout

▸ **onceWithTimeout**(`eventName`: *string*, `timeout?`: *undefined | number*): *`Promise<any>`*

*Inherited from [Core](core.md).[onceWithTimeout](core.md#oncewithtimeout)*

*Overrides [Core](core.md).[onceWithTimeout](core.md#oncewithtimeout)*

*Defined in [messenger/core.ts:131](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/core.ts#L131)*

**Parameters:**

Name | Type |
------ | ------ |
`eventName` | string |
`timeout?` | undefined \| number |

**Returns:** *`Promise<any>`*

___

###  prependListener

▸ **prependListener**(`event`: *string | symbol*, `listener`: *function*): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:14

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: *any[]*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  prependOnceListener

▸ **prependOnceListener**(`event`: *string | symbol*, `listener`: *function*): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:15

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: *any[]*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  rawListeners

▸ **rawListeners**(`event`: *string | symbol*): *`Function`[]*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:22

**Parameters:**

Name | Type |
------ | ------ |
`event` | string \| symbol |

**Returns:** *`Function`[]*

___

###  removeAllListeners

▸ **removeAllListeners**(`event?`: *string | symbol*): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:18

**Parameters:**

Name | Type |
------ | ------ |
`event?` | string \| symbol |

**Returns:** *this*

___

###  removeListener

▸ **removeListener**(`event`: *string | symbol*, `listener`: *function*): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:16

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: *any[]*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

### `Protected` send

▸ **send**(`eventName`: *string*, `payload`: *[Payload](../interfaces/payload.md)*, `options`: *[SendOptions](../interfaces/sendoptions.md)*): *`Promise<Message | null>`*

*Overrides [Client](client.md).[send](client.md#protected-send)*

*Defined in [messenger/client.ts:197](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L197)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`eventName` | string | - |
`payload` | [Payload](../interfaces/payload.md) |  {} |
`options` | [SendOptions](../interfaces/sendoptions.md) |  { response: true } |

**Returns:** *`Promise<Message | null>`*

___

###  sendAvailable

▸ **sendAvailable**(`payload?`: *`i.Payload`*): *`Promise<undefined | null | Message>`*

*Overrides [Client](client.md).[sendAvailable](client.md#sendavailable)*

*Defined in [messenger/client.ts:179](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L179)*

**Parameters:**

Name | Type |
------ | ------ |
`payload?` | `i.Payload` |

**Returns:** *`Promise<undefined | null | Message>`*

___

###  sendClusterAnalytics

▸ **sendClusterAnalytics**(`stats`: *[ClusterExecutionAnalytics](../interfaces/clusterexecutionanalytics.md)*, `timeout?`: *undefined | number*): *`Promise<null | Message>`*

*Defined in [cluster-master/client.ts:38](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/cluster-master/client.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ClusterExecutionAnalytics](../interfaces/clusterexecutionanalytics.md) |
`timeout?` | undefined \| number |

**Returns:** *`Promise<null | Message>`*

___

###  sendExecutionFinished

▸ **sendExecutionFinished**(`error?`: *undefined | string*): *undefined | `Promise<null | Message>`*

*Defined in [cluster-master/client.ts:53](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/cluster-master/client.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`error?` | undefined \| string |

**Returns:** *undefined | `Promise<null | Message>`*

___

###  sendSliceComplete

▸ **sendSliceComplete**(`payload`: *[SliceCompletePayload](../interfaces/slicecompletepayload.md)*): *`Promise<null | Message>`*

*Defined in [execution-controller/client.ts:69](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/execution-controller/client.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`payload` | [SliceCompletePayload](../interfaces/slicecompletepayload.md) |

**Returns:** *`Promise<null | Message>`*

___

###  sendUnavailable

▸ **sendUnavailable**(`payload?`: *`i.Payload`*): *`Promise<undefined | null | Message>`*

*Overrides [Client](client.md).[sendUnavailable](client.md#sendunavailable)*

*Defined in [messenger/client.ts:188](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L188)*

**Parameters:**

Name | Type |
------ | ------ |
`payload?` | `i.Payload` |

**Returns:** *`Promise<undefined | null | Message>`*

___

###  setMaxListeners

▸ **setMaxListeners**(`n`: *number*): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:19

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *this*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Overrides [Client](client.md).[shutdown](client.md#shutdown)*

*Defined in [messenger/client.ts:238](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/client.ts#L238)*

**Returns:** *`Promise<void>`*

___

###  start

▸ **start**(): *`Promise<void>`*

*Defined in [cluster-master/client.ts:34](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/cluster-master/client.ts#L34)*

**Returns:** *`Promise<void>`*

___

###  waitForClientReady

▸ **waitForClientReady**(`clientId`: *string*, `timeout?`: *undefined | number*): *`Promise<boolean>`*

*Inherited from [Core](core.md).[waitForClientReady](core.md#waitforclientready)*

*Overrides [Core](core.md).[waitForClientReady](core.md#waitforclientready)*

*Defined in [messenger/core.ts:100](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/messenger/core.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |
`timeout?` | undefined \| number |

**Returns:** *`Promise<boolean>`*

___

###  waitForSlice

▸ **waitForSlice**(`fn`: *[WaitUntilFn](../interfaces/waituntilfn.md)*, `timeoutMs`: *number*): *`Promise<Slice | undefined>`*

*Defined in [execution-controller/client.ts:76](https://github.com/terascope/teraslice/blob/a3992c27/packages/teraslice-messaging/src/execution-controller/client.ts#L76)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`fn` | [WaitUntilFn](../interfaces/waituntilfn.md) |  () => false |
`timeoutMs` | number |  2 * ONE_MIN |

**Returns:** *`Promise<Slice | undefined>`*

___

### `Static` listenerCount

▸ **listenerCount**(`emitter`: *`EventEmitter`*, `event`: *string | symbol*): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:8

**`deprecated`** since v4.0.0

**Parameters:**

Name | Type |
------ | ------ |
`emitter` | `EventEmitter` |
`event` | string \| symbol |

**Returns:** *number*
