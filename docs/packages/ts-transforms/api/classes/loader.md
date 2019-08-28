---
title: Ts Transforms: `Loader`
sidebar_label: Loader
---

# Class: Loader

## Hierarchy

* **Loader**

## Index

### Constructors

* [constructor](loader.md#constructor)

### Methods

* [load](loader.md#load)

## Constructors

###  constructor

\+ **new Loader**(`opConfig`: [WatcherConfig](../interfaces/watcherconfig.md), `logger`: Logger): *[Loader](loader.md)*

*Defined in [loader/loader.ts:11](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/loader/loader.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`opConfig` | [WatcherConfig](../interfaces/watcherconfig.md) |
`logger` | Logger |

**Returns:** *[Loader](loader.md)*

## Methods

###  load

▸ **load**(`opsManager`: OperationsManager): *Promise‹[ValidationResults](../interfaces/validationresults.md)›*

*Defined in [loader/loader.ts:18](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ts-transforms/src/loader/loader.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`opsManager` | OperationsManager |

**Returns:** *Promise‹[ValidationResults](../interfaces/validationresults.md)›*
