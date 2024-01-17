#!/bin/bash

cat /etc/docker/daemon.json | jq '. | .+{"features": {"containerd-snapshotter": true}}' | sudo tee /etc/docker/daemon.json
cat /etc/docker/daemon.json
sudo systemctl restart docker
docker info -f '{{ .DriverStatus }}'