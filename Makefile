
.DEFAULT_GOAL := help
.PHONY: help lint test integration-tests master worker docker-image grep
SHELL := bash

APP_NAME := teraslice


help: ## show target summary
	@grep -E '^\S+:.* ## .+$$' $(MAKEFILE_LIST) | sed 's/##/#/' | while IFS='#' read spec help; do \
	  tgt=$${spec%%:*}; \
	  printf "\n%s: %s\n" "$$tgt" "$$help"; \
	  awk -F ': ' -v TGT="$$tgt" '$$1 == TGT && $$2 ~ "=" { print $$2 }' $(MAKEFILE_LIST) | \
	  while IFS='#' read var help; do \
	    printf "  %s  :%s\n" "$$var" "$$help"; \
	  done \
	done


node_modules: package.json
	npm install
	touch node_modules


lint: node_modules ## run linters
	npm run lint


test: node_modules ## run unit tests
	npm run test


integration-tests: ## run integration tests
	make -C integration-tests test


master: LOG=info# log level: debug, info, warn, error
master: node_modules ## start teraslice master node
	node service.js -c examples/config/processor-master.yaml | bunyan -o short -l $(LOG)


worker: LOG=info# log level: debug, info, warn, error
worker: node_modules ## start teraslice worker node
	node service.js -c examples/config/processor-worker.yaml | bunyan -o short -l $(LOG)


Dockerfile: Dockerfile.sh
	./Dockerfile.sh > Dockerfile


docker-image: Dockerfile ## build docker image
	docker build -t $(APP_NAME) .


grep: TYPE:=F# how to interpret NEEDLE (F=fixed, E=extended regex, G=basic regex)
grep: NEEDLE:=todo# pattern to search for
grep: ## grep source
	grep --exclude-dir node_modules -Hrn$(TYPE)i -- '$(NEEDLE)' .
