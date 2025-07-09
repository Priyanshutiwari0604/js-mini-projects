// DOM Elements
const weatherForm = document.getElementById('weatherForm');
const cityInput = document.getElementById('cityInput');
const weatherCard = document.getElementById('weatherCard');
const errorCard = document.getElementById('errorCard');

// Weather display elements
const cityName = document.getElementById('cityName');
const lastUpdated = document.getElementById('lastUpdated');
const temperature = document.getElementById('temperature');
const weatherIcon = document.getElementById('weatherIcon');
const weatherDescription = document.getElementById('weatherDescription');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const coordinates = document.getElementById('coordinates');
const errorMessage = document.getElementById('errorMessage');

// Weather code mappings
const WEATHER_CODES = {
    0: { icon: '☀️', description: 'Clear sky' },
    1: { icon: '🌤️', description: 'Mainly clear' },
    2: { icon: '⛅', description: 'Partly cloudy' },
    3: { icon: '☁️', description: 'Overcast' },
    45: { icon: '🌫️', description: 'Fog' },
    48: { icon: '🌫️', description: 'Depositing rime fog' },
    51: { icon: '🌦️', description: 'Light drizzle' },
    53: { icon: '🌦️', description: 'Moderate drizzle' },
    55: { icon: '🌦️', description: 'Dense drizzle' },
    56: { icon: '🌨️', description: 'Light freezing drizzle' },
    57: { icon: '🌨️', description: 'Dense freezing drizzle' },
    61: { icon: '🌧️', description: 'Slight rain' },
    63: { icon: '🌧️', description: 'Moderate rain' },
    65: { icon: '🌧️', description: 'Heavy rain' },
    66: { icon: '🌨️', description: 'Light freezing rain' },
    67: { icon: '🌨️', description: 'Heavy freezing rain' },
    71: { icon: '❄️', description: 'Slight snow fall' },
    73: { icon: '❄️', description: 'Moderate snow fall' },
    75: { icon: '❄️', description: 'Heavy snow fall' },
    77: { icon: '🌨️', description: 'Snow grains' },
    80: { icon: '🌦️', description: 'Slight rain showers' },
    81: { icon: '🌧️', description: 'Moderate rain showers' },
    82: { icon: '🌧️', description: 'Violent rain showers' },
    85: { icon: '🌨️', description: 'Slight snow showers' },
    86: { icon: '🌨️', description: 'Heavy snow showers' },
    95: { icon: '⛈️', description: 'Thunderstorm' },
    96: { icon: '⛈️', description: 'Thunderstorm with slight hail' },
    99: { icon: '⛈️', description: 'Thunderstorm with heavy hail' }
};

// Application state
let isLoading = false;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Add event listeners
    weatherForm.addEventListener('submit', handleFormSubmit);
    cityInput.addEventListener('input', handleInputChange);
    
    // Focus on input field
    cityInput.focus();
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    if (isLoading) {
        return;
    }
    
    await fetchWeatherData(city);
}

function handleInputChange() {
    // Clear previous error when user starts typing
    if (errorCard.classList.contains('visible')) {
        hideError();
    }
}

async function fetchWeatherData(city) {
    try {
        setLoadingState(true);
        hideError();
        
        // Get coordinates for the city
        const locationData = await getLocationData(city);
        
        // Get weather data
        const weatherData = await getWeatherData(locationData);
        
        // Display the weather information
        displayWeatherData(weatherData, locationData);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(error.message);
    } finally {
        setLoadingState(false);
    }
}

async function getLocationData(city) {
    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    
    if (!response.ok) {
        throw new Error('Unable to connect to location service');
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
        throw new Error('City not found. Please check the spelling and try again.');
    }
    
    return data.results[0];
}

async function getWeatherData(location) {
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
    );
    
    if (!response.ok) {
        throw new Error('Unable to fetch weather data');
    }
    
    const data = await response.json();
    
    if (!data.current) {
        throw new Error('Invalid weather data received');
    }
    
    return data;
}

function displayWeatherData(weatherData, locationData) {
    const current = weatherData.current;
    const weatherCode = current.weather_code;
    const weatherInfo = WEATHER_CODES[weatherCode] || WEATHER_CODES[0];
    
    // Update city information
    cityName.textContent = `${locationData.name}, ${locationData.country}`;
    lastUpdated.textContent = `Updated: ${formatTime(current.time)}`;
    
    // Update current weather
    temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
    weatherIcon.textContent = weatherInfo.icon;
    weatherDescription.textContent = weatherInfo.description;
    
    // Update weather details
    feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
    humidity.textContent = `${current.relative_humidity_2m}%`;
    windSpeed.textContent = `${current.wind_speed_10m} km/h`;
    coordinates.textContent = `${locationData.latitude.toFixed(4)}°, ${locationData.longitude.toFixed(4)}°`;
    
    // Show weather card
    showWeatherCard();
    
    // Clear input
    cityInput.value = '';
}

function showWeatherCard() {
    weatherCard.classList.add('visible');
    errorCard.classList.remove('visible');
}

function showError(message) {
    errorMessage.textContent = message;
    errorCard.classList.add('visible');
    weatherCard.classList.remove('visible');
}

function hideError() {
    errorCard.classList.remove('visible');
}

function setLoadingState(loading) {
    isLoading = loading;
    
    if (loading) {
        weatherCard.classList.add('loading');
        weatherForm.classList.add('loading');
    } else {
        weatherCard.classList.remove('loading');
        weatherForm.classList.remove('loading');
    }
}

function formatTime(timeString) {
    try {
        const date = new Date(timeString);
        return date.toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return 'Unknown';
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle keyboard navigation
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        cityInput.blur();
    }
});

// Handle offline/online status
window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    showError('No internet connection. Please check your network and try again.');
});