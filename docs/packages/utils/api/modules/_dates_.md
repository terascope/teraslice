---
title: Utils Dates
sidebar_label: Dates
---

> Dates for @terascope/utils

[Globals](../overview.md) / ["dates"](_dates_.md) /

# External module: "dates"

### Index

#### Functions

* [getValidDate](_dates_.md#getvaliddate)
* [isValidDate](_dates_.md#isvaliddate)
* [makeISODate](_dates_.md#makeisodate)

## Functions

###  getValidDate

▸ **getValidDate**(`val`: *any*): *`Date` | false*

*Defined in [dates.ts:16](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/dates.ts#L16)*

Check if the data is valid and return if it is

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *`Date` | false*

___

###  isValidDate

▸ **isValidDate**(`val`: *any*): *boolean*

*Defined in [dates.ts:9](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/dates.ts#L9)*

A simplified implemation of moment(new Date(val)).isValid()

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  makeISODate

▸ **makeISODate**(): *string*

*Defined in [dates.ts:4](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/dates.ts#L4)*

A helper function for making an ISODate string

**Returns:** *string*
