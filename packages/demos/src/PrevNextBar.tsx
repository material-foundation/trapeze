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
} from 'preact';

import {
  Signal,
} from '@preact/signals';

import {
  Block,
  JsxstyleProps,
  Row,
} from 'jsxstyle/preact';

import {
  next,
  previous,
} from 'trapeze';

type PrevNextBarProps = {
  prevIsEnabled?: boolean | Signal<boolean>,
  nextIsEnabled?: boolean | Signal<boolean>,
  nextIsEmphasized?: boolean,
  onNextClick?: () => void,
};
export const PrevNextBar = ({
  prevIsEnabled = true,
  nextIsEnabled = true,
  nextIsEmphasized = true,
  onNextClick,
}: PrevNextBarProps) => (
  <Row
    width = '100%'
    border = '1px solid #CCCCCC'
  >
    <NavButton
      width = '50%'
      borderRight = '1px solid #CCCCCC'
      enabled = { prevIsEnabled }
      fontStyle = {
        prevIsEnabled
          ? 'italic'
          : ''
      }
      onClick = { previous }
    >
      previous
    </NavButton>
    <NavButton
      width = '50%'
      fontWeight = {
        nextIsEmphasized
          ? 500
          : 400
      }
      enabled = { nextIsEnabled }
      onClick = {
        () => {
          if (onNextClick) {
            onNextClick();
          }
          next();
        }
      }
    >
      next
    </NavButton>
  </Row>
);
export const PageWithPrevNextBar = ({
  children,
  ...prevNextBarProps
}: {
  children: ComponentChildren,
} & PrevNextBarProps) => (
  <Block
    maxHeight = '100vh'
    overflow = 'scroll'
    paddingBottom = { 60 } // Prevent iOS toolbar from intercepting the tap
  >
    <Block
      padding = { 16 }
    >
      { children }
    </Block>
    <PrevNextBar
      { ...prevNextBarProps }
    />
  </Block>
);
export const NavButton = ({
  onClick,
  enabled = true,
  ...props
}: {
  enabled?: boolean | Signal<boolean>,
  onClick?: () => void,
} & JsxstyleProps<{}>) => (
  <Row
    minHeight = { 48 }
    alignItems = 'center'
    justifyContent = 'center'
    opacity = {
      enabled
        ? 1
        : .5
    }
    cursor = {
      enabled
        ? 'pointer'
        : 'not-allowed'
    }
    props = {
      {
        onClick() {
          if (((enabled as Signal<boolean>).value ?? enabled as boolean) && onClick) {
            onClick();
          }
        }
      }
    }
    { ...props }
  />
);
