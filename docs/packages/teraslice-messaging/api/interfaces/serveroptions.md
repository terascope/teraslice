---
title: Teraslice Messaging: `ServerOptions`
sidebar_label: ServerOptions
---

# Interface: ServerOptions

## Hierarchy

* [CoreOptions](coreoptions.md)

  ↳ **ServerOptions**

## Index

### Properties

* [actionTimeout](serveroptions.md#actiontimeout)
* [clientDisconnectTimeout](serveroptions.md#clientdisconnecttimeout)
* [logger](serveroptions.md#optional-logger)
* [networkLatencyBuffer](serveroptions.md#optional-networklatencybuffer)
* [nodeDisconnectTimeout](serveroptions.md#nodedisconnecttimeout)
* [port](serveroptions.md#port)
* [requestListener](serveroptions.md#optional-requestlistener)
* [serverName](serveroptions.md#servername)
* [serverTimeout](serveroptions.md#optional-servertimeout)
* [workerDisconnectTimeout](serveroptions.md#workerdisconnecttimeout)

## Properties

###  actionTimeout

• **actionTimeout**: *number*

*Inherited from [CoreOptions](coreoptions.md).[actionTimeout](coreoptions.md#actiontimeout)*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:7](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/messenger/interfaces.ts#L7)*

*Defined in [packages/teraslice-messaging/src/cluster-master/interfaces.ts:18](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L18)*

*Defined in [packages/teraslice-messaging/src/execution-controller/interfaces.ts:18](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/execution-controller/interfaces.ts#L18)*

___

###  clientDisconnectTimeout

• **clientDisconnectTimeout**: *number*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:24](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/messenger/interfaces.ts#L24)*

___

### `Optional` logger

• **logger**? : *Logger*

*Inherited from [CoreOptions](coreoptions.md).[logger](coreoptions.md#optional-logger)*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:8](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/messenger/interfaces.ts#L8)*

*Defined in [packages/teraslice-messaging/src/cluster-master/interfaces.ts:22](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L22)*

*Defined in [packages/teraslice-messaging/src/execution-controller/interfaces.ts:19](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/execution-controller/interfaces.ts#L19)*

___

### `Optional` networkLatencyBuffer

• **networkLatencyBuffer**? : *undefined | number*

*Inherited from [CoreOptions](coreoptions.md).[networkLatencyBuffer](coreoptions.md#optional-networklatencybuffer)*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:6](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/messenger/interfaces.ts#L6)*

*Defined in [packages/teraslice-messaging/src/cluster-master/interfaces.ts:20](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L20)*

*Defined in [packages/teraslice-messaging/src/execution-controller/interfaces.ts:17](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/execution-controller/interfaces.ts#L17)*

___

###  nodeDisconnectTimeout

• **nodeDisconnectTimeout**: *number*

*Defined in [packages/teraslice-messaging/src/cluster-master/interfaces.ts:17](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L17)*

___

###  port

• **port**: *number*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:22](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/messenger/interfaces.ts#L22)*

*Defined in [packages/teraslice-messaging/src/cluster-master/interfaces.ts:16](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L16)*

*Defined in [packages/teraslice-messaging/src/execution-controller/interfaces.ts:15](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/execution-controller/interfaces.ts#L15)*

___

### `Optional` requestListener

• **requestListener**? : *[RequestListener](requestlistener.md)*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:26](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/messenger/interfaces.ts#L26)*

*Defined in [packages/teraslice-messaging/src/cluster-master/interfaces.ts:21](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L21)*

___

###  serverName

• **serverName**: *string*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:23](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/messenger/interfaces.ts#L23)*

___

### `Optional` serverTimeout

• **serverTimeout**? : *undefined | number*

*Defined in [packages/teraslice-messaging/src/messenger/interfaces.ts:25](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/messenger/interfaces.ts#L25)*

*Defined in [packages/teraslice-messaging/src/cluster-master/interfaces.ts:19](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L19)*

___

###  workerDisconnectTimeout

• **workerDisconnectTimeout**: *number*

*Defined in [packages/teraslice-messaging/src/execution-controller/interfaces.ts:16](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-messaging/src/execution-controller/interfaces.ts#L16)*
