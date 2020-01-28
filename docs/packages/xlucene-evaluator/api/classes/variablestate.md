---
title: xLucene Evaluator: `VariableState`
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

*Defined in [packages/xlucene-evaluator/src/utils.ts:353](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L353)*

**Parameters:**

Name | Type |
------ | ------ |
`variables?` | AnyObject |

**Returns:** *[VariableState](variablestate.md)*

## Methods

###  createVariable

▸ **createVariable**(`field`: string, `value`: any): *string*

*Defined in [packages/xlucene-evaluator/src/utils.ts:371](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L371)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`value` | any |

**Returns:** *string*

___

###  getVariables

▸ **getVariables**(): *AnyObject*

*Defined in [packages/xlucene-evaluator/src/utils.ts:385](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L385)*

Shallow clones and sorts the keys

**Returns:** *AnyObject*
