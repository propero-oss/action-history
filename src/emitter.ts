/**
 * A map of event names to handler parameters.
 *
 * @see {@link Emitter}, {@link createEmitter}
 *
 * @remarks
 * Use with interfaces is preferred, since it allows for simple augmentation
 *
 * @example ```typescript
 * export interface MyEvents extends EventMeta {
 *   myFirstEvent: [str: string, bool: boolean, maybeNumber?: number];
 *   mySecondEvent: [pattern: string, ...format: unknown[]];
 *   myThirdEvent: [];
 * }
 * ```
 */
export type EventMeta = Record<string, unknown[]>;
/**
 * An event handler for a given event in an {@link EventMeta} map.
 *
 * @see {@link Emitter.on}, {@link Emitter.off}
 *
 * @typeParam T - The event map to infer arguments from.
 * @typeParam Key - The name of the event.
 *
 * @example ```typescript
 * interface MyEvents extends EventMeta {
 *   myEvent: [str: string, bool: boolean, maybeNumber?: number];
 * }
 *
 * export const myEventHandler: EventHandler<MyEvents, "myEvent"> = (
 *   str,
 *   bool,
 *   maybeNumber
 * ) {
 *   // to be implemented
 * };
 * ```
 */
export type EventHandler<T extends EventMeta, Key extends keyof T = keyof T> = (
  ...params: T[Key]
) => void;

/**
 * A typesafe event emitter
 *
 * @typeParam T - An interface or other structural type, mapping event names to possible parameters
 *
 * @see {@link EventMeta} for information on event mapping
 * @see {@link createEmitter} for creating a basic emitter
 *
 * @example ```typescript
 * const emitter = createEmitter<{
 *   "myFirstEvent": [myFirstParam: string, mySecondParam?: number];
 *   "mySecondEvent": [];
 *   "myThirdEvent": [firstParam: boolean, ...variadicParameters: string[]];
 * }>();
 *
 * emitter.on("myFirstEvent", console.log);
 * emitter.on("mySecondEvent", () => console.log("mySecondEvent"));
 * emitter.on("myThirdEvent", (firstParam, ...strings) => {
 *   // all parameters are typed correctly
 * });
 *
 * emitter.emit("myFirstEvent", "foo", 3);
 * emitter.emit("mySecondEvent");
 * emitter.emit("myThirdEvent", true);
 *
 * emitter.off("myFirstEvent", console.log);
 * ```
 */
export interface Emitter<T extends EventMeta> {
  /**
   * Attach an event handler to one or more events
   *
   * @param event - The event(s) to attach to
   * @param handler - The handler function
   */
  on<Key extends keyof T>(
    event: Key | Key[],
    handler: EventHandler<T, Key>
  ): void;

  /**
   * Remove an event handler from one or more events
   *
   * @param event - The event(s) to detach from
   * @param handler - The handler function
   */
  off<Key extends keyof T>(
    event: Key | Key[],
    handler: EventHandler<T, Key>
  ): void;

  /**
   * Trigger all event handlers registered for one or more events
   *
   * @param event - The event(s) to trigger
   * @param params - Parameters to forward to the handler functions
   */
  emit<Key extends keyof T>(event: Key | Key[], ...params: T[Key]): void;
}

/**
 * Creates a basic event emitter.
 * @typeParam T - The event name to handler parameter mapping.
 * @see {@link EventMeta} for information on event mapping
 * @returns {@link Emitter}
 */
export function createEmitter<T extends EventMeta>(): Emitter<T> {
  const handlers: { [Key in keyof T]?: EventHandler<T, Key>[] } = {};

  function on<Key extends keyof T>(
    event: Key | Key[],
    handler: EventHandler<T, Key>
  ): void {
    for (const key of Array.isArray(event) ? event : [event])
      (handlers[key] ??= []).push(handler as never);
  }

  function off<Key extends keyof T>(
    event: Key,
    handler: EventHandler<T, Key>
  ): void {
    for (const key of (Array.isArray(event) ? event : [event]) as Key[]) {
      const index = handlers[key]?.lastIndexOf(handler) ?? -1;
      if (index !== -1) handlers[key]!.splice(index, 1);
    }
  }

  function emit<Key extends keyof T>(
    event: Key | Key[],
    ...params: T[Key]
  ): void {
    for (const key of (Array.isArray(event) ? event : [event]) as Key[])
      for (const handler of handlers[key] ?? []) handler(...params);
  }

  return { on, off, emit };
}
