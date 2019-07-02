---
title: Utils Errors
sidebar_label: Errors
---

> Errors for @terascope/utils

[Globals](../overview.md) / ["errors"](_errors_.md) /

# External module: "errors"

### Index

#### Classes

* [TSError](../classes/_errors_.tserror.md)

#### Interfaces

* [ElasticsearchError](../interfaces/_errors_.elasticsearcherror.md)
* [TSErrorConfig](../interfaces/_errors_.tserrorconfig.md)
* [TSErrorContext](../interfaces/_errors_.tserrorcontext.md)

#### Functions

* [getErrorStatusCode](_errors_.md#geterrorstatuscode)
* [isElasticsearchError](_errors_.md#iselasticsearcherror)
* [isError](_errors_.md#iserror)
* [isFatalError](_errors_.md#isfatalerror)
* [isRetryableError](_errors_.md#isretryableerror)
* [isTSError](_errors_.md#istserror)
* [parseError](_errors_.md#parseerror)
* [parseErrorInfo](_errors_.md#parseerrorinfo)
* [prefixErrorMsg](_errors_.md#prefixerrormsg)
* [stripErrorMessage](_errors_.md#striperrormessage)
* [toStatusErrorCode](_errors_.md#tostatuserrorcode)

## Functions

###  getErrorStatusCode

▸ **getErrorStatusCode**(`err`: *any*, `config`: *[TSErrorConfig](../interfaces/_errors_.tserrorconfig.md)*, `defaultCode`: *number*): *number*

*Defined in [errors.ts:357](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L357)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`err` | any | - |
`config` | [TSErrorConfig](../interfaces/_errors_.tserrorconfig.md) |  {} |
`defaultCode` | number |  DEFAULT_STATUS_CODE |

**Returns:** *number*

___

###  isElasticsearchError

▸ **isElasticsearchError**(`err`: *any*): *boolean*

*Defined in [errors.ts:321](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L321)*

Check is a elasticsearch error

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isError

▸ **isError**(`err`: *any*): *boolean*

*Defined in [errors.ts:307](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L307)*

Check if an input has an error compatible api

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isFatalError

▸ **isFatalError**(`err`: *any*): *boolean*

*Defined in [errors.ts:298](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L298)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isRetryableError

▸ **isRetryableError**(`err`: *any*): *boolean*

*Defined in [errors.ts:302](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L302)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  isTSError

▸ **isTSError**(`err`: *any*): *boolean*

*Defined in [errors.ts:312](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L312)*

Check is a TSError

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *boolean*

___

###  parseError

▸ **parseError**(`input`: *any*, `withStack`: *boolean*): *string*

*Defined in [errors.ts:199](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L199)*

parse input to get error message or stack

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`withStack` | boolean | false |

**Returns:** *string*

___

###  parseErrorInfo

▸ **parseErrorInfo**(`input`: *any*, `config`: *[TSErrorConfig](../interfaces/_errors_.tserrorconfig.md)*): *`ErrorInfo`*

*Defined in [errors.ts:130](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L130)*

parse error for info

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`config` | [TSErrorConfig](../interfaces/_errors_.tserrorconfig.md) |  {} |

**Returns:** *`ErrorInfo`*

___

###  prefixErrorMsg

▸ **prefixErrorMsg**(`input`: *any*, `prefix?`: *undefined | string*, `defaultMsg`: *string*): *string*

*Defined in [errors.ts:288](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L288)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`prefix?` | undefined \| string | - |
`defaultMsg` | string | "Unknown Error" |

**Returns:** *string*

___

###  stripErrorMessage

▸ **stripErrorMessage**(`error`: *any*, `reason`: *string*, `requireSafe`: *boolean*): *string*

*Defined in [errors.ts:374](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L374)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`error` | any | - |
`reason` | string |  DEFAULT_ERR_MSG |
`requireSafe` | boolean | false |

**Returns:** *string*

___

###  toStatusErrorCode

▸ **toStatusErrorCode**(`input`: *string | undefined*): *string*

*Defined in [errors.ts:256](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L256)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string \| undefined |

**Returns:** *string*
