import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import './App.css';

function App() {
  const [currentTemp, setCurrentTemp] = useState('--.-');
  const [temperatureHistory, setTemperatureHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastDataUpdate, setLastDataUpdate] = useState(null);
  const [minTemp, setMinTemp] = useState('--.-');
  const [maxTemp, setMaxTemp] = useState('--.-');

  // Fetch current temperature from the view
const fetchCurrentTemperature = async () => {
  try {
    const { data, error } = await supabase
      .from('temperature_readingss')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    if (data) {
      setCurrentTemp(data.temperature);
      setLastDataUpdate(new Date(data.recorded_at));
    }
  } catch (error) {
    console.error('Error fetching current temperature:', error);
  }
};

  // Fetch temperature history for last 24 hours
  const fetchTemperatureHistory = async () => {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error } = await supabase
        .from('temperature_readingss')
        .select('*')
        .gte('recorded_at', twentyFourHoursAgo.toISOString())
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Format data for display
        const formattedHistory = data.map(entry => {
          const date = new Date(entry.recorded_at);
          return {
            day: date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            }),
            time: date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }),
            hour: date.getHours(),
            temperature: entry.temperature
          };
        });

        setTemperatureHistory(formattedHistory);

        // Calculate min and max
        const temps = data.map(entry => parseFloat(entry.temperature));
        setMinTemp(Math.min(...temps).toFixed(1));
        setMaxTemp(Math.max(...temps).toFixed(1));
      }
    } catch (error) {
      console.error('Error fetching temperature history:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCurrentTemperature();
    fetchTemperatureHistory();

    // Set up real-time subscription
    const subscription = supabase
      .channel('temperature_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'temperature_readingss'
        },
        (payload) => {
          console.log('New temperature reading:', payload);
          // Update current temperature with new data
          setCurrentTemp(payload.new.temperature);
          setLastDataUpdate(new Date(payload.new.recorded_at));
          // Refresh history
          fetchTemperatureHistory();
        }
      )
      .subscribe();

    // Refresh data every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchCurrentTemperature();
      fetchTemperatureHistory();
    }, 5 * 60 * 1000);

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <div className="dashboard">
      <div className="header">
        <div className="header-left">
          <h1 className="title">AfroVax</h1>
          <p className="subtitle">Vaccine Storage</p>
        </div>
        <div className="header-right">
          <p className="last-updated-label">Last Updated</p>
          <p className="last-updated-time">
            {lastDataUpdate 
              ? lastDataUpdate.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false 
                })
              : currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false 
                })
            }
          </p>
        </div>
      </div>

      <div className="main-content">
        <div className="temperature-card">
          <p className="current-label">Current Temperature</p>
          <div className="temperature-display">
            <span className="temperature-number">{currentTemp}</span>
            <span className="temperature-unit">°C</span>
          </div>
          <div className="stats-grid">
            <div className="stat">
              <p className="stat-label">24h Minimum</p>
              <p className="stat-value">{minTemp}°C</p>
            </div>
            <div className="stat">
              <p className="stat-label">24h Maximum</p>
              <p className="stat-value">{maxTemp}°C</p>
            </div>
          </div>
        </div>

        <div className="history-card">
          <h2 className="history-title">24-Hour Temperature History</h2>
          <div className="history-grid">
            {temperatureHistory.length > 0 ? (
              temperatureHistory.map((entry, index) => (
                <div key={index} className="history-slot">
                  <div className="slot-time">
                    <span className="slot-hour">{entry.hour.toString().padStart(2, '0')}:00</span>
                    <span className="slot-date">{entry.day}</span>
                  </div>
                  <div className="slot-temp">
                    <span className="slot-temp-value">{entry.temperature}°C</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#64748b', gridColumn: '1 / -1' }}>
                No temperature data available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
