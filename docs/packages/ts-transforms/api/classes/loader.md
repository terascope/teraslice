---
title: TS Transforms: `Loader`
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

*Defined in [loader/loader.ts:10](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/loader/loader.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`opConfig` | [WatcherConfig](../interfaces/watcherconfig.md) |
`logger` | Logger |

**Returns:** *[Loader](loader.md)*

## Methods

###  load

▸ **load**(`opsManager`: OperationsManager): *Promise‹[ValidationResults](../interfaces/validationresults.md)›*

*Defined in [loader/loader.ts:17](https://github.com/terascope/teraslice/blob/b843209f9/packages/ts-transforms/src/loader/loader.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`opsManager` | OperationsManager |

**Returns:** *Promise‹[ValidationResults](../interfaces/validationresults.md)›*
