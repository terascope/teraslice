---
title: Elasticsearch Store: `Cluster`
sidebar_label: Cluster
---

# Class: Cluster

Get Cluster Metadata and Stats

## Hierarchy

* **Cluster**

## Index

### Constructors

* [constructor](cluster.md#constructor)

### Properties

* [client](cluster.md#client)

### Methods

* [nodeInfo](cluster.md#nodeinfo)
* [nodeStats](cluster.md#nodestats)

## Constructors

###  constructor

\+ **new Cluster**(`client`: Client): *[Cluster](cluster.md)*

*Defined in [cluster.ts:5](https://github.com/terascope/teraslice/blob/0ae31df4/packages/elasticsearch-store/src/cluster.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |

**Returns:** *[Cluster](cluster.md)*

## Properties

###  client

• **client**: *Client*

*Defined in [cluster.ts:5](https://github.com/terascope/teraslice/blob/0ae31df4/packages/elasticsearch-store/src/cluster.ts#L5)*

## Methods

###  nodeInfo

▸ **nodeInfo**(`_params`: NodesInfoParams): *Promise‹void›*

*Defined in [cluster.ts:14](https://github.com/terascope/teraslice/blob/0ae31df4/packages/elasticsearch-store/src/cluster.ts#L14)*

Get the Cluster Nodes Info

**Parameters:**

Name | Type |
------ | ------ |
`_params` | NodesInfoParams |

**Returns:** *Promise‹void›*

___

###  nodeStats

▸ **nodeStats**(`_params`: NodesStatsParams): *Promise‹void›*

*Defined in [cluster.ts:21](https://github.com/terascope/teraslice/blob/0ae31df4/packages/elasticsearch-store/src/cluster.ts#L21)*

Get the Cluster Nodes Stats

**Parameters:**

Name | Type |
------ | ------ |
`_params` | NodesStatsParams |

**Returns:** *Promise‹void›*
