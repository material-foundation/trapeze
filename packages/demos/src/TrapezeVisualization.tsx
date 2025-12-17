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
  cloneElement,
  toChildArray,
  VNode,
} from 'preact';

import {
  useEffect,
} from 'preact/hooks';

import {
  Block,
  Col,
  Row,
} from '@jsxstyle/preact';

import {
  next,
  previous,
  useTrapeze,
} from 'trapeze';

export function AutoAdvancingTrapezeVisualization() {
  useEffect(
    () => {
      let nextStep = 0;
      let previousStep = 0;
      let advance = next;

      const interval = setInterval(
        () => {
          if (nextStep >= 14) {
            advance = previous;
            nextStep = 0;
          }

          if (previousStep >= 9) {
            advance = next;
            previousStep = 0;
          }

          if (advance === next) {
            nextStep++;
          } else {
            previousStep++;
          }
          advance();
        },
        333
      );

      return () => {
        clearInterval(interval);
      }
    },
    []
  );

  return (
    <TrapezeVisualization />
  );
}

export function TrapezeVisualization() {
  return (
    <Block
      position = 'relative'
      minHeight = { 516 }
    >
      <Piece isActive = { true }>
        <Piece rotation = { 50 }>
          <Piece rotation = { 30 } />
          <Piece rotation = { 15 } />
          <Piece rotation = { 0 } />
        </Piece>

        <Piece rotation = { 35 } />
        <Piece rotation = { 20 } />

        <Piece rotation = { 5 }>
          <Piece rotation = { 15 } />
          <Piece rotation = { 0 } />
          <Piece rotation = { -15 } />
        </Piece>

        <Piece rotation = { -10 } />

        <Piece rotation = { -25 }>
          <Piece rotation = { 0 } />
          <Piece rotation = { -20 } />
        </Piece>

        <Piece rotation = { -50 }>
          <Piece rotation = { 0 } />
          <Piece rotation = { -20 } />
          <Piece rotation = { -40 } />
          <Piece rotation = { -60 } />
        </Piece>
      </Piece>
    </Block>
  );
}

const JOINT_RADIUS = 28;
const PIECE_WIDTH = 16;
const PIECE_HEIGHT = 140;
const PIECE_OFFSET_Y = -8;
const CHILDREN_OFFSET_Y = -4;

const INACTIVE_COLOR = '#BDC1C6';
const ACTIVE_JOINT_COLOR = '#FCC934';
const INACTIVE_JOINT_COLOR = '#DADCE0';
const BRANCH_COLOR = '#1E8E3E';
const LEAF_COLOR = '#EA4335';

type PieceProps =  {
  children?: ComponentChildren,
  level?: number,
  isActive?: boolean,
  activeIndex?: number,
  rotation?: number,
  translateX?: number,
};

// In a paginated experience like a deck, the first frame would contain
// `useTrapeze` calls from all the components on the first slide.  Future slides
// wouldn't call `useTrapeze` until they are rendered.
//
// This visualization simulates that call order by only calling `useTrapeze`
// when a piece is active.  Since hooks can't be called conditionally,
// `ActivePiece` is a wrapper that calls `useTrapeze` and passes the result
// through to the undifferentiated `Piece`.
//
// When `ActivePiece` is unmounted, Preact forgets its hooks.  This ensures that
// when a piece becomes active again, it get a fresh instance with a fresh
// state.
function ActivePiece(props: PieceProps) {
  const childrenCount = toChildArray(props.children).length;
  const activeIndex = useTrapeze(childrenCount);

  return (
    <Piece
      { ...props }
      activeIndex = { activeIndex }
    />
  );
}

function Piece({
  children,
  level = 0,
  isActive = false,
  activeIndex = undefined,
  rotation = 0,
  translateX = 0,
}: PieceProps) {
  if (isActive && activeIndex === undefined) {
    return (
      <ActivePiece
        { ...arguments[0] }
      />
    );
  }

  const childrenCount = toChildArray(children).length;

  return (
    <Col
      position = 'absolute'
      left = { PIECE_WIDTH / -2 }
      top = { 0 }
      alignItems = 'center'
      transformOrigin = { `50% ${ -JOINT_RADIUS  }px` }
      transform = { `rotate(${ rotation }deg)` }
      zIndex = { isActive ? 10 : 0 }
    >
      <Block
        width = { PIECE_WIDTH }
        height = { PIECE_HEIGHT }
        backgroundColor = {
          isActive
            ? childrenCount
              ? BRANCH_COLOR
              : LEAF_COLOR
            : INACTIVE_COLOR
        }
        opacity = { level === 0 ? 0 : 1 }
      />

      <Col
        position = 'absolute'
        left = { -JOINT_RADIUS + PIECE_WIDTH / 2 }
        top = { PIECE_HEIGHT + PIECE_OFFSET_Y }
        justifyContent = 'center'
        alignItems = 'center'
        backgroundColor = {
          isActive
            ? ACTIVE_JOINT_COLOR
            : INACTIVE_JOINT_COLOR
        }
        width = { 2 * JOINT_RADIUS }
        height = { 2 * JOINT_RADIUS }
        borderRadius = { JOINT_RADIUS }
        fontFamily = 'Roboto'
        fontSize = { 18 }
        zIndex = { 100 }
        visibility = {
          childrenCount
            ? 'visible'
            : 'hidden'
        }
      >
        {
          isActive
            ? activeIndex
            : ''
        }
      </Col>

      <Row
        position = 'absolute'
        top = { PIECE_HEIGHT + 2 * JOINT_RADIUS + PIECE_OFFSET_Y + CHILDREN_OFFSET_Y }
        zIndex = { 0 }
      >
        {
          toChildArray(children).map(
            (child: VNode<any>, index) => cloneElement(
              child,
              {
                level: level + 1,
                isActive: isActive && index === activeIndex,
              }
            )
          )
        }
      </Row>
    </Col>
  )
}
