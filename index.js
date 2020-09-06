'use strict';

let { Op } = require('sequelize');

if (!Op) {
  // Support older versions of sequelize
  Op = {
    and: '$and',
    or: '$or',
    lt: '$lt',
    gt: '$gt'
  };
}

function encodeCursor(obj, order, direction) {
  if (!obj) return null;

  // Get fields that uniquely identify the object in the order
  const values = [];
  for (const [field] of order) values.push(obj[field]);

  // Put cursor into relevant format
  const cursor = direction ? { values, direction } : values;

  // Encode the cursor
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

function decodeCursor(cursor) {
  return cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) : null;
}

function getAdditionalWhereClause(order, cursor) {
  const currentOp = order[0][1] === 'ASC' ? Op.gt : Op.lt;

  if (order.length === 1) {
    return {
      [order[0][0]]: {
        [currentOp]: cursor[0]
      }
    };
  } else {
    return {
      [Op.or]: [
        {
          [order[0][0]]: {
            [currentOp]: cursor[0]
          }
        },
        {
          [order[0][0]]: cursor[0],
          ...getAdditionalWhereClause(order.slice(1), cursor.slice(1))
        }
      ]
    };
  }
}

module.exports.withSimplePagination = function ({
  methodName = 'paginate',
  primaryKeyField = 'id'
} = {}) {
  return (model) => {
    model[methodName] = ({
      where = {},
      order = [],
      limit,
      paginationField = primaryKeyField,
      cursor,
      ...queryArgs
    } = {}) => {
      // Decode the cursor
      cursor = decodeCursor(cursor);

      const { values, direction } = cursor || { values: null, direction: null };

      // Push primary key to sort to ensure that there is always a unique sort
      order = [...order];
      if (order.filter((field) => field[0] === paginationField).length === 0)
        order.push([paginationField, 'ASC']);

      if (values) {
        // Check that the cursor is compatiable with this query.
        if (values.length !== order.length) throw new Error('Cursor does not match query.');

        // If the direction is prev then we need to flip the sorting to get the fields closest the cursor first as
        // opposed to the very first values
        if (direction === 'prev')
          order = order.map(([field, value]) => [field, value === 'ASC' ? 'DESC' : 'ASC']);

        // We now get the sequelize equivalent of (field1, field2) > (value1, value2) for a infinite number of fields
        // AND do so in a way that allows for the fields to be sorted in different directions.
        const paginationWhere = getAdditionalWhereClause(order, values);

        // Add the generated where clause to the inputted where clause with the AND operator
        where = { [Op.and]: [where, paginationWhere] };
      }

      return model
        .findAll({
          where,
          order,
          ...(limit && { limit: limit + 1 }),
          ...queryArgs
        })
        .then((results) => {
          // - If no cursor is provided then values are fetched from the start of the order and therefore there is no
          //   previous page. If there is more results than on the page then there is a next page.
          // - If there is a cursor and the direction is next then there is a value before the page, i.e. the cursor's
          //   value, and therefore there is a previous page. If there is more results than on the page then there is a
          //   next page.
          // - If there is a cursor and the direction is previous then there is a value after the page, i.e. the
          //   cursor's value, and therefore there is a next page. If there is more results than on the page then there
          //   is a previous page.
          const [hasPrev, hasNext] = cursor
            ? direction === 'next'
              ? [true, results.length > limit]
              : [results.length > limit, true]
            : [false, results.length > limit];

          // Remove the extra value used to check for additional values.
          if (results.length > limit) results.pop();

          // Reorder the results if we changed the order in the query.
          if (direction === 'prev') results.reverse();

          // Return page and cursor info.
          return {
            results,
            cursors: {
              hasPrev,
              hasNext,
              // Create cursors from the first and last value to use as cursors for the previous and next page.
              prevCursor: results.length !== 0 ? encodeCursor(results[0], order, 'prev') : null,
              nextCursor:
                results.length !== 0
                  ? encodeCursor(results[results.length - 1], order, 'next')
                  : null
            }
          };
        });
    };

    return model;
  };
};

module.exports.withRelayPagination = function ({
  methodName = 'paginate',
  primaryKeyField = 'id'
} = {}) {
  return (model) => {
    model[methodName] = ({
      where = {},
      order = [],
      first,
      after,
      last,
      before,
      paginationField = primaryKeyField,
      cursor,
      ...queryArgs
    } = {}) => {
      if ((first || after) && (last || before))
        throw new Error(
          'This package does not support both first/after and before/last simultaneously, as advised by spec.'
        );
      if (last && !before)
        throw new Error('This package does not support the use of last without a before cursor.');

      if ((first && first < 0) || (last && last < 0))
        throw new Error('first/last must be a non-negative integer values.');

      // Decode the cursor
      const values = decodeCursor(after) || decodeCursor(before);
      const direction = (!after && !before) || after ? 'next' : 'prev';
      const limit = first || last;

      // Push primary key to sort to ensure that there is always a unique sort
      order = [...order];
      if (order.filter((field) => field[0] === paginationField).length === 0)
        order.push([paginationField, 'ASC']);

      if (values) {
        // Check that the cursor is compatiable with this query.
        if (values.length !== order.length) throw new Error('Cursor does not match query.');

        // If the direction is prev then we need to flip the sorting to get the fields closest the cursor first as
        // opposed to the very first values
        if (direction === 'prev')
          order = order.map(([field, value]) => [field, value === 'ASC' ? 'DESC' : 'ASC']);

        // We now get the sequelize equivalent of (field1, field2) > (value1, value2) for a infinite number of fields
        // AND do so in a way that allows for the fields to be sorted in different directions.
        const paginationWhere = getAdditionalWhereClause(order, values);

        // Add the generated where clause to the inputted where clause with the AND operator
        where = { [Op.and]: [where, paginationWhere] };
      }

      return model
        .findAll({
          where,
          order,
          ...(limit && { limit: limit + 1 }),
          ...queryArgs
        })
        .then((results) => {
          // - If no cursor is provided then values are fetched from the start of the order and therefore there is no
          //   previous page. If there is more results than on the page then there is a next page.
          // - If there is a cursor and the direction is next then there is a value before the page, i.e. the cursor's
          //   value, and therefore there is a previous page. If there is more results than on the page then there is a
          //   next page.
          // - If there is a cursor and the direction is previous then there is a value after the page, i.e. the
          //   cursor's value, and therefore there is a next page. If there is more results than on the page then there
          //   is a previous page.
          const [hasPreviousPage, hasNextPage] =
            after || before
              ? direction === 'next'
                ? [true, results.length > limit]
                : [results.length > limit, true]
              : [false, results.length > limit];

          // Remove the extra value used to check for additional values.
          if (results.length > limit) results.pop();

          // Reorder the results if we changed the order in the query.
          if (direction === 'prev') results.reverse();

          // Map results into Relay spec format
          const edges = results.map((result) => ({
            cursor: encodeCursor(result, order),
            node: result
          }));

          // Return page and cursor info.
          return {
            edges,
            pageInfo: {
              hasPreviousPage,
              hasNextPage,
              startCursor: edges.length !== 0 ? edges[0].cursor : null,
              endCursor: edges.length !== 0 ? edges[edges.length - 1].cursor : null
            }
          };
        });
    };

    return model;
  };
};
