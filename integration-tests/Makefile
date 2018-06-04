
.DEFAULT_GOAL := help
.PHONY: help lint test test-all clean grep
SHELL := bash

# MODE acceptable values: dev, qa
export MODE ?= dev
export ES_VERSION ?= 5.5


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
	yarn install


lint: node_modules ## run linters
	yarn lint


test: node_modules ## run tests
	./docker-compose.sh # do every time in case variables or linked modules change
	$$(npm bin)/jasmine --fail-fast=true


test-all: ## run test matrix
	ES_VERSION=2.3 make test
	ES_VERSION=5.5 make test


clean: ## remove test docker containers
	curl -XDELETE "localhost:49200/*"
	docker-compose down -v


clean-all: clean ## remove all test artifacts
	rm -rf node_modules


grep: TYPE:=F# how to interpret NEEDLE (F=fixed, E=extended regex, G=basic regex)
grep: NEEDLE:=todo# pattern to search for
grep: ## grep source
	grep --exclude-dir node_modules -Hrn$(TYPE)i -- '$(NEEDLE)' .
