import {parse} from  'csv-parse';
import * as fs from  'fs';
import readline from 'readline'
import { measureTimeAsync } from './perf';
import { startSpinner, stopSpinner, startProgress, updateProgress, stopProgress } from './cli';
import path, { relative } from 'path';

const mPath = (rel: string) => path.resolve(process.cwd(), 'public/data', rel);


const tagCSV = mPath('../../tags.csv');
const worksCSV = mPath('../../works.csv');

const workCountJson = mPath('./works.json');
console.log(tagCSV);

type TagRecord = {
    id:string,
    type: string,
    name: string,
    canonical: string, // If has a canonical, it's a duplicate of another tag
    cached_count: '910',
    merger_id: ''
}

type TagMeta = {
  sumCount: number,
  maxCount: number,
  minCount: number,
  start: Date,
  end: Date
}

type WorkRecord = {
  "creation date": string,
  language: string,
  restricted: boolean,
  complete: boolean,
  word_count: number,
  tags: string,
}


type StringDate = `${number}-${number}-${number}`;
type DateIndexedCount = {[key: StringDate]: number };
type DateIndexStats = {[key: StringDate]: StatsCount }
type StatsCount = {
  count: number,
  aroace: number,
  polysexual: number,
  gay: number,
  straight: number,
}

type WorkCountMap = Map<string,  { _meta: TagMeta, [key: StringDate]: StatsCount } >
type WorkCountMapNoMeta = Map<string, DateIndexedCount >
let nform = new Intl.NumberFormat();


const interestedTags = [
  'pining',
  'yearning',
  'slow burn',
]

const comparisonTags = [
  'fluff',
  'angst',
  'alternate universe',
]

const gayness = [
  'm/m',
  'f/f',
  'gay',
  'lesbian'
]

const straightness = [
  'f/m',
  'm/f',
  'straight',
]

const polysexyness = [
  'bisexual',
  'pansexual character',
  'polysexual'
]

const aceness = [
  'asexual',
  'aromantic'
]

const makeTagData = (tags: string[]) => ({
  tags,
  totals: {} as DateIndexStats,
  matchedTags: new Map() as WorkCountMap,
  avgRelativeDates: {} as DateIndexedCount,
  relativeDates: new Map() as WorkCountMapNoMeta,
})

type TagData = ReturnType<typeof makeTagData>;

const tagData = {
  piningData: makeTagData(interestedTags), 
  comparativeData: makeTagData(comparisonTags),
  gaynessData: makeTagData(gayness),
  straightnessData: makeTagData(straightness),
  polysexynessData: makeTagData(polysexyness),
  acenessData: makeTagData(aceness),
}

async function run() {
  // Read and parse the CSV file named attendees.csv using node and fs
  console.log("creating tag buffer");
  console.log("Counting tags...");
  
  let csvCount = 0;
  await measureTimeAsync(() => new Promise<void>((resolve, reject) => {
    startSpinner();
    let rl = readline.createInterface({ input: fs.createReadStream(tagCSV), });
    rl.on('line', () => { csvCount++;});
    rl.on('close', () => { stopSpinner(); resolve(); });
    rl.on('error', () => { stopSpinner(); reject(); })
  }), 'Counting tags')
  console.log("Counting works...");
  
  let workCount = 0;
  await measureTimeAsync(() => new Promise<void>((resolve, reject) => {
    startSpinner();
    let rl = readline.createInterface({ input: fs.createReadStream(worksCSV), });
    rl.on('line', () => { workCount++;});
    rl.on('close', () => { stopSpinner(); resolve(); });
    rl.on('error', () => { stopSpinner(); reject(); })
  }), 'Counting works')
  
  console.log(`There are ${nform.format(csvCount)} records in the tags file`)
  console.log(`There are ${nform.format(workCount)} records in the works file`)
  
  console.log("Parsing tags...");
  let records: TagRecord[] = [];
  let csvParsedTagsCount = 0;
  let csvParsedWorksCount = 0;

  const tagIdToCanonical = new Map();
  const canonicalTagIdToName = new Map<number, string>();
  const totalDates: {[key: StringDate]: number } = {};
  
  const meta: TagMeta = {
    sumCount: 0,
    maxCount: 0,
    minCount: 0,
    start: new Date('2030-01-01'),
    end: new Date('1900-01-01'),
  }
  
  const tagTypes = new Set<string>();
  await measureTimeAsync( async () => {
    startProgress(csvCount);
    const tagsStream = fs.createReadStream(tagCSV).pipe(parse({ columns: true, skip_empty_lines: true, trim: true, rtrim: true }));

    for await (const row of tagsStream) {
      const tagRow = row as TagRecord;
      tagTypes.add(tagRow.type);
      
      if(tagRow.name === 'Redacted' && !tagRow.merger_id) {
        updateProgress(++csvParsedTagsCount, nform.format(csvParsedTagsCount));
        continue
      }

      const tagId = parseInt(tagRow.id);

      if (tagRow.merger_id) {
        const mergerId = parseInt(tagRow.merger_id);
        tagIdToCanonical.set(tagId, mergerId);
      } else {
        canonicalTagIdToName.set(tagId, tagRow.name);
      }
      updateProgress(++csvParsedTagsCount, nform.format(csvParsedTagsCount));
    }

    stopProgress();
  }, 'Creating tags')
  
  await measureTimeAsync( async () => {

    startProgress(workCount);
    const worksStream = fs.createReadStream(worksCSV).pipe(parse({ columns: true, skip_empty_lines: true, trim: true, rtrim: true }));

    for await (const row of worksStream) {
      const workRow = row as WorkRecord;
      const creation = workRow['creation date'] as StringDate;
      const creationDate = new Date(workRow['creation date']);
      const tagIds = workRow.tags.split('+').map(id => parseInt(id));

      if (creationDate < meta.start) {
        meta.start = creationDate;
      } else if (creationDate > meta.end) {
        meta.end = creationDate;
      }

      meta.sumCount += 1;

      totalDates[creation] = (totalDates[creation] ?? 0) + 1;
      let countedInclusive = false;
      let countedComparable = false;
      let countedAroace = false;
      let countedPolysexual = false;
      let countedGay = false;
      let countedStraight = false;

      let tagNames = tagIds
        .map(id => 
          canonicalTagIdToName.get(tagIdToCanonical.get(id) || id)?.toLocaleLowerCase()
        ).filter(name => !!name) as string[];

        const sexualities = {
          aroace: 0,
          polysexual: 0,
          gay: 0,
          straight: 0,
        }
  
      tagNames.forEach(name => {
        if (aceness.some(t => name.includes(t))) {
          sexualities.aroace = 1;
        } else if (polysexyness.some(t => name.includes(t))) {
          sexualities.polysexual = 1;
        } else if (gayness.some(t => name.includes(t))) {
          sexualities.gay = 1;
        } else if (straightness.some(t => name.includes(t))) {
          sexualities.straight = 1;
        }
      })

      for (const normalised of tagNames) {

          const includes = interestedTags.find(t => normalised.includes(t));
          const comparable = comparisonTags.find(t => normalised.includes(t));

          const isAceIsh = sexualities.aroace ? aceness.find(t => normalised.includes(t)) : false;
          const isPolysexyIsh = sexualities.polysexual ? polysexyness.find(t => normalised.includes(t)) : false;
          const isGayIsh = sexualities.gay ? gayness.find(t => normalised.includes(t)) : false;
          const isStraightIsh = sexualities.straight ? straightness.find(t => normalised.includes(t)) : false ; 

          const createWorkMap = (normalisedName: string, counts: WorkCountMap, relevantDates: DateIndexStats, countedWorkTag: boolean) => {
  
            relevantDates[creation] =  relevantDates[creation] ?? {
              count: 0,
              aroace: 0,
              polysexual: 0,
              gay: 0,
              straight: 0,
            };

            if (!countedWorkTag) {
              
            }

            const dates = counts.get(normalisedName) ?? {
              _meta: {
                sumCount: 0,
                maxCount: 0,
                minCount: 0,
                start: creationDate,
                end: creationDate,
              }
            };

            dates[creation] = dates[creation] ?? {
              count: 0,
              aroace: 0,
              polysexual: 0,
              gay: 0,
              straight: 0,
            }
            
            dates[creation].count += 1;

            if (!countedWorkTag) {
              relevantDates[creation].count += 1;
              Object.entries(sexualities).forEach(([key, value]) => {
                dates[creation][key as keyof StatsCount] += value;
                relevantDates[creation][key as keyof StatsCount] += value;
              })
              countedWorkTag = true;
            }


            dates._meta.sumCount += 1;
            if (dates._meta.maxCount < dates[creation].count) {
              dates._meta.maxCount = dates[creation].count;
              if(dates._meta.maxCount > meta.maxCount) {
                meta.maxCount = dates._meta.maxCount;
              }
            } else if (dates._meta.minCount > dates[creation].count) { 
              dates._meta.minCount = dates[creation].count;
              if(dates._meta.minCount < meta.minCount) {
                meta.minCount = dates._meta.minCount;
              }
            }

            if (dates._meta.start > creationDate) {
              dates._meta.start = creationDate;
            } else if (dates._meta.end < creationDate) {
              dates._meta.end = creationDate;
            }

            counts.set(normalisedName, dates);
          }

          if(includes) {
            createWorkMap(includes, tagData.piningData.matchedTags, tagData.piningData.totals, countedInclusive )
          } else if (comparable) {
            createWorkMap(comparable, tagData.comparativeData.matchedTags, tagData.comparativeData.totals, countedComparable)
          }
          
          if (isGayIsh) {
            createWorkMap(isGayIsh, tagData.gaynessData.matchedTags, tagData.gaynessData.totals, countedAroace)
          } else if (isPolysexyIsh) {
            createWorkMap(isPolysexyIsh, tagData.straightnessData.matchedTags, tagData.straightnessData.totals, countedPolysexual)
          } else if (isAceIsh) {
            createWorkMap(isAceIsh, tagData.polysexynessData.matchedTags, tagData.polysexynessData.totals, countedGay)
          } else if (isStraightIsh) {
            createWorkMap(isStraightIsh, tagData.acenessData.matchedTags, tagData.acenessData.totals, countedStraight)
          }
      }

      updateProgress(++csvParsedWorksCount, nform.format(csvParsedWorksCount));
    }
    
    stopProgress();
  }, 'Creating Works')


  const emptyDates = Object.keys(totalDates).reduce<{ [key: StringDate]: number }>((acc, key) => {
    // @ts-ignore
    acc[key] = 0;
    return acc;
  }, {});

  for (const [tag, data] of Object.entries(tagData)) {

    data.avgRelativeDates = {...emptyDates}
    data.relativeDates = data.tags.reduce<WorkCountMapNoMeta>((acc, tag) => {
      acc.set(tag, {...emptyDates});
      return acc;
    }, new Map())

    for (const [date, count] of Object.entries(data.totals) as [StringDate, StatsCount][]) {

      data.avgRelativeDates[date] = count.count / totalDates[date];
      
      data.tags.forEach(tag => {
        let dates = data.matchedTags.get(tag);
        if (dates) {
          let relDates = data.relativeDates.get(tag)!;
          relDates[date] = (dates[date]?.count ?? 0) / totalDates[date];
          data.relativeDates.set(tag, relDates);
        }
      })
    }
  }

  const growthTotals = {...emptyDates};
  let runningSum = 0;

  const sortedDateEntries = Object.entries(totalDates).sort(([a], [b]) => {
    return a.localeCompare(b);
  }) as [StringDate, number][]
  
  for (const [date, count] of sortedDateEntries ) {
    runningSum += count;
    growthTotals[date] = runningSum / meta.sumCount;
  }

  await saveCache(totalDates, growthTotals, meta, tagData);
}


type ScienceData = {
  counts: WorkCountMap,
  sum: { [key: StringDate]: number  },
  relativeToTotal: WorkCountMapNoMeta,
  avgRelativeToTotal: { [key: StringDate]: number  },
}

type WorkData = typeof tagData;

// Save the workCounts data structure to a JSON file
// Pick out parents we are interested in, save all child tags
// Filter out everything else
async function saveCache(totals: { [key: StringDate]: number  }, totalGrowth: { [key: StringDate]: number  }, meta: TagMeta, works: WorkData ) {
  
  let count = 0;
  const workEntries =  Object.entries(works);
  const workEntryCount = workEntries.length;

  for (const [key, data] of workEntries) {
    count += data.matchedTags.size * 2;
    count += Object.keys(data.totals).length;
  }

  count += Object.keys(totals).length;
  let savedCount = 0;

  await measureTimeAsync( async () => {

    startProgress(count);
    console.log("Will write to: ", workCountJson);
    const outputStream = fs.createWriteStream(workCountJson);
    
    outputStream.on('error',  (error) => {
      console.log(`An error occured while writing to the file. Error: ${error.message}`);
    });

    await new Promise((resolve) => {
      outputStream.write('{\n', resolve);
      outputStream.write('"_meta": ' + JSON.stringify(meta, null, 2) +',\n');
      outputStream.write('"_totals": ' + JSON.stringify(Object.entries(totals)) +',\n');
      outputStream.write('"_totalGrowth": ' + JSON.stringify(Object.entries(totalGrowth)) +',\n');
    })

    

    let workEntriesLeft = workEntryCount;
    for (const [key, data] of workEntries) {

      workEntriesLeft--;
      await new Promise((resolve) => {
        outputStream.write(JSON.stringify(key) + ': {\n', resolve);
        outputStream.write('"_summed": ' + JSON.stringify(Object.entries(data.totals)) +',\n');
        outputStream.write('"_relativeToTotal": ' + JSON.stringify(Object.entries(data.avgRelativeDates)) +',\n');
      })
      let entries = data.matchedTags.entries();
      let entriesLeft = data.matchedTags.size;

      for (const [date, values] of entries) {
        let { _meta, ...dates } = values
        entriesLeft--;
        const relativeDates = data.relativeDates.get(date);
        
        let jsonString = `${JSON.stringify(date.toLocaleLowerCase())}: {\n`;
            jsonString += `"_meta": ${JSON.stringify(_meta, null, 2)},\n`;
            jsonString += `"dates": ${JSON.stringify(Object.entries(dates))}${relativeDates ? ',' : '' }\n`;
            if(relativeDates) {
              jsonString += `"datesRelative": ${JSON.stringify(Object.entries(relativeDates))}\n`;
            }
            jsonString += `}${entriesLeft > 0 ? ',' : '' }\n`;
        await new Promise((resolve) => {
          outputStream.write(jsonString, resolve);
        })
    }
    await new Promise((resolve) => {
      outputStream.write(`}${workEntriesLeft > 0 ? ',' : '' }\n`, resolve);
    })
      updateProgress(++savedCount, nform.format(savedCount));
    }

    await new Promise((resolve) => {
      outputStream.write('}\n', resolve);
    })
    
    outputStream.close();

    async function writeCSV(filePrefix: string, tagData: TagData) {
      console.log("\nWill write to: ", filePrefix + '\n');
      const tagCSVStream = fs.createWriteStream(filePrefix + '_separate.csv');

      await new Promise((resolve) => {
        tagCSVStream.write('date,tag,count,count_gay,count_straight,count_aroace,count_polysexual\n', resolve);
      })

      for (const [key, values] of tagData.matchedTags.entries()) {
        let { _meta, ...dates } = values
        for (const [ date, count ] of Object.entries(dates)) {
          await new Promise((resolve) => {
            tagCSVStream.write(`${date},${key},${count.count},${count.gay},${count.straight},${count.aroace},${count.polysexual}\n`, resolve);
          })
        }
        
        updateProgress(++savedCount, nform.format(savedCount));
      }

      const combinedTagsCSVStream = fs.createWriteStream(filePrefix + '_combined.csv');

      await new Promise((resolve) => {
        combinedTagsCSVStream.write('date,count,count_gay,count_straight,count_aroace,count_polysexual\n', resolve);
      })
      
      for (const [ date, count ] of Object.entries(tagData.totals)) {
        await new Promise((resolve) => {
          combinedTagsCSVStream.write(`${date},${count.count},${count.gay},${count.straight},${count.aroace},${count.polysexual}\n`, resolve);
        })
      }
        
      updateProgress(++savedCount, nform.format(savedCount));

      combinedTagsCSVStream.close();

      tagCSVStream.close();
    }

    for (const [key, data] of Object.entries(works)) {
      await writeCSV(mPath('./'+key), data);
    }

    const totalsCSVStream = fs.createWriteStream(mPath('./total_count.csv'));

    await new Promise((resolve) => {
      totalsCSVStream.write('date,count\n', resolve);
    })
    
    for (const [ date, count ] of Object.entries(totals)) {
      await new Promise((resolve) => {
        totalsCSVStream.write(`${date},${count}\n`, resolve);
      })
    }
      
    updateProgress(++savedCount, nform.format(savedCount));

    totalsCSVStream.close();

    console.log('Cache saved');
    
    stopProgress();
  }, 'Saving cache')

  const outputStream = fs.createWriteStream(workCountJson);

}

// Read the cached data from the JSON file
async function readCache() {
  const data = await fs.promises.readFile(workCountJson, 'utf-8');
  const entries = JSON.parse(data);
  const workCounts = new Map(entries);
  return workCounts;
}

run().catch(console.error).then(() => {
  console.log("done");
  process.exit(0);
});