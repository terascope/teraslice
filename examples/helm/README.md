# Starting teraslice using helm and helmfile

## Prerequisites

The following dependencies are required to successfully deploy a basic instance of Teraslice and interact with its API. The examples provided use Homebrew (brew) and Node.js's (npm) for installation.

- Docker
- [Helm](https://helm.sh/docs/intro/install/)
    - `brew install helm`
- [helmfile](https://formulae.brew.sh/formula/helmfile)
    - `brew install helmfile`
- [Kubectl](https://kubernetes.io/docs/reference/kubectl/)
    - `brew install kubectl`
- [Kind](https://kind.sigs.k8s.io/) - Kubernetes in Docker
    - `brew install kind`
- [curl](https://formulae.brew.sh/formula/curl) - Command-line tool for making HTTP requests
    - `brew install curl`
- [teraslice-cli](https://www.npmjs.com/package/teraslice-cli) - A CLI tool for managing Teraslice
    - `npm install -g teraslice-cli`

### Initial Setup

First you're going to want to be in the correct directory. Starting in the top level of the teraslice directory:

```bash
cd ./examples/helm
```

### Step 1: Creating a Kind Cluster

Create a single node Kubernetes cluster by running the following command:

```bash
kind create cluster --config kindConfig.yaml
```

### Step 2: Building the Docker Image

Build the teraslice docker image using the following command. Ensure the image is tagged correctly to match the intended version `dev-nodev22.9.0` in this example:

```bash
docker build -t ghcr.io/terascope/teraslice:dev-nodev22.9.0 ../../.
```

### Step 3: Loading the Docker Image into the Cluster

Load the built Docker image into the Kind cluster's control plane:

```bash
kind load docker-image --name k8s-env ghcr.io/terascope/teraslice:dev-nodev22.9.0
```

### Step 4: Verifying the Image Load

Confirm that the teraslice image has been successfully loaded into the cluster. The following command lists the images available in the clusters control plane:

```bash
docker exec -it k8s-env-control-plane crictl images
```

### Step 5: Verifying the Kubernetes Resource Configuration

Generate a preview of the Kubernetes resources that will be deployed. This step ensures that the `helmfile` is configured correctly:

```bash
helmfile diff
```

### Step 6: Deploying Resources

Lastly if there were no erros with the `diff` command, deploy teraslice and opensearch into the cluster by running:

```bash
helmfile sync
```

### Step 7: Deploying Assets

The example job requires the `standard-assets` and `elasticsearch-assets` to be available in the cluster for successful execution. Use the `teraslice-cli` tool to deploy these assets:

```bash
teraslice-cli assets deploy localhost terascope/standard-assets
```

```bash
teraslice-cli assets deploy localhost terascope/elasticsearch-assets
```

### Step 8: Submitting and Starting a Test Job

This example job generates `10,000` records and writes them to an Opensearch index named `random-data-1`. Submit the job to the Teraslice API using the following command:

```bash
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

### Step 9: Viewing results in opensearch

Once the job completes, query Opensearch to verify that the documents have been written successfully. Use the following command to view the index information:

```bash
curl 'localhost:9200/_cat/indices?v&h=index,status,docs.count,docs.deleted,store.size,pri.store.size'
```

Results:

```bash
index                        status docs.count docs.deleted store.size pri.store.size
teraslice__assets            open            2            0      2.8mb          2.8mb
teraslice__state-2024.11     open            1            0     28.8kb         28.8kb
teraslice__ex                open            1            0     49.1kb         49.1kb
teraslice__jobs              open            1            0      5.6kb          5.6kb
random-data-1                open        10000            0        7mb            7mb
teraslice__analytics-2024.11 open            4            0     23.9kb         23.9kb
```
