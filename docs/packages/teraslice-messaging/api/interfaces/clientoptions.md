---
title: Teraslice Messaging :: ClientOptions
sidebar_label: ClientOptions
---

# Interface: ClientOptions

## Hierarchy

* [CoreOptions](coreoptions.md)

  * **ClientOptions**

### Index

#### Properties

* [actionTimeout](clientoptions.md#actiontimeout)
* [clientId](clientoptions.md#clientid)
* [clientType](clientoptions.md#clienttype)
* [clusterMasterUrl](clientoptions.md#clustermasterurl)
* [connectTimeout](clientoptions.md#connecttimeout)
* [exId](clientoptions.md#exid)
* [executionControllerUrl](clientoptions.md#executioncontrollerurl)
* [hostUrl](clientoptions.md#hosturl)
* [logger](clientoptions.md#optional-logger)
* [networkLatencyBuffer](clientoptions.md#optional-networklatencybuffer)
* [serverName](clientoptions.md#servername)
* [socketOptions](clientoptions.md#optional-socketoptions)
* [workerId](clientoptions.md#workerid)

## Properties

###  actionTimeout

• **actionTimeout**: *number*

*Inherited from [CoreOptions](coreoptions.md).[actionTimeout](coreoptions.md#actiontimeout)*

*Defined in [messenger/interfaces.ts:7](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/messenger/interfaces.ts#L7)*

*Defined in [cluster-master/interfaces.ts:9](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L9)*

*Defined in [execution-controller/interfaces.ts:8](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/execution-controller/interfaces.ts#L8)*

___

###  clientId

• **clientId**: *string*

*Defined in [messenger/interfaces.ts:13](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/messenger/interfaces.ts#L13)*

___

###  clientType

• **clientType**: *string*

*Defined in [messenger/interfaces.ts:14](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/messenger/interfaces.ts#L14)*

___

###  clusterMasterUrl

• **clusterMasterUrl**: *string*

*Defined in [cluster-master/interfaces.ts:6](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L6)*

___

###  connectTimeout

• **connectTimeout**: *number*

*Defined in [messenger/interfaces.ts:16](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/messenger/interfaces.ts#L16)*

*Defined in [cluster-master/interfaces.ts:10](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L10)*

*Defined in [execution-controller/interfaces.ts:9](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/execution-controller/interfaces.ts#L9)*

___

###  exId

• **exId**: *string*

*Defined in [cluster-master/interfaces.ts:5](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L5)*

___

###  executionControllerUrl

• **executionControllerUrl**: *string*

*Defined in [execution-controller/interfaces.ts:4](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/execution-controller/interfaces.ts#L4)*

___

###  hostUrl

• **hostUrl**: *string*

*Defined in [messenger/interfaces.ts:12](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/messenger/interfaces.ts#L12)*

___

### `Optional` logger

• **logger**? : *`Logger`*

*Inherited from [CoreOptions](coreoptions.md).[logger](coreoptions.md#optional-logger)*

*Defined in [messenger/interfaces.ts:8](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/messenger/interfaces.ts#L8)*

*Defined in [cluster-master/interfaces.ts:11](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L11)*

*Defined in [execution-controller/interfaces.ts:10](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/execution-controller/interfaces.ts#L10)*

___

### `Optional` networkLatencyBuffer

• **networkLatencyBuffer**? : *undefined | number*

*Inherited from [CoreOptions](coreoptions.md).[networkLatencyBuffer](coreoptions.md#optional-networklatencybuffer)*

*Defined in [messenger/interfaces.ts:6](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/messenger/interfaces.ts#L6)*

*Defined in [cluster-master/interfaces.ts:8](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L8)*

*Defined in [execution-controller/interfaces.ts:7](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/execution-controller/interfaces.ts#L7)*

___

###  serverName

• **serverName**: *string*

*Defined in [messenger/interfaces.ts:15](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/messenger/interfaces.ts#L15)*

___

### `Optional` socketOptions

• **socketOptions**? : *`ConnectOpts`*

*Defined in [messenger/interfaces.ts:17](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/messenger/interfaces.ts#L17)*

*Defined in [cluster-master/interfaces.ts:7](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/cluster-master/interfaces.ts#L7)*

*Defined in [execution-controller/interfaces.ts:6](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/execution-controller/interfaces.ts#L6)*

___

###  workerId

• **workerId**: *string*

*Defined in [execution-controller/interfaces.ts:5](https://github.com/terascope/teraslice/blob/7cdb60b1/packages/teraslice-messaging/src/execution-controller/interfaces.ts#L5)*
