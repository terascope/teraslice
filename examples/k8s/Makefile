.DEFAULT_GOAL := help
.PHONY: help show destroy logs logs-master logs-ex logs-worker submit k8s-master build
SHELL := bash

# defaults to my minikube teraslice master, override by setting the
# TERASLICE_MASTER_URL env variable
TERASLICE_MASTER_URL ?= 192.168.99.100:30678
TERASLICE_K8S_IMAGE ?= teraslice:k8sdev
LOG_LENGTH ?= 10

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
	kubectl logs -l app=teraslice --tail=$(LOG_LENGTH) | bunyan

logs-master: ## show logs for k8s teraslice master
	kubectl logs -l app=teraslice,nodeType=master --tail=$(LOG_LENGTH) | bunyan

logs-ex: ## show logs for k8s teraslice execution_controllers
	kubectl logs -l app=teraslice,nodeType=execution_controller --tail=$(LOG_LENGTH) | bunyan

logs-worker: ## show logs for k8s teraslice workers
	kubectl logs -l app=teraslice,nodeType=worker --tail=$(LOG_LENGTH) | bunyan

submit: ## submit test job, override teraslice URL by setting TERASLICE_MASTER_URL
	curl -sS -XPOST $(TERASLICE_MASTER_URL)/jobs -d@./sample-job.json

k8s-master: ## start teraslice master in k8s
	kubectl create -f ./masterDeployment.yaml

build: ## build the teraslice:k8sdev container, override container name by setting TERASLICE_K8S_IMAGE
	docker build -t $(TERASLICE_K8S_IMAGE) .
