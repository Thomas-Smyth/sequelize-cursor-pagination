const { Sequelize, DataTypes } = require('sequelize');
const withPagination = require('./index');

const sequelize = new Sequelize('sqlite::memory:', { logging: false });

const Test = sequelize.define('test', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  extra1: DataTypes.INTEGER,
  extra2: DataTypes.INTEGER,
  extra3: DataTypes.INTEGER
});

withPagination()(Test);

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
  page = await Test.paginate({ limit: 2 });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(1);
  expect(page.results[1].id).toBe(2);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(3);
  expect(page.results[1].id).toBe(4);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(1);
  expect(page.results[0].id).toBe(5);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ limit: 2, cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(3);
  expect(page.results[1].id).toBe(4);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(1);
  expect(page.results[1].id).toBe(2);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);
});

test('Paginates correctly on non primary key ordered ASC', async () => {
  await generateTestData();

  const order = [['extra1', 'ASC']];

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ limit: 2, order });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(2);
  expect(page.results[1].id).toBe(3);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(1);
  expect(page.results[1].id).toBe(5);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(1);
  expect(page.results[0].id).toBe(4);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(1);
  expect(page.results[1].id).toBe(5);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(2);
  expect(page.results[1].id).toBe(3);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);
});

test('Paginates correctly on primary key ordered DESC', async () => {
  await generateTestData();

  const order = [['id', 'DESC']];

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ limit: 2, order });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(5);
  expect(page.results[1].id).toBe(4);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(3);
  expect(page.results[1].id).toBe(2);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(1);
  expect(page.results[0].id).toBe(1);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(3);
  expect(page.results[1].id).toBe(2);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(5);
  expect(page.results[1].id).toBe(4);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);
});

test('Paginates correctly on non primary key ordered DESC', async () => {
  await generateTestData();

  const order = [['extra1', 'DESC']];

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ limit: 2, order });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(4);
  expect(page.results[1].id).toBe(5);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(1);
  expect(page.results[1].id).toBe(3);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(1);
  expect(page.results[0].id).toBe(2);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(1);
  expect(page.results[1].id).toBe(3);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(4);
  expect(page.results[1].id).toBe(5);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);
});

test('Paginates correctly on non unique field ordered ASC', async () => {
  await generateTestData();

  const order = [['extra2', 'ASC']];

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ limit: 2, order });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(1);
  expect(page.results[1].id).toBe(5);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(2);
  expect(page.results[1].id).toBe(3);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(1);
  expect(page.results[0].id).toBe(4);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(2);
  expect(page.results[1].id).toBe(3);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(1);
  expect(page.results[1].id).toBe(5);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);
});

test('Paginates correctly on non unique field ordered DESC', async () => {
  await generateTestData();

  const order = [['extra2', 'DESC']];

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ limit: 2, order });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(2);
  expect(page.results[1].id).toBe(3);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(4);
  expect(page.results[1].id).toBe(1);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(1);
  expect(page.results[0].id).toBe(5);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(4);
  expect(page.results[1].id).toBe(1);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, order, cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(2);
  expect(page.results[1].id).toBe(3);
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);
});

test('Paginates correctly when findAll attributes are provided', async () => {
  await generateTestData();

  let page;

  // UP THROUGH PAGES
  page = await Test.paginate({ limit: 2, attributes: ['id'] });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(1);
  expect(page.results[1].id).toBe(2);
  expect(page.results[0].extra1).toBeUndefined();
  expect(page.results[1].extra1).toBeUndefined();
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, attributes: ['id'], cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(3);
  expect(page.results[1].id).toBe(4);
  expect(page.results[0].extra1).toBeUndefined();
  expect(page.results[1].extra1).toBeUndefined();
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, attributes: ['id'], cursor: page.cursors.nextCursor });
  expect(page.results.length).toBe(1);
  expect(page.results[0].id).toBe(5);
  expect(page.results[0].extra1).toBeUndefined();
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(false);

  // DOWN THROUGH PAGES
  page = await Test.paginate({ limit: 2, attributes: ['id'], cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(3);
  expect(page.results[1].id).toBe(4);
  expect(page.results[0].extra1).toBeUndefined();
  expect(page.results[1].extra1).toBeUndefined();
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(true);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);

  page = await Test.paginate({ limit: 2, attributes: ['id'], cursor: page.cursors.prevCursor });
  expect(page.results.length).toBe(2);
  expect(page.results[0].id).toBe(1);
  expect(page.results[1].id).toBe(2);
  expect(page.results[0].extra1).toBeUndefined();
  expect(page.results[1].extra1).toBeUndefined();
  expect(page.cursors.prevCursor).not.toBeNull();
  expect(page.cursors.hasPrev).toBe(false);
  expect(page.cursors.nextCursor).not.toBeNull();
  expect(page.cursors.hasNext).toBe(true);
});
