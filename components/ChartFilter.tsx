import React, { useState } from "react";
import { GroupBy, DataContext } from "../context/data";
import Button from "./Button";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon as FA } from '@fortawesome/react-fontawesome';
import DatePicker from 'react-datepicker'
import styled from 'styled-components';
import { format } from "date-fns";


export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: row;
  button {
    border-radius: none;
    &:first-child {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }
    &:last-child {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
    }
  }
`

const InputGroup = styled.div`
  display: flex;
  flex-direction: row;
`

const InputField = styled.label`
  margin-right: 1rem;
  span {
    
    display: block;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  input {
    border-radius: 4px;
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    background-color: #fff;
    margin-bottom: 1rem;
  }
`

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.05);;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  svg {
    position: relative;
    height: 1rem;
    top: -0.25rem;
    display: inline;
    color: #718096;
  }
  p {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  small {
    font-style: italic;
    width: 65%;
    min-width: 300px;
    line-height: 1.5rem;

  }
`

const InfoCircle = ({tooltip}: {tooltip: string}) => <a data-tooltip-id="tooltipper" data-tooltip-content={tooltip}><FA icon={faCircleQuestion} /></a>

function TruncationDisclaimer({ groupedBy, at }: { groupedBy: GroupBy, at: Date }) {
  switch (groupedBy) {
    case "daily":
      return null
    case "weekly":
      return <small>This end date cause partial data, so graphs are truncated at end of {format(at, "yyyy-MM-dd")}</small>
    case "monthly":
      return <small>This end date cause partial data, so graphs are truncated at end of {format(at, 'MM/yyyy')}</small>
    case "quarterly":
      return <small>This end date cause partial data, so graphs are truncated at end of {format(at, 'QQQ, yyyy')}</small>
    case "yearly":
      return <small>This end date cause partial data, so graphs are truncated at end of {format(at, 'yyyy')}</small>
  }
}

function getDatePickerProps (groupBy: GroupBy) {
  switch (groupBy) {
    case "daily":
      return {
        dateFormat: "yyyy-MM-dd"
      }
    case "weekly":
      return {
        showWeekNumbers: true,
        dateFormat: "yyyy-MM-dd"
      }
    case "monthly":
      return {
        dateFormat:"MM/yyyy",
        showMonthYearPicker: true
      }
    case "quarterly":
      return {
        dateFormat:"QQQ, yyyy",
        showQuarterYearPicker: true
      }
    case "yearly":
      return {
        showYearPicker: true,
        dateFormat: "yyyy"
      }
  }
}

export default function ChartFilter(props: {updateSelection: (key: GroupBy) => void}) {

  const { setGroupBy, dateRange, setDateRange, groupBy, isTruncated, meta } = React.useContext(DataContext);

  const [startDate, endDate] = dateRange;
    
    return <Controls>
    <InputGroup>
      <InputField>
        <span>Show data from</span>
        <DatePicker {...getDatePickerProps(groupBy)} selected={startDate} minDate={new Date(meta.start)} maxDate={endDate} onChange={(date) => setDateRange([ date, endDate ])} />
      </InputField>
      <InputField>
        <span>Show data to</span>
        <DatePicker {...getDatePickerProps(groupBy)} selected={endDate} minDate={startDate} maxDate={new Date(meta.end)} onChange={(date) => setDateRange([ startDate, date ])} />
      </InputField>
    </InputGroup>
    
    <p>Group data by dates <InfoCircle tooltip="Shorter intervals = more data points to show / slower website." /></p>
    <ButtonGroup>
      <Button onClick={() => setGroupBy('daily')} className={ (groupBy === 'daily' ? 'selected ': '')}>Day</Button>
      <Button onClick={() => setGroupBy('weekly')} className={ (groupBy === 'weekly' ? 'selected ': '')}>Week</Button>
      <Button onClick={() => setGroupBy('monthly')} className={ (groupBy === 'monthly' ? 'selected ': '')}>Month</Button>
      <Button onClick={() => setGroupBy('quarterly')} className={ (groupBy === 'quarterly' ? 'selected ': '')}>Quarter</Button>
      <Button onClick={() => setGroupBy('yearly')} className={ (groupBy === 'yearly' ? 'selected ': '')}>Year</Button>
    </ButtonGroup>
    {
      isTruncated && <TruncationDisclaimer groupedBy={groupBy} at={isTruncated} />
    }
  </Controls>
}