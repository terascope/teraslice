
.DEFAULT_GOAL := help
.PHONY: help lint test integration-tests run docker-image grep
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


lint: node_modules ## run linters
	npm run lint


test: node_modules ## run unit tests
	npm run test


integration-tests: ## run integration tests
	make -C integration-tests test


run: node_modules ## start listening to events
	npm run start


Dockerfile: Dockerfile.sh
	./Dockerfile.sh > Dockerfile


docker-image: Dockerfile ## build docker image
	docker build -t $(APP_NAME) .


grep: TYPE:=F# how to interpret NEEDLE (F=fixed, E=extended regex, G=basic regex)
grep: NEEDLE:=todo# pattern to search for
grep: ## grep source
	grep --exclude-dir node_modules -Hrn$(TYPE)i -- '$(NEEDLE)' .
