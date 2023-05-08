import { AnchorHTMLAttributes } from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
    font-size: 1rem !important;
    background-color: #3182ce;
    color: #fff;
    border-radius: 4px;
    &.inline {
      display: inline-block;
      margin: 0 0.5rem;
    }
    &.small {
      font-size: 0.8rem !important;
      padding: 0.1rem 0.5rem !important;
    }
    &:hover {
      background-color: #2c5282;
    }
    &.selected {
      background-color: #2c5282;
    }
`

const StyledAnchor = styled.a`
  display: block;
    font-size: 1rem !important;
    background-color: #3182ce;
    color: #fff;
    border-radius: 4px;
    &.inline {
      display: inline-block;
      margin: 0 0.5rem;
    }
    &:hover {
      background-color: #2c5282;
    }
    &.selected {
      background-color: #2c5282;
    }
`

export default function Button({className, ...props}: Omit<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, 'ref'>) {
  return <StyledButton {...props} className={(className ?? '') + " nx-font-bold nx-py-1 nx-px-2 "}  />
}

export function LinkButton({className, ...props}: Omit<React.DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>, 'ref'>) {
  return <StyledAnchor {...props} className={(className ?? '') + " nx-font-bold nx-py-1 nx-px-2 "}  />
}