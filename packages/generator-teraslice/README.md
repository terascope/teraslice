# Generator Teraslice

> Generate teraslice related packages and code

- [Installation](#installation)
- [Usage](#usage)
  - [Package](#package)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
# Using yarn
yarn global add yo tersalice-generator
# Using npm
npm install --global yo teraslice-generator
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
yo teraslice-generator:package
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE) licensed.
