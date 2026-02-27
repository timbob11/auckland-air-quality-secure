// Netlify Serverless Function
// This function safely stores your API key and proxies requests to OpenWeatherMap

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get parameters from query string
    const { lat, lon, city } = event.queryStringParameters;

    // Validate parameters
    if (!lat || !lon) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters: lat and lon' })
      };
    }

    // YOUR API KEY GOES HERE (stored securely as an environment variable)
    // In Netlify, you'll set this in: Site settings → Environment variables
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    if (!API_KEY) {
      console.error('OPENWEATHER_API_KEY environment variable is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error: API key not set' })
      };
    }

    // Call OpenWeatherMap API
    const apiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    console.log(`Fetching air quality data for ${city || 'unknown city'} (${lat}, ${lon})`);
    
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `OpenWeatherMap API error: ${response.statusText}` })
      };
    }

    const data = await response.json();

    // Extract the relevant data
    const airQualityData = {
      aqi: data.list[0].main.aqi,
      components: data.list[0].components,
      timestamp: new Date().toISOString(),
      city: city || 'Unknown'
    };

    console.log(`Successfully fetched data for ${city || 'unknown city'}: AQI ${airQualityData.aqi}`);

    // Return the data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(airQualityData)
    };

  } catch (error) {
    console.error('Error in air-quality function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      })
    };
  }
};
