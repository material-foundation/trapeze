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
} from 'preact';

import {
  Block,
  Col,
  InlineBlock,
  JsxstyleComponentStyleProps,
  Row,
} from '@jsxstyle/preact';

import {
  Build,
  Spotlight,
  attachTrapezeToArrowKeys,
  attachTrapezeToHistory,
  canPrevious,
  canNext,
  useTrapeze,
} from 'trapeze';

import {
  PrevNextBar,
} from './PrevNextBar';

import {
  TrapezeVisualization,
} from './TrapezeVisualization';

attachTrapezeToHistory();
attachTrapezeToArrowKeys();

export function Main() {
  return (
    <Col
      width = '100vw'
      height = '100vh'
      // justifyContent = 'center'
      alignItems = 'center'
    >
      <Block
        width = { 600 }
        height = { 600 }
        padding = { 16 }
        lineHeight = '24px'
        fontSize = { 16 }
      >
        <Spotlight>
          <Block>
            These slides are in a <CodeInline>{`<Spotlight>`}</CodeInline>.
            Click the buttons below to move through them.
          </Block>

          <Block>
            This one uses <CodeInline>{`<Build>`}</CodeInline>.

            <ol>
              <Build>
                <li>
                  First, this appears,
                </li>
                <li>
                  and then this,
                </li>
                <li>
                  and this is the last one.
                </li>
              </Build>
            </ol>
          </Block>

          <Block>
            Note: Navigation in Trapeze is not symmetric.  If
            <CodeInline>previous()</CodeInline>causes<CodeInline>useTrapeze(…)</CodeInline>
            to be called, it will be initialized at<CodeInline>0</CodeInline>.
            <p>
              Notice that if you go back now, the previous slide starts with the
              first bullet.  If you go back twice, you'll be on the first slide.
            </p>
          </Block>

          <Counter />

          <Block>
            This visualization demonstrates the nested nature of Trapeze.

            <p>
              Notice how each call to
              <CodeInline>next()</CodeInline>or<CodeInline>previous()</CodeInline>
              walks through the active leaves, only incrementing the outer
              Trapeze when an inner one runs out of children.
            </p>

            <p>
              Also notice that each Trapeze is always initialized
              at<CodeInline>0</CodeInline>.  Therefore, it takes
              14<CodeInline>next()</CodeInline>calls to get to the end, but only
              9<CodeInline>previous()</CodeInline>calls to get back to the
              beginning.
            </p>

            <Col
              alignItems = 'center'
            >
              <TrapezeVisualization />
            </Col>
          </Block>
        </Spotlight>
      </Block>
      <Block
        position = 'fixed'
        bottom = { 0 }
        width = '100vw'
      >
        <PrevNextBar
          nextIsEnabled = { canNext }
          prevIsEnabled = { canPrevious }
        />
      </Block>
    </Col>
  )
}

function Counter() {
  const length = 3;
  const index = useTrapeze(length);

  return (
    <Block>
      This component calls
      <CodeBlock padding = { 8 }>
        {`const index = useTrapeze(${ length });`}
      </CodeBlock>

      <CodeInline>index</CodeInline> is currently <CodeInline>{ index }</CodeInline>.  Click the next and previous buttons to change the value of <CodeInline>index</CodeInline>.
    </Block>
  );
}

const CodeBlock = ({ children, ...props }: { children: ComponentChildren } & JsxstyleComponentStyleProps) => (
  <Block component = 'pre'
    { ...props }
  >
    <code>
      { children }
    </code>
  </Block>
);

const CodeInline = ({ children, ...props }: { children: ComponentChildren } & JsxstyleComponentStyleProps) => (
  <Fragment>
    &nbsp;<InlineBlock component = 'code'
      fontWeight = 'bold'
      { ...props }
    >
      { children }
    </InlineBlock>&nbsp;
  </Fragment>
);
