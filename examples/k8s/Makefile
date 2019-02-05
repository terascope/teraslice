.DEFAULT_GOAL := help
.PHONY: help build build-and-push start stop show destroy destroy-all logs logs-master logs-slicer logs-worker k8s-master setup setup-all rebuild elasticsearch deelasticsearch namespace delete-namespace role delete-role binding delete-binding auth deauth showauth
SHELL := bash

# ES_URL="http://192.168.99.1:9200" make rebuild
ES_URL ?= http://192.168.99.100:30200
TERASLICE_MASTER_URL ?= 192.168.99.100:30678
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

logs: ## show logs for k8s deployments and services
	kubectl logs --namespace $(NAMESPACE) -l app=teraslice --tail=$(LOG_LENGTH) | bunyan

logs-master: ## show logs for k8s teraslice master
	kubectl logs --namespace $(NAMESPACE) -l app=teraslice,nodeType=master --tail=$(LOG_LENGTH) | bunyan

logs-slicer: ## show logs for k8s teraslice slicers
	kubectl logs --namespace $(NAMESPACE) -l app=teraslice,nodeType=execution_controller --tail=$(LOG_LENGTH) | bunyan

logs-worker: ## show logs for k8s teraslice workers
	kubectl logs --namespace $(NAMESPACE) -l app=teraslice,nodeType=worker --tail=$(LOG_LENGTH) | bunyan

k8s-master: ## start teraslice master in k8s
	yq w masterDeployment.yaml spec.template.spec.containers[0].image $(TERASLICE_K8S_IMAGE) | kubectl create --namespace $(NAMESPACE) -f -

elasticsearch: elasticsearchDeployment.yaml ## start elasticsearch in k8s
	kubectl create --namespace $(NAMESPACE) -f ./elasticsearchDeployment.yaml

deelasticsearch: elasticsearchDeployment.yaml ## start elasticsearch in k8s
	kubectl delete --namespace $(NAMESPACE) -f ./elasticsearchDeployment.yaml

namespace: ns.yaml ## create namespace
	yq w ns.yaml metadata.name $(NAMESPACE) | kubectl create -f -

delete-namespace:
	kubectl delete namespace $(NAMESPACE)

role: role.yaml ## create role with specified NAMESPACE
	yq w role.yaml metadata.namespace $(NAMESPACE) | yq w - metadata.name teraslice-all-$(NAMESPACE) | kubectl create -f -

delete-role:
	kubectl delete --namespace $(NAMESPACE) roles teraslice-all-$(NAMESPACE)

binding: roleBinding.yaml ## bind NAMESPACE default service acount to teraslice-all-NAMESPACE role
	yq w roleBinding.yaml metadata.namespace $(NAMESPACE) | yq w - metadata.name teraslice-all-$(NAMESPACE) | yq w - subjects[0].namespace $(NAMESPACE) | yq w - roleRef.name teraslice-all-$(NAMESPACE) | kubectl create -f - || true

delete-binding:
	kubectl delete --namespace $(NAMESPACE) roleBindings teraslice-all-$(NAMESPACE)

auth: role binding ## Setup k8s auth for teraslice in NAMESPACE

deauth: delete-role delete-binding ## Delete the role and binding

showauth: ## Show roles and roleBindings
	kubectl get --namespace $(NAMESPACE) roles teraslice-all-$(NAMESPACE) -o yaml
	kubectl get --namespace $(NAMESPACE) roleBindings teraslice-all-$(NAMESPACE) -o yaml

configs: ## create the configmaps
	yq w teraslice-master.yaml.tpl teraslice.kubernetes_image $(TERASLICE_K8S_IMAGE) | yq w - teraslice.kubernetes_namespace $(NAMESPACE) > teraslice.yaml
	kubectl create --namespace $(NAMESPACE) configmap teraslice-master --from-file=teraslice.yaml
	rm teraslice.yaml
	yq w teraslice-worker.yaml.tpl teraslice.kubernetes_image $(TERASLICE_K8S_IMAGE) | yq w - teraslice.kubernetes_namespace $(NAMESPACE) > teraslice.yaml
	kubectl create --namespace $(NAMESPACE) configmap teraslice-worker --from-file=teraslice.yaml
	rm teraslice.yaml

build: ## builds docker images
	docker build -t $(TERASLICE_K8S_IMAGE) ../..

push: ## push final docker image
	docker push $(TERASLICE_K8S_IMAGE)

setup-all: namespace elasticsearch auth setup ## setup EVERYTHING
	earl aliases add ${TERASLICE_ALIAS} ${TERASLICE_MASTER_URL}

setup: configs k8s-master ## setup teraslice

destroy: stop ## delete k8s deployments and services
	kubectl delete --namespace $(NAMESPACE) deployments,jobs,services,pods -l app=teraslice
	kubectl delete --namespace $(NAMESPACE) configmap teraslice-master || echo "* it is okay..."
	kubectl delete --namespace $(NAMESPACE) configmap teraslice-worker || echo "* it is okay..."
	curl -fsS -XDELETE "${ES_URL}/ts-dev1*" || echo '* it is okay'
	earl tjm reset example-job.json || echo '* it is okay'

destroy-all: destroy deauth deelasticsearch delete-namespace ## delete ALL things including the namespace
	earl aliases remove ${TERASLICE_ALIAS} || echo '* it is okay'

rebuild: destroy setup ## destroys then re-runs things
	sleep 20
	make build
	make register

register: ## creates asset and registers job
	earl assets deploy ${TERASLICE_ALIAS} terascope/elasticsearch-assets
	earl assets deploy ${TERASLICE_ALIAS} --build --replace --src-dir asset/
	earl tjm register ${TERASLICE_ALIAS} example-job.json

start: ## runs example job
	# yes | tjm asset --replace -c $(TERASLICE_MASTER_URL) || echo '* it is okay'
	earl assets deploy ${TERASLICE_ALIAS} --build --replace --src-dir asset/
	earl tjm start example-job.json

stop: ## stops example job
	earl tjm stop example-job.json || echo '* it is okay'