---
title: Teraslice Client (JavaScript) API Overview
sidebar_label: API
---

## Index

### Enumerations

* [ExecutionStatus](enums/executionstatus.md)

### Classes

* [Assets](classes/assets.md)
* [Client](classes/client.md)
* [Cluster](classes/cluster.md)
* [Ex](classes/ex.md)
* [Job](classes/job.md)
* [Jobs](classes/jobs.md)

### Interfaces

* [APISearchParams](interfaces/apisearchparams.md)
* [Asset](interfaces/asset.md)
* [AssetIDResponse](interfaces/assetidresponse.md)
* [AssetStatusResponse](interfaces/assetstatusresponse.md)
* [AssetsDeleteResponse](interfaces/assetsdeleteresponse.md)
* [AssetsPostResponse](interfaces/assetspostresponse.md)
* [ChangeWorkerResponse](interfaces/changeworkerresponse.md)
* [ClientConfig](interfaces/clientconfig.md)
* [ClusterStateKubernetes](interfaces/clusterstatekubernetes.md)
* [ClusterStateNative](interfaces/clusterstatenative.md)
* [ClusterStateNodeKubernetes](interfaces/clusterstatenodekubernetes.md)
* [ClusterStateNodeNative](interfaces/clusterstatenodenative.md)
* [ClusterStats](interfaces/clusterstats.md)
* [ErrorResponse](interfaces/errorresponse.md)
* [ErrorStateRecord](interfaces/errorstaterecord.md)
* [Execution](interfaces/execution.md)
* [ExecutionIDResponse](interfaces/executionidresponse.md)
* [JobConfiguration](interfaces/jobconfiguration.md)
* [JobIDResponse](interfaces/jobidresponse.md)
* [JobKubernetesProcess](interfaces/jobkubernetesprocess.md)
* [JobNativeProcess](interfaces/jobnativeprocess.md)
* [JobSearchParams](interfaces/jobsearchparams.md)
* [KubernetesProcess](interfaces/kubernetesprocess.md)
* [NativeProcess](interfaces/nativeprocess.md)
* [PausedResponse](interfaces/pausedresponse.md)
* [RecoverQuery](interfaces/recoverquery.md)
* [RequestOptions](interfaces/requestoptions.md)
* [ResumeResponse](interfaces/resumeresponse.md)
* [RootResponse](interfaces/rootresponse.md)
* [SliceAccumulationStats](interfaces/sliceaccumulationstats.md)
* [SlicerAnalytics](interfaces/sliceranalytics.md)
* [SlicerStats](interfaces/slicerstats.md)
* [StopQuery](interfaces/stopquery.md)
* [StoppedResponse](interfaces/stoppedresponse.md)
* [TxtSearchParams](interfaces/txtsearchparams.md)

### Type aliases

* [AssetsGetResponse](overview.md#assetsgetresponse)
* [AssetsPutResponse](overview.md#assetsputresponse)
* [AssetsTxtResponse](overview.md#assetstxtresponse)
* [ChangeWorkerQueryParams](overview.md#changeworkerqueryparams)
* [ClusterProcess](overview.md#clusterprocess)
* [ClusterState](overview.md#clusterstate)
* [ControllerState](overview.md#controllerstate)
* [ExecutionGetResponse](overview.md#executiongetresponse)
* [ExecutionInitStatus](overview.md#executioninitstatus)
* [ExecutionPutResponse](overview.md#executionputresponse)
* [ExecutionRunningStatus](overview.md#executionrunningstatus)
* [ExecutionTerminalStatus](overview.md#executionterminalstatus)
* [ExecutionTxtResponse](overview.md#executiontxtresponse)
* [JobListStatusQuery](overview.md#jobliststatusquery)
* [JobProcesses](overview.md#jobprocesses)
* [JobsGetResponse](overview.md#jobsgetresponse)
* [JobsPutResponse](overview.md#jobsputresponse)
* [JobsTxtResponse](overview.md#jobstxtresponse)
* [PostData](overview.md#postdata)
* [SearchJobStatus](overview.md#searchjobstatus)
* [SearchOptions](overview.md#searchoptions)
* [SearchQuery](overview.md#searchquery)
* [StateErrors](overview.md#stateerrors)
* [TxtType](overview.md#txttype)
* [WorkerJobProcesses](overview.md#workerjobprocesses)

## Type aliases

###  AssetsGetResponse

Ƭ **AssetsGetResponse**: *[Asset](interfaces/asset.md)[]*

*Defined in [interfaces.ts:106](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L106)*

___

###  AssetsPutResponse

Ƭ **AssetsPutResponse**: *[Asset](interfaces/asset.md)*

*Defined in [interfaces.ts:107](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L107)*

___

###  AssetsTxtResponse

Ƭ **AssetsTxtResponse**: *string*

*Defined in [interfaces.ts:105](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L105)*

___

###  ChangeWorkerQueryParams

Ƭ **ChangeWorkerQueryParams**: *"add" | "remove" | "total"*

*Defined in [interfaces.ts:298](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L298)*

___

###  ClusterProcess

Ƭ **ClusterProcess**: *[NativeProcess](interfaces/nativeprocess.md) | [KubernetesProcess](interfaces/kubernetesprocess.md)*

*Defined in [interfaces.ts:169](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L169)*

___

###  ClusterState

Ƭ **ClusterState**: *[ClusterStateNative](interfaces/clusterstatenative.md) & [ClusterStateKubernetes](interfaces/clusterstatekubernetes.md)*

*Defined in [interfaces.ts:168](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L168)*

___

###  ControllerState

Ƭ **ControllerState**: *[SlicerStats](interfaces/slicerstats.md)[]*

*Defined in [interfaces.ts:313](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L313)*

___

###  ExecutionGetResponse

Ƭ **ExecutionGetResponse**: *[Execution](interfaces/execution.md)[]*

*Defined in [interfaces.ts:266](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L266)*

___

###  ExecutionInitStatus

Ƭ **ExecutionInitStatus**: *"pending" | "scheduling" | "initializing"*

*Defined in [interfaces.ts:212](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L212)*

___

###  ExecutionPutResponse

Ƭ **ExecutionPutResponse**: *[Execution](interfaces/execution.md)*

*Defined in [interfaces.ts:267](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L267)*

___

###  ExecutionRunningStatus

Ƭ **ExecutionRunningStatus**: *"running" | "failing" | "paused" | "stopping"*

*Defined in [interfaces.ts:213](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L213)*

___

###  ExecutionTerminalStatus

Ƭ **ExecutionTerminalStatus**: *"completed" | "stopped" | "rejected" | "failed" | "terminated"*

*Defined in [interfaces.ts:214](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L214)*

___

###  ExecutionTxtResponse

Ƭ **ExecutionTxtResponse**: *string*

*Defined in [interfaces.ts:265](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L265)*

___

###  JobListStatusQuery

Ƭ **JobListStatusQuery**: *[SearchJobStatus](overview.md#searchjobstatus) | [JobSearchParams](interfaces/jobsearchparams.md)*

*Defined in [interfaces.ts:33](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L33)*

___

###  JobProcesses

Ƭ **JobProcesses**: *[JobNativeProcess](interfaces/jobnativeprocess.md) | [JobKubernetesProcess](interfaces/jobkubernetesprocess.md)*

*Defined in [interfaces.ts:76](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L76)*

___

###  JobsGetResponse

Ƭ **JobsGetResponse**: *[JobConfiguration](interfaces/jobconfiguration.md)[]*

*Defined in [interfaces.ts:186](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L186)*

___

###  JobsPutResponse

Ƭ **JobsPutResponse**: *[JobConfiguration](interfaces/jobconfiguration.md)*

*Defined in [interfaces.ts:187](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L187)*

___

###  JobsTxtResponse

Ƭ **JobsTxtResponse**: *string*

*Defined in [interfaces.ts:185](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L185)*

___

###  PostData

Ƭ **PostData**: *string | ReadableStream | Buffer*

*Defined in [interfaces.ts:50](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L50)*

___

###  SearchJobStatus

Ƭ **SearchJobStatus**: *"*" | [ExecutionStatus](enums/executionstatus.md)*

*Defined in [interfaces.ts:31](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L31)*

___

###  SearchOptions

Ƭ **SearchOptions**: *Omit‹[RequestOptions](interfaces/requestoptions.md), "query"›*

*Defined in [interfaces.ts:48](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L48)*

___

###  SearchQuery

Ƭ **SearchQuery**: *[APISearchParams](interfaces/apisearchparams.md) & Record‹string, any›*

*Defined in [interfaces.ts:39](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L39)*

___

###  StateErrors

Ƭ **StateErrors**: *[ErrorStateRecord](interfaces/errorstaterecord.md)[]*

*Defined in [interfaces.ts:331](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L331)*

___

###  TxtType

Ƭ **TxtType**: *"assets" | "slicers" | "ex" | "jobs" | "nodes" | "workers"*

*Defined in [interfaces.ts:52](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L52)*

___

###  WorkerJobProcesses

Ƭ **WorkerJobProcesses**: *Overwrite‹[JobProcesses](overview.md#jobprocesses), object›*

*Defined in [interfaces.ts:78](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-client-js/src/interfaces.ts#L78)*
