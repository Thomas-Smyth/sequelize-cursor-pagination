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
Sequelize model decorator, heavily inspired by [Kaltsoon's sequelize-cursor-pagination](https://github.com/Kaltsoon/sequelize-cursor-pagination), that provides cursor based pagination queries. 

### Why use this package over others?
There is a small number of packages out there that provide cursor based pagination queries for Sequelize. My personal favourite of these is [Kaltsoon's sequelize-cursor-pagination](https://github.com/Kaltsoon/sequelize-cursor-pagination), however, a few annoyances in his package have provoked me to create my own using his as inspiration. 

 * Multiple Order Queries - [Kaltsoon's version does not support multiple order queries very well](https://github.com/Kaltsoon/sequelize-cursor-pagination/issues/17). 
  This version allows you to input orders of any length like normal Sequelize finders, i.e. `[[field1, direction1], [field2, direction2], ...]`.
 * Common Value Support - [Kaltsoon's version does not support common values very well](https://github.com/Kaltsoon/sequelize-cursor-pagination/issues/35).  This version provides better support for common values by ensuring that ordering and comparisons of fields are robust. Furthermore, it ensures that all queries are ordered by primary key at some stage and that cursors contain the primary  key leading to unambiguous starting points for pages.
  * Single Cursor Input - Kaltsoon's version requires you to specify whether an inputted cursor is either a `before` or `after` cursor in order for the package to decide whether you are requesting the previous or next page. This adds extra complexity to code/APIs where the caller has to specify both the cursor and the direction. This version embeds  the direction in each cursor, so the caller only needs to input the cursor for the appropriate page to be returned.
  
## Install
```
yarn add @thomas-smyth/sequelize-cursor-pagination
```

## Usage
Define a Sequelize model:
```js
const withPagination = require('@thomas-smyth/sequelize-cursor-pagination');

const Counter = sequelize.define('counter', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  value: Sequelize.INTEGER,
});

const options = {
  methodName: 'paginate',
  primaryKeyField: 'id',
};

withPagination(options)(Counter);
```

The `withPagination` function has the following options:
 * `methodName` - The name of the pagination method. The default value is `paginate`.
 * `primaryKeyField` - The primary key field of the model. The default value is `id`.
 
Call the `paginate` method:
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
     
To use the cursors, pass the appropriate cursor to the next call of the `pagination` method as the `cursor` option. For example, to go to the next page:
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

The `paginate` method _should_ accept all the same arguments as [Sequelizer's `findAll` finder](https://sequelize.org/master/manual/model-querying-finders.html#-code-findall--code-), however, this has not been as extensively tested. Open to issues/PRs to address any issues found regarding this.

As well as the `cursor` option, the `paginate` method also accepts a `paginationField` cursor that overrides the previously specified primary key. It should be noted that for cursors to be unambiguous the specified primary key/pagination field should be unique.

## Run Tests
```
yarn run test
```

