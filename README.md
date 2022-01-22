# Action History

[![Maintainability](---)](https://codeclimate.com/github/propero-oss/action-history/maintainability)
[![Test Coverage](---)](https://codeclimate.com/github/propero-oss/action-history/test_coverage)

```shell
npm i @propero/action-history
```
```shell
yarn add @propero/action-history
```
```shell
pnpm i @propero/action-history
```

## Documentation

*In progress... maybe... hopefully... within the next decade or so... no guarantees though!*


## Example
```typescript
import { createHistory, HistoryMeta } from "@propero/action-history";

// interface for type safety inside handlers, calls, etc.
// can later be augmented for extensibility
interface Events extends HistoryMeta {
  "myapp:myaction": {
    parameters: { param?: number },
    context: { context: number },
  },
  "myapp:otheraction": {
    reversible: false,
  },
  "myapp:lateaction": {
    context: { latecontext: number },
  }
}

const history = createHistory<Events>();

history.context({ context: 2 });

let myNumber = 0;

history.action("myapp:myaction", async ({ param = 5 }, { context }) => {
  const previous = myNumber;
  myNumber += param;
  myNumber /= context;
  return async () => {
    myNumber = previous;
  };
});

history.action("myapp:otheraction", async () => {
  console.log("other action");
});

await history.exec("myapp:myaction", { param: 2 });
// myNumber = (0 + 2) / 2 = 1
await history.exec("myapp:otheraction");
// myNumber unchanged
await history.exec("myapp:myaction");
// myNumber = (1 + 5) / 2 = 3

await history.exec("history:undo", { steps: 2 });
// myNumber = 0
await history.exec("history:redo");
// myNumber = 1

const actionPromise = history.exec("myapp:lateaction");
// actionPromise waits for action to be registered

history.action("myapp:lateaction", ({}, { latecontext }) => {
  myNumber *= latecontext;
  () => myNumber /= latecontext;
}, ["latecontext"]);
// actionPromise waits for dependent context to be defined

history.context({ latecontext: 10 });
// action is executed

await actionPromise;
// myNumber = 1 * 10 = 10
```
