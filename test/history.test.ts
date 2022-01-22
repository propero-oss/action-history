import { createHistory } from "src/history";
import { HistoryMeta } from "src/types";

interface Events extends HistoryMeta {
  foo: {
    parameters: { bar: string };
  };
  bar: {
    parameters: { foo: string };
  };
}

function action(undo = false): [() => never, jest.Mock, jest.Mock] {
  const done = jest.fn();
  const undone = jest.fn();
  return [
    ((params: unknown, context: unknown) => {
      done(params, context);
      if (undo) return undone;
    }) as never,
    done,
    undone,
  ];
}

describe("history", () => {
  it("should register and execute a handler", async () => {
    const history = createHistory<Events>();
    const [fn, done, undone] = action(true);
    history.action("foo", fn);
    await history.exec("foo", { bar: "baz" });
    expect(done).toHaveBeenCalledWith({ bar: "baz" }, {});
    expect(undone).not.toHaveBeenCalled();
  });
  it("should undo an action", async () => {
    const history = createHistory<Events>();
    const [fn, done, undone] = action(true);
    history.action("foo", fn);
    await history.exec("foo", { bar: "baz" });
    expect(done).toHaveBeenCalledWith({ bar: "baz" }, {});
    expect(undone).not.toHaveBeenCalled();
    await history.undo();
    expect(undone).toHaveBeenCalled();
  });
  it("should undo and redo actions in correct order", async () => {
    const history = createHistory<Events>();
    const [fn1, done1, undone1] = action(true);
    const [fn2, done2, undone2] = action(true);
    history.action("foo", fn1);
    history.action("bar", fn2);
    await history.exec("foo", { bar: "baz" });
    expect(done1).toHaveBeenCalledTimes(1);
    expect(done2).toHaveBeenCalledTimes(0);
    await history.exec("bar", { foo: "baz" });
    expect(done1).toHaveBeenCalledTimes(1);
    expect(done2).toHaveBeenCalledTimes(1);
    await history.undo();
    expect(undone2).toHaveBeenCalledTimes(1);
    expect(undone1).toHaveBeenCalledTimes(0);
    await history.undo();
    expect(undone2).toHaveBeenCalledTimes(1);
    expect(undone1).toHaveBeenCalledTimes(1);
    await history.redo();
    expect(done1).toHaveBeenCalledTimes(2);
    expect(done2).toHaveBeenCalledTimes(1);
    await history.redo();
    expect(done1).toHaveBeenCalledTimes(2);
    expect(done2).toHaveBeenCalledTimes(2);
  });
  it("should log actions in correct order", async () => {
    const history = createHistory<Events>();
    const [foo] = action(true);
    const [bar] = action(true);

    history.action("foo", foo);
    history.action("bar", bar);

    await history.exec("foo", { bar: "baz" });
    await history.exec("foo", { bar: "baz" });
    await history.exec("bar", { foo: "baz" });
    await history.exec("foo", { bar: "baz" });
    await history.exec("bar", { foo: "baz" });
    await history.exec("bar", { foo: "baz" });

    await history.undo(3);

    const last = history.last(5);
    const lastUndone = history.lastUndone(5);

    expect(last.map(({ name }) => name)).toEqual(["bar", "foo", "foo"]);
    expect(lastUndone.map(({ name }) => name)).toEqual(["foo", "bar", "bar"]);
  });
});
