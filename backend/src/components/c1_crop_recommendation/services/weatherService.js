const { env } = require('../../../config/env');
const { logger } = require('../../../shared/utils/logger');

/**
 * OpenWeather API Integration Service for Component 1
 * Retrieves current and forecast meteorological observations for Sri Lankan farming locations.
 */
class WeatherService {
  constructor() {
    this.apiKey = env.OPENWEATHER_API_KEY || '';
    this.timeoutMs = env.OPENWEATHER_TIMEOUT_MS || 10000;
    this.cache = new Map();
    this.cacheTtlMs = 15 * 60 * 1000; // 15-minute observation cache
  }

  /**
   * Fetch weather observations for coordinates or district
   * @param {object} location { latitude, longitude, district }
   * @returns {Promise<object|null>} Standardized weather context or null if unavailable
   */
  async getWeatherForLocation({ latitude, longitude, district }) {
    if (!this.apiKey) {
      logger.debug('OpenWeather API key not configured; weather feature enrichment skipped.');
      return null;
    }

    const cacheKey = latitude && longitude
      ? `${latitude.toFixed(2)}_${longitude.toFixed(2)}`
      : district ? district.toLowerCase() : null;

    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTtlMs) {
        logger.debug({ cacheKey }, 'Returning cached OpenWeather observation');
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      let queryUrl = '';
      if (latitude !== undefined && longitude !== undefined) {
        queryUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${this.apiKey}`;
      } else if (district) {
        queryUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(district)},LK&units=metric&appid=${this.apiKey}`;
      } else {
        return null;
      }

      const response = await fetch(queryUrl, {
        signal: AbortSignal.timeout(this.timeoutMs)
      });

      if (!response.ok) {
        logger.warn(
          { status: response.status, statusText: response.statusText },
          'OpenWeather API returned non-2xx response'
        );
        return null;
      }

      const raw = await response.json();

      const weatherResult = {
        temperature: raw.main ? raw.main.temp : null,
        humidity: raw.main ? raw.main.humidity : null,
        rainfall: raw.rain ? (raw.rain['1h'] || raw.rain['3h'] || 0.0) : 0.0,
        provenance: {
          source: 'OpenWeather',
          stationName: raw.name || district || 'Sri Lanka Station',
          coordinates: {
            latitude: raw.coord ? raw.coord.lat : latitude,
            longitude: raw.coord ? raw.coord.lon : longitude
          },
          observationTimestamp: raw.dt ? new Date(raw.dt * 1000).toISOString() : new Date().toISOString()
        }
      };

      if (cacheKey) {
        this.cache.set(cacheKey, { timestamp: Date.now(), data: weatherResult });
      }

      return weatherResult;
    } catch (err) {
      logger.warn({ error: err.message }, 'Failed to retrieve meteorological data from OpenWeather');
      return null;
    }
  }
}

module.exports = new WeatherService();
