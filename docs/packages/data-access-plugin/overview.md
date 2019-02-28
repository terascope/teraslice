---
title: Data Access Plugin
sidebar_label: data-access-plugin
---

> A teraserver plugin for managing data access and searching spaces

# Installation

```bash
# Using yarn
yarn add data-access-plugin
# Using npm
npm install --save data-access-plugin
```

## Important Changes

Since this project is designed to replace the teraserver teranaut plugin, and the search libray, there are few important breaking changes to be aware of.

 - The search api is under `GET /api/v2/:spaceId`
 - The elasticsearch index configuration needs to specified in `space.metadata.indexConfig`
 - The `date_field` and `geo_field` will have to live in `view.metadata.searchConfig`
 - The following configuration has been moved to the view:
      - `fields`
      - `allowed_fields`
 - The following configuration has been moved to the view search config:
      - `date_field`
      - `geo_field`
 - The following configuration has been removed:
      - `type`

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE) licensed.
