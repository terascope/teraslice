---
title: Job Components Execution Context Utils
sidebar_label: Execution Context Utils
---

> Execution Context Utils for @terascope/job-components

[Globals](../overview.md) / ["execution-context/utils"](_execution_context_utils_.md) /

# External module: "execution-context/utils"

### Index

#### Functions

* [getMetric](_execution_context_utils_.md#getmetric)
* [getOperationAPIType](_execution_context_utils_.md#getoperationapitype)
* [isOperationAPI](_execution_context_utils_.md#isoperationapi)
* [makeContextLogger](_execution_context_utils_.md#makecontextlogger)

## Functions

###  getMetric

▸ **getMetric**(`input`: *number[]*, `i`: *number*): *number*

*Defined in [execution-context/utils.ts:5](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/utils.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | number[] |
`i` | number |

**Returns:** *number*

___

###  getOperationAPIType

▸ **getOperationAPIType**(`api`: *any*): *[OperationAPIType](_operations_interfaces_.md#operationapitype)*

*Defined in [execution-context/utils.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/utils.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`api` | any |

**Returns:** *[OperationAPIType](_operations_interfaces_.md#operationapitype)*

___

###  isOperationAPI

▸ **isOperationAPI**(`api`: *any*): *boolean*

*Defined in [execution-context/utils.ts:11](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/utils.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`api` | any |

**Returns:** *boolean*

___

###  makeContextLogger

▸ **makeContextLogger**(`context`: *[Context](../interfaces/_interfaces_context_.context.md)*, `moduleName`: *string*, `extra`: *object*): *`Logger`*

*Defined in [execution-context/utils.ts:19](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/execution-context/utils.ts#L19)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`context` | [Context](../interfaces/_interfaces_context_.context.md) | - |
`moduleName` | string | - |
`extra` | object |  {} |

**Returns:** *`Logger`*
