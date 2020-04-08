---
title: Data-Mate: `VariableState`
sidebar_label: VariableState
---

# Class: VariableState

## Hierarchy

* **VariableState**

## Index

### Constructors

* [constructor](variablestate.md#constructor)

### Methods

* [createVariable](variablestate.md#createvariable)
* [getVariables](variablestate.md#getvariables)

## Constructors

###  constructor

\+ **new VariableState**(`variables?`: AnyObject): *[VariableState](variablestate.md)*

*Defined in [data-mate/src/transforms/helpers.ts:174](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/helpers.ts#L174)*

**Parameters:**

Name | Type |
------ | ------ |
`variables?` | AnyObject |

**Returns:** *[VariableState](variablestate.md)*

## Methods

###  createVariable

▸ **createVariable**(`field`: string, `value`: any): *string*

*Defined in [data-mate/src/transforms/helpers.ts:192](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/helpers.ts#L192)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`value` | any |

**Returns:** *string*

___

###  getVariables

▸ **getVariables**(): *AnyObject*

*Defined in [data-mate/src/transforms/helpers.ts:206](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-mate/src/transforms/helpers.ts#L206)*

Shallow clones and sorts the keys

**Returns:** *AnyObject*
