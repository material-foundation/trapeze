import {
  ReadonlySignal
} from '@preact/signals';

import {
  createTrapeze,
} from './trapeze'


const sharedInstance = createTrapeze({
  updateHistoryIndex,
});

export  {
  type Entry,
  createTrapeze,
} from './trapeze'

export const {
  Spotlight,
  Build,
  useTrapeze,
  next,
  previous,
} = sharedInstance;

export const canPrevious: ReadonlySignal<boolean> = sharedInstance.canPrevious;
export const canNext: ReadonlySignal<boolean> = sharedInstance.canNext;


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
