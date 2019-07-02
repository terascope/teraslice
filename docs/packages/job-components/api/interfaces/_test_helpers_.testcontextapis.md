---
title: Job Components Test Helpers Testcontextapis
sidebar_label: Test Helpers Testcontextapis
---

> Test Helpers Testcontextapis for @terascope/job-components

[Globals](../overview.md) / ["test-helpers"](../modules/_test_helpers_.md) / [TestContextAPIs](_test_helpers_.testcontextapis.md) /

# Interface: TestContextAPIs

## Hierarchy

  * [ContextAPIs](_interfaces_context_.contextapis.md)

  * **TestContextAPIs**

## Indexable

● \[▪ **namespace**: *string*\]: any

### Index

#### Properties

* [foundation](_test_helpers_.testcontextapis.md#foundation)

#### Methods

* [getTestClients](_test_helpers_.testcontextapis.md#gettestclients)
* [registerAPI](_test_helpers_.testcontextapis.md#registerapi)
* [setTestClients](_test_helpers_.testcontextapis.md#settestclients)

## Properties

###  foundation

• **foundation**: *[FoundationApis](_interfaces_context_.foundationapis.md)*

*Inherited from [ContextApis](_interfaces_context_.contextapis-1.md).[foundation](_interfaces_context_.contextapis-1.md#foundation)*

*Defined in [interfaces/context.ts:82](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L82)*

## Methods

###  getTestClients

▸ **getTestClients**(): *[TestClients](_test_helpers_.testclients.md)*

*Defined in [test-helpers.ts:101](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L101)*

**Returns:** *[TestClients](_test_helpers_.testclients.md)*

___

###  registerAPI

▸ **registerAPI**(`namespace`: *string*, `apis`: *any*): *void*

*Inherited from [ContextApis](_interfaces_context_.contextapis-1.md).[registerAPI](_interfaces_context_.contextapis-1.md#registerapi)*

*Defined in [interfaces/context.ts:83](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |
`apis` | any |

**Returns:** *void*

___

###  setTestClients

▸ **setTestClients**(`clients`: *[TestClientConfig](_test_helpers_.testclientconfig.md)[]*): *void*

*Defined in [test-helpers.ts:100](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/test-helpers.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`clients` | [TestClientConfig](_test_helpers_.testclientconfig.md)[] |

**Returns:** *void*
