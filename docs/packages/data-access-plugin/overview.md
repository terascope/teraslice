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

 - The data access management api is under `GET /api/v2/data-access`
 - The search api is under `GET /api/v2/:spaceIdOrName`
 - Pre/Post process function will need to be written to use express middleware, docs comming soon.
 - The following configuration has been added to the space config:
      - `index` under `metadata.indexConfig.index`
      - `typesConfig` for `xlucene-evaluator` under `metadata.indexConfig.typesConfig`
 - The following configuration has been moved to the view:
      - `allowed_fields` under `includes`
      - `type`, `date_start`, `date_end`, `geo_box_top_left`, `geo_box_bottom_right`, `geo_point`, `geo_distance` should be added to `constraint`.
 - The following configuration has been moved to the view search config:
      - `date_field` under `metadata.searchConfig.default_date_field`
      - `geo_field` under `metadata.searchConfig.default_geo_field`
      - `max_query_size`: under `metadata.searchConfig.max_query_size`;
      - `sort_default`: under `metadata.searchConfig.sort_default`;
      - `sort_enabled`: under `metadata.searchConfig.sort_enabled`;
      - `preserve_index_name`: under `metadata.searchConfig.preserve_index_name`;
      - `history_prefix`: under `metadata.searchConfig.history_prefix`;
      - `require_query`: under `metadata.searchConfig.require_query`;
 - The following configuration has been removed:
      - `type` since this can be achieved via a `constraint`
      - `date_range`, `date_start`, `date_end`, `geo_box_top_left`, `geo_box_bottom_right`, `geo_point`, `geo_distance`, since this should be achieved via the view constraint and the xclucene queries.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE) licensed.
