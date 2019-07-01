> **[utils](../README.md)**

[Globals](../README.md) / ["promises"](../modules/_promises_.md) / [PRetryConfig](_promises_.pretryconfig.md) /

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

*Defined in [promises.ts:35](https://github.com/terascope/teraslice/tree/683dac73cdbcf5a70581ac5c9ea14ddddf69eb91/packages/utils/promises.ts#L35)*

The backoff multiplier

**`default`** 2

___

###  delay

• **delay**: *number*

*Defined in [promises.ts:21](https://github.com/terascope/teraslice/tree/683dac73cdbcf5a70581ac5c9ea14ddddf69eb91/packages/utils/promises.ts#L21)*

The initial time to delay before retrying the function

**`default`** 500

___

###  endWithFatal

• **endWithFatal**: *boolean*

*Defined in [promises.ts:40](https://github.com/terascope/teraslice/tree/683dac73cdbcf5a70581ac5c9ea14ddddf69eb91/packages/utils/promises.ts#L40)*

If set to true, this will set fail with fatalError to true

___

###  logError

• **logError**: *function*

*Defined in [promises.ts:50](https://github.com/terascope/teraslice/tree/683dac73cdbcf5a70581ac5c9ea14ddddf69eb91/packages/utils/promises.ts#L50)*

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

*Defined in [promises.ts:57](https://github.com/terascope/teraslice/tree/683dac73cdbcf5a70581ac5c9ea14ddddf69eb91/packages/utils/promises.ts#L57)*

If this not specified or is empty, all errors will be treated as retryable.
If any of the items in the array match the error message,
it will be considered retryable

___

###  maxDelay

• **maxDelay**: *number*

*Defined in [promises.ts:28](https://github.com/terascope/teraslice/tree/683dac73cdbcf5a70581ac5c9ea14ddddf69eb91/packages/utils/promises.ts#L28)*

The maximum time to delay when retrying in milliseconds

**`default`** 60000

___

### `Optional` reason

• **reason**? : *undefined | string*

*Defined in [promises.ts:45](https://github.com/terascope/teraslice/tree/683dac73cdbcf5a70581ac5c9ea14ddddf69eb91/packages/utils/promises.ts#L45)*

Set a error message prefix

___

###  retries

• **retries**: *number*

*Defined in [promises.ts:14](https://github.com/terascope/teraslice/tree/683dac73cdbcf5a70581ac5c9ea14ddddf69eb91/packages/utils/promises.ts#L14)*

The number of retries to attempt before failing.
This does not include the initial attempt

**`default`** 3