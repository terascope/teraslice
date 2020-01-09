---
title: Teraslice Messaging: `Client`
sidebar_label: Client
---

# Class: Client

## Hierarchy

  ↳ [Core](core.md)

  ↳ [Client](client.md)

  ↳ [Client](client.md)

  ↳ **Client**

  ↳ [Client](client.md)

  ↳ [Client](client.md)

## Index

### Constructors

* [constructor](client.md#constructor)

### Properties

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

### Methods

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

\+ **new Client**(`opts`: [ClientOptions](../interfaces/clientoptions.md)): *[Client](client.md)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [messenger/client.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L21)*

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

*Defined in [messenger/core.ts:15](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/core.ts#L15)*

___

###  available

• **available**: *boolean*

*Overrides [Client](client.md).[available](client.md#available)*

*Defined in [messenger/client.ts:19](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L19)*

___

###  clientId

• **clientId**: *string*

*Overrides [Client](client.md).[clientId](client.md#clientid)*

*Defined in [messenger/client.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L14)*

___

###  clientType

• **clientType**: *string*

*Overrides [Client](client.md).[clientType](client.md#clienttype)*

*Defined in [messenger/client.ts:15](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L15)*

___

###  closed

• **closed**: *boolean* = false

*Inherited from [Core](core.md).[closed](core.md#closed)*

*Overrides [Core](core.md).[closed](core.md#closed)*

*Defined in [messenger/core.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/core.ts#L12)*

___

###  connectTimeout

• **connectTimeout**: *number*

*Overrides [Client](client.md).[connectTimeout](client.md#connecttimeout)*

*Defined in [messenger/client.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L17)*

___

###  exId

• **exId**: *string*

*Defined in [cluster-master/client.ts:6](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/cluster-master/client.ts#L6)*

___

###  hostUrl

• **hostUrl**: *string*

*Overrides [Client](client.md).[hostUrl](client.md#hosturl)*

*Defined in [messenger/client.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L18)*

___

### `Protected` logger

• **logger**: *Logger*

*Inherited from [Core](core.md).[logger](core.md#protected-logger)*

*Overrides [Core](core.md).[logger](core.md#protected-logger)*

*Defined in [messenger/core.ts:16](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/core.ts#L16)*

___

### `Protected` networkLatencyBuffer

• **networkLatencyBuffer**: *number*

*Inherited from [Core](core.md).[networkLatencyBuffer](core.md#protected-networklatencybuffer)*

*Overrides [Core](core.md).[networkLatencyBuffer](core.md#protected-networklatencybuffer)*

*Defined in [messenger/core.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/core.ts#L14)*

___

### `Protected` ready

• **ready**: *boolean*

*Overrides [Client](client.md).[ready](client.md#protected-ready)*

*Defined in [messenger/client.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L20)*

___

###  serverName

• **serverName**: *string*

*Overrides [Client](client.md).[serverName](client.md#servername)*

*Defined in [messenger/client.ts:16](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L16)*

___

### `Protected` serverShutdown

• **serverShutdown**: *boolean*

*Overrides [Client](client.md).[serverShutdown](client.md#protected-servershutdown)*

*Defined in [messenger/client.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L21)*

___

###  socket

• **socket**: *Socket*

*Overrides [Client](client.md).[socket](client.md#socket)*

*Defined in [messenger/client.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L13)*

___

###  workerId

• **workerId**: *string*

*Defined in [execution-controller/client.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/execution-controller/client.ts#L8)*

___

### `Static` defaultMaxListeners

▪ **defaultMaxListeners**: *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:18

## Methods

###  addListener

▸ **addListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:20

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

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

*Defined in [messenger/core.ts:38](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/core.ts#L38)*

**Returns:** *void*

___

###  connect

▸ **connect**(): *Promise‹void›*

*Overrides [Client](client.md).[connect](client.md#connect)*

*Defined in [messenger/client.ts:111](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L111)*

**Returns:** *Promise‹void›*

___

###  emit

▸ **emit**(`eventName`: string, `msg`: [ClientEventMessage](../interfaces/clienteventmessage.md)): *void*

*Overrides [Core](core.md).[emit](core.md#emit)*

*Defined in [messenger/client.ts:263](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L263)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`eventName` | string | - |
`msg` | [ClientEventMessage](../interfaces/clienteventmessage.md) |  { payload: {} } |

**Returns:** *void*

___

###  eventNames

▸ **eventNames**(): *Array‹string | symbol›*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:33

**Returns:** *Array‹string | symbol›*

___

###  forceReconnect

▸ **forceReconnect**(): *Promise‹unknown›*

*Overrides [Client](client.md).[forceReconnect](client.md#forcereconnect)*

*Defined in [messenger/client.ts:299](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L299)*

**Returns:** *Promise‹unknown›*

___

###  getMaxListeners

▸ **getMaxListeners**(): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:29

**Returns:** *number*

___

###  getTimeout

▸ **getTimeout**(`timeout?`: undefined | number): *number*

*Inherited from [Core](core.md).[getTimeout](core.md#gettimeout)*

*Overrides [Core](core.md).[getTimeout](core.md#gettimeout)*

*Defined in [messenger/core.ts:125](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/core.ts#L125)*

**Parameters:**

Name | Type |
------ | ------ |
`timeout?` | undefined &#124; number |

**Returns:** *number*

___

###  getTimeoutWithMax

▸ **getTimeoutWithMax**(`maxTimeout`: number): *number*

*Inherited from [Core](core.md).[getTimeoutWithMax](core.md#gettimeoutwithmax)*

*Overrides [Core](core.md).[getTimeoutWithMax](core.md#gettimeoutwithmax)*

*Defined in [messenger/core.ts:120](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/core.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`maxTimeout` | number |

**Returns:** *number*

___

### `Protected` handleResponse

▸ **handleResponse**(`socket`: [SocketEmitter](../interfaces/socketemitter.md), `eventName`: string, `fn`: [MessageHandler](../interfaces/messagehandler.md)): *void*

*Inherited from [Core](core.md).[handleResponse](core.md#protected-handleresponse)*

*Overrides [Core](core.md).[handleResponse](core.md#protected-handleresponse)*

*Defined in [messenger/core.ts:64](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/core.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`socket` | [SocketEmitter](../interfaces/socketemitter.md) |
`eventName` | string |
`fn` | [MessageHandler](../interfaces/messagehandler.md) |

**Returns:** *void*

___

### `Protected` handleSendResponse

▸ **handleSendResponse**(`sent`: [Message](../interfaces/message.md)): *Promise‹[Message](../interfaces/message.md) | null›*

*Inherited from [Core](core.md).[handleSendResponse](core.md#protected-handlesendresponse)*

*Overrides [Core](core.md).[handleSendResponse](core.md#protected-handlesendresponse)*

*Defined in [messenger/core.ts:43](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/core.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`sent` | [Message](../interfaces/message.md) |

**Returns:** *Promise‹[Message](../interfaces/message.md) | null›*

___

###  isClientReady

▸ **isClientReady**(): *boolean*

*Overrides [Core](core.md).[isClientReady](core.md#isclientready)*

*Defined in [messenger/client.ts:268](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L268)*

**Returns:** *boolean*

___

###  listenerCount

▸ **listenerCount**(`type`: string | symbol): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:34

**Parameters:**

Name | Type |
------ | ------ |
`type` | string &#124; symbol |

**Returns:** *number*

___

###  listeners

▸ **listeners**(`event`: string | symbol): *Function[]*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:30

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |

**Returns:** *Function[]*

___

###  off

▸ **off**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:26

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  on

▸ **on**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:21

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  onExecutionAnalytics

▸ **onExecutionAnalytics**(`fn`: [MessageHandler](../interfaces/messagehandler.md)): *void*

*Defined in [cluster-master/client.ts:79](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/cluster-master/client.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | [MessageHandler](../interfaces/messagehandler.md) |

**Returns:** *void*

___

###  onExecutionFinished

▸ **onExecutionFinished**(`fn`: function): *void*

*Defined in [execution-controller/client.ts:79](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/execution-controller/client.ts#L79)*

**Parameters:**

▪ **fn**: *function*

▸ (): *void*

**Returns:** *void*

___

###  onExecutionPause

▸ **onExecutionPause**(`fn`: [MessageHandler](../interfaces/messagehandler.md)): *void*

*Defined in [cluster-master/client.ts:83](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/cluster-master/client.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | [MessageHandler](../interfaces/messagehandler.md) |

**Returns:** *void*

___

###  onExecutionResume

▸ **onExecutionResume**(`fn`: [MessageHandler](../interfaces/messagehandler.md)): *void*

*Defined in [cluster-master/client.ts:87](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/cluster-master/client.ts#L87)*

**Parameters:**

Name | Type |
------ | ------ |
`fn` | [MessageHandler](../interfaces/messagehandler.md) |

**Returns:** *void*

___

###  onServerShutdown

▸ **onServerShutdown**(`fn`: function): *void*

*Overrides [Client](client.md).[onServerShutdown](client.md#onservershutdown)*

*Defined in [messenger/client.ts:97](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L97)*

**Parameters:**

▪ **fn**: *function*

▸ (): *void*

**Returns:** *void*

___

###  once

▸ **once**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:22

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  onceWithTimeout

▸ **onceWithTimeout**(`eventName`: string, `timeout?`: undefined | number): *Promise‹any›*

*Inherited from [Core](core.md).[onceWithTimeout](core.md#oncewithtimeout)*

*Overrides [Core](core.md).[onceWithTimeout](core.md#oncewithtimeout)*

*Defined in [messenger/core.ts:137](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/core.ts#L137)*

**Parameters:**

Name | Type |
------ | ------ |
`eventName` | string |
`timeout?` | undefined &#124; number |

**Returns:** *Promise‹any›*

___

###  prependListener

▸ **prependListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:23

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  prependOnceListener

▸ **prependOnceListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:24

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  rawListeners

▸ **rawListeners**(`event`: string | symbol): *Function[]*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:31

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |

**Returns:** *Function[]*

___

###  removeAllListeners

▸ **removeAllListeners**(`event?`: string | symbol): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:27

**Parameters:**

Name | Type |
------ | ------ |
`event?` | string &#124; symbol |

**Returns:** *this*

___

###  removeListener

▸ **removeListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:25

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

### `Protected` send

▸ **send**(`eventName`: string, `payload`: [Payload](../interfaces/payload.md), `options`: [SendOptions](../interfaces/sendoptions.md)): *Promise‹[Message](../interfaces/message.md) | null›*

*Overrides [Client](client.md).[send](client.md#protected-send)*

*Defined in [messenger/client.ts:231](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L231)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`eventName` | string | - |
`payload` | [Payload](../interfaces/payload.md) |  {} |
`options` | [SendOptions](../interfaces/sendoptions.md) |  { response: true } |

**Returns:** *Promise‹[Message](../interfaces/message.md) | null›*

___

###  sendAvailable

▸ **sendAvailable**(`payload?`: i.Payload): *Promise‹undefined | null | [Message](../interfaces/message.md)›*

*Overrides [Client](client.md).[sendAvailable](client.md#sendavailable)*

*Defined in [messenger/client.ts:213](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L213)*

**Parameters:**

Name | Type |
------ | ------ |
`payload?` | i.Payload |

**Returns:** *Promise‹undefined | null | [Message](../interfaces/message.md)›*

___

###  sendClusterAnalytics

▸ **sendClusterAnalytics**(`stats`: [ClusterExecutionAnalytics](../interfaces/clusterexecutionanalytics.md), `timeout?`: undefined | number): *Promise‹null | [Message](../interfaces/message.md)›*

*Defined in [cluster-master/client.ts:52](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/cluster-master/client.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ClusterExecutionAnalytics](../interfaces/clusterexecutionanalytics.md) |
`timeout?` | undefined &#124; number |

**Returns:** *Promise‹null | [Message](../interfaces/message.md)›*

___

###  sendExecutionFinished

▸ **sendExecutionFinished**(`error?`: undefined | string): *undefined | Promise‹null | [Message](../interfaces/message.md)›*

*Defined in [cluster-master/client.ts:67](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/cluster-master/client.ts#L67)*

**Parameters:**

Name | Type |
------ | ------ |
`error?` | undefined &#124; string |

**Returns:** *undefined | Promise‹null | [Message](../interfaces/message.md)›*

___

###  sendSliceComplete

▸ **sendSliceComplete**(`payload`: [SliceCompletePayload](../interfaces/slicecompletepayload.md)): *Promise‹null | [Message](../interfaces/message.md)›*

*Defined in [execution-controller/client.ts:83](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/execution-controller/client.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`payload` | [SliceCompletePayload](../interfaces/slicecompletepayload.md) |

**Returns:** *Promise‹null | [Message](../interfaces/message.md)›*

___

###  sendUnavailable

▸ **sendUnavailable**(`payload?`: i.Payload): *Promise‹undefined | null | [Message](../interfaces/message.md)›*

*Overrides [Client](client.md).[sendUnavailable](client.md#sendunavailable)*

*Defined in [messenger/client.ts:222](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L222)*

**Parameters:**

Name | Type |
------ | ------ |
`payload?` | i.Payload |

**Returns:** *Promise‹undefined | null | [Message](../interfaces/message.md)›*

___

###  setMaxListeners

▸ **setMaxListeners**(`n`: number): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:28

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *this*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Overrides [Client](client.md).[shutdown](client.md#shutdown)*

*Defined in [messenger/client.ts:272](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/client.ts#L272)*

**Returns:** *Promise‹void›*

___

###  start

▸ **start**(): *Promise‹void›*

*Defined in [cluster-master/client.ts:48](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/cluster-master/client.ts#L48)*

**Returns:** *Promise‹void›*

___

###  waitForClientReady

▸ **waitForClientReady**(`clientId`: string, `timeout?`: undefined | number): *Promise‹boolean›*

*Inherited from [Core](core.md).[waitForClientReady](core.md#waitforclientready)*

*Overrides [Core](core.md).[waitForClientReady](core.md#waitforclientready)*

*Defined in [messenger/core.ts:106](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/messenger/core.ts#L106)*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |
`timeout?` | undefined &#124; number |

**Returns:** *Promise‹boolean›*

___

###  waitForSlice

▸ **waitForSlice**(`fn`: [WaitUntilFn](../interfaces/waituntilfn.md), `timeoutMs`: number): *Promise‹[Slice](../interfaces/slice.md) | undefined›*

*Defined in [execution-controller/client.ts:90](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-messaging/src/execution-controller/client.ts#L90)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`fn` | [WaitUntilFn](../interfaces/waituntilfn.md) |  () => false |
`timeoutMs` | number |  2 * ONE_MIN |

**Returns:** *Promise‹[Slice](../interfaces/slice.md) | undefined›*

___

### `Static` listenerCount

▸ **listenerCount**(`emitter`: EventEmitter, `event`: string | symbol): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:17

**`deprecated`** since v4.0.0

**Parameters:**

Name | Type |
------ | ------ |
`emitter` | EventEmitter |
`event` | string &#124; symbol |

**Returns:** *number*
