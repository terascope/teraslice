
.DEFAULT_GOAL := help
.PHONY: help lint test test-all clean grep
SHELL := bash


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


images.log: ../Dockerfile
	docker build --no-cache -t teraslice .. | tee images.log


test: ES=5.5# elasticsearch version to use
test: images.log node_modules ## run tests
	ES_VERSION=$(ES) $$(npm bin)/jasmine


test-all: ## run test matrix
	make test ES=2.3
	make test ES=5.5


clean: ## remove test docker containers
	docker-compose down -v


clean-all: clean ## remove all test artifacts
	rm -rf node_modules
	rm images.log


grep: TYPE:=F# how to interpret NEEDLE (F=fixed, E=extended regex, G=basic regex)
grep: NEEDLE:=todo# pattern to search for
grep: ## grep source
	grep --exclude-dir node_modules -Hrn$(TYPE)i -- '$(NEEDLE)' .
