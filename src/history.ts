import { createRegistry } from "src/registry";
import {
  ActionContext,
  History,
  HistoryAction,
  HistoryActionRegistry,
  HistoryContextRegistry,
  HistoryEntry,
  HistoryExecParam,
  HistoryLog,
  HistoryMeta,
  RequiredKeys,
} from "src/types";

export interface HistoryOptions {
  limit?: number;
}

export function createHistory<Actions extends HistoryMeta = HistoryMeta>({
  limit = 10000,
}: HistoryOptions = {}): History<Actions> {
  const contextRegistry = createRegistry<HistoryContextRegistry<Actions>>();
  const handlerRegistry = createRegistry<HistoryActionRegistry<Actions>>();

  const done: HistoryEntry<Actions>[] = [];
  const undone: HistoryEntry<Actions>[] = [];

  async function run<Key extends keyof Actions>(
    entry: Omit<HistoryEntry<Actions, Key>, "time">,
    resetUndone?: boolean
  ): Promise<void> {
    entry.undo = (await entry.action(entry.parameters, entry.context)) as never;
    (entry as HistoryEntry<Actions, Key>).time = new Date();
    if (entry.undo) {
      if (resetUndone) undone.slice(0, undone.length);
      done.unshift(entry as never);
      if (done.length > limit) done.splice(limit, done.length - limit);
    }
  }

  async function undo(steps = 1) {
    while (steps--) {
      if (!done.length) return;
      const entry = done[0];
      await entry.undo!();
      entry.time = new Date();
      done.splice(0, 1);
      undone.unshift(entry);
    }
  }

  async function redo(steps = 1) {
    while (steps--) {
      if (!undone.length) return;
      const entry = undone[0];
      await run(entry, false);
      entry.time = new Date();
      undone.splice(0, 1);
    }
  }

  async function exec<Key extends keyof Actions>(
    name: Key,
    parameters: HistoryExecParam<Actions, Key> = {}
  ): Promise<void> {
    const { action, required } = await handlerRegistry.get(name);
    const context = await contextRegistry.all(required as never, true);
    await run({ name, parameters, context, action });
  }

  function action<Key extends keyof Actions>(
    name: Key,
    action: HistoryAction<Actions, Key>,
    required: RequiredKeys<ActionContext<Actions, Key>>[] = []
  ) {
    handlerRegistry.set(name, { action, required });
  }

  function entryToLog({
    name,
    parameters,
    context,
    time,
  }: HistoryEntry<Actions>): HistoryLog<Actions> {
    return {
      name,
      parameters: { ...parameters },
      context: { ...context },
      time: new Date(time),
    };
  }

  function last(steps: number): HistoryLog<Actions>[] {
    return done.slice(0, steps).map(entryToLog);
  }

  function lastUndone(steps: number): HistoryLog<Actions>[] {
    return undone.slice(0, steps).map(entryToLog);
  }

  const context = contextRegistry.set;

  action("history:undo", ({ steps }) => undo(steps) as never);
  action("history:redo", ({ steps }) => redo(steps) as never);

  return { action, context, exec, undo, redo, last, lastUndone };
}
