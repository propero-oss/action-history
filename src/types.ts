export type AnyObject = Record<string, unknown>;
export type HasRequiredMembers<T, Then = true, Else = false> = Record<
  string,
  unknown
> extends T
  ? Then
  : Else;
export type RequiredKeys<T> = Exclude<
  {
    [Key in keyof T]: T extends Record<Key, T[Key]> ? Key : never;
  }[keyof T],
  undefined
>;

export type Action<Parameters = AnyObject, Context = AnyObject> = (
  parameters: Parameters,
  context: Context
) => Promise<void>;
export type ReversibleAction<Parameters = AnyObject, Context = AnyObject> = (
  parameters: Parameters,
  context: Context
) => Promise<() => Promise<void>>;

export interface ActionMeta<
  Parameters extends AnyObject = AnyObject,
  Context extends AnyObject = AnyObject,
  Reversible extends boolean = true
> {
  parameters?: Parameters;
  context?: Context;
  reversible?: Reversible;
}

export interface HistoryMeta
  extends Record<string, ActionMeta<AnyObject, AnyObject, boolean>> {
  "history:undo": {
    parameters: { steps?: number };
    reversible: false;
  };
  "history:redo": {
    parameters: { steps?: number };
    reversible: false;
  };
}

export type HistoryAction<
  Actions extends HistoryMeta,
  Key extends keyof Actions
> = ActionReversible<Actions, Key> extends false
  ? ExtractAction<Actions, Key>
  : ExtractReversibleAction<Actions, Key>;

export type ActionReversible<
  Actions extends HistoryMeta,
  Key extends keyof Actions
> = Actions[Key]["reversible"];
export type ActionParameters<
  Actions extends HistoryMeta,
  Key extends keyof Actions
> = Actions[Key]["parameters"];
export type ActionContext<
  Actions extends HistoryMeta,
  Key extends keyof Actions
> = Actions[Key]["context"];
export type ExtractAction<
  Actions extends HistoryMeta,
  Key extends keyof Actions
> = Action<ActionParameters<Actions, Key>, ActionContext<Actions, Key>>;
export type ExtractReversibleAction<
  Actions extends HistoryMeta,
  Key extends keyof Actions
> = ReversibleAction<
  ActionParameters<Actions, Key>,
  ActionContext<Actions, Key>
>;

export interface HistoryEntry<
  Actions extends HistoryMeta,
  Key extends keyof Actions = keyof Actions
> {
  name: Key;
  parameters: ActionParameters<Actions, Key>;
  context: ActionContext<Actions, Key>;
  action: HistoryAction<Actions, Key>;
  time: Date;
  undo?: () => Promise<void>;
}

export type HistoryExecParams<
  Actions extends HistoryMeta,
  Key extends keyof Actions
> = HasRequiredMembers<
  ActionParameters<Actions, Key>,
  [parameters: ActionParameters<Actions, Key>],
  [parameters?: ActionParameters<Actions, Key>]
>;

export type HistoryExecParam<
  Actions extends HistoryMeta,
  Key extends keyof Actions
> = HasRequiredMembers<
  ActionParameters<Actions, Key>,
  ActionParameters<Actions, Key>,
  ActionParameters<Actions, Key> | undefined
>;

export type HistoryActionRegistry<Actions extends HistoryMeta> = {
  [Key in keyof Actions]: {
    action: HistoryAction<Actions, Key>;
    required: RequiredKeys<ActionContext<Actions, Key>>[];
  };
};

export type HistoryContextRegistry<Actions extends HistoryMeta> = Partial<
  ActionContext<Actions, keyof Actions>
>;

export type HistoryLog<Actions extends HistoryMeta> = Pick<
  HistoryEntry<Actions>,
  "name" | "context" | "parameters" | "time"
>;

export interface History<Actions extends HistoryMeta> {
  action<Key extends keyof Actions>(
    name: Key,
    action: HistoryAction<Actions, Key>,
    context?: RequiredKeys<ActionContext<Actions, Key>>[]
  ): void;

  context<Key extends keyof ActionContext<Actions, keyof Actions>>(
    name: Key,
    value: ActionContext<Actions, keyof Actions>[Key]
  ): void;

  exec: <Key extends keyof Actions>(
    name: Key,
    ...params: HistoryExecParams<Actions, Key>
  ) => Promise<void>;

  undo(steps?: number): Promise<void>;
  redo(steps?: number): Promise<void>;

  last(steps: number): HistoryLog<Actions>[];
  lastUndone(steps: number): HistoryLog<Actions>[];
}
