const { Sequelize, DataTypes } = require('sequelize');
const { withRelayPagination } = require('./index');

const sequelize = new Sequelize('sqlite::memory:', { logging: false });

const Test = sequelize.define('test', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  extra1: DataTypes.INTEGER,
  extra2: DataTypes.INTEGER,
  extra3: DataTypes.INTEGER
});

withRelayPagination()(Test);

function generateTestData() {
  return Promise.all([
    Test.create({ id: 1, extra1: 3, extra2: 2 }),
    Test.create({ id: 2, extra1: 1, extra2: 3 }),
    Test.create({ id: 3, extra1: 2, extra2: 3 }),
    Test.create({ id: 4, extra1: 5, extra2: 3 }),
    Test.create({ id: 5, extra1: 4, extra2: 2 })
  ]);
}

beforeEach(async () => {
  await Test.sync({ force: true });
});

test('Sets correct default method', () => {
  expect(typeof Test.paginate).toBe('function');
});

test('Paginates correctly on primary key ordered ASC', async () => {
  await generateTestData();

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ first: 2 });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(1);
  expect(page.edges[1].node.id).toBe(2);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(3);
  expect(page.edges[1].node.id).toBe(4);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(1);
  expect(page.edges[0].node.id).toBe(5);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ last: 2, before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(3);
  expect(page.edges[1].node.id).toBe(4);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ last: 2, before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(1);
  expect(page.edges[1].node.id).toBe(2);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);
});

test('Paginates correctly on non primary key ordered ASC', async () => {
  await generateTestData();

  const order = [['extra1', 'ASC']];

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ first: 2, order });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(2);
  expect(page.edges[1].node.id).toBe(3);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, order, after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(1);
  expect(page.edges[1].node.id).toBe(5);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, order, after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(1);
  expect(page.edges[0].node.id).toBe(4);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ last: 2, order, before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(1);
  expect(page.edges[1].node.id).toBe(5);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ last: 2, order, before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(2);
  expect(page.edges[1].node.id).toBe(3);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);
});

test('Paginates correctly on primary key ordered DESC', async () => {
  await generateTestData();

  const order = [['id', 'DESC']];

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ first: 2, order });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(5);
  expect(page.edges[1].node.id).toBe(4);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, order, after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(3);
  expect(page.edges[1].node.id).toBe(2);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, order, after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(1);
  expect(page.edges[0].node.id).toBe(1);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ last: 2, order, before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(3);
  expect(page.edges[1].node.id).toBe(2);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ last: 2, order, before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(5);
  expect(page.edges[1].node.id).toBe(4);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);
});

test('Paginates correctly on non primary key ordered DESC', async () => {
  await generateTestData();

  const order = [['extra1', 'DESC']];

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ first: 2, order });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(4);
  expect(page.edges[1].node.id).toBe(5);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, order, after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(1);
  expect(page.edges[1].node.id).toBe(3);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, order, after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(1);
  expect(page.edges[0].node.id).toBe(2);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ last: 2, order, before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(1);
  expect(page.edges[1].node.id).toBe(3);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ last: 2, order, before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(4);
  expect(page.edges[1].node.id).toBe(5);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);
});

test('Paginates correctly on non unique field ordered ASC', async () => {
  await generateTestData();

  const order = [['extra2', 'ASC']];

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ first: 2, order });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(1);
  expect(page.edges[1].node.id).toBe(5);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, order, after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(2);
  expect(page.edges[1].node.id).toBe(3);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, order, after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(1);
  expect(page.edges[0].node.id).toBe(4);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ last: 2, order, before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(2);
  expect(page.edges[1].node.id).toBe(3);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ last: 2, order, before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(1);
  expect(page.edges[1].node.id).toBe(5);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);
});

test('Paginates correctly on non unique field ordered DESC', async () => {
  await generateTestData();

  const order = [['extra2', 'DESC']];

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ first: 2, order });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(2);
  expect(page.edges[1].node.id).toBe(3);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, order, after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(4);
  expect(page.edges[1].node.id).toBe(1);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, order, after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(1);
  expect(page.edges[0].node.id).toBe(5);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ last: 2, order, before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(4);
  expect(page.edges[1].node.id).toBe(1);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ last: 2, order, before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(2);
  expect(page.edges[1].node.id).toBe(3);
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);
});

test('Paginates correctly when findAll attributes are provided', async () => {
  await generateTestData();

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ first: 2, attributes: ['id'] });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(1);
  expect(page.edges[1].node.id).toBe(2);
  expect(page.edges[0].node.extra1).toBeUndefined();
  expect(page.edges[1].node.extra1).toBeUndefined();
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, attributes: ['id'], after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(3);
  expect(page.edges[1].node.id).toBe(4);
  expect(page.edges[0].node.extra1).toBeUndefined();
  expect(page.edges[1].node.extra1).toBeUndefined();
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ first: 2, attributes: ['id'], after: page.pageInfo.endCursor });
  expect(page.edges.length).toBe(1);
  expect(page.edges[0].node.id).toBe(5);
  expect(page.edges[0].node.extra1).toBeUndefined();
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ last: 2, attributes: ['id'], before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(3);
  expect(page.edges[1].node.id).toBe(4);
  expect(page.edges[0].node.extra1).toBeUndefined();
  expect(page.edges[1].node.extra1).toBeUndefined();
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(true);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);

  page = await Test.paginate({ last: 2, attributes: ['id'], before: page.pageInfo.startCursor });
  expect(page.edges.length).toBe(2);
  expect(page.edges[0].node.id).toBe(1);
  expect(page.edges[1].node.id).toBe(2);
  expect(page.edges[0].node.extra1).toBeUndefined();
  expect(page.edges[1].node.extra1).toBeUndefined();
  expect(page.pageInfo.startCursor).not.toBeNull();
  expect(page.pageInfo.hasPreviousPage).toBe(false);
  expect(page.pageInfo.endCursor).not.toBeNull();
  expect(page.pageInfo.hasNextPage).toBe(true);
});
