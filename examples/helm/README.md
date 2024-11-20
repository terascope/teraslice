# Starting teraslice using helm and helmfile

## Prerequisites

The following dependencies are required to successfully deploy a basic instance of Teraslice using Helm and Helmfile. The examples provided use Homebrew (brew) for installation.

- Docker
- [Helm](https://helm.sh/docs/intro/install/)
    - `brew install helm`
- [helmfile](https://formulae.brew.sh/formula/helmfile)
    - `brew install helmfile`
- [Kubectl](https://kubernetes.io/docs/reference/kubectl/)
    - `brew install kubectl`
- [Kind](https://kind.sigs.k8s.io/) - Kubernetes in Docker
    - `brew install kind`

## Initial Setup

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
