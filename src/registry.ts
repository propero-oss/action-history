export interface Registry<T> {
  has<Key extends keyof T>(key: Key): boolean;
  get<Key extends keyof T>(key: Key): Promise<T[Key]>;
  set<Key extends keyof T>(key: Key, value?: T[Key]): void;
  unset(key: keyof T): void;
  patch(members: Partial<T>): void;
  all<Keys extends keyof T = keyof T>(
    keys: Keys[],
    additional?: boolean
  ): Promise<{ [Key in Keys]: T[Key] }>;
}

export function createRegistry<T>(initial: Partial<T> = {}): Registry<T> {
  const registered = { ...initial };
  const pending: { [Key in keyof T]?: Promise<T[Key]> } = {};
  const resolvers: { [Key in keyof T]?: (value: T[Key]) => void } = {};

  function set<Key extends keyof T>(key: Key, value?: T[Key]): void {
    if (value === undefined) return unset(key);
    registered[key] = value;
    if (pending[key]) {
      resolvers[key]!(value);
      pending[key] = resolvers[key] = undefined;
    }
  }

  function unset(key: keyof T): void {
    delete registered[key];
  }

  function patch(members: Partial<T>): void {
    for (const key in members)
      if (members[key] !== undefined) set(key, members[key] as never);
  }

  function has(key: keyof T): boolean {
    return registered[key] !== undefined;
  }

  async function get<Key extends keyof T>(key: Key): Promise<T[Key]> {
    if (has(key)) return (registered as T)[key];
    return (pending[key] ??= new Promise<T[Key]>((resolve) => {
      resolvers[key] = resolve;
    })) as never;
  }

  async function all<Keys extends keyof T = keyof T>(
    keys: Keys[],
    additional?: boolean
  ): Promise<{ [Key in Keys]: T[Key] }> {
    const result: T = {} as never;
    for (const key of keys) result[key] = await get(key);
    if (additional)
      for (const key in registered)
        if (!keys.includes(key as never))
          result[key] = registered[key] as never;
    return result;
  }

  return { has, get, set, unset, patch, all };
}
