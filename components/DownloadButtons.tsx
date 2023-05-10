import styled from 'styled-components';
import Button, { LinkButton } from './Button';
import { faCircleDown, faCircleQuestion, faSave } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon as FA } from '@fortawesome/react-fontawesome';

const LinkGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  /* display: grid; */
  /* grid-template-columns: repeat(3, 1fr); */
  /* gap: 10px; */
  /* grid-auto-rows: minmax(100px, auto); */
  svg {
    height: 1rem;
    margin-right: 0.5rem;
  }
  a {
    padding: 0.5rem 1.5rem;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    margin: 0.5rem;
    span {
      text-decoration: center;
      &:last-child {
        padding-left: 0.5rem;
        border-left: 1px solid rgba(0, 0, 0, 0.6);
      }
    }
  }
`

export function DownloadAggregates() {
  return <LinkGroup>
  <DownloadButton filename='total_count.csv' size={"70kb"} />
  <DownloadButton filename='piningData_combined.csv' size={"87kb"} />
  <DownloadButton filename='piningData_separate.csv' size={"218kb"} />
</LinkGroup>
}
export function DownloadSupplements() {
  return <LinkGroup>
  <DownloadButton filename='comparativeData_combined.csv' size={"75kb"} />
  <DownloadButton filename='comparativeData_separate.csv' size={"164kb"} />
</LinkGroup>
}
export function DownloadQueerness() {
  return <LinkGroup>
    <DownloadButton filename='acenessData_combined.csv' size={"114kb"} />
    <DownloadButton filename='acenessData_separate.csv' size={"202kb"} />
    <DownloadButton filename='gaynessData_combined.csv' size={"124kb"} />
    <DownloadButton filename='gaynessData_separate.csv' size={"451kb"} />
    <DownloadButton filename='polysexynessData_combined.csv' size={"75kb"} />
    <DownloadButton filename='polysexynessData_separate.csv' size={"164kb"} />
    <DownloadButton filename='straightnessData_combined.csv' size={"79kb"} />
    <DownloadButton filename='straightnessData_separate.csv' size={"174kb"} />
  </LinkGroup>
}

function DownloadButton({filename, size}: {filename: string, size: string}) {
  return <LinkButton href={filename} download >
      <span><FA icon={faCircleDown} /></span>
      <span>data/{filename}<br/><small>{size}</small></span>
    </LinkButton>
}