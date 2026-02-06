---
title: Native Clustering
sidebar_label: Native Clustering
---

Native Clustering provides a basic clustering mechanism suitable for single node deployment or smaller clustered deployments. When running Teraslice in it's most simple form, on a single computer, you're using a single node native cluster.

Native Clustering is not really recommended for large scale production usage. Kubernetes will provide much more control and stability.

## Configuration Single Node / Native Clustering - Cluster Master

If you're running a single Teraslice node or using the simple native clustering you'll need a master node configuration.

The master node will still have workers available and this configuration is sufficient to do useful work if you don't yet have multiple nodes available. The workers will connect to the master on localhost and do work just as if they were in a real cluster. Then if you want to add workers you can use the worker configuration below as a starting point on adding more nodes.

```yaml
teraslice:
    workers: 8
    master: true
    master_hostname: "127.0.0.1"
    name: "teracluster"

terafoundation:
    log_path: '/path/to/logs'

    connectors:
        elasticsearch-next:
            default:
                node:
                    - YOUR_OPENSEARCH_IP:9200"
```

## Configuration Native Clustering - Worker Node

Configuration for a worker node is very similar. You just set `master` to false and provide the IP address where the master node can be located.

```yaml
teraslice:
    workers: 8
    master: false
    master_hostname: "YOUR_MASTER_IP"
    name: "teracluster"

terafoundation:
    log_path: '/path/to/logs'

    connectors:
        elasticsearch-next:
            default:
                node:
                    - YOUR_OPENSEARCH_IP:9200
```
