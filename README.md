<div align="center">

# sequelize-cursor-pagination

[![GitHub release](https://img.shields.io/github/release/Thomas-Smyth/sequelize-cursor-pagination.svg?style=flat-square)](https://github.com/Thomas-Smyth/sequelize-cursor-pagination/releases)
[![GitHub contributors](https://img.shields.io/github/contributors/Thomas-Smyth/sequelize-cursor-pagination.svg?style=flat-square)](https://github.com/Thomas-Smyth/sequelize-cursor-pagination/graphs/contributors)
[![GitHub release](https://img.shields.io/github/license/Thomas-Smyth/sequelize-cursor-pagination.svg?style=flat-square)](https://github.com/Thomas-Smyth/sequelize-cursor-pagination/blob/master/LICENSE)

<br>

[![GitHub issues](https://img.shields.io/github/issues/Thomas-Smyth/sequelize-cursor-pagination.svg?style=flat-square)](https://github.com/Thomas-Smyth/sequelize-cursor-pagination/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/Thomas-Smyth/sequelize-cursor-pagination.svg?style=flat-square)](https://github.com/Thomas-Smyth/sequelize-cursor-pagination/pulls)
[![GitHub issues](https://img.shields.io/github/stars/Thomas-Smyth/sequelize-cursor-pagination.svg?style=flat-square)](https://github.com/Thomas-Smyth/sequelize-cursor-pagination/stargazers)

<br><br>
</div>

## About
`sequelize-cursor-pagination` is a Sequelize modal decorator that implements two kinds of pagination:
 * Simple Pagination - A non-formal pagination approach that is intended to be simple and easy to use.
 * Relay Pagination - A formal pagination approach that meets the [Relay GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm).

This package was created to solve some minor annoyances in and simplify [Kaltsoon's sequelize-cursor-pagination](https://github.com/Kaltsoon/sequelize-cursor-pagination), however, has expanded to support the [Relay GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm) in order for it to be suitable for GraphQL APIs.

#### Why use this package over others?
There is a small number of packages out there that provide cursor based pagination queries for Sequelize. The most prominent of these is [Kaltsoon's sequelize-cursor-pagination](https://github.com/Kaltsoon/sequelize-cursor-pagination), which this package uses as a base with the intent to improve upon it.

 * Multiple Order Queries - [Kaltsoon's version does not support multiple order queries very well](https://github.com/Kaltsoon/sequelize-cursor-pagination/issues/17). This version allows you to input orders of any length like normal Sequelize finders, i.e. `[[field1, direction1], [field2, direction2], ...]`.
 * Common Value Support - [Kaltsoon's version does not support common values very well](https://github.com/Kaltsoon/sequelize-cursor-pagination/issues/35).  This version provides better support for common values by ensuring that ordering and comparisons of fields are robust. Furthermore, it ensures that all queries are ordered by primary key at some stage and that cursors contain the primary  key leading to unambiguous starting points for pages.
  * Single Cursor Input/Relay GraphQL Cursor Connections Specification  - Kaltsoon's version requires you to specify whether an inputted cursor is either a `before` or `after` cursor in order for it to decide whether you are requesting the previous or next page. Although this is similar to the Relay GraphQL Cursor Connections Specification, the package is not a full implementation of the specification and therefore the two cursor input options add unnecessary complexity to the package as the caller has to specify both the cursor and the direction even though the cursor will be unique to the direction. This version simplifies this by embedding the direction in each cursor, so the caller only needs to input the appropriate cursor for the previous/next page to be returned. In addition to this, it provides an implementation that fully meets the Relay GraphQL Cursor Connections Specification for use in GraphQL APIs.

## Install
```
yarn add @thomas-smyth/sequelize-cursor-pagination
```

## Usage
#### Define a Sequelize Model
##### Simple Pagination
```js
const { withSimplePagination } = require('@thomas-smyth/sequelize-cursor-pagination');

const Counter = sequelize.define('counter', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  value: Sequelize.INTEGER,
});

const options = {
  methodName: 'paginate',
  primaryKeyField: 'id',
};

withSimplePagination(options)(Counter);
```

##### Relay Pagination
```js
const { withRelayPagination } = require('@thomas-smyth/sequelize-cursor-pagination');

const Counter = sequelize.define('counter', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  value: Sequelize.INTEGER,
});

const options = {
  methodName: 'paginate',
  primaryKeyField: 'id',
};

withRelayPagination(options)(Counter);
```

The `withSimplePagination`/`withRelayPagination` function has the following options:
 * `methodName` - The name of the pagination method. The default value is `paginate`.
 * `primaryKeyField` - The primary key field of the model which all queries will be ordered by last in order to ensure cursors are unique. The default value is `id`.

#### Call the Initial Page
##### Simple Pagination
```js
const page = await Counter.paginate({
  where: { value: { $gt: 2 } },
  limit: 10
});
```

The `paginate` method returns an object with the following properties:
 * `results` - An array of Sequelize model instances.
 * `cursors` - Object containing information related to cursors.
     - `cursors.hasPrev` - Has previous value(s).
     - `cursors.hasNext` - Has next value(s).
     - `cursors.prevCursor` - The cursor for the previous page.
     - `cursors.nextCursor` - The cursor for the next page.

##### Relay Pagination
```js
const page = await Counter.paginate({
  where: { value: { $gt: 2 } },
  first: 10
});
```

The `paginate` method returns an object with the following properties:
 * `edges` - An array of edges.
   - `edges[].cursor` - The cursor of the edge.
   - `edges[].node` - The node of the edge.
 * `pageInfo` - Object containing information related to cursors.
   - `pageInfo.hasPreviousPage` - Has previous value(s).
   - `pageInfo.hasNextPage` - Has next value(s).
   - `pageInfo.startCursor` - The cursor for the first edge page.
   - `pageInfo.endCursor` - The cursor for the last edge page.

For more information, please see the [Relay GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm).

#### Call the Next Page
##### Simple Pagination
To call the next/previous page pass the appropriate `prevCursor`/`nextCursor` values to the `cursor` option. For example, to go to the next page:
```js
const pageOne = await Counter.paginate({
  where: { value: { $gt: 2 } },
  limit: 10
});

const pageTwo = await Counter.paginate({
  where: { value: { $gt: 2 } },
  limit: 10,
  cursor: pageOne.cursors.nextCursor
});
```

##### Relay Specification
To call the next/previous page pass the appropriate `endCursor`/`startCursor` value to the appropriate `after`/`before` option, as well as the appropriate `first`/`last` option as a replacement to the `limit` option. For example, to go to the next page:
```js
const pageOne = await Counter.paginate({
  where: { value: { $gt: 2 } },
  limit: 10
});

const pageTwo = await Counter.paginate({
  where: { value: { $gt: 2 } },
  after: pageOne.pageInfo.endCursor,
  first: 10
});
```

For more information, please see the [Relay GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm).

The `paginate` method accepts a `paginationField` cursor that overrides the previously specified primary key. It should be , like a primary key, this field should be unique to ensure cursors are unique.

The `paginate` method _should_ also accept all the same arguments as [Sequelizer's `findAll` finder](https://sequelize.org/master/manual/model-querying-finders.html#-code-findall--code-), however, this has not been as extensively tested. Open to issues/PRs to address any issues found regarding this.

## Run Tests
```
yarn run test
```
