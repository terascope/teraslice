.DEFAULT_GOAL := help
.PHONY: help show destroy logs logsm logss logsw submit k8s-master
SHELL := bash

# defaults to my minikube teraslice master, override by setting the
# TERASLICE_MASTER_URL env variable
TERASLICE_MASTER_URL ?= 192.168.99.100:30678
TERASLICE_K8S_IMAGE ?= teraslice:k8sdev

help: ## show target summary
	@grep -E '^\S+:.* ## .+$$' $(MAKEFILE_LIST) | sed 's/##/#/' | while IFS='#' read spec help; do \
	  tgt=$${spec%%:*}; \
	  printf "\n%s: %s\n" "$$tgt" "$$help"; \
	  awk -F ': ' -v TGT="$$tgt" '$$1 == TGT && $$2 ~ "=" { print $$2 }' $(MAKEFILE_LIST) | \
	  while IFS='#' read var help; do \
	    printf "  %s  :%s\n" "$$var" "$$help"; \
	  done \
	done

show: ## show k8s deployments and services
	kubectl get deployments,svc,po -o wide

destroy: ## delete k8s deployments and services
	kubectl delete deployments,services -l app=teraslice

logs: ## show logs for k8s deployments and services
	kubectl logs -l app=teraslice --tail=10 | bunyan

logsm: ## show logs for k8s teraslice master
	kubectl logs -l app=teraslice,nodeType=master | bunyan

logss: ## show logs for k8s teraslice slicers
	kubectl logs -l app=teraslice,nodeType=execution_controller | bunyan

logsw: ## show logs for k8s teraslice workers
	kubectl logs -l app=teraslice,nodeType=worker | bunyan

submit: ## submit test job, override teraslice URL by setting TERASLICE_MASTER_URL
	curl -sS -XPOST $(TERASLICE_MASTER_URL)/jobs -d@./sample-job.json

k8s-master: ## start teraslice master in k8s
	kubectl create -f ./masterDeployment.yaml

build: ## build the teraslice:k8sdev container, override container name by setting TERASLICE_K8S_IMAGE
	docker build -t $(TERASLICE_K8S_IMAGE) ../../
	