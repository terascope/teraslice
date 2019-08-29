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

*Defined in [interfaces.ts:107](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L107)*

___

###  AssetsPutResponse

Ƭ **AssetsPutResponse**: *[Asset](interfaces/asset.md)*

*Defined in [interfaces.ts:108](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L108)*

___

###  AssetsTxtResponse

Ƭ **AssetsTxtResponse**: *string*

*Defined in [interfaces.ts:106](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L106)*

___

###  ChangeWorkerQueryParams

Ƭ **ChangeWorkerQueryParams**: *"add" | "remove" | "total"*

*Defined in [interfaces.ts:299](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L299)*

___

###  ClusterProcess

Ƭ **ClusterProcess**: *[NativeProcess](interfaces/nativeprocess.md) | [KubernetesProcess](interfaces/kubernetesprocess.md)*

*Defined in [interfaces.ts:170](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L170)*

___

###  ClusterState

Ƭ **ClusterState**: *[ClusterStateNative](interfaces/clusterstatenative.md) & [ClusterStateKubernetes](interfaces/clusterstatekubernetes.md)*

*Defined in [interfaces.ts:169](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L169)*

___

###  ControllerState

Ƭ **ControllerState**: *[SlicerStats](interfaces/slicerstats.md)[]*

*Defined in [interfaces.ts:314](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L314)*

___

###  ExecutionGetResponse

Ƭ **ExecutionGetResponse**: *[Execution](interfaces/execution.md)[]*

*Defined in [interfaces.ts:267](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L267)*

___

###  ExecutionInitStatus

Ƭ **ExecutionInitStatus**: *"pending" | "scheduling" | "initializing"*

*Defined in [interfaces.ts:213](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L213)*

___

###  ExecutionPutResponse

Ƭ **ExecutionPutResponse**: *[Execution](interfaces/execution.md)*

*Defined in [interfaces.ts:268](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L268)*

___

###  ExecutionRunningStatus

Ƭ **ExecutionRunningStatus**: *"running" | "failing" | "paused" | "stopping"*

*Defined in [interfaces.ts:214](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L214)*

___

###  ExecutionTerminalStatus

Ƭ **ExecutionTerminalStatus**: *"completed" | "stopped" | "rejected" | "failed" | "terminated"*

*Defined in [interfaces.ts:215](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L215)*

___

###  ExecutionTxtResponse

Ƭ **ExecutionTxtResponse**: *string*

*Defined in [interfaces.ts:266](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L266)*

___

###  JobListStatusQuery

Ƭ **JobListStatusQuery**: *[SearchJobStatus](overview.md#searchjobstatus) | [JobSearchParams](interfaces/jobsearchparams.md)*

*Defined in [interfaces.ts:34](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L34)*

___

###  JobProcesses

Ƭ **JobProcesses**: *[JobNativeProcess](interfaces/jobnativeprocess.md) | [JobKubernetesProcess](interfaces/jobkubernetesprocess.md)*

*Defined in [interfaces.ts:77](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L77)*

___

###  JobsGetResponse

Ƭ **JobsGetResponse**: *[JobConfiguration](interfaces/jobconfiguration.md)[]*

*Defined in [interfaces.ts:187](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L187)*

___

###  JobsPutResponse

Ƭ **JobsPutResponse**: *[JobConfiguration](interfaces/jobconfiguration.md)*

*Defined in [interfaces.ts:188](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L188)*

___

###  JobsTxtResponse

Ƭ **JobsTxtResponse**: *string*

*Defined in [interfaces.ts:186](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L186)*

___

###  PostData

Ƭ **PostData**: *string | ReadableStream | Buffer*

*Defined in [interfaces.ts:51](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L51)*

___

###  SearchJobStatus

Ƭ **SearchJobStatus**: *"*" | [ExecutionStatus](enums/executionstatus.md)*

*Defined in [interfaces.ts:32](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L32)*

___

###  SearchOptions

Ƭ **SearchOptions**: *Omit‹[RequestOptions](interfaces/requestoptions.md), "query"›*

*Defined in [interfaces.ts:49](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L49)*

___

###  SearchQuery

Ƭ **SearchQuery**: *[APISearchParams](interfaces/apisearchparams.md) & Record‹string, any›*

*Defined in [interfaces.ts:40](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L40)*

___

###  StateErrors

Ƭ **StateErrors**: *[ErrorStateRecord](interfaces/errorstaterecord.md)[]*

*Defined in [interfaces.ts:332](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L332)*

___

###  TxtType

Ƭ **TxtType**: *"assets" | "slicers" | "ex" | "jobs" | "nodes" | "workers"*

*Defined in [interfaces.ts:53](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L53)*

___

###  WorkerJobProcesses

Ƭ **WorkerJobProcesses**: *Overwrite‹[JobProcesses](overview.md#jobprocesses), object›*

*Defined in [interfaces.ts:79](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-client-js/src/interfaces.ts#L79)*
