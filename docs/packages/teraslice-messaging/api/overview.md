---
title: Teraslice Messaging API Overview
sidebar_label: API
---

#### Enumerations

* [ClientState](enums/clientstate.md)

#### Classes

* [Client](classes/client.md)
* [Core](classes/core.md)
* [Server](classes/server.md)

#### Interfaces

* [ActiveWorkers](interfaces/activeworkers.md)
* [ClientEventMessage](interfaces/clienteventmessage.md)
* [ClientOptions](interfaces/clientoptions.md)
* [ClientSendFn](interfaces/clientsendfn.md)
* [ClientSendFns](interfaces/clientsendfns.md)
* [ClientSocketMetadata](interfaces/clientsocketmetadata.md)
* [ClusterAnalytics](interfaces/clusteranalytics.md)
* [ClusterExecutionAnalytics](interfaces/clusterexecutionanalytics.md)
* [ConnectedClient](interfaces/connectedclient.md)
* [ConnectedClients](interfaces/connectedclients.md)
* [CoreOptions](interfaces/coreoptions.md)
* [EnqueuedWorker](interfaces/enqueuedworker.md)
* [ErrorObj](interfaces/errorobj.md)
* [EventListener](interfaces/eventlistener.md)
* [EventMessage](interfaces/eventmessage.md)
* [ExecutionAnalytics](interfaces/executionanalytics.md)
* [ExecutionAnalyticsMessage](interfaces/executionanalyticsmessage.md)
* [Message](interfaces/message.md)
* [MessageHandler](interfaces/messagehandler.md)
* [OnExecutionAnalyticsFn](interfaces/onexecutionanalyticsfn.md)
* [OnStateChangeFn](interfaces/onstatechangefn.md)
* [Payload](interfaces/payload.md)
* [RequestListener](interfaces/requestlistener.md)
* [SendOptions](interfaces/sendoptions.md)
* [ServerOptions](interfaces/serveroptions.md)
* [Slice](interfaces/slice.md)
* [SliceAnalyticsData](interfaces/sliceanalyticsdata.md)
* [SliceCompletePayload](interfaces/slicecompletepayload.md)
* [SliceRequest](interfaces/slicerequest.md)
* [SliceResponseMessage](interfaces/sliceresponsemessage.md)
* [SocketEmitter](interfaces/socketemitter.md)
* [UpdateClientState](interfaces/updateclientstate.md)
* [WaitUntilFn](interfaces/waituntilfn.md)
* [Worker](interfaces/worker.md)
* [WorkerShutdownFn](interfaces/workershutdownfn.md)

#### Type aliases

* [ResponseError](overview.md#responseerror)

#### Functions

* [formatURL](overview.md#formaturl)
* [newMsgId](overview.md#newmsgid)

## Type aliases

###  ResponseError

Ƭ **ResponseError**: *[ErrorObj](interfaces/errorobj.md) | string*

*Defined in [messenger/interfaces.ts:43](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-messaging/src/messenger/interfaces.ts#L43)*

## Functions

###  formatURL

▸ **formatURL**(`hostname`: string, `port`: number): *string*

*Defined in [utils/index.ts:9](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-messaging/src/utils/index.ts#L9)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`hostname` | string |  os.hostname() |
`port` | number | - |

**Returns:** *string*

___

###  newMsgId

▸ **newMsgId**(): *`Promise<string>`*

*Defined in [utils/index.ts:5](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-messaging/src/utils/index.ts#L5)*

**Returns:** *`Promise<string>`*
