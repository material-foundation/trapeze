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
  Fragment,
  ComponentChildren,
  VNode,
  createElement,
  toChildArray,
} from 'preact';

import {
  useEffect,
} from 'preact/hooks';

import {
  Signal,
  signal,
  useSignal,
} from '@preact/signals';

export type Entry = Signal<{
  index: number,
  length: number,
}>;


// TypeScript gets mad if a component returns a primitive (string, number, list)
// therefore, we cast/wrap the return values of these components to placate
// TypeScript, even though they'd work without them.

export function Spotlight({
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

export function Build({ children }: { children: ComponentChildren }): VNode<unknown> {
  const list = toChildArray(children);
  const index = useTrapeze(list.length);

  return (
    <Fragment>
      { list.slice(0, index + 1) }
    </Fragment>
  );
}



export function useTrapeze(length: number) {
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
// Imagine a tree of components: `trunk`, `branch`, and `leafA`.  If each called
// `useTrapeze` and were directly added to the stack, it would be `
// [trunk, branch, leafA]`.  Then, when `next()` is called and `leafA` is
// replaced by `leafB` in the component tree, the stack would look like this: `
// [leafB, trunk, branch]`.  `leafB` is on the wrong end of the stack!
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
let queue: Array<Entry> = [];

function moveQueueToStack() {
  if (queue.length) {
    const currentStack = stack.value;
    // `queue` puts the newest at the end.  `stack` puts the newest at the
    // beginning.  This works around the inside-out ordering problem without
    // needing to manually reorder anything.
    stack.value = [
      ...queue,
      ...currentStack,
    ];
    queue = [];
  }
}

function addToStack(entry: Entry) {
  queue = [
    ...queue,
    entry,
  ];
  requestAnimationFrame(moveQueueToStack);
}

export function attachTrapezeToArrowKeys() {
  window.addEventListener(
    'keydown',
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowLeft':
          previous();
          break;

        case 'ArrowRight':
          next();
          break;
      }
    }
  );
}

let historyIndex: number;

export function attachTrapezeToHistory() {
  historyIndex = 0;
  updateHistoryIndex();

  window.addEventListener(
    'popstate',
    function onPopState() {
      // base-64 encode the URL to make it less tempting for manual mucking
      const incomingIndex = parseInt(atob(window.location.hash.substr(1)));

      if (incomingIndex > historyIndex) {
        next();

      } else if (incomingIndex < historyIndex) {
        previous();
      }
    }
  );
}

function updateHistoryIndex(increment = 0) {
  if (historyIndex !== undefined) {
    historyIndex += increment;
    window.location.hash = btoa(`${ historyIndex }`);
  }
}

export function next() {
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

export function previous() {
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
