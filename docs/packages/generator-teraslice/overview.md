---
title: Teraslice Generator
sidebar_label: generator-teraslice
---

> Generate teraslice related packages and code

## Installation

### Install Yeoman

```bash
# Using yarn
yarn global add yo
# Using npm
npm install --global yo
```

### Global Setup

**NOTE:** This will use version lock the generator and you'll have to update it manually to get the latest.

```bash
# Using yarn
yarn global add tersalice-generator
# Using npm
npm install --global teraslice-generator
```

### Development Setup

**NOTE:** This will always use the latest code locally.

```bash
# From the root of the teraslice repo
cd ./packages/generator-teraslice

# Link the generator so the command is available to you
# Using yarn
yarn link
# Using npm
npm link
```

## Usage

### Package

Generate a Teraslice package within the teraslice repo.

```bash
# From the root of the teraslice repo
mkdir ./packages/<name-of-package>
cd ./packages/<name-of-package>

# Follow the prompts to generate
# the correct package
yo teraslice:package
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE) licensed.
