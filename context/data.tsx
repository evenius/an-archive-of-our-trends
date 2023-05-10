import React, { useState, useMemo } from "react";
import works from '../public/data/works.json';

const tagData = works as unknown as WorkStructure;

type TagCount = {
  count: number,
  aroace: number,
  polysexual: number,
  gay: number,
  straight: number
}

type TagMeta = {
  sumCount: number,
  maxCount: number,
  minCount: number,
  start: string,
  end: string
}

type TagGroupInfo<K extends string> = {
  _summed: Array<[string, TagCount]>,
  _relativeToTotal: Array<[string, number]>,
} & {[key in K]: TagInfo}

type TagInfo = {
  _meta: TagMeta,
  dates: Array<[string, TagCount]>,
  datesRelative: Array<[string, number]>,
}

type WorkStructure = {
  _meta: TagMeta,
  _totals: Array<[string, number]>
  _totalGrowth: Array<[string, number]>
  piningData: TagGroupInfo<"slow burn" | "pining" | "yearning">,
  comparativeData: TagGroupInfo<"fluff" | "angst" | "alternate universe">
  gayNessData: TagGroupInfo<"m/m" | "gay" >,
  straightNessData: TagGroupInfo<"f/m" | "straight">,
  polysexynessData: TagGroupInfo<"bisexual" | "pansexual character" | "polysexual">,
  acenessData: TagGroupInfo<"asexual" | "aromantic" >,
}

import { startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns";

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

const defaultGroupBy = 'quarterly';

export type GroupBy = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

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

export type DateRange = [Date, Date];
export type SetType = 'grandTotal' | 'setTotal' | 'tagSets' | 'comparisonTagSets' | 'queerTagSets';

function useChartData(initialGroupBy: GroupBy = defaultGroupBy) {

  const [ groupBy, setGroupBy ] = useState<GroupBy>(initialGroupBy)
  const [ dateRange, setDateRange ] = useState<DateRange>([ new Date(tagData._meta.start), new Date(tagData._meta.end) ])

  const renderData = useMemo(() => {
    const { _totals, _totalGrowth, piningData, comparativeData }  = tagData
    const {
      _relativeToTotal,
      _summed,
      ...tags
    } = piningData

    const {
      _relativeToTotal: _compRelative,
      _summed: _compSummed,
      ...compTags
    } = comparativeData
    
    const keys = Object.keys(tags);
    const compKeys = Object.keys(compTags);

    const parseDataSet = createParser(groupBy)
    
    const grandTotal = parseDataSet("Total works - Ao3", _totals, '#272727');
    const totalGrowth = parseDataSet("Total growth - Ao3", _totalGrowth, '#272727', 'avg');
    
    const setTotal = parseDataSet("Combined yearning", _summed,'#a71544');
    const relativeSetTotal = parseDataSet("Yearning relative to total", _relativeToTotal, '#531321', 'avg');

    const tagSets = keys.map((key, i) => {
        return parseDataSet(key, piningData[key].dates, piningColors[i]!);
    })

    const relativeTagSets = keys.map((key, i) => {
        return parseDataSet(key + " of total", piningData[key].datesRelative, piningColors[i]!, 'avg');
    })
    
    const comparisonTagSets = compKeys.map((key, i) => {
      return parseDataSet(key, compTags[key].dates, comparisonColors[i]!);
    })

    const relativeComparisonTagSets = compKeys.map((key, i) => {
        return parseDataSet(key + " of total", compTags[key].datesRelative, comparisonColors[i]!, 'avg', );
    })

    type QueerTagSet = {
      aroace: Array<[string, number]>,
      polysexual: Array<[string, number]>,
      gay: Array<[string, number]>,
      straight: Array<[string, number]>,
    }

    const [ queerTagData, relativeQueerTagData] = _summed.reduce<[QueerTagSet, QueerTagSet]>((queerTagData, [date, counts]) => {
      queerTagData[0].aroace.push([date, counts.aroace]);
      queerTagData[0].polysexual.push([date, counts.polysexual]);
      queerTagData[0].gay.push([date, counts.gay]);
      queerTagData[0].straight.push([date, counts.straight]);

      const total = (counts.aroace + counts.polysexual + counts.gay + counts.straight);

      queerTagData[1].aroace.push([date, total > 0 ? counts.aroace / total: 0]);
      queerTagData[1].polysexual.push([date, total > 0 ? counts.polysexual / total : 0]);
      queerTagData[1].gay.push([date, total > 0 ? counts.gay / total : 0]);
      queerTagData[1].straight.push([date, total > 0 ? counts.straight / total : 0]);

      return queerTagData
    }, [{ aroace: [], polysexual: [], gay: [], straight: []}, { aroace: [], polysexual: [], gay: [], straight: []}])

    const queerTagSets = ["aroace", "polysexual", "gay", "straight"].map((key, i) => {
      return parseDataSet(key, queerTagData[key], comparisonColors[i]!);
    })

    const relativeQueerTagSets = ["aroace", "polysexual", "gay", "straight"].map((key, i) => {
      return parseDataSet(key, relativeQueerTagData[key], comparisonColors[i]!, 'avg');
    })

    return {
      grandTotal,
      totalGrowth,
      setTotal,
      relativeSetTotal,
      tagSets,
      relativeTagSets,
      comparisonTagSets,
      relativeComparisonTagSets,
      queerTagSets,
      relativeQueerTagSets
    }
  }, [  ])

  const [ isTruncated, filteredChartData ] = useMemo(() => filterData(renderData, groupBy, dateRange, tagData._meta) , [groupBy, dateRange])

  return useMemo(() => ({
    meta: tagData._meta,
    groupBy,
    setGroupBy,
    dateRange, 
    setDateRange,
    isTruncated,
    ...filteredChartData,
  }), [filteredChartData, groupBy, dateRange])
}

function filterData<K extends string>(datasetList: { [key in K ]: DataSetOptions | DataSetOptions[] }, groupBy: GroupBy, [from, to]: DateRange, meta: TagMeta): [ Date | false,  { [key in K ]: DataSetOptions[] }]  {
  const startOf = getGroupByFn(groupBy)
  const startTime = from.getTime();

  let didTruncateAt: false | Date = false;
  
  let endTime = to.getTime();
  let aggEndDate = startOf(to); 

  if (endTime <= aggEndDate.getTime()) {
    endTime = to.getTime();
  } else {
    didTruncateAt = aggEndDate;
  }

  const isOutOfRange = ({x: date}: DataPoint) => {
    const aggDate = new Date(date).getTime();
    return ( 
      // Keep if we truncated and the date is less than the end time
      (didTruncateAt && aggDate < endTime) ||  
      // Or, if we didn't truncate and the date is less than the end time
      (!didTruncateAt && aggDate <= endTime) ||  
      // Or, if the date is greater than the start time
      (aggDate >= startTime) 
    )
  }

  const setList = Object.entries(datasetList) as [K, DataSetOptions | DataSetOptions[]][];

  return [ didTruncateAt, setList.reduce((filteredSets, [key, parsedDataSet]) => {
    if(Array.isArray(parsedDataSet)) {
      filteredSets[key] = parsedDataSet.map(({data, ...dataSet}) => ({
        ...dataSet,
        data: data.filter(isOutOfRange),
      }))
    } else {
      const {data, ...dataSet} = parsedDataSet;
      filteredSets[key] = [ { ...dataSet, data: data.filter(isOutOfRange) } ]
    }

    return filteredSets;
  }, {} as  { [key in K ]: DataSetOptions[] })]
}

type DataPoint = {x: number, y: number}

type DataSetOptions = {
  data: DataPoint[]
  label: string,
  borderColor?: string
  tension?: number,
}

function createParser (groupBy: GroupBy)  {
  const startOf = getGroupByFn(groupBy)
  const parseFunction = (label: string, work: Array<[string, number | TagCount]>, color: string, alg: 'sum' | 'avg' = 'sum'): DataSetOptions => {
    const dateGroups = work
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .reduce((dateGroups, [date, value]) => {

        const aggDate = startOf(new Date(date)).getTime();
        const dateCount = typeof value === 'number' ? value : value.count;
        const { count, sum } = dateGroups.get(aggDate) ?? {count: 0, sum: 0};
  
        dateGroups.set(aggDate, {
          count: count + 1,
          sum: sum + dateCount,
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
  
  return parseFunction
}

export const DataContext = React.createContext<ReturnType<typeof useChartData>>(null);

export default function DataContextProvider({ children }: {children: React.ReactNode}) {
  let data = useChartData();
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>
}

