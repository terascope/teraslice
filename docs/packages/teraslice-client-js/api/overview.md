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
* [Executions](classes/executions.md)
* [Job](classes/job.md)
* [Jobs](classes/jobs.md)

### Interfaces

* [APISearchParams](interfaces/apisearchparams.md)
* [Asset](interfaces/asset.md)
* [AssetIDResponse](interfaces/assetidresponse.md)
* [AssetStatusResponse](interfaces/assetstatusresponse.md)
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

* [ChangeWorkerQueryParams](overview.md#changeworkerqueryparams)
* [ClusterProcess](overview.md#clusterprocess)
* [ClusterState](overview.md#clusterstate)
* [ControllerState](overview.md#controllerstate)
* [ExecutionInitStatus](overview.md#executioninitstatus)
* [ExecutionRunningStatus](overview.md#executionrunningstatus)
* [ExecutionTerminalStatus](overview.md#executionterminalstatus)
* [JobListStatusQuery](overview.md#jobliststatusquery)
* [JobProcesses](overview.md#jobprocesses)
* [PostData](overview.md#postdata)
* [SearchJobStatus](overview.md#searchjobstatus)
* [SearchOptions](overview.md#searchoptions)
* [SearchQuery](overview.md#searchquery)
* [StateErrors](overview.md#stateerrors)
* [TxtType](overview.md#txttype)
* [WorkerJobProcesses](overview.md#workerjobprocesses)

## Type aliases

###  ChangeWorkerQueryParams

Ƭ **ChangeWorkerQueryParams**: *"add" | "remove" | "total"*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:305](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L305)*

___

###  ClusterProcess

Ƭ **ClusterProcess**: *[NativeProcess](interfaces/nativeprocess.md) | [KubernetesProcess](interfaces/kubernetesprocess.md)*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:161](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L161)*

___

###  ClusterState

Ƭ **ClusterState**: *[ClusterStateNative](interfaces/clusterstatenative.md) & [ClusterStateKubernetes](interfaces/clusterstatekubernetes.md)*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:160](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L160)*

___

###  ControllerState

Ƭ **ControllerState**: *[SlicerStats](interfaces/slicerstats.md)[]*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:320](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L320)*

___

###  ExecutionInitStatus

Ƭ **ExecutionInitStatus**: *[pending](enums/executionstatus.md#pending) | [scheduling](enums/executionstatus.md#scheduling) | [recovering](enums/executionstatus.md#recovering)*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:220](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L220)*

___

###  ExecutionRunningStatus

Ƭ **ExecutionRunningStatus**: *[recovering](enums/executionstatus.md#recovering) | [running](enums/executionstatus.md#running) | [failing](enums/executionstatus.md#failing) | [paused](enums/executionstatus.md#paused) | [stopping](enums/executionstatus.md#stopping)*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:225](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L225)*

___

###  ExecutionTerminalStatus

Ƭ **ExecutionTerminalStatus**: *[completed](enums/executionstatus.md#completed) | [stopped](enums/executionstatus.md#stopped) | [rejected](enums/executionstatus.md#rejected) | [failed](enums/executionstatus.md#failed) | [terminated](enums/executionstatus.md#terminated)*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:232](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L232)*

___

###  JobListStatusQuery

Ƭ **JobListStatusQuery**: *[SearchJobStatus](overview.md#searchjobstatus) | [JobSearchParams](interfaces/jobsearchparams.md)*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:34](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L34)*

___

###  JobProcesses

Ƭ **JobProcesses**: *[JobNativeProcess](interfaces/jobnativeprocess.md) | [JobKubernetesProcess](interfaces/jobkubernetesprocess.md)*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:77](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L77)*

___

###  PostData

Ƭ **PostData**: *string | ReadableStream | Buffer*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:51](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L51)*

___

###  SearchJobStatus

Ƭ **SearchJobStatus**: *"*" | [ExecutionStatus](enums/executionstatus.md)*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:32](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L32)*

___

###  SearchOptions

Ƭ **SearchOptions**: *Omit‹[RequestOptions](interfaces/requestoptions.md), "query"›*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:49](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L49)*

___

###  SearchQuery

Ƭ **SearchQuery**: *[APISearchParams](interfaces/apisearchparams.md) & Record‹string, any›*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:40](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L40)*

___

###  StateErrors

Ƭ **StateErrors**: *[ErrorStateRecord](interfaces/errorstaterecord.md)[]*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:338](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L338)*

___

###  TxtType

Ƭ **TxtType**: *"assets" | "slicers" | "ex" | "jobs" | "nodes" | "workers"*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:53](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L53)*

___

###  WorkerJobProcesses

Ƭ **WorkerJobProcesses**: *Overwrite‹[JobProcesses](overview.md#jobprocesses), object›*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:79](https://github.com/terascope/teraslice/blob/f95bb5556/packages/teraslice-client-js/src/interfaces.ts#L79)*
