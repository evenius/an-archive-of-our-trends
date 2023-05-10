import React, { CSSProperties, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';

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
  Filler,
} from 'chart.js';


import { format, addWeeks } from 'date-fns'
import styled from 'styled-components';

import 'chartjs-adapter-date-fns';
import { nform } from './contextual';
import { DataContext, GroupBy, SetType } from '../context/data';
import { ButtonGroup } from './ChartFilter';
import Button from './Button';

ChartJS.register(
  Tooltip,
  Colors,
  TimeScale,
  LineController,
  CategoryScale,
  LineElement,
  LinearScale,
  PointElement,
  Filler,
  Legend
);

const makeChartOptions = (isRelative: boolean, groupBy: GroupBy, stacked?: boolean) => {
  return {
    parsing: false,
    responsive: true,
    scales: {
      x: {
          type: 'time',
      },
      y: {
        max: (stacked ? 1 : undefined ),
        stacked,
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
      filler: {

      },
      tooltip: {
        callbacks: {
          title: function(context) {
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



type ChartOptions = { useRelativeData?: boolean, stacked?: boolean, showArea?: boolean, groupBy: GroupBy,  }

function useChart(ref: MutableRefObject<HTMLCanvasElement>, selectedSets: SetType[], options: ChartOptions) {

  let chartRef = useRef<ChartJS>(null);

  const {
    grandTotal, 
    totalGrowth,
    
    setTotal,
    relativeSetTotal,

    tagSets,
    relativeTagSets,

    queerTagSets,
    relativeQueerTagSets,

    comparisonTagSets,
    relativeComparisonTagSets,
    groupBy
  } = React.useContext(DataContext);

  // const showTotals = options.showTotals ?? false;
  const useRelativeData = !!options.useRelativeData;
  const showArea = !!options.showArea;

  const datasets = useMemo(() => {
    let sets = selectedSets.reduce((sets, key) => {
      switch(key) {
        case 'grandTotal':
          sets.push(...(useRelativeData ? totalGrowth :  grandTotal));
          break;
        case 'setTotal':
          sets.push(...(useRelativeData ? relativeSetTotal : setTotal));
          break;
        case 'tagSets':
          sets.push(...(useRelativeData ? relativeTagSets : tagSets));
          break;
        case 'comparisonTagSets':
          sets.push(...(useRelativeData ? relativeComparisonTagSets : comparisonTagSets))
          break;
        case 'queerTagSets':
          if(useRelativeData && selectedSets.length > 1) throw new Error("Queer tag data is so far only relative to total yearning, not to other tags.");
          sets.push(...(useRelativeData ? relativeQueerTagSets : queerTagSets))
          break;
      }
      return sets;
    }, [])
    if(showArea) {
      sets.forEach(set => {
        set.fill = 'start';
      })
    }
    return sets
  }, [ selectedSets, grandTotal, setTotal, tagSets ])

  useEffect(() => {

    if(ref.current === null) { return }

    if(chartRef.current !== null) {
      chartRef.current.destroy();
    }
    
    let chart = new ChartJS(
      ref.current,
      {
        // @ts-ignore
        options: makeChartOptions(!!options.useRelativeData, groupBy, !!options.stacked),
        type: 'line',
        data: { datasets }
      }
      );
      
    return () => chart.destroy();
  }, [ datasets ])
}

const ChartWrapper = styled.div`
  margin: 1.5rem 0;
`

function getSelectedSets(selected?: SetType[]) {
  let individual = false;
  let combined = false;
  if(!selected) return 'individual'
  for (const set of selected) {
    if(set === 'setTotal') {
      combined = true;
    } else if(set === 'tagSets') {
      individual = true;
    }
    if(individual && combined) { break }
  }
  return individual && combined ? 'both' : (combined ? 'combined' : 'individual');
}

type TagSetView = 'individual' | 'combined' | 'both' | 'none'

export default function Graph ({ defaultSet, setTypes, hideGroupingOptions, ...props}: ChartOptions & { hideGroupingOptions?: boolean, setTypes?: SetType[], defaultSet?: TagSetView }) {

  let chartRef = useRef<HTMLCanvasElement>(null);
  const [ chartView, setViewedSets ] = useState<TagSetView>(defaultSet ?? 'individual');

  const linesToShow = useMemo(() => {
    const mainCharts = (chartView === 'none' ? [] : chartView === 'combined' ? ['setTotal'] : chartView === 'individual' ? ['tagSets'] : ['setTotal', 'tagSets'] ) as SetType[];
    return setTypes ? [
      ...mainCharts,
      ...setTypes
    ] : mainCharts
  }, [ setTypes , chartView ])

  useChart(chartRef, linesToShow, props); 

  return <ChartWrapper>
    <canvas id="mainChart" ref={chartRef} /> 
    {!hideGroupingOptions && <>
      <br/>
      <p><b>Tag groupings</b></p>
      <ButtonGroup>
        <Button onClick={() => setViewedSets('combined')} className={ (chartView === 'combined' ? 'selected ': '')}>Show combined tags</Button>
        <Button onClick={() => setViewedSets('individual')} className={ (chartView ==='individual'  ? 'selected ': '')}>Show tags individually</Button>
        <Button onClick={() => setViewedSets('both')} className={ (chartView === 'both'  ? 'selected ': '')}>Show both combined and individual tags</Button>
      </ButtonGroup>
    </>
    }
  </ChartWrapper>
}