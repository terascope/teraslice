---
title: Job Components: `TestContextAPIs`
sidebar_label: TestContextAPIs
---

# Interface: TestContextAPIs

## Hierarchy

  ↳ [ContextAPIs](contextapis.md)

  ↳ **TestContextAPIs**

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

*Defined in [packages/job-components/src/interfaces/context.ts:93](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/interfaces/context.ts#L93)*

## Methods

###  getTestClients

▸ **getTestClients**(): *[TestClients](testclients.md)*

*Defined in [packages/job-components/src/test-helpers.ts:112](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/test-helpers.ts#L112)*

**Returns:** *[TestClients](testclients.md)*

___

###  registerAPI

▸ **registerAPI**(`namespace`: string, `apis`: any): *void*

*Inherited from [ContextApis](contextapis.md).[registerAPI](contextapis.md#registerapi)*

*Defined in [packages/job-components/src/interfaces/context.ts:94](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/interfaces/context.ts#L94)*

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |
`apis` | any |

**Returns:** *void*

___

###  setTestClients

▸ **setTestClients**(`clients`: [TestClientConfig](testclientconfig.md)[]): *void*

*Defined in [packages/job-components/src/test-helpers.ts:111](https://github.com/terascope/teraslice/blob/b843209f9/packages/job-components/src/test-helpers.ts#L111)*

**Parameters:**

Name | Type |
------ | ------ |
`clients` | [TestClientConfig](testclientconfig.md)[] |

**Returns:** *void*
