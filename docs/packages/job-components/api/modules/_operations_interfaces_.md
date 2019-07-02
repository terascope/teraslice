---
title: Job Components Operations Interfaces
sidebar_label: Operations Interfaces
---

> Operations Interfaces for @terascope/job-components

[Globals](../overview.md) / ["operations/interfaces"](_operations_interfaces_.md) /

# External module: "operations/interfaces"

### Index

#### Interfaces

* [APIModule](../interfaces/_operations_interfaces_.apimodule.md)
* [OperationModule](../interfaces/_operations_interfaces_.operationmodule.md)
* [ProcessorModule](../interfaces/_operations_interfaces_.processormodule.md)
* [ReaderModule](../interfaces/_operations_interfaces_.readermodule.md)
* [SchemaModule](../interfaces/_operations_interfaces_.schemamodule.md)

#### Type aliases

* [APIConstructor](_operations_interfaces_.md#apiconstructor)
* [APICoreConstructor](_operations_interfaces_.md#apicoreconstructor)
* [CoreOperation](_operations_interfaces_.md#coreoperation)
* [FetcherConstructor](_operations_interfaces_.md#fetcherconstructor)
* [ObserverConstructor](_operations_interfaces_.md#observerconstructor)
* [OperationAPIConstructor](_operations_interfaces_.md#operationapiconstructor)
* [OperationAPIType](_operations_interfaces_.md#operationapitype)
* [OperationCoreConstructor](_operations_interfaces_.md#operationcoreconstructor)
* [ParallelSlicerConstructor](_operations_interfaces_.md#parallelslicerconstructor)
* [ProcessorConstructor](_operations_interfaces_.md#processorconstructor)
* [SchemaConstructor](_operations_interfaces_.md#schemaconstructor)
* [SingleSlicerConstructor](_operations_interfaces_.md#singleslicerconstructor)
* [SlicerConstructor](_operations_interfaces_.md#slicerconstructor)
* [SlicerCoreConstructor](_operations_interfaces_.md#slicercoreconstructor)

## Type aliases

###  APIConstructor

Ƭ **APIConstructor**: *[APICoreConstructor](_operations_interfaces_.md#apicoreconstructor)‹*[APICore](../classes/_operations_core_api_core_.apicore.md)*›*

*Defined in [operations/interfaces.ts:30](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L30)*

___

###  APICoreConstructor

Ƭ **APICoreConstructor**: *object*

*Defined in [operations/interfaces.ts:11](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L11)*

#### Type declaration:

___

###  CoreOperation

Ƭ **CoreOperation**: *[FetcherCore](../classes/_operations_core_fetcher_core_.fetchercore.md) | [SlicerCore](../classes/_operations_core_slicer_core_.slicercore.md) | [ProcessorCore](../classes/_operations_core_processor_core_.processorcore.md)*

*Defined in [operations/interfaces.ts:37](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L37)*

___

###  FetcherConstructor

Ƭ **FetcherConstructor**: *[OperationCoreConstructor](_operations_interfaces_.md#operationcoreconstructor)‹*[FetcherCore](../classes/_operations_core_fetcher_core_.fetchercore.md)*›*

*Defined in [operations/interfaces.ts:34](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L34)*

___

###  ObserverConstructor

Ƭ **ObserverConstructor**: *[APICoreConstructor](_operations_interfaces_.md#apicoreconstructor)‹*[APICore](../classes/_operations_core_api_core_.apicore.md)*›*

*Defined in [operations/interfaces.ts:29](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L29)*

___

###  OperationAPIConstructor

Ƭ **OperationAPIConstructor**: *[APICoreConstructor](_operations_interfaces_.md#apicoreconstructor)‹*[OperationAPI](../classes/_operations_operation_api_.operationapi.md)*›*

*Defined in [operations/interfaces.ts:28](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L28)*

___

###  OperationAPIType

Ƭ **OperationAPIType**: *"api" | "observer"*

*Defined in [operations/interfaces.ts:48](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L48)*

___

###  OperationCoreConstructor

Ƭ **OperationCoreConstructor**: *object*

*Defined in [operations/interfaces.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L15)*

#### Type declaration:

___

###  ParallelSlicerConstructor

Ƭ **ParallelSlicerConstructor**: *[SlicerCoreConstructor](_operations_interfaces_.md#slicercoreconstructor)‹*[ParallelSlicer](../classes/_operations_parallel_slicer_.parallelslicer.md)*›*

*Defined in [operations/interfaces.ts:33](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L33)*

___

###  ProcessorConstructor

Ƭ **ProcessorConstructor**: *[OperationCoreConstructor](_operations_interfaces_.md#operationcoreconstructor)‹*[ProcessorCore](../classes/_operations_core_processor_core_.processorcore.md)*›*

*Defined in [operations/interfaces.ts:35](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L35)*

___

###  SchemaConstructor

Ƭ **SchemaConstructor**: *object*

*Defined in [operations/interfaces.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L23)*

#### Type declaration:

___

###  SingleSlicerConstructor

Ƭ **SingleSlicerConstructor**: *[SlicerCoreConstructor](_operations_interfaces_.md#slicercoreconstructor)‹*[Slicer](../classes/_operations_slicer_.slicer.md)*›*

*Defined in [operations/interfaces.ts:32](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L32)*

___

###  SlicerConstructor

Ƭ **SlicerConstructor**: *[SlicerCoreConstructor](_operations_interfaces_.md#slicercoreconstructor)‹*[SlicerCore](../classes/_operations_core_slicer_core_.slicercore.md)*›*

*Defined in [operations/interfaces.ts:31](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L31)*

___

###  SlicerCoreConstructor

Ƭ **SlicerCoreConstructor**: *object*

*Defined in [operations/interfaces.ts:19](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/interfaces.ts#L19)*

#### Type declaration:
