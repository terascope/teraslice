# NOTES:
# * This makefile has been switched to us yq v4, which has a syntax change.  If
#   you are seeing yq related errors, it may be that you are using yq v3.  There
#   are probably better ways to do this than with yq at this point, maybe
#   kustomize.

.DEFAULT_GOAL := help
.PHONY: help build build-and-push start stop show destroy destroy-all logs logs-master logs-slicer logs-worker teraslice-master setup setup-all rebuild elasticsearch deelasticsearch namespace delete-namespace role delete-role binding delete-binding auth deauth showauth
SHELL := bash

TERASLICE_MODE ?= minikube

# IP address of the minikube VM
IP ?= $(shell minikube ip)
# IP address of the minikube host (used by in cluster pods to access master, in
# hybrid mode)
HOST_IP = $(shell ./hostip.sh)

ifeq ($(TERASLICE_MODE),minikube)
TERASLICE_MASTER_IP = $(IP)
TERASLICE_MASTER_PORT = 30678
else
TERASLICE_MASTER_IP = localhost
TERASLICE_MASTER_PORT = 5678
endif

ES_URL ?= http://$(IP):30200
TERASLICE_MASTER_URL ?= http://$(TERASLICE_MASTER_IP):$(TERASLICE_MASTER_PORT)
TERASLICE_ALIAS ?= ts-minikube-dev1
TERASLICE_K8S_IMAGE ?= teraslice-k8sdev
NAMESPACE ?= default
LOG_LENGTH ?= 1000


help: ## show target summary
	@grep -E '^\S+:.* ## .+$$' $(MAKEFILE_LIST) | sed 's/##/#/' | while IFS='#' read spec help; do \
	  tgt=$${spec%%:*}; \
	  printf "\n%s: %s\n" "$$tgt" "$$help"; \
	  awk -F ': ' -v TGT="$$tgt" '$$1 == TGT && $$2 ~ "=" { print $$2 }' $(MAKEFILE_LIST) | \
	  while IFS='#' read var help; do \
	    printf "  %s  :%s\n" "$$var" "$$help"; \
	  done \
	done

install:
	yarn global add teraslice-cli

show: ## show k8s deployments and services
	kubectl get --namespace $(NAMESPACE) deployments,svc,po,jobs -o wide
	@echo ""
	curl $(ES_URL)/_cat/indices
	@echo ""
	curl $(TERASLICE_MASTER_URL)/txt/nodes

logs: ## show logs for k8s deployments and services
	kubectl logs --namespace $(NAMESPACE) -l app=teraslice --tail=$(LOG_LENGTH) | bunyan

logs-master: ## show logs for k8s teraslice master
	kubectl logs --namespace $(NAMESPACE) -l app=teraslice,nodeType=master --tail=$(LOG_LENGTH) | bunyan

logs-slicer: ## show logs for k8s teraslice slicers
	kubectl logs --namespace $(NAMESPACE) -l app=teraslice,nodeType=execution_controller --tail=$(LOG_LENGTH) | bunyan

logs-worker: ## show logs for k8s teraslice workers
	kubectl logs --namespace $(NAMESPACE) -l app=teraslice,nodeType=worker --tail=$(LOG_LENGTH) | bunyan

master-start: ## start teraslice master in k8s or locally
ifeq ($(TERASLICE_MODE),minikube)
	# Deploy master to Kubernetes
	yq eval "select(documentIndex == 0) | .spec.template.spec.containers[0].image = \"$(TERASLICE_K8S_IMAGE)\"" masterDeployment.yaml | kubectl create --namespace $(NAMESPACE) -f -
	yq eval "select(documentIndex == 1)" masterDeployment.yaml | kubectl create --namespace $(NAMESPACE) -f -
else
	# Run Master Locally
	./run-ts-master.sh
endif

master-stop: ## stop teraslice master in k8s or locally
ifeq ($(TERASLICE_MODE),minikube)
	# Stop master in Kubernetes
	#???
else
	# Stop Master Locally
	kill $(shell cat master.pid)
	rm -f master.pid master.log
endif

master-logs: ## stop teraslice master in k8s or locally
ifeq ($(TERASLICE_MODE),minikube)
	# Stop master in Kubernetes
	#???
else
	tail -F master.log | bunyan
endif

master-status: ## show status of teraslice master
ifeq ($(TERASLICE_MODE),minikube)
	# Deploy master to Kubernetes
	#yq w masterDeployment.yaml spec.template.spec.containers[0].image $(TERASLICE_K8S_IMAGE) | kubectl create --namespace $(NAMESPACE) -f -
else
	# Run Master Locally
	cat master.pid
	pgrep $(shell cat master.pid)
endif

elasticsearch: elasticsearchDeployment.yaml ## start elasticsearch in k8s
	kubectl create --namespace $(NAMESPACE) -f ./elasticsearchDeployment.yaml

deelasticsearch: elasticsearchDeployment.yaml ## delete elasticsearch from k8s
	kubectl delete --namespace $(NAMESPACE) -f ./elasticsearchDeployment.yaml

namespace: ns.yaml ## create namespace
	yq eval ".metadata.name = \"$(NAMESPACE)\"" ns.yaml | kubectl create -f -

delete-namespace:
	kubectl delete namespace $(NAMESPACE) || echo "* it is okay..."

role: role.yaml ## create role with specified NAMESPACE
	yq eval ".metadata.namespace = \"$(NAMESPACE)\"" role.yaml | yq eval ".metadata.name = \"teraslice-all-$(NAMESPACE)\"" - | kubectl create -f -

delete-role:
	kubectl delete --namespace $(NAMESPACE) roles teraslice-all-$(NAMESPACE) || echo "* it is okay..."

binding: roleBinding.yaml ## bind NAMESPACE default service acount to teraslice-all-NAMESPACE role
	yq eval ".metadata.namespace = \"$(NAMESPACE)\"" roleBinding.yaml | yq eval ".metadata.name = \"teraslice-all-$(NAMESPACE)\"" - | yq eval ".subjects[0].namespace = \"$(NAMESPACE)\"" - | yq eval ".roleRef.name = \"teraslice-all-$(NAMESPACE)\"" - | kubectl create -f - || true

delete-binding:
	kubectl delete --namespace $(NAMESPACE) roleBindings teraslice-all-$(NAMESPACE)

auth: role binding ## Setup k8s auth for teraslice in NAMESPACE

deauth: delete-role delete-binding ## Delete the role and binding

showauth: ## Show roles and roleBindings
	kubectl get --namespace $(NAMESPACE) roles teraslice-all-$(NAMESPACE) -o yaml
	kubectl get --namespace $(NAMESPACE) roleBindings teraslice-all-$(NAMESPACE) -o yaml

priority: ## Setup Kubernetes Priority Class
	kubectl apply -f priorityClass.yaml

delete-priority: ## Remove Kubernetes Priority Class
	kubectl delete priorityclasses high-priority

showpriority:  ## Show Kubernetes Priority Class
	kubectl get priorityclasses high-priority -o yaml

configs: ## create the configmaps
ifeq ($(TERASLICE_MODE),minikube)
	yq eval ".teraslice.kubernetes_image = \"$(TERASLICE_K8S_IMAGE)\"" teraslice-worker.yaml.tpl | yq eval ".teraslice.kubernetes_namespace = \"$(NAMESPACE)\"" - > teraslice.yaml
	kubectl create --namespace $(NAMESPACE) configmap teraslice-worker --from-file=teraslice.yaml || echo "* it is okay..."
	rm teraslice.yaml
	yq eval ".teraslice.kubernetes_image = \"$(TERASLICE_K8S_IMAGE)\"" teraslice-master.yaml.tpl | yq eval ".teraslice.kubernetes_namespace = \"$(NAMESPACE)\"" - > teraslice.yaml
	kubectl create --namespace $(NAMESPACE) configmap teraslice-master --from-file=teraslice.yaml
	rm teraslice.yaml
else
	# This adds the minikube vm's host machines IP where the master runs in the
	# hybrid case
	yq eval ".teraslice.kubernetes_image = \"$(TERASLICE_K8S_IMAGE)\"" teraslice-worker.yaml.tpl | yq eval ".teraslice.master_hostname = \"$(HOST_IP)\"" - | yq eval ".teraslice.kubernetes_namespace = \"$(NAMESPACE)\"" - > teraslice.yaml
	kubectl create --namespace $(NAMESPACE) configmap teraslice-worker --from-file=teraslice.yaml || echo "* it is okay..."
	rm teraslice.yaml
	# FIXME: Figure out where to clean this up
	# Note that the ES Port Here is 30200 because that is the port the service
	# NodePort gets exposed on
	yq eval ".terafoundation.connectors.elasticsearch.default.host[0] = \"$(shell minikube ip):30200\"" teraslice-master.yaml.tpl | yq eval ".teraslice.kubernetes_image = \"$(TERASLICE_K8S_IMAGE)\"" - | yq eval ".teraslice.assets_directory = \"/tmp/assets\"" - > teraslice-master-local.yaml
endif

build: ## builds docker images
	docker build -t $(TERASLICE_K8S_IMAGE) ../..

push: ## push final docker image
	docker push $(TERASLICE_K8S_IMAGE)

setup-all: namespace elasticsearch auth priority setup ## setup EVERYTHING
	earl aliases remove ${TERASLICE_ALIAS} 2> /dev/null || true
	earl aliases add ${TERASLICE_ALIAS} ${TERASLICE_MASTER_URL}

setup: configs master-start ## setup teraslice

# We don't bother calling stop here because everything just gets deleted anyway
destroy: deregister ## delete k8s deployments and services
	kubectl delete --namespace $(NAMESPACE) deployments,jobs,services,pods -l app=teraslice --grace-period=1
	kubectl delete --namespace $(NAMESPACE) configmap teraslice-master || echo "* it is okay..."
	kubectl delete --namespace $(NAMESPACE) configmap teraslice-worker || echo "* it is okay..."
	curl -fsS -XDELETE "$(ES_URL)/ts-dev1*" || echo '* it is okay'
	curl -fsS -XDELETE "$(ES_URL)/terak8s-example-data" || echo '* it is okay'

destroy-img: destroy
	docker rmi $(shell docker image ls $(TERASLICE_K8S_IMAGE) --format "{{.ID}}") || echo "* it is okay..."

destroy-all: destroy-img deauth deelasticsearch delete-namespace master-stop ## delete ALL things including the namespace
	earl aliases remove ${TERASLICE_ALIAS} || echo '* it is okay'

rebuild: destroy build setup ## destroys then re-runs things
	sleep 10
	make register

register: ## creates asset and registers job
	earl assets deploy ${TERASLICE_ALIAS} --blocking --bundle terascope/standard-assets
	earl assets deploy ${TERASLICE_ALIAS} --blocking --bundle terascope/elasticsearch-assets
	rm -f asset/build/example-v1.0.0-node-*.zip
	earl assets deploy ${TERASLICE_ALIAS} --blocking --build --bundle --replace --src-dir asset/
	earl tjm register ${TERASLICE_ALIAS} example-job.json
	earl tjm register ${TERASLICE_ALIAS} example-job-labels.json
	earl tjm register ${TERASLICE_ALIAS} example-job-resource.json
	earl tjm register ${TERASLICE_ALIAS} example-job-separate-resources.json
	earl tjm register ${TERASLICE_ALIAS} example-job-stateful.json
	earl tjm register ${TERASLICE_ALIAS} example-job-targets.json
	earl tjm register ${TERASLICE_ALIAS} example-job-volume.json

deregister: ## resets jobs
	earl tjm reset example-job.json || echo '* it is okay'
	earl tjm reset example-job-labels.json || echo '* it is okay'
	earl tjm reset example-job-resource.json || echo '* it is okay'
	earl tjm reset example-job-separate-resources.json || echo '* it is okay'
	earl tjm reset example-job-stateful.json || echo '* it is okay'
	earl tjm reset example-job-targets.json || echo '* it is okay'
	earl tjm reset example-job-volume.json || echo '* it is okay'

start: ## starts example job
	# yes | tjm asset --replace -c $(TERASLICE_MASTER_URL) || echo '* it is okay'
	rm -f asset/build/example-v1.0.0-node-*.zip
	earl assets deploy ${TERASLICE_ALIAS} --blocking --bundle --build --replace --src-dir asset/
	earl tjm start example-job.json

stop: ## stops example job
	earl tjm stop example-job.json || echo '* it is okay'

# pause: ## pauses example job
# 	earl tjm pause example-job.json || echo '* it is okay'

# resume: ## resumes example job
# 	earl tjm resume example-job.json || echo '* it is okay'

scaleup: ## pauses example job
	earl tjm workers add 2 example-job.json || echo '* it is okay'

scaledown: ## pauses example job
	earl tjm workers remove 1 example-job.json || echo '* it is okay'

scaleto: ## pauses example job
	earl tjm workers total 2 example-job.json || echo '* it is okay'
