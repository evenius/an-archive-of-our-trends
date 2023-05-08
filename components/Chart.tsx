import React, { CSSProperties, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import works from '../pages/works.json';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineController,
  Colors,
  LineElement,
  Title,
  Tooltip,
  PointElement,
  Legend,
  TimeScale,
  DateAdapter,
} from 'chart.js';
import { startOfWeek, startOfMonth, startOfQuarter, startOfYear, format, addWeeks } from 'date-fns'
import styled from 'styled-components';

import 'chartjs-adapter-date-fns';
import Button from './Button';
import { nform } from './contextual';

ChartJS.register(
  Tooltip,
  Colors,
  TimeScale,
  LineController,
  CategoryScale,
  LineElement,
  LinearScale,
  PointElement,
  Legend
);

export const DataContext = React.createContext<ReturnType<typeof useChartData>>(null);

export function DataContextProvider(props: {children: React.ReactNode}) {
  let data = useChartData();
  return <DataContext.Provider value={data}>
    {props.children}
  </DataContext.Provider>
}

type GroupBy = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const defaultGroupBy = 'quarterly';
function getGroupByFn (groupBy: GroupBy) {
  switch(groupBy) {
    case 'daily':
      return (d: Date) => d;
    case 'weekly':
      return startOfWeek;
    case 'monthly':
      return startOfMonth;
    case 'quarterly':
      return startOfQuarter;
    case 'yearly':
      return startOfYear;
  }
}
let bla = 'rgb(75, 192, 192)';
function createParser (groupBy: GroupBy, meta: typeof works['_meta']) {
  const startOf = getGroupByFn(groupBy)
  const cutoff = startOf(new Date(meta.end)).getTime();
  
  return (label: string, work: Array<[string, number]>, color: string, alg: 'sum' | 'avg' = 'sum') => {
    const dateGroups = work
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .reduce((dateGroups, [date, value]) => {
  
        const aggDate = startOf(new Date(date)).getTime();

        if(aggDate >= cutoff) {
          return dateGroups;
        }

        const { count, sum } = dateGroups.get(aggDate) ?? {count: 0, sum: 0};
  
        dateGroups.set(aggDate, {
          count: count + 1,
          sum: sum + value,
        });
  
        return dateGroups;
      }, new Map<number, { count: number, sum: number }>())
  
      let data = (alg === 'sum') ?
        Array.from(dateGroups.entries()).map(([date, value]) => ({ x: date, y: value.sum})) :
        Array.from(dateGroups.entries()).map(([date, value]) => ({ x: date, y: (value.sum / value.count)}))
  
      return {
        data,
        label,
        borderColor: color ? color : undefined,
        tension: 0.5,
      }
  }
}


const piningColors = [
  '#FA5246',
  '#F551CE',
  '#C73EDE',
  '#AF46FA',
  '#DE3E69',
]
// '#a71544'

const comparisonColors = [
  '#44D3EB',
  '#288A7D',
  '#4BDEA1',
  '#47F57B',
  '#44EB47',
]

function useChartData(initialGroupBy: GroupBy = defaultGroupBy) {

  const [ groupBy, setGroupBy ] = useState<GroupBy>(initialGroupBy)
  const [ selectedSets, setDataSets ] = useState<Array<'grandTotal' | 'setTotal' | 'tagSets'>>(['tagSets'])

  let renderData = useMemo(() => {
    const { _meta, _totals, _totalGrowth, piningData, comparisonTags,  }  = works
    const {
      _relativeToTotal,
      _summed,
      ...tags
    } = piningData

    const {
      _relativeToTotal: _compRelative,
      _summed: _compSummed,
      ...compTags
    } = comparisonTags
    
    const keys = Object.keys(tags);
    const compKeys = Object.keys(compTags);

    const parseDataSet = createParser(groupBy, _meta)
    
    
    const grandTotal = parseDataSet("Total works - Ao3", _totals as Array<[string, number]>, '#272727');
    const totalGrowth = parseDataSet("Total growth - Ao3", _totalGrowth as Array<[string, number]>, '#272727', 'avg');
    
    const setTotal = parseDataSet("Combined yearning", _summed as Array<[string, number]>,'#a71544');
    const relativeSetTotal = parseDataSet("Yearning relative to total", _relativeToTotal as Array<[string, number]>, '#531321', 'avg');
    const tagSets = keys.map((key, i) => {
        return parseDataSet(key, piningData[key].dates as Array<[string, number]>, piningColors[i]!);
    })
    const relativeTagSets = keys.map((key, i) => {
        return parseDataSet(key + " of total", piningData[key].datesRelative as Array<[string, number]>, piningColors[i]!, 'avg');
    })
    

    const comparisonTagSets = compKeys.map((key, i) => {
      return parseDataSet(key, compTags[key].dates as Array<[string, number]>, comparisonColors[i]!);
    })
    const relativeComparisonTagSets = compKeys.map((key, i) => {
        return parseDataSet(key + " of total", compTags[key].datesRelative as Array<[string, number]>, comparisonColors[i]!, 'avg', );
    })

    return {
      meta: _meta,
      tagSets, 
      comparisonTagSets,

      setTotal,
      grandTotal,
      totalGrowth,
      
      relativeSetTotal,
      relativeTagSets,
      relativeComparisonTagSets,
    }
  }, [ groupBy ])

  return {
    ...renderData,
    groupBy,
    setGroupBy,
    selectedSets,
    setDataSets,
  }
}


const makeChartOptions = (isRelative: boolean, groupBy: GroupBy) => {
  return {
    parsing: false,
    responsive: true,
    scales: {
      x: {
          type: 'time',
      },
      y: {
        ticks: {
            // Include a dollar sign in the ticks
            callback: function(value: number, index, ticks: {value: number, label: string}[]) {
              let maxSize = ticks.reduce((max, {value}) => Math.max(max, value), 0);;
              let isSmallPercentage = maxSize < 0.01;
  
              if(isRelative) {
                if(isSmallPercentage) {
                  return (value * 100).toFixed(4) + "%";
                }
                return Math.round(value * 100) + "%"
              }
              return nform.format(value);
            }
        }
    }
  },
    plugins: {
      tooltip: {
        callbacks: {
          title: function(context) {
            console.log(context)
            return context.map(({raw, label}) => {
              if(raw) {
                let date = new Date(raw.x);
                
                switch(groupBy) {
                  case 'daily':
                    return format(date, 'PP');
                  case 'weekly':
                    return `Week of ${format(date, 'd MMM')} - ${format(addWeeks(date, 1), 'd MMM')}, ${format(date, 'yyyy')}}`;
                  case 'monthly':
                    return format(date, 'MMMM yyyy');
                  case 'quarterly':
                    return format(date, 'qqq yyyy');
                  case 'yearly':
                    return format(date, 'yyyy');
                  default: 
                    return label;
                }
              }
            })
          },
          label: function(context) {
              let label = context.dataset.label || '';
  
              if (label) {
                console.log(label);
                
                  label += ': ';
              }
              if (context.parsed.y !== null) {
                let val = context.parsed.y;

                if(isRelative) {
                  if(val < 0.01 && val !== 0) {
                    label += (val * 100).toFixed(4) + "%";
                  } else {
                    label += Math.round(val * 100) + "%"
                  }
                } else {
                  label += nform.format(val)
                }
              }
  
              return label;
          }
        }
      },
      legend: {
        position: 'top' as const,
      },
      decimation: {
        enabled: true,
        algorithm: 'lttb',
      },
      title: {
        display: true,
        text: 'Chart.js Line Chart',
      },
    },
  }
}



type ChartOptions = { showTotals?: boolean, useRelativeData?: boolean, withComparison?: boolean }

function useChart(ref: MutableRefObject<HTMLCanvasElement>, options: ChartOptions) {

  let chartRef = useRef<ChartJS>(null);
  const {
    selectedSets,
    grandTotal, 
    totalGrowth,
    setTotal,
    relativeSetTotal,
    tagSets,
    relativeTagSets,
    comparisonTagSets,
    relativeComparisonTagSets,
    groupBy
  } = React.useContext(DataContext);

  const showTotals = options.showTotals ?? false;
  const useRelativeData = options.useRelativeData ?? false;

  const datasets = useMemo(() => {
    let sets = selectedSets.reduce((sets, key) => {

      switch(key) {
        case 'grandTotal':
          sets.push(useRelativeData ? totalGrowth :  grandTotal);
          break;
        case 'setTotal':
          sets.push(useRelativeData ? relativeSetTotal : setTotal);
          break;
        case 'tagSets':
          sets.push(...(useRelativeData ? relativeTagSets : tagSets));
          break;
      }

      if(!sets.includes('grandTotal') && showTotals) {
        sets.push(useRelativeData ? totalGrowth :  grandTotal);
      }
      return sets;
    }, [])

    if(options.withComparison) {
      sets.push(...(useRelativeData ? relativeComparisonTagSets : comparisonTagSets))
    }
    return sets
  }, [ showTotals, selectedSets, grandTotal, setTotal, tagSets ])

  useEffect(() => {

    if(ref.current === null) { return }

    if(chartRef.current !== null) {
      chartRef.current.destroy();
    }
    
    let chart = new ChartJS(
      ref.current,
      {
        // @ts-ignore
        options: makeChartOptions(!!options.useRelativeData, groupBy),
        type: 'line',
        data: { datasets }
      }
      );
      
    return () => chart.destroy();
  }, [ datasets ])
}

const ButtonGroup = styled.div`
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

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.05);;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
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

export function MetaSelector(props: {updateSelection: (key: GroupBy) => void}) {

  let { setGroupBy, setDataSets, groupBy, selectedSets } = React.useContext(DataContext);

  return <Controls>
    <p>Group data by dates</p>
    <ButtonGroup>
      <Button onClick={() => setGroupBy('daily')} className={ (groupBy === 'daily' ? 'selected ': '')}>Day</Button>
      <Button onClick={() => setGroupBy('weekly')} className={ (groupBy === 'weekly' ? 'selected ': '')}>Week</Button>
      <Button onClick={() => setGroupBy('monthly')} className={ (groupBy === 'monthly' ? 'selected ': '')}>Month</Button>
      <Button onClick={() => setGroupBy('quarterly')} className={ (groupBy === 'quarterly' ? 'selected ': '')}>Quarter</Button>
      <Button onClick={() => setGroupBy('yearly')} className={ (groupBy === 'yearly' ? 'selected ': '')}>Year</Button>
    </ButtonGroup>
    <small>Shorter intervals = slower but more precise. <br/> Data is cut off for incomplete periods i.e. If "yearly" is selected all data for 2021 is truncated</small>
    <br/>
    <p>Tag groupings</p>
    <ButtonGroup>
      <Button onClick={() => setDataSets(['setTotal'])} className={ (JSON.stringify(selectedSets) === '["setTotal"]' ? 'selected ': '')}>Show combined tags</Button>
      <Button onClick={() => setDataSets(['tagSets'])} className={ (JSON.stringify(selectedSets) ==='["tagSets"]'  ? 'selected ': '')}>Show tags individually</Button>
      <Button onClick={() => setDataSets(['setTotal', 'tagSets'])} className={ (JSON.stringify(selectedSets) === '["setTotal", "tagSets"]'  ? 'selected ': '')}>Show both combined and individual tags</Button>
    </ButtonGroup>
    <small>
      Combined means all tags are added together. <br/>Individual means each tag is shown separately.
    </small>
  </Controls>
}

const ChartWrapper = styled.div`
  margin: 1.5rem 0;
`

export default function Graph (props: ChartOptions) {

  let chartRef = useRef<HTMLCanvasElement>(null);
  useChart(chartRef, props); 

  return <ChartWrapper>
    <canvas id="mainChart" ref={chartRef} /> 
  </ChartWrapper>
}