---
title: Getting Started
---

Teraslice is a distributed data processing platform designed to run in kubernetes. There is also a [native clustering mode](./development/overview.md) used for development. You can interact with Teraslice using [curl](./management-apis/overview.md) or the [teraslice CLI client](./packages/teraslice-cli/overview.md). Once running, see the [Using Teraslice](#using-teraslice) section for details on how to run your first [job](./jobs/overview.md).

## Setup Teraslice

Teraslice requires a connection to an elasticsearch or opensearch cluster in order to run correctly. Below is a quick guide to launch a functional local teraslice instance with opensearch1 using helmfile. See the [helm examples directory](https://github.com/terascope/teraslice/tree/master/examples/helm) or the [e2e helm directory](https://github.com/terascope/teraslice/tree/master/e2e/helm) for more comprehensive helmfile examples.

### Required dependencies

- [Docker](https://www.docker.com/get-started/) - Application Containerization Platform
- [Helm](https://helm.sh/docs/intro/install/) - The package manager for Kubernetes
- [helmfile](https://helmfile.readthedocs.io/en/latest/#installation) - Deploy Kubernetes Helm Charts
- [Kind](https://kind.sigs.k8s.io/) - Kubernetes in Docker
- [curl](https://curl.se/download.html) - Command-line tool for making HTTP requests
- [teraslice-cli](https://www.npmjs.com/package/teraslice-cli) - A CLI tool for managing Teraslice

Create a new file called `kindConfig.yaml` and paste the following code snippet in it and save.

```yaml
kind: Cluster
name: k8s-env
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30678 # Map internal teraslice api service to host port
    hostPort: 5678
  - containerPort: 30921 # Map internal opensearch1 service to host port
    hostPort: 9200
```

Next run the kind command below to launch a kind cluster.

```sh
kind create cluster --config kindConfig.yaml
```

Next create a file called `helmfile.yaml` and paste the code below in it and save.

```yaml
repositories:
  - name: opensearch
    url: https://opensearch-project.github.io/helm-charts/
  - name: terascope
    url: https://terascope.github.io/helm-charts/

helmDefaults:
  wait: true

releases:
  - name: opensearch1
    namespace: ts-dev1
    version: 2.17.1
    chart: opensearch/opensearch
    values:
      - replicas: 1
        singleNode: true
        image:
          tag: 1.3.14
        service:
          type: NodePort
          nodePort: 30921
        config:
          opensearch.yml:
            plugins:
              security:
                disabled: true
        masterService: opensearch1

  - name: teraslice
    namespace: ts-dev1
    version: 2.3.0
    chart: terascope/teraslice-chart
    needs:
      - ts-dev1/opensearch1
    values:
      - terafoundation:
          connectors:
            elasticsearch-next:
              default:
                node:
                  - "http://opensearch1.ts-dev1:9200"
        service:
          nodePort: 30678
          type: NodePort
        master:
          teraslice:
            kubernetes_namespace: ts-dev1
            cluster_manager_type: kubernetesV2
            asset_storage_connection_type: elasticsearch-next
        worker:
          teraslice:
            kubernetes_namespace: ts-dev1
            cluster_manager_type: kubernetesV2
            asset_storage_connection_type: elasticsearch-next
```

Run the following command to submit it to the local dev cluster:

```sh
helmfile sync
```

## Using Teraslice

See the [overview](overview.md) and [terminology](./terminology.md) pages for details on how teraslice works. See the [management APIs](./management-apis/overview.md) or the [teraslice CLI client](./packages/teraslice-cli/overview.md) for useful commands.

To ensure teraslice is running make a curl request to the API

```sh
curl localhost:5678
{
    "arch": "x64",
    "clustering_type": "kubernetesV2",
    "name": "teraslice",
    "node_version": "v22.14.0",
    "platform": "linux",
    "teraslice_version": "v2.14.1"
}
```

### Deploy Needed Assets

Asset bundles are collection of processors or files that can be loaded and used within a [Job](./jobs/overview.md).

There are public asset bundles available for:

- [elasticsearch](https://terascope.github.io/elasticsearch-assets)
- [Kafka](https://terascope.github.io/kafka-assets)
- [Files](https://terascope.github.io/file-assets) - Amazon S3, local filesystem
- [Standard](https://terascope.github.io/standard-assets) - library of data transformation tools

The example job below requires standard-assets and elasticsearch-assets to be available in the cluster for successful execution. Use the teraslice-cli tool to deploy these assets:

```sh
teraslice-cli assets deploy localhost terascope/standard-assets
```

```sh
teraslice-cli assets deploy localhost terascope/elasticsearch-assets
```

### Submitting and Starting a Test Job

This example job generates 10,000 records using the standard-assets [data generator](https://github.com/terascope/standard-assets/blob/master/docs/operations/data_generator.md) and writes them to an Opensearch index named random-data-1. Submit the job to the Teraslice API using the following command:

```sh
curl -XPOST 'localhost:5678/v1/jobs' -H "Content-Type: application/json" -d '{
    "name": "data-to-es",
    "lifecycle": "once",
    "workers": 1,
    "assets": [
        "standard",
        "elasticsearch"
    ],
    "operations": [
        {
            "_op": "data_generator",
            "size": 10000
        },
        {
            "_op": "elasticsearch_bulk",
            "size": 10000,
            "index": "random-data-1"
        }
    ]
}'
```

### Check the status of the job execution

```sh
curl localhost:5678/txt/ex
```

Run the command several times to see the execution status move from initializing to running to completed.

### Viewing results in opensearch

Once the job completes, query Opensearch to verify that the documents have been written successfully to the `random-data-1` index. Use the following command to view the index information:

```sh

curl 'localhost:9200/_cat/indices?v&h=index,status,docs.count,docs.deleted,store.size,pri.store.size'
```

Results:

```sh
index                        status docs.count docs.deleted store.size pri.store.size
teraslice__assets            open            2            0      2.8mb          2.8mb
teraslice__state-2024.11     open            1            0     28.8kb         28.8kb
teraslice__ex                open            1            0     49.1kb         49.1kb
teraslice__jobs              open            1            0      5.6kb          5.6kb
random-data-1                open        10000            0        7mb            7mb
teraslice__analytics-2024.11 open            4            0     23.9kb         23.9kb
```
