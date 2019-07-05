---
title: Job Components: `TerasliceConfig`
sidebar_label: TerasliceConfig
---

# Interface: TerasliceConfig

## Hierarchy

* **TerasliceConfig**

### Index

#### Properties

* [action_timeout](terasliceconfig.md#action_timeout)
* [analytics_rate](terasliceconfig.md#analytics_rate)
* [assets_directory](terasliceconfig.md#optional-assets_directory)
* [assets_volume](terasliceconfig.md#optional-assets_volume)
* [cluster_manager_type](terasliceconfig.md#cluster_manager_type)
* [cpu](terasliceconfig.md#optional-cpu)
* [hostname](terasliceconfig.md#hostname)
* [index_rollover_frequency](terasliceconfig.md#index_rollover_frequency)
* [kubernetes_config_map_name](terasliceconfig.md#optional-kubernetes_config_map_name)
* [kubernetes_image](terasliceconfig.md#optional-kubernetes_image)
* [kubernetes_image_pull_secret](terasliceconfig.md#optional-kubernetes_image_pull_secret)
* [kubernetes_namespace](terasliceconfig.md#optional-kubernetes_namespace)
* [master](terasliceconfig.md#master)
* [master_hostname](terasliceconfig.md#master_hostname)
* [memory](terasliceconfig.md#optional-memory)
* [name](terasliceconfig.md#name)
* [network_latency_buffer](terasliceconfig.md#network_latency_buffer)
* [node_disconnect_timeout](terasliceconfig.md#node_disconnect_timeout)
* [node_state_interval](terasliceconfig.md#node_state_interval)
* [port](terasliceconfig.md#port)
* [shutdown_timeout](terasliceconfig.md#shutdown_timeout)
* [slicer_allocation_attempts](terasliceconfig.md#slicer_allocation_attempts)
* [slicer_port_range](terasliceconfig.md#slicer_port_range)
* [slicer_timeout](terasliceconfig.md#slicer_timeout)
* [state](terasliceconfig.md#state)
* [worker_disconnect_timeout](terasliceconfig.md#worker_disconnect_timeout)
* [workers](terasliceconfig.md#workers)

## Properties

###  action_timeout

• **action_timeout**: *number | `300000`*

*Defined in [interfaces/context.ts:20](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L20)*

___

###  analytics_rate

• **analytics_rate**: *number | `60000`*

*Defined in [interfaces/context.ts:21](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L21)*

___

### `Optional` assets_directory

• **assets_directory**? : *undefined | string*

*Defined in [interfaces/context.ts:22](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L22)*

___

### `Optional` assets_volume

• **assets_volume**? : *undefined | string*

*Defined in [interfaces/context.ts:23](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L23)*

___

###  cluster_manager_type

• **cluster_manager_type**: *[ClusterManagerType](../overview.md#clustermanagertype)*

*Defined in [interfaces/context.ts:24](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L24)*

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Defined in [interfaces/context.ts:26](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L26)*

This will only be available in the context of k8s

___

###  hostname

• **hostname**: *string*

*Defined in [interfaces/context.ts:27](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L27)*

___

###  index_rollover_frequency

• **index_rollover_frequency**: *[IndexRolloverFrequency](indexrolloverfrequency.md)*

*Defined in [interfaces/context.ts:28](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L28)*

___

### `Optional` kubernetes_config_map_name

• **kubernetes_config_map_name**? : *string | "teraslice-worker"*

*Defined in [interfaces/context.ts:29](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L29)*

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *string | "terascope/teraslice"*

*Defined in [interfaces/context.ts:31](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L31)*

___

### `Optional` kubernetes_image_pull_secret

• **kubernetes_image_pull_secret**? : *string | `""`*

*Defined in [interfaces/context.ts:30](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L30)*

___

### `Optional` kubernetes_namespace

• **kubernetes_namespace**? : *string | "default"*

*Defined in [interfaces/context.ts:32](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L32)*

___

###  master

• **master**: *boolean | false*

*Defined in [interfaces/context.ts:34](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L34)*

___

###  master_hostname

• **master_hostname**: *string | "localhost"*

*Defined in [interfaces/context.ts:33](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L33)*

___

### `Optional` memory

• **memory**? : *undefined | number*

*Defined in [interfaces/context.ts:36](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L36)*

This will only be available in the context of k8s

___

###  name

• **name**: *string | "teracluster"*

*Defined in [interfaces/context.ts:37](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L37)*

___

###  network_latency_buffer

• **network_latency_buffer**: *number | `15000`*

*Defined in [interfaces/context.ts:38](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L38)*

___

###  node_disconnect_timeout

• **node_disconnect_timeout**: *number | `300000`*

*Defined in [interfaces/context.ts:39](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L39)*

___

###  node_state_interval

• **node_state_interval**: *number | `5000`*

*Defined in [interfaces/context.ts:40](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L40)*

___

###  port

• **port**: *number | `5678`*

*Defined in [interfaces/context.ts:41](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L41)*

___

###  shutdown_timeout

• **shutdown_timeout**: *number | number*

*Defined in [interfaces/context.ts:42](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L42)*

___

###  slicer_allocation_attempts

• **slicer_allocation_attempts**: *number | `3`*

*Defined in [interfaces/context.ts:43](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L43)*

___

###  slicer_port_range

• **slicer_port_range**: *string | "45679:46678"*

*Defined in [interfaces/context.ts:44](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L44)*

___

###  slicer_timeout

• **slicer_timeout**: *number | `180000`*

*Defined in [interfaces/context.ts:45](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L45)*

___

###  state

• **state**: *[ClusterStateConfig](clusterstateconfig.md)*

*Defined in [interfaces/context.ts:46](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L46)*

___

###  worker_disconnect_timeout

• **worker_disconnect_timeout**: *number | `300000`*

*Defined in [interfaces/context.ts:47](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L47)*

___

###  workers

• **workers**: *number | `4`*

*Defined in [interfaces/context.ts:48](https://github.com/terascope/teraslice/blob/d3a803c3/packages/job-components/src/interfaces/context.ts#L48)*

