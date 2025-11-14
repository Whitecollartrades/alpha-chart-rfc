const BASE_URL = 'https://www.alphavantage.co/query';

export interface Candle {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchIntraday(
  symbol: string,
  apiKey: string,
  interval: string = '5min'
): Promise<Candle[]> {
  const params = new URLSearchParams({
    function: 'TIME_SERIES_INTRADAY',
    symbol,
    interval,
    apikey: apiKey,
    outputsize: 'compact',
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  const data = await res.json();

  const key = `Time Series (${interval})`;
  if (data[key]) {
    return Object.entries(data[key])
      .map(([time, values]: [string, any]) => ({
        date: new Date(time),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseFloat(values['5. volume']),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // ascending
  }

  throw new Error(data['Note'] || data['Error Message'] || 'Failed to fetch data');
}