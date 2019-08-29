---
title: Job Components: `TestContextAPIs`
sidebar_label: TestContextAPIs
---

# Interface: TestContextAPIs

## Hierarchy

  * [ContextAPIs](contextapis.md)

  * **TestContextAPIs**

## Indexable

* \[ **namespace**: *string*\]: any

## Index

### Properties

* [foundation](testcontextapis.md#foundation)

### Methods

* [getTestClients](testcontextapis.md#gettestclients)
* [registerAPI](testcontextapis.md#registerapi)
* [setTestClients](testcontextapis.md#settestclients)

## Properties

###  foundation

• **foundation**: *[FoundationApis](foundationapis.md)*

*Inherited from [ContextApis](contextapis.md).[foundation](contextapis.md#foundation)*

*Defined in [interfaces/context.ts:87](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L87)*

## Methods

###  getTestClients

▸ **getTestClients**(): *[TestClients](testclients.md)*

*Defined in [test-helpers.ts:109](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/test-helpers.ts#L109)*

**Returns:** *[TestClients](testclients.md)*

___

###  registerAPI

▸ **registerAPI**(`namespace`: string, `apis`: any): *void*

*Inherited from [ContextApis](contextapis.md).[registerAPI](contextapis.md#registerapi)*

*Defined in [interfaces/context.ts:88](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/interfaces/context.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |
`apis` | any |

**Returns:** *void*

___

###  setTestClients

▸ **setTestClients**(`clients`: [TestClientConfig](testclientconfig.md)[]): *void*

*Defined in [test-helpers.ts:108](https://github.com/terascope/teraslice/blob/d2d877b60/packages/job-components/src/test-helpers.ts#L108)*

**Parameters:**

Name | Type |
------ | ------ |
`clients` | [TestClientConfig](testclientconfig.md)[] |

**Returns:** *void*
