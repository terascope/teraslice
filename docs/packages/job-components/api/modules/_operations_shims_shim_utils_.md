---
title: Job Components Operations Shims Shim Utils
sidebar_label: Operations Shims Shim Utils
---

> Operations Shims Shim Utils for @terascope/job-components

[Globals](../overview.md) / ["operations/shims/shim-utils"](_operations_shims_shim_utils_.md) /

# External module: "operations/shims/shim-utils"

### Index

#### Functions

* [convertResult](_operations_shims_shim_utils_.md#convertresult)

## Functions

###  convertResult

▸ **convertResult**(`input`: *`DataInput`[] | `Buffer`[] | string[]*): *`DataEntity`[]*

*Defined in [operations/shims/shim-utils.ts:16](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/shims/shim-utils.ts#L16)*

Convert legacy processor results into DataEntities if possible.
But in order to be more backwards compatible legacy modules
can return an array of buffers or strings.

**Parameters:**

Name | Type |
------ | ------ |
`input` | `DataInput`[] \| `Buffer`[] \| string[] |

**Returns:** *`DataEntity`[]*
