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

function encodeCursor(cursor) {
  return cursor ? Buffer.from(JSON.stringify(cursor)).toString('base64') : null;
}

function decodeCursor(cursor) {
  return cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) : null;
}

function getValues(order, row) {
  const values = [];
  for (const [field] of order) {
    values.push(row[field]);
  }
  return values;
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

function withPagination({ methodName = 'paginate', primaryKeyField = 'id' } = {}) {
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

      // Push primary key to sort to ensure that there is always a unique sort
      order = [...order];

      let orderedByField = false;
      for (const [field] of order) if (field === paginationField) orderedByField = true;
      if (!orderedByField) order.push([paginationField, 'ASC']);

      if (cursor) {
        // Check that the cursor
        if (cursor.values.length !== order.length) throw new Error('Cursor does not match query.');

        // If the direction is prev then we need to flip the sorting to get the fields closest the cursor first as
        // opposed to the very first values
        if (cursor.direction === 'prev')
          order = order.map(([field, value]) => [field, value === 'ASC' ? 'DESC' : 'ASC']);

        // We now get the sequelize equivalent of (field1, field2) > (value1, value2) for a infinite number of fields
        // AND do so in a way that allows for the fields to be sorted in different directions.
        const paginationWhere = getAdditionalWhereClause(order, cursor.values);

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
          let hasPrev, hasNext;
          const hasMore = results.length > limit;
          // No cursor means that there's no starting point offset so there's nothing before the start of the results
          // thus no previous values.
          // We have a next value if there's more rows than shown on this page.
          if (!cursor) [hasPrev, hasNext] = [false, hasMore];
          // A cursor in the next direction means that there was a previous value that was used to generate the cursor.
          // We have a next value if there's more rows than shown on this page.
          else if (cursor.direction === 'next') [hasPrev, hasNext] = [true, hasMore];
          // A cursor in the previous direction means that there was a next value that was used to generate the cursor.
          // We have a previous value if there's more rows than shown on this page.
          else [hasPrev, hasNext] = [hasMore, true];

          // Remove the extra value used to check for additional values.
          if (results.length > limit) results.pop();

          // Reorder the results if we changed the order in the query.
          if (cursor && cursor.direction === 'prev') results.reverse();

          // Get the values of the first and last value to use as cursors for the previous and next page.
          const prevValues = results.length !== 0 ? getValues(order, results[0]) : null;
          const nextValues =
            results.length !== 0 ? getValues(order, results[results.length - 1]) : null;

          // Return page and cursor info.
          return {
            results,
            cursors: {
              hasPrev,
              hasNext,
              prevCursor: prevValues
                ? encodeCursor({ direction: 'prev', values: prevValues })
                : null,
              nextCursor: nextValues
                ? encodeCursor({ direction: 'next', values: nextValues })
                : null
            }
          };
        });
    };

    return model;
  };
}

module.exports = withPagination;
