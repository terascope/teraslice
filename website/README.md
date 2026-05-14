# Teraslice Website

This is the [Docusaurus 3](https://docusaurus.io/) documentation site for Teraslice. It lives in its own pnpm workspace with a separate lockfile from the main monorepo.

## Getting Started

Install dependencies from within this directory:

```sh
cd website
pnpm install
```

## Commands

```sh
pnpm run start    # Start local dev server (http://localhost:3000)
pnpm run build    # Production build (output: build/)
pnpm run deploy   # Deploy to GitHub Pages
```

## Adding or Updating Docs

Source docs live in `../docs/`. See [Teraslice Packages](../docs/development/packages.md) for how to add a new package's docs, and [Development Overview](../docs/development/overview.md) for general development setup.

After adding or editing docs:

1. Run `pnpm docs` from the repo root to regenerate package READMEs.
2. Update `sidebars.json` if you added a new page.

## Known Issues

### `webpack` pinned to `5.105.1`

`package.json` contains a pnpm override pinning `webpack` to `5.105.1`. Do not remove it without testing `pnpm run build`.

**Root cause:** `webpackbar@6.0.1` (a transitive dependency of `@docusaurus/core`) extends webpack's `ProgressPlugin` and then overwrites `this.options` with its own options, which include properties like `name`, `color`, `reporters`, and `reporter`. Webpack `5.106.2` moved `ProgressPlugin` schema validation from the constructor to a deferred compiler hook, so it now validates `this.options` *after* webpackbar has overwritten it — resulting in a build-breaking `ValidationError: options has an unknown property 'name'`. Webpack `5.105.1` validated in the constructor before the overwrite, so it was unaffected.

Remove the override once `webpackbar` ships a fix upstream.
