function formatDuration(durationInMilliseconds: number) {
  if (durationInMilliseconds < 1000) {
    return `${durationInMilliseconds.toFixed(2)} milliseconds`;
  }

  const seconds = durationInMilliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)} seconds`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toFixed(2)} minutes`;
}


export function measureTime(operation: () => void, label: string) {
  return measureTimeAsync(async () => {
    operation();
  }, label)
}

export async function measureTimeAsync<T>(operation: () => Promise<void>, label: string) {
  const startTime = process.hrtime.bigint();

  await operation();

  const endTime = process.hrtime.bigint();
  const duration = endTime - startTime;
  const durationInMilliseconds = Number(duration) / 1e6;
  console.log(`\n${label} took ${formatDuration(durationInMilliseconds)}`);
}