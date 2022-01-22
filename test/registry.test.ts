import { createRegistry } from "src/registry";

describe("registry", () => {
  describe("has", () => {
    it("should return true for initial members", async () => {
      const registry = createRegistry({ foo: 1 });
      expect(registry.has("foo")).toBeTruthy();
    });
    it("should return true for registered members", async () => {
      const registry = createRegistry<{ foo: unknown }>({});
      await registry.patch({ foo: 1 });
      expect(registry.has("foo")).toBeTruthy();
    });
    it("should return false for non-registered members", async () => {
      const registry = createRegistry<{ foo: unknown }>({});
      expect(registry.has("foo")).toBeFalsy();
    });
  });
  describe("get", () => {
    it("should resolve to a registered member", async () => {
      const registry = createRegistry({ foo: 1 });
      expect(await registry.get("foo")).toBe(1);
    });
    it("should resolve after a member is registered", async () => {
      const registry = createRegistry<{ foo: number }>();
      const promise = registry.get("foo");
      registry.patch({ foo: 1 });
      expect(await promise).toBe(1);
    });
  });
  describe("set", () => {
    it("should register a member", async () => {
      const registry = createRegistry<{ foo: 1 }>();
      registry.set("foo", 1);
      expect(await registry.get("foo")).toBe(1);
    });
    it("should overwrite a member", async () => {
      const registry = createRegistry({ foo: 1 });
      registry.set("foo", 2);
      expect(await registry.get("foo")).toBe(2);
    });
    it("should not resolve pending accesses for undefined", async () => {
      const registry = createRegistry<{ foo: 1 }>();
      const spy = jest.fn();
      const promise = registry.get("foo").then(spy);
      registry.set("foo");
      await new Promise((resolve) => setTimeout(resolve, 1));
      expect(spy).not.toHaveBeenCalled();
      registry.set("foo", 1);
      await promise;
      expect(spy).toHaveBeenCalledWith(1);
    });
  });
  describe("unset", () => {
    it("should unset a member", async () => {
      const registry = createRegistry({ foo: 1 });
      registry.unset("foo");
      expect(registry.has("foo")).toBeFalsy();
    });
  });
  describe("patch", () => {
    it("should register a member", async () => {
      const registry = createRegistry<{ foo: 1 }>();
      await registry.patch({ foo: 1 });
      expect(registry.has("foo")).toBeTruthy();
    });
    it("should overwrite existing members", async () => {
      const registry = createRegistry({ foo: 1 });
      await registry.patch({ foo: 2 });
      expect(await registry.get("foo")).toBe(2);
    });
  });
  describe("all", () => {
    it("should wait for all members to be registered", async () => {
      const registry = createRegistry<{
        foo: number;
        bar: string;
        baz: string;
      }>({ foo: 1, baz: "qux" });
      const promise = registry.all(["foo", "bar"]);
      registry.patch({ bar: "baz" });
      expect(await promise).toEqual({ foo: 1, bar: "baz" });
    });
    it("should add additional members if requrested", async () => {
      const registry = createRegistry<{
        foo: number;
        bar: string;
        baz: string;
      }>({ foo: 1, baz: "qux" });
      const promise = registry.all(["foo", "bar"], true);
      registry.patch({ bar: "baz" });
      expect(await promise).toEqual({ foo: 1, bar: "baz", baz: "qux" });
    });
  });
});
