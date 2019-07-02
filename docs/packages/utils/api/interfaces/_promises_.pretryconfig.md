---
title: Utils Promises Pretryconfig
sidebar_label: Promises Pretryconfig
---

> Promises Pretryconfig for @terascope/utils

[Globals](../overview.md) / ["promises"](../modules/_promises_.md) / [PRetryConfig](_promises_.pretryconfig.md) /

# Interface: PRetryConfig

## Hierarchy

* **PRetryConfig**

### Index

#### Properties

* [backoff](_promises_.pretryconfig.md#backoff)
* [delay](_promises_.pretryconfig.md#delay)
* [endWithFatal](_promises_.pretryconfig.md#endwithfatal)
* [logError](_promises_.pretryconfig.md#logerror)
* [matches](_promises_.pretryconfig.md#optional-matches)
* [maxDelay](_promises_.pretryconfig.md#maxdelay)
* [reason](_promises_.pretryconfig.md#optional-reason)
* [retries](_promises_.pretryconfig.md#retries)

## Properties

###  backoff

• **backoff**: *number*

*Defined in [promises.ts:35](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L35)*

The backoff multiplier

**`default`** 2

___

###  delay

• **delay**: *number*

*Defined in [promises.ts:21](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L21)*

The initial time to delay before retrying the function

**`default`** 500

___

###  endWithFatal

• **endWithFatal**: *boolean*

*Defined in [promises.ts:40](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L40)*

If set to true, this will set fail with fatalError to true

___

###  logError

• **logError**: *function*

*Defined in [promises.ts:50](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L50)*

Log function for logging any errors that occurred

#### Type declaration:

▸ (...`args`: *any[]*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

___

### `Optional` matches

• **matches**? : *string | `RegExp`[]*

*Defined in [promises.ts:57](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L57)*

If this not specified or is empty, all errors will be treated as retryable.
If any of the items in the array match the error message,
it will be considered retryable

___

###  maxDelay

• **maxDelay**: *number*

*Defined in [promises.ts:28](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L28)*

The maximum time to delay when retrying in milliseconds

**`default`** 60000

___

### `Optional` reason

• **reason**? : *undefined | string*

*Defined in [promises.ts:45](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L45)*

Set a error message prefix

___

###  retries

• **retries**: *number*

*Defined in [promises.ts:14](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/promises.ts#L14)*

The number of retries to attempt before failing.
This does not include the initial attempt

**`default`** 3
