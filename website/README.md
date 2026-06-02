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
