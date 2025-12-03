/** @license
 *  Copyright 2019 - present The Trapeze Authors. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not
 *  use this file except in compliance with the License. You may obtain a copy
 *  of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations
 *  under the License.
 */

import {
  ComponentChildren,
  Fragment,
  VNode,
  toChildArray,
} from 'preact';

import {
  useEffect,
} from 'preact/hooks';

import {
  ReadonlySignal,
  Signal,
  computed,
  signal,
  useSignal,
} from '@preact/signals';

export type Entry = Signal<{
  index: number,
  length: number,
}>;

// Trapeze was originally designed so `next` and `previous` could walk across an
// arbitrarily nested shared stack.  Sharing the stack was what enabled a single
// set of nav buttons to page through an unknown component tree.
//
// We've since realized the need to have multiple trapeze stacks be siblings on
// a single page.  To support this use case without breaking the primary one,
// everything that closes over the stack is now wrapped in `createTrapeze`,
// giving them a shared namespace.  To support the original API, where
// everything controlled a common stack, we create a single shared instance in
// `index` and export its closures.  Situations that call for multiple parallel
// stacks can instantiate them with `createTrapeze`.

export function createTrapeze({
  updateHistoryIndex = (increment) => {}
}: {
  updateHistoryIndex?: (increment: number) => void,
} = {}) {
  // TypeScript gets mad if a component returns a primitive (string, number,
  // list) therefore, we cast/wrap the return values of these components to
  // placate TypeScript, even though they'd work without them.

  function Spotlight({
    resetScrollPositionOnChange,
    children,
  }: {
    resetScrollPositionOnChange?: boolean,
    children: ComponentChildren,
  }): VNode<unknown> {
    const list = toChildArray(children);
    const index = useTrapeze(list.length);

    useEffect(
      () => {
        if (resetScrollPositionOnChange) {
          window.scroll(0, 0);
        }
      },
      [index]
    );

    return list[index] as VNode<unknown>;
  }

  function Build({ children }: { children: ComponentChildren }): VNode<unknown> {
    const list = toChildArray(children);
    const index = useTrapeze(list.length);

    return (
      <Fragment>
        { list.slice(0, index + 1) }
      </Fragment>
    );
  }



  function useTrapeze(length: number) {
    const entry = useSignal({
      index: 0,
      length,
    });

    // Keep length current, e.g. if Spotlight gets more children
    if (length !== entry.value.length) {
      entry.value = {
        ...entry.value,
        length,
      }
    }

    useEffect(
      () => {
        addToStack(entry);
      },
      []
    );

    return entry.value.index;
  }

  // In React/Preact, the `useEffect` calls in children are run before those in
  // their parents.
  //
  // Imagine a tree of components: `trunk`, `branch`, and `leafA`.  If each
  // called `useTrapeze` and were directly added to the stack, it would be `
  // [trunk, branch, leafA]`.  Then, when `next()` is called and `leafA` is
  // replaced by `leafB` in the component tree, the stack would look like this:
  // `[leafB, trunk, branch]`.  `leafB` is on the wrong end of the stack!
  //
  // The solution to this problem is to use a queue.  Instead of being added to
  // the stack directly, `useTrapeze` calls are queued while we wait for all the
  // other `useTrapeze` calls from this frame to be made.  Then, they are put on
  // the stack in LIFO order.  This gives you `[leafA, branch, trunk]` for the
  // first tree and then `[leafB, branch, trunk]` later on.  The leaves are put
  // on the same side of the stack, regardless of if there were other
  // `useTrapeze` calls in a frame.
  //
  // `queue` is merged into `stack` one frame after rendering, as well as if
  // `next` or `previous` is called.  Hopefully this is sufficient.

  const stack: Signal<Array<Entry>> = signal([]);
  const queue: Signal<Array<Entry>> = signal([]);

  // queue was originally a plain [].  Refactoring Trapeze into
  // createTrapeze+sharedInstance worked from `vite serve`, but was throwing
  // `Cannot read properties of undefined (reading '__H')` after being processed
  // by `vite build`.  Gemini suggested that wrapping `queue` in `signal` would
  // ensure that Vite's optimizations don't break Trapeze, and indeed, that
  // seems to be true.

  function moveQueueToStack() {
    if (queue.value.length) {
      const currentStack = stack.value;
      // `queue` puts the newest at the end.  `stack` puts the newest at the
      // beginning.  This works around the inside-out ordering problem without
      // needing to manually reorder anything.
      stack.value = [
        ...queue.value,
        ...currentStack,
      ];
      queue.value = [];
    }
  }

  function addToStack(entry: Entry) {
    queue.value = [
      ...queue.value,
      entry,
    ];
    requestAnimationFrame(moveQueueToStack);
  }

  function next() {
    moveQueueToStack();

    const currentStack = stack.value;
    const entry = currentStack[0];

    const {
      index,
      length,
    } = entry.value;

    if (index < length - 1) {
      entry.value = {
        index: index + 1,
        length
      };

    } else if (currentStack.length > 1) {
      stack.value = currentStack.slice(1);
      next();
    }

    updateHistoryIndex(+1);
  }

  function previous() {
    moveQueueToStack();

    const currentStack = stack.value;
    const entry = currentStack[0];

    const {
      index,
      length,
    } = entry.value;

    if (index > 0) {
      entry.value = {
        index: index - 1,
        length
      };

    } else if (currentStack.length > 1) {
      stack.value = currentStack.slice(1);
      previous();
    }

    updateHistoryIndex(-1);
  }

  const canPrevious: ReadonlySignal<boolean> = computed(
    () => {
      const currentStack = stack.value;

      for (let i = 0; i < currentStack.length; i++) {
        const {
          index,
        } = currentStack[i].value;

        if (index > 0) {
          return true;
        }
      }
      return false;
    }
  );

  const canNext: ReadonlySignal<boolean> = computed(
    () => {
      const currentStack = stack.value;

      for (let i = 0; i < currentStack.length; i++) {
        const {
          index,
          length,
        } = currentStack[i].value;

        if (index < length - 1) {
          return true;
        }
      }
      return false;
    }
  );

  return {
    Spotlight,
    Build,
    useTrapeze,
    next,
    previous,
    canPrevious,
    canNext,
  }
}
