// src/App.tsx
import { useState, useEffect, useRef } from 'react';
import {
  ChartCanvas,
  Chart,
  CandlestickSeries,
  XAxis,
  YAxis,
  CrossHairCursor,
  MouseCoordinateX,
  MouseCoordinateY,
  discontinuousTimeScaleProviderBuilder,
  rsi,
  lastVisibleItemBasedZoomAnchor,
  RSISeries,
} from 'react-financial-charts';
import { Search, RefreshCw, Moon, Sun } from 'lucide-react';
import { fetchIntraday, Candle } from './lib/alphaVantage';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('av_key') || '');
  const [symbol, setSymbol] = useState('BTCUSD');
  const [interval, setInterval] = useState('5min');
  const [data, setData] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    if (apiKey) localStorage.setItem('av_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) setWidth(containerRef.current.clientWidth);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = async () => {
    if (!apiKey || !symbol) return;
    setLoading(true);
    setError('');
    try {
      const fetchedData = await fetchIntraday(symbol, apiKey, interval);
      setData(fetchedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey && symbol) {
      loadData();
      intervalRef.current = window.setInterval(loadData, 15000);
    }
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [apiKey, symbol, interval]);

  if (data.length === 0) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'} p-4`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">AlphaChart RFC</h1>
            <div className="flex items-center gap-4">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-700 transition">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="bg-gray-800 dark:bg-gray-800 bg-white p-4 rounded-lg mb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="demo or your key"
                  className="w-full px-3 py-2 bg-gray-700 dark:bg-gray-700 bg-gray-100 text-gray-900 rounded border border-gray-600 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Symbol</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="BTCUSD, AAPL"
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 dark:bg-gray-700 bg-gray-100 text-gray-900 rounded border border-gray-600 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interval</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 dark:bg-gray-700 bg-gray-100 text-gray-900 rounded border border-gray-600 focus:border-blue-500 outline-none"
                >
                  <option value="1min">1 min</option>
                  <option value="5min">5 min</option>
                  <option value="15min">15 min</option>
                  <option value="30min">30 min</option>
                  <option value="60min">60 min</option>
                </select>
              </div>
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
          </div>

          <div className="h-[600px] flex items-center justify-center text-gray-400">
            {loading ? 'Loading...' : 'Enter API key and symbol'}
          </div>
        </div>
      </div>
    );
  }

  const rsiCalculator = rsi().options({ windowSize: 14 }).accessor((d: any) => d.rsi);
  const calculatedData = rsiCalculator(data);

  const ScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor((d: Candle) => d.date);
  const { data: chartData, xScale, xAccessor, displayXAccessor } = ScaleProvider(calculatedData);

  const gridColor = darkMode ? '#374151' : '#e5e7eb';
  const axisColor = darkMode ? '#9ca3af' : '#6b7280';

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'} p-4`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">AlphaChart RFC</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-700 transition">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-gray-800 dark:bg-gray-800 bg-white p-4 rounded-lg mb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="demo or your key"
                className="w-full px-3 py-2 bg-gray-700 dark:bg-gray-700 bg-gray-100 text-gray-900 rounded border border-gray-600 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Symbol</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="BTCUSD, AAPL"
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 dark:bg-gray-700 bg-gray-100 text-gray-900 rounded border border-gray-600 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 dark:bg-gray-700 bg-gray-100 text-gray-900 rounded border border-gray-600 focus:border-blue-500 outline-none"
              >
                <option value="1min">1 min</option>
                <option value="5min">5 min</option>
                <option value="15min">15 min</option>
                <option value="30min">30 min</option>
                <option value="60min">60 min</option>
              </select>
            </div>
          </div>
          {error && (
            <div className="text-red-400 text-sm">
              {error.includes('call frequency') ? (
                <p>Rate limit hit. Using demo key? Wait 1 min or use your own key.</p>
              ) : (
                <p>{error}</p>
              )}
            </div>
          )}
        </div>

        <div ref={containerRef} className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg overflow-hidden">
          <ChartCanvas
            height={600}
            ratio={1}
            width={width}
            margin={{ left: 50, right: 60, top: 10, bottom: 30 }}
            seriesName={symbol}
            data={chartData}
            xScale={xScale}
            xAccessor={xAccessor}
            displayXAccessor={displayXAccessor}
            zoomAnchor={lastVisibleItemBasedZoomAnchor}
          >
            <Chart id={1} yExtents={(d: Candle) => [d.high, d.low]}>
              <XAxis showGridLines strokeStyle={gridColor} tickStrokeStyle={axisColor} />
              <YAxis showGridLines strokeStyle={gridColor} tickStrokeStyle={axisColor} ticks={5} />
              <MouseCoordinateX displayFormat={(d) => new Date(d).toLocaleTimeString()} />
              <MouseCoordinateY at="right" orient="right" displayFormat={(d) => d.toFixed(2)} />
              <CandlestickSeries
                wickStroke={(d: any) => (d.close > d.open ? '#22c55e' : '#ef4444')}
                fill={(d: any) => (d.close > d.open ? '#22c55e' : '#ef4444')}
              />
            </Chart>

            <Chart id={2} height={150} origin={[0, 450]} yExtents={[0, 100]}>
              <XAxis showGridLines strokeStyle={gridColor} tickStrokeStyle={axisColor} />
              <YAxis showGridLines strokeStyle={gridColor} tickStrokeStyle={axisColor} ticks={5} />
              <RSISeries yAccessor={rsiCalculator.accessor()} />
            </Chart>

            <CrossHairCursor strokeStyle="#ffffff" />
          </ChartCanvas>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          Data by Alpha Vantage • Not financial advice • Demo key limited to 25 requests/day
        </div>
      </div>
    </div>
  );
}

export default App;
