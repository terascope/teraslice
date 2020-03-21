#!/usr/bin/env bash

minikube ssh "route -n | grep ^0.0.0.0 | awk '{ print \$2 }'"
