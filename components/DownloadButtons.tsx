import styled from 'styled-components';
import Button, { LinkButton } from './Button';

const LinkGroup = styled.div`
  display: flex;
  flex-direction: row;
  a {
    margin: 0.5rem;
  }
`


export default function DownloadButtons () {
  return <LinkGroup>
    <LinkButton href='/totalData.csv' download >Download totalData.csv</LinkButton>
    <LinkButton href='/combinedTagData.csv' download >Download combinedTagData.csv</LinkButton>
    <LinkButton href='/tagData.csv' download >Download tagData.csv</LinkButton>
    <LinkButton href='/relatedTagData.csv' download >Download relatedTagData.csv</LinkButton>
  </LinkGroup>
}