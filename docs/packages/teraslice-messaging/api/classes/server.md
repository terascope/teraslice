---
title: Teraslice Messaging: `Server`
sidebar_label: Server
---

# Class: Server

## Hierarchy

  * [Core](core.md)

  * [Server](server.md)

  * [Server](server.md)

  * **Server**

  * [Server](server.md)

  * [Server](server.md)

## Index

### Constructors

* [constructor](server.md#constructor)

### Properties

* [_clients](server.md#protected-_clients)
* [actionTimeout](server.md#protected-actiontimeout)
* [clientDisconnectTimeout](server.md#clientdisconnecttimeout)
* [closed](server.md#closed)
* [httpServer](server.md#httpserver)
* [isShuttingDown](server.md#isshuttingdown)
* [logger](server.md#protected-logger)
* [networkLatencyBuffer](server.md#protected-networklatencybuffer)
* [port](server.md#port)
* [queue](server.md#queue)
* [server](server.md#server)
* [serverName](server.md#servername)
* [defaultMaxListeners](server.md#static-defaultmaxlisteners)

### Accessors

* [activeWorkerCount](server.md#activeworkercount)
* [availableClientCount](server.md#availableclientcount)
* [availableClients](server.md#availableclients)
* [disconnectedClientCount](server.md#disconnectedclientcount)
* [disconnectedClients](server.md#disconnectedclients)
* [onlineClientCount](server.md#onlineclientcount)
* [onlineClients](server.md#onlineclients)
* [unavailableClientCount](server.md#unavailableclientcount)
* [unavailableClients](server.md#unavailableclients)
* [workerQueueSize](server.md#workerqueuesize)

### Methods

* [addListener](server.md#addlistener)
* [close](server.md#close)
* [dequeueWorker](server.md#dequeueworker)
* [dispatchSlice](server.md#dispatchslice)
* [emit](server.md#emit)
* [ensureClient](server.md#protected-ensureclient)
* [eventNames](server.md#eventnames)
* [getClientMetadataFromSocket](server.md#protected-getclientmetadatafromsocket)
* [getClusterAnalytics](server.md#getclusteranalytics)
* [getMaxListeners](server.md#getmaxlisteners)
* [getTimeout](server.md#gettimeout)
* [getTimeoutWithMax](server.md#gettimeoutwithmax)
* [handleResponse](server.md#protected-handleresponse)
* [handleSendResponse](server.md#protected-handlesendresponse)
* [isClientConnected](server.md#isclientconnected)
* [isClientReady](server.md#isclientready)
* [listen](server.md#listen)
* [listenerCount](server.md#listenercount)
* [listeners](server.md#listeners)
* [off](server.md#off)
* [on](server.md#on)
* [onClientAvailable](server.md#onclientavailable)
* [onClientDisconnect](server.md#onclientdisconnect)
* [onClientError](server.md#onclienterror)
* [onClientOnline](server.md#onclientonline)
* [onClientReconnect](server.md#onclientreconnect)
* [onClientShutdown](server.md#onclientshutdown)
* [onClientUnavailable](server.md#onclientunavailable)
* [onExecutionFinished](server.md#onexecutionfinished)
* [onSliceFailure](server.md#onslicefailure)
* [onSliceSuccess](server.md#onslicesuccess)
* [once](server.md#once)
* [onceWithTimeout](server.md#oncewithtimeout)
* [prependListener](server.md#prependlistener)
* [prependOnceListener](server.md#prependoncelistener)
* [rawListeners](server.md#rawlisteners)
* [removeAllListeners](server.md#removealllisteners)
* [removeListener](server.md#removelistener)
* [send](server.md#protected-send)
* [sendExecutionAnalyticsRequest](server.md#sendexecutionanalyticsrequest)
* [sendExecutionFinishedToAll](server.md#sendexecutionfinishedtoall)
* [sendExecutionPause](server.md#sendexecutionpause)
* [sendExecutionResume](server.md#sendexecutionresume)
* [sendToAll](server.md#protected-sendtoall)
* [setMaxListeners](server.md#setmaxlisteners)
* [shutdown](server.md#shutdown)
* [start](server.md#start)
* [updateClientState](server.md#protected-updateclientstate)
* [waitForClientReady](server.md#waitforclientready)
* [listenerCount](server.md#static-listenercount)

## Constructors

###  constructor

\+ **new Server**(`opts`: [ServerOptions](../interfaces/serveroptions.md)): *[Server](server.md)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [messenger/server.ts:31](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`opts` | [ServerOptions](../interfaces/serveroptions.md) |

**Returns:** *[Server](server.md)*

## Properties

### `Protected` _clients

• **_clients**: *[ConnectedClients](../interfaces/connectedclients.md)*

*Overrides [Server](server.md).[_clients](server.md#protected-_clients)*

*Defined in [messenger/server.ts:31](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L31)*

___

### `Protected` actionTimeout

• **actionTimeout**: *number*

*Inherited from [Core](core.md).[actionTimeout](core.md#protected-actiontimeout)*

*Overrides [Core](core.md).[actionTimeout](core.md#protected-actiontimeout)*

*Defined in [messenger/core.ts:15](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/core.ts#L15)*

___

###  clientDisconnectTimeout

• **clientDisconnectTimeout**: *number*

*Overrides [Server](server.md).[clientDisconnectTimeout](server.md#clientdisconnecttimeout)*

*Defined in [messenger/server.ts:29](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L29)*

___

###  closed

• **closed**: *boolean* = false

*Inherited from [Core](core.md).[closed](core.md#closed)*

*Overrides [Core](core.md).[closed](core.md#closed)*

*Defined in [messenger/core.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/core.ts#L12)*

___

###  httpServer

• **httpServer**: *Server*

*Overrides [Server](server.md).[httpServer](server.md#httpserver)*

*Defined in [messenger/server.ts:27](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L27)*

___

###  isShuttingDown

• **isShuttingDown**: *boolean*

*Overrides [Server](server.md).[isShuttingDown](server.md#isshuttingdown)*

*Defined in [messenger/server.ts:24](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L24)*

___

### `Protected` logger

• **logger**: *Logger*

*Inherited from [Core](core.md).[logger](core.md#protected-logger)*

*Overrides [Core](core.md).[logger](core.md#protected-logger)*

*Defined in [messenger/core.ts:16](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/core.ts#L16)*

___

### `Protected` networkLatencyBuffer

• **networkLatencyBuffer**: *number*

*Inherited from [Core](core.md).[networkLatencyBuffer](core.md#protected-networklatencybuffer)*

*Overrides [Core](core.md).[networkLatencyBuffer](core.md#protected-networklatencybuffer)*

*Defined in [messenger/core.ts:14](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/core.ts#L14)*

___

###  port

• **port**: *number*

*Overrides [Server](server.md).[port](server.md#port)*

*Defined in [messenger/server.ts:25](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L25)*

___

###  queue

• **queue**: *Queue‹[EnqueuedWorker](../interfaces/enqueuedworker.md)›*

*Defined in [execution-controller/server.ts:10](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/execution-controller/server.ts#L10)*

___

###  server

• **server**: *Server*

*Overrides [Server](server.md).[server](server.md#server)*

*Defined in [messenger/server.ts:26](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L26)*

___

###  serverName

• **serverName**: *string*

*Overrides [Server](server.md).[serverName](server.md#servername)*

*Defined in [messenger/server.ts:28](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L28)*

___

### `Static` defaultMaxListeners

▪ **defaultMaxListeners**: *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:9

## Accessors

###  activeWorkerCount

• **get activeWorkerCount**(): *number*

*Defined in [execution-controller/server.ts:127](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/execution-controller/server.ts#L127)*

**Returns:** *number*

___

###  availableClientCount

• **get availableClientCount**(): *number*

*Overrides [Server](server.md).[availableClientCount](server.md#availableclientcount)*

*Defined in [messenger/server.ts:190](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L190)*

**Returns:** *number*

___

###  availableClients

• **get availableClients**(): *[ConnectedClient](../interfaces/connectedclient.md)[]*

*Overrides [Server](server.md).[availableClients](server.md#availableclients)*

*Defined in [messenger/server.ts:186](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L186)*

**Returns:** *[ConnectedClient](../interfaces/connectedclient.md)[]*

___

###  disconnectedClientCount

• **get disconnectedClientCount**(): *number*

*Overrides [Server](server.md).[disconnectedClientCount](server.md#disconnectedclientcount)*

*Defined in [messenger/server.ts:182](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L182)*

**Returns:** *number*

___

###  disconnectedClients

• **get disconnectedClients**(): *[ConnectedClient](../interfaces/connectedclient.md)[]*

*Overrides [Server](server.md).[disconnectedClients](server.md#disconnectedclients)*

*Defined in [messenger/server.ts:178](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L178)*

**Returns:** *[ConnectedClient](../interfaces/connectedclient.md)[]*

___

###  onlineClientCount

• **get onlineClientCount**(): *number*

*Overrides [Server](server.md).[onlineClientCount](server.md#onlineclientcount)*

*Defined in [messenger/server.ts:174](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L174)*

**Returns:** *number*

___

###  onlineClients

• **get onlineClients**(): *[ConnectedClient](../interfaces/connectedclient.md)[]*

*Overrides [Server](server.md).[onlineClients](server.md#onlineclients)*

*Defined in [messenger/server.ts:170](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L170)*

**Returns:** *[ConnectedClient](../interfaces/connectedclient.md)[]*

___

###  unavailableClientCount

• **get unavailableClientCount**(): *number*

*Overrides [Server](server.md).[unavailableClientCount](server.md#unavailableclientcount)*

*Defined in [messenger/server.ts:198](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L198)*

**Returns:** *number*

___

###  unavailableClients

• **get unavailableClients**(): *[ConnectedClient](../interfaces/connectedclient.md)[]*

*Overrides [Server](server.md).[unavailableClients](server.md#unavailableclients)*

*Defined in [messenger/server.ts:194](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L194)*

**Returns:** *[ConnectedClient](../interfaces/connectedclient.md)[]*

___

###  workerQueueSize

• **get workerQueueSize**(): *number*

*Defined in [execution-controller/server.ts:131](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/execution-controller/server.ts#L131)*

**Returns:** *number*

## Methods

###  addListener

▸ **addListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:11

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

*Defined in [messenger/core.ts:38](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/core.ts#L38)*

**Returns:** *void*

___

###  dequeueWorker

▸ **dequeueWorker**(`slice`: [Slice](../interfaces/slice.md)): *string | null*

*Defined in [execution-controller/server.ts:66](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/execution-controller/server.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`slice` | [Slice](../interfaces/slice.md) |

**Returns:** *string | null*

___

###  dispatchSlice

▸ **dispatchSlice**(`slice`: [Slice](../interfaces/slice.md), `workerId`: string): *Promise‹boolean›*

*Defined in [execution-controller/server.ts:71](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/execution-controller/server.ts#L71)*

**Parameters:**

Name | Type |
------ | ------ |
`slice` | [Slice](../interfaces/slice.md) |
`workerId` | string |

**Returns:** *Promise‹boolean›*

___

###  emit

▸ **emit**(`eventName`: string, `msg`: [EventMessage](../interfaces/eventmessage.md)): *void*

*Inherited from [Core](core.md).[emit](core.md#emit)*

*Overrides void*

*Defined in [messenger/core.ts:130](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/core.ts#L130)*

**Parameters:**

Name | Type |
------ | ------ |
`eventName` | string |
`msg` | [EventMessage](../interfaces/eventmessage.md) |

**Returns:** *void*

___

### `Protected` ensureClient

▸ **ensureClient**(`socket`: Socket): *[ConnectedClient](../interfaces/connectedclient.md)*

*Overrides [Server](server.md).[ensureClient](server.md#protected-ensureclient)*

*Defined in [messenger/server.ts:358](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L358)*

**Parameters:**

Name | Type |
------ | ------ |
`socket` | Socket |

**Returns:** *[ConnectedClient](../interfaces/connectedclient.md)*

___

###  eventNames

▸ **eventNames**(): *Array‹string | symbol›*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:24

**Returns:** *Array‹string | symbol›*

___

### `Protected` getClientMetadataFromSocket

▸ **getClientMetadataFromSocket**(`socket`: Socket): *[ClientSocketMetadata](../interfaces/clientsocketmetadata.md)*

*Overrides [Server](server.md).[getClientMetadataFromSocket](server.md#protected-getclientmetadatafromsocket)*

*Defined in [messenger/server.ts:307](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L307)*

**Parameters:**

Name | Type |
------ | ------ |
`socket` | Socket |

**Returns:** *[ClientSocketMetadata](../interfaces/clientsocketmetadata.md)*

___

###  getClusterAnalytics

▸ **getClusterAnalytics**(): *[ClusterAnalytics](../interfaces/clusteranalytics.md)*

*Defined in [cluster-master/server.ts:67](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/cluster-master/server.ts#L67)*

**Returns:** *[ClusterAnalytics](../interfaces/clusteranalytics.md)*

___

###  getMaxListeners

▸ **getMaxListeners**(): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:20

**Returns:** *number*

___

###  getTimeout

▸ **getTimeout**(`timeout?`: undefined | number): *number*

*Inherited from [Core](core.md).[getTimeout](core.md#gettimeout)*

*Overrides [Core](core.md).[getTimeout](core.md#gettimeout)*

*Defined in [messenger/core.ts:125](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/core.ts#L125)*

**Parameters:**

Name | Type |
------ | ------ |
`timeout?` | undefined \| number |

**Returns:** *number*

___

###  getTimeoutWithMax

▸ **getTimeoutWithMax**(`maxTimeout`: number): *number*

*Inherited from [Core](core.md).[getTimeoutWithMax](core.md#gettimeoutwithmax)*

*Overrides [Core](core.md).[getTimeoutWithMax](core.md#gettimeoutwithmax)*

*Defined in [messenger/core.ts:120](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/core.ts#L120)*

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

*Defined in [messenger/core.ts:64](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/core.ts#L64)*

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

*Defined in [messenger/core.ts:43](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/core.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`sent` | [Message](../interfaces/message.md) |

**Returns:** *Promise‹[Message](../interfaces/message.md) | null›*

___

###  isClientConnected

▸ **isClientConnected**(`clientId`: string): *boolean*

*Overrides [Server](server.md).[isClientConnected](server.md#isclientconnected)*

*Defined in [messenger/server.ts:301](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L301)*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |

**Returns:** *boolean*

___

###  isClientReady

▸ **isClientReady**(`clientId`: string): *boolean*

*Overrides [Core](core.md).[isClientReady](core.md#isclientready)*

*Defined in [messenger/server.ts:244](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L244)*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |

**Returns:** *boolean*

___

###  listen

▸ **listen**(): *Promise‹void›*

*Overrides [Server](server.md).[listen](server.md#listen)*

*Defined in [messenger/server.ts:94](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L94)*

**Returns:** *Promise‹void›*

___

###  listenerCount

▸ **listenerCount**(`type`: string | symbol): *number*

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

▸ **listeners**(`event`: string | symbol): *Function[]*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:21

**Parameters:**

Name | Type |
------ | ------ |
`event` | string \| symbol |

**Returns:** *Function[]*

___

###  off

▸ **off**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:17

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

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:12

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

###  onClientAvailable

▸ **onClientAvailable**(`fn`: function): *this*

*Overrides [Server](server.md).[onClientAvailable](server.md#onclientavailable)*

*Defined in [messenger/server.ts:208](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L208)*

**Parameters:**

▪ **fn**: *function*

▸ (`clientId`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |

**Returns:** *this*

___

###  onClientDisconnect

▸ **onClientDisconnect**(`fn`: function): *this*

*Overrides [Server](server.md).[onClientDisconnect](server.md#onclientdisconnect)*

*Defined in [messenger/server.ts:220](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L220)*

**Parameters:**

▪ **fn**: *function*

▸ (`clientId`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |

**Returns:** *this*

___

###  onClientError

▸ **onClientError**(`fn`: function): *this*

*Overrides [Server](server.md).[onClientError](server.md#onclienterror)*

*Defined in [messenger/server.ts:238](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L238)*

**Parameters:**

▪ **fn**: *function*

▸ (`clientId`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |

**Returns:** *this*

___

###  onClientOnline

▸ **onClientOnline**(`fn`: function): *this*

*Overrides [Server](server.md).[onClientOnline](server.md#onclientonline)*

*Defined in [messenger/server.ts:202](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L202)*

**Parameters:**

▪ **fn**: *function*

▸ (`clientId`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |

**Returns:** *this*

___

###  onClientReconnect

▸ **onClientReconnect**(`fn`: function): *this*

*Overrides [Server](server.md).[onClientReconnect](server.md#onclientreconnect)*

*Defined in [messenger/server.ts:232](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L232)*

**Parameters:**

▪ **fn**: *function*

▸ (`clientId`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |

**Returns:** *this*

___

###  onClientShutdown

▸ **onClientShutdown**(`fn`: function): *this*

*Overrides [Server](server.md).[onClientShutdown](server.md#onclientshutdown)*

*Defined in [messenger/server.ts:226](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L226)*

**Parameters:**

▪ **fn**: *function*

▸ (`clientId`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |

**Returns:** *this*

___

###  onClientUnavailable

▸ **onClientUnavailable**(`fn`: function): *this*

*Overrides [Server](server.md).[onClientUnavailable](server.md#onclientunavailable)*

*Defined in [messenger/server.ts:214](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L214)*

**Parameters:**

▪ **fn**: *function*

▸ (`clientId`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |

**Returns:** *this*

___

###  onExecutionFinished

▸ **onExecutionFinished**(`fn`: function): *void*

*Defined in [cluster-master/server.ts:71](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/cluster-master/server.ts#L71)*

**Parameters:**

▪ **fn**: *function*

▸ (`clientId`: string, `error?`: core.ResponseError): *__type*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |
`error?` | core.ResponseError |

**Returns:** *void*

___

###  onSliceFailure

▸ **onSliceFailure**(`fn`: function): *void*

*Defined in [execution-controller/server.ts:110](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/execution-controller/server.ts#L110)*

**Parameters:**

▪ **fn**: *function*

▸ (`workerId`: string, `payload`: [SliceCompletePayload](../interfaces/slicecompletepayload.md)): *__type*

**Parameters:**

Name | Type |
------ | ------ |
`workerId` | string |
`payload` | [SliceCompletePayload](../interfaces/slicecompletepayload.md) |

**Returns:** *void*

___

###  onSliceSuccess

▸ **onSliceSuccess**(`fn`: function): *void*

*Defined in [execution-controller/server.ts:104](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/execution-controller/server.ts#L104)*

**Parameters:**

▪ **fn**: *function*

▸ (`workerId`: string, `payload`: [SliceCompletePayload](../interfaces/slicecompletepayload.md)): *__type*

**Parameters:**

Name | Type |
------ | ------ |
`workerId` | string |
`payload` | [SliceCompletePayload](../interfaces/slicecompletepayload.md) |

**Returns:** *void*

___

###  once

▸ **once**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:13

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

*Defined in [messenger/core.ts:137](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/core.ts#L137)*

**Parameters:**

Name | Type |
------ | ------ |
`eventName` | string |
`timeout?` | undefined \| number |

**Returns:** *Promise‹any›*

___

###  prependListener

▸ **prependListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:14

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

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:15

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

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:22

**Parameters:**

Name | Type |
------ | ------ |
`event` | string \| symbol |

**Returns:** *Function[]*

___

###  removeAllListeners

▸ **removeAllListeners**(`event?`: string | symbol): *this*

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

▸ **removeListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:16

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

▸ **send**(`clientId`: string, `eventName`: string, `payload`: [Payload](../interfaces/payload.md), `options`: [SendOptions](../interfaces/sendoptions.md)): *Promise‹[Message](../interfaces/message.md) | null›*

*Overrides [Server](server.md).[send](server.md#protected-send)*

*Defined in [messenger/server.ts:260](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L260)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`clientId` | string | - |
`eventName` | string | - |
`payload` | [Payload](../interfaces/payload.md) |  {} |
`options` | [SendOptions](../interfaces/sendoptions.md) |  { response: true } |

**Returns:** *Promise‹[Message](../interfaces/message.md) | null›*

___

###  sendExecutionAnalyticsRequest

▸ **sendExecutionAnalyticsRequest**(`exId`: string): *Promise‹null | [Message](../interfaces/message.md)›*

*Defined in [cluster-master/server.ts:63](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/cluster-master/server.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string |

**Returns:** *Promise‹null | [Message](../interfaces/message.md)›*

___

###  sendExecutionFinishedToAll

▸ **sendExecutionFinishedToAll**(`exId`: string): *Promise‹null | [Message](../interfaces/message.md)[]›*

*Defined in [execution-controller/server.ts:116](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/execution-controller/server.ts#L116)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string |

**Returns:** *Promise‹null | [Message](../interfaces/message.md)[]›*

___

###  sendExecutionPause

▸ **sendExecutionPause**(`exId`: string): *Promise‹null | [Message](../interfaces/message.md)›*

*Defined in [cluster-master/server.ts:55](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/cluster-master/server.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string |

**Returns:** *Promise‹null | [Message](../interfaces/message.md)›*

___

###  sendExecutionResume

▸ **sendExecutionResume**(`exId`: string): *Promise‹null | [Message](../interfaces/message.md)›*

*Defined in [cluster-master/server.ts:59](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/cluster-master/server.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`exId` | string |

**Returns:** *Promise‹null | [Message](../interfaces/message.md)›*

___

### `Protected` sendToAll

▸ **sendToAll**(`eventName`: string, `payload?`: i.Payload, `options`: [SendOptions](../interfaces/sendoptions.md)): *Promise‹null | [Message](../interfaces/message.md)[]›*

*Overrides [Server](server.md).[sendToAll](server.md#protected-sendtoall)*

*Defined in [messenger/server.ts:249](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L249)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`eventName` | string | - |
`payload?` | i.Payload | - |
`options` | [SendOptions](../interfaces/sendoptions.md) |  { volatile: true, response: true } |

**Returns:** *Promise‹null | [Message](../interfaces/message.md)[]›*

___

###  setMaxListeners

▸ **setMaxListeners**(`n`: number): *this*

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

▸ **shutdown**(): *Promise‹void›*

*Overrides [Server](server.md).[shutdown](server.md#shutdown)*

*Defined in [messenger/server.ts:138](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L138)*

**Returns:** *Promise‹void›*

___

###  start

▸ **start**(): *Promise‹void›*

*Defined in [cluster-master/server.ts:47](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/cluster-master/server.ts#L47)*

**Returns:** *Promise‹void›*

___

### `Protected` updateClientState

▸ **updateClientState**(`clientId`: string, `state`: [ClientState](../enums/clientstate.md)): *boolean*

*Overrides [Server](server.md).[updateClientState](server.md#protected-updateclientstate)*

*Defined in [messenger/server.ts:325](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/server.ts#L325)*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |
`state` | [ClientState](../enums/clientstate.md) |

**Returns:** *boolean*

___

###  waitForClientReady

▸ **waitForClientReady**(`clientId`: string, `timeout?`: undefined | number): *Promise‹boolean›*

*Inherited from [Core](core.md).[waitForClientReady](core.md#waitforclientready)*

*Overrides [Core](core.md).[waitForClientReady](core.md#waitforclientready)*

*Defined in [messenger/core.ts:106](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-messaging/src/messenger/core.ts#L106)*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |
`timeout?` | undefined \| number |

**Returns:** *Promise‹boolean›*

___

### `Static` listenerCount

▸ **listenerCount**(`emitter`: EventEmitter, `event`: string | symbol): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:8

**`deprecated`** since v4.0.0

**Parameters:**

Name | Type |
------ | ------ |
`emitter` | EventEmitter |
`event` | string \| symbol |

**Returns:** *number*
