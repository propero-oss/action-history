import { createEmitter } from "src/emitter";

describe("emitter", () => {
  it("should register an event handler", async () => {
    const emitter = createEmitter<{ foo: [bar: string] }>();
    const spy = jest.fn();
    emitter.on("foo", spy);
    expect(spy).not.toHaveBeenCalled();
    emitter.emit("foo", "bar");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("bar");
  });
  it("should register multiple event handlers", async () => {
    const emitter = createEmitter<{ foo: [bar: string] }>();
    const spies = Array(5)
      .fill(0)
      .map(() => jest.fn());
    for (const spy of spies) emitter.on("foo", spy);
    emitter.emit("foo", "bar");
    for (const spy of spies) expect(spy).toHaveBeenCalledWith("bar");
  });
  it("should unregister an event handler", async () => {
    const emitter = createEmitter<{ foo: [bar: string] }>();
    const spy = jest.fn();
    emitter.on("foo", spy);
    expect(spy).not.toHaveBeenCalled();
    emitter.emit("foo", "bar");
    emitter.off("foo", spy);
    emitter.emit("foo", "bar");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("bar");
  });
});
