---
title: Job Components Execution Context Index
sidebar_label: Execution Context Index
---

> Execution Context Index for @terascope/job-components

[Globals](../overview.md) / ["execution-context/index"](_execution_context_index_.md) /

# External module: "execution-context/index"

### Index

#### Functions

* [isSlicerContext](_execution_context_index_.md#isslicercontext)
* [isSlicerExecutionContext](_execution_context_index_.md#isslicerexecutioncontext)
* [isWorkerContext](_execution_context_index_.md#isworkercontext)
* [isWorkerExecutionContext](_execution_context_index_.md#isworkerexecutioncontext)
* [makeExecutionContext](_execution_context_index_.md#makeexecutioncontext)

## Functions

###  isSlicerContext

▸ **isSlicerContext**(`context`: *[Context](../interfaces/_interfaces_context_.context.md)*): *boolean*

*Defined in [execution-context/index.ts:16](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/index.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](../interfaces/_interfaces_context_.context.md) |

**Returns:** *boolean*

___

###  isSlicerExecutionContext

▸ **isSlicerExecutionContext**(`context`: *any*): *boolean*

*Defined in [execution-context/index.ts:24](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/index.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | any |

**Returns:** *boolean*

___

###  isWorkerContext

▸ **isWorkerContext**(`context`: *[Context](../interfaces/_interfaces_context_.context.md)*): *boolean*

*Defined in [execution-context/index.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/index.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](../interfaces/_interfaces_context_.context.md) |

**Returns:** *boolean*

___

###  isWorkerExecutionContext

▸ **isWorkerExecutionContext**(`context`: *any*): *boolean*

*Defined in [execution-context/index.ts:20](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/index.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | any |

**Returns:** *boolean*

___

###  makeExecutionContext

▸ **makeExecutionContext**(`config`: *[ExecutionContextConfig](../interfaces/_execution_context_interfaces_.executioncontextconfig.md)*): *[SlicerExecutionContext](../classes/_execution_context_slicer_.slicerexecutioncontext.md) | [WorkerExecutionContext](../classes/_execution_context_worker_.workerexecutioncontext.md)*

*Defined in [execution-context/index.ts:28](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/index.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ExecutionContextConfig](../interfaces/_execution_context_interfaces_.executioncontextconfig.md) |

**Returns:** *[SlicerExecutionContext](../classes/_execution_context_slicer_.slicerexecutioncontext.md) | [WorkerExecutionContext](../classes/_execution_context_worker_.workerexecutioncontext.md)*
