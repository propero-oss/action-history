export type EventMeta = Record<string, unknown[]>;
export type EventHandler<T extends EventMeta, Key extends keyof T = keyof T> = (
  ...params: T[Key]
) => void;

export interface Emitter<T extends EventMeta> {
  on<Key extends keyof T>(
    event: Key | Key[],
    handler: EventHandler<T, Key>
  ): void;
  off<Key extends keyof T>(
    event: Key | Key[],
    handler: EventHandler<T, Key>
  ): void;
  emit<Key extends keyof T>(event: Key | Key[], ...params: T[Key]): void;
}

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
