---
title: Teraslice Generator
sidebar_label: Overview
---

> Generate teraslice related packages and code

## Installation

### Install Yeoman

```bash
# Using pnpm
pnpm add -g yo
# Using npm
npm install --global yo
```

### Global Setup

**NOTE:** This will use version lock the generator and you'll have to update it manually to get the latest.

```bash
# Using pnpm
pnpm add -g generator-teraslice
# Using npm
npm install --global generator-teraslice
```

### Development Setup

**NOTE:** This will always use the latest code locally.

```bash
# From the root of the teraslice repo
cd ./packages/generator-teraslice

# Link the generator so the command is available to you
# Using pnpm
pnpm link --global
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
