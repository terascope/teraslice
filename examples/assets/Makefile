.PHONY: help build all clean copy

help:
	@echo "all - builds and copies assets"
	@echo "build - Builds all example asset types"
	@echo "clean - Removes asset zipfiles"
	@echo "copy - Copies assets into fixture dir"
	@echo "ex1 - Create an asset with asset.json at the top level"
	@echo "ex2 - Create an asset with asset.json in a subdir"
	@echo "bad1 - Create an asset without an asset.json anywhere"

build: example_asset_1.zip example_asset_2.zip example_bad_asset_1.zip

all: build copy

clean:
	rm -f *.zip

copy:
	mkdir -p ../../e2e/spec/fixtures/assets
	cp example_asset_1.zip ../../e2e/spec/fixtures/assets/
	cp example_asset_2.zip ../../e2e/spec/fixtures/assets/
	cp example_bad_asset_1.zip ../../e2e/spec/fixtures/assets/

example_asset_1.zip: example_asset_type1/example_assets/drop_property/index.js
	@zip -qr $@ example_asset_type1/
	@zipinfo $@

example_asset_2.zip: example_asset_type2/drop_property/index.js
	@zip -qr $@ example_asset_type2/
	@zipinfo $@

example_bad_asset_1.zip: example_asset_bad1/drop_property/index.js
	@zip -qr $@ example_asset_bad1/
	@zipinfo $@
