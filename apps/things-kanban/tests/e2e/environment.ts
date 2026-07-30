export const allowLiveThingsWrites =
  process.env.THINGS_KANBAN_LIVE_TESTS === "1" &&
  Boolean(process.env.THINGS_KANBAN_TEST_TODO_ID);
