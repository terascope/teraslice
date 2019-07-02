---
title: Job Components Execution Context Interfaces
sidebar_label: Execution Context Interfaces
---

> Execution Context Interfaces for @terascope/job-components

[Globals](../overview.md) / ["execution-context/interfaces"](_execution_context_interfaces_.md) /

# External module: "execution-context/interfaces"

### Index

#### Interfaces

* [EventHandlers](../interfaces/_execution_context_interfaces_.eventhandlers.md)
* [ExecutionContextConfig](../interfaces/_execution_context_interfaces_.executioncontextconfig.md)
* [JobAPIInstance](../interfaces/_execution_context_interfaces_.jobapiinstance.md)
* [JobAPIInstances](../interfaces/_execution_context_interfaces_.jobapiinstances.md)
* [RunSliceResult](../interfaces/_execution_context_interfaces_.runsliceresult.md)
* [SlicerOperations](../interfaces/_execution_context_interfaces_.sliceroperations.md)
* [WorkerOperations](../interfaces/_execution_context_interfaces_.workeroperations.md)

#### Type aliases

* [SliceStatus](_execution_context_interfaces_.md#slicestatus)
* [WorkerSliceState](_execution_context_interfaces_.md#workerslicestate)
* [WorkerStatus](_execution_context_interfaces_.md#workerstatus)

## Type aliases

###  SliceStatus

Ƭ **SliceStatus**: *"starting" | "started" | "completed" | "failed" | "flushed"*

*Defined in [execution-context/interfaces.ts:40](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/interfaces.ts#L40)*

___

###  WorkerSliceState

Ƭ **WorkerSliceState**: *object*

*Defined in [execution-context/interfaces.ts:48](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/interfaces.ts#L48)*

#### Type declaration:

___

###  WorkerStatus

Ƭ **WorkerStatus**: *"initializing" | "idle" | "flushing" | "running" | "shutdown"*

*Defined in [execution-context/interfaces.ts:39](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/interfaces.ts#L39)*
