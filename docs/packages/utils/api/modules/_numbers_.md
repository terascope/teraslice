---
title: Utils Numbers
sidebar_label: Numbers
---

> Numbers for @terascope/utils

[Globals](../overview.md) / ["numbers"](_numbers_.md) /

# External module: "numbers"

### Index

#### Functions

* [isInteger](_numbers_.md#isinteger)
* [isNumber](_numbers_.md#isnumber)
* [parseNumberList](_numbers_.md#parsenumberlist)
* [random](_numbers_.md#random)
* [toInteger](_numbers_.md#tointeger)
* [toNumber](_numbers_.md#tonumber)

## Functions

###  isInteger

▸ **isInteger**(`val`: *any*): *boolean*

*Defined in [numbers.ts:2](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/numbers.ts#L2)*

A simplified implemation of lodash isInteger

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  isNumber

▸ **isNumber**(`input`: *any*): *boolean*

*Defined in [numbers.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/numbers.ts#L13)*

Check if an input is a number

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  parseNumberList

▸ **parseNumberList**(`input`: *any*): *number[]*

*Defined in [numbers.ts:35](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/numbers.ts#L35)*

Like parseList, except it returns numbers

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number[]*

___

###  random

▸ **random**(`min`: *number*, `max`: *number*): *number*

*Defined in [numbers.ts:8](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/numbers.ts#L8)*

A native implemation of lodash random

**Parameters:**

Name | Type |
------ | ------ |
`min` | number |
`max` | number |

**Returns:** *number*

___

###  toInteger

▸ **toInteger**(`input`: *any*): *number | false*

*Defined in [numbers.ts:25](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/numbers.ts#L25)*

Convert any input to a integer, return false if unable to convert input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number | false*

___

###  toNumber

▸ **toNumber**(`input`: *any*): *number*

*Defined in [numbers.ts:18](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/numbers.ts#L18)*

Convert any input to a number, return Number.NaN if unable to convert input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number*
