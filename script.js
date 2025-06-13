// WeatherWise - Professional Weather App

const API_BASE_URL = 'http://127.0.0.1:5000';

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the datetime display
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
    
    // Setup event listeners
    document.getElementById('getWeatherBtn').addEventListener('click', getWeather);
    document.getElementById('locationBtn').addEventListener('click', getUserLocation);
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Setup search form submission
    const searchForm = document.querySelector('form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            getWeather();
        });
    }
    
    // Load dark mode preference from localStorage
    loadDarkModePreference();
    
    // Load search history
    loadSearchHistory();

    // Get weather for user's location on page load
    getUserLocation();
});

// Toggle Dark Mode Function
function toggleDarkMode() {
    const body = document.body;
    const isDarkMode = body.classList.toggle('dark-mode');
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode);
    
    // Update toggle icon
    const darkModeIcon = document.getElementById('darkModeIcon');
    if (darkModeIcon) {
        darkModeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Load Dark Mode Preference
function loadDarkModePreference() {
    const darkModePreference = localStorage.getItem('darkMode');
    
    if (darkModePreference === 'true') {
        document.body.classList.add('dark-mode');
        const darkModeIcon = document.getElementById('darkModeIcon');
        if (darkModeIcon) {
            darkModeIcon.className = 'fas fa-sun';
        }
    }
}

// Update Date and Time Display
function updateDateTime() {
    const datetimeElement = document.getElementById('datetime');
    if (datetimeElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        datetimeElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Get Weather Data by City Name
async function getWeather() {
    // Show loader
    showLoader();
    
    // Clear previous error messages
    clearError();
    
    // Get city input
    const cityInput = document.getElementById('city');
    const city = cityInput ? cityInput.value.trim() : '';
    
    if (!city) {
        showError('Please enter a city name');
        hideLoader();
        return;
    }
    
    try {
        // Fetch current weather data
        const weatherData = await fetchWeatherData(city);
        if (!weatherData) return; // Error already handled in fetchWeatherData
        
        // Fetch forecast data
        const forecastData = await fetchForecastData(city);
        
        // Update UI with weather data
        updateWeatherUI(weatherData, forecastData);
        
        // Save to search history
        saveToSearchHistory(city);
        
        // Hide loader
        hideLoader();
    } catch (error) {
        console.error('Error in getWeather:', error);
        showError('Failed to fetch weather data. Please try again.');
        hideLoader();
    }
}

// Get User's Location
function getUserLocation() {
    showLoader();
    clearError();
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    
                    // Fetch weather data by coordinates
                    const weatherData = await fetchWeatherByCoordinates(lat, lon);
                    if (!weatherData) return; // Error already handled
                    
                    // Fetch forecast data by coordinates
                    const forecastData = await fetchForecastByCoordinates(lat, lon);
                    
                    // Update UI
                    updateWeatherUI(weatherData, forecastData);
                    
                    // Save to search history if city name is available
                    if (weatherData.name) {
                        saveToSearchHistory(weatherData.name);
                        
                        // Update city input field
                        const cityInput = document.getElementById('city');
                        if (cityInput) cityInput.value = weatherData.name;
                    }
                    
                    hideLoader();
                } catch (error) {
                    console.error('Error getting weather by location:', error);
                    showError('Failed to get weather for your location');
                    hideLoader();
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMsg = 'Failed to get your location';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = 'Location access denied. Please enable location services.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMsg = 'Location request timed out.';
                        break;
                }
                
                showError(errorMsg);
                hideLoader();
            }
        );
    } else {
        showError('Geolocation is not supported by your browser');
        hideLoader();
    }
}

// Fetch current weather data
async function fetchWeatherData(city) {
    try {
        // Use our Flask proxy endpoint instead of calling OpenWeatherMap directly
        const url = `${API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`;
        console.log('Fetching weather from:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.cod === 200) {
            return data;
        } else {
            showError(`City not found: ${data.message || 'Please check the city name'}`);
            hideLoader();
            return null;
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Error connecting to weather service. Please try again.');
        hideLoader();
        return null;
    }
}

// Fetch forecast data
async function fetchForecastData(city) {
    try {
        // Use our Flask proxy endpoint instead of calling OpenWeatherMap directly
        const url = `${API_BASE_URL}/api/forecast?city=${encodeURIComponent(city)}`;
        console.log('Fetching forecast from:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.cod === '200') {
            return data;
        } else {
            console.error('Forecast data error:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error fetching forecast data:', error);
        return null;
    }
}

// Fetch weather by coordinates
async function fetchWeatherByCoordinates(lat, lon) {
    try {
        // Use our Flask proxy endpoint instead of calling OpenWeatherMap directly
        const url = `${API_BASE_URL}/api/weather/coordinates?lat=${lat}&lon=${lon}`;
        console.log('Fetching weather by coordinates from:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.cod === 200) {
            return data;
        } else {
            showError(`Location error: ${data.message || 'Unable to get weather for your location'}`);
            hideLoader();
            return null;
        }
    } catch (error) {
        console.error('Error fetching weather by coordinates:', error);
        showError('Error connecting to weather service. Please try again.');
        hideLoader();
        return null;
    }
}

// Fetch forecast by coordinates
async function fetchForecastByCoordinates(lat, lon) {
    try {
        // Use our Flask proxy endpoint instead of calling OpenWeatherMap directly
        const url = `${API_BASE_URL}/api/forecast/coordinates?lat=${lat}&lon=${lon}`;
        console.log('Fetching forecast by coordinates from:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.cod === '200') {
            return data;
        } else {
            console.error('Forecast data error:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error fetching forecast by coordinates:', error);
        return null;
    }
}

// Update Weather UI
function updateWeatherUI(weatherData, forecastData) {
    if (!weatherData) return;
    
    // Update weather information
    const weatherInfo = document.getElementById('weather-info');
    if (weatherInfo) {
        // Format the weather data HTML
        weatherInfo.innerHTML = `
            <div class="weather-card">
                <div class="weather-header">
                    <h2>${weatherData.name}, ${weatherData.sys.country}</h2>
                    <p class="weather-date">${formatDate(new Date())}</p>
                </div>
                <div class="weather-body">
                    <div class="weather-temp">
                        <h1>${Math.round(weatherData.main.temp)}°C</h1>
                        <p>Feels like: ${Math.round(weatherData.main.feels_like)}°C</p>
                    </div>
                    <div class="weather-description">
                        <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png" alt="${weatherData.weather[0].description}">
                        <p>${weatherData.weather[0].description}</p>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="weather-detail">
                        <i class="fas fa-wind"></i>
                        <p>Wind: ${weatherData.wind.speed} m/s</p>
                    </div>
                    <div class="weather-detail">
                        <i class="fas fa-tint"></i>
                        <p>Humidity: ${weatherData.main.humidity}%</p>
                    </div>
                    <div class="weather-detail">
                        <i class="fas fa-thermometer-half"></i>
                        <p>Pressure: ${weatherData.main.pressure} hPa</p>
                    </div>
                    <div class="weather-detail">
                        <i class="fas fa-eye"></i>
                        <p>Visibility: ${(weatherData.visibility / 1000).toFixed(1)} km</p>
                    </div>
                </div>
            </div>
        `;
        weatherInfo.style.display = 'block';
    }
    
    // Update forecast section
    const forecastSection = document.querySelector('.forecast-section');
    if (forecastSection && forecastData) {
        forecastSection.style.display = 'block';
        
        const forecastContainer = document.getElementById('forecast-container');
        if (forecastContainer) {
            // Clear previous forecast
            forecastContainer.innerHTML = '';
            
            // Get forecasts for different days (one per day)
            const dailyForecasts = getUniqueDailyForecasts(forecastData.list);
            
            // Create forecast cards
            dailyForecasts.forEach(forecast => {
                const forecastDate = new Date(forecast.dt * 1000);
                const dayName = forecastDate.toLocaleDateString('en-US', { weekday: 'short' });
                
                const forecastCard = document.createElement('div');
                forecastCard.className = 'forecast-card';
                forecastCard.innerHTML = `
                    <div class="forecast-day">${dayName}</div>
                    <div class="forecast-icon">
                        <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="${forecast.weather[0].description}">
                    </div>
                    <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
                    <div class="forecast-desc">${forecast.weather[0].description}</div>
                `;
                
                forecastContainer.appendChild(forecastCard);
            });
        }
    }
    
    // Update chart section
    updateWeatherChart(weatherData, forecastData);
    
    // Show forecast and chart containers
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        container.style.display = 'block';
    });
}

// Get unique daily forecasts (one forecast per day)
function getUniqueDailyForecasts(forecastList) {
    if (!forecastList || !Array.isArray(forecastList) || forecastList.length === 0) {
        return [];
    }
    
    const dailyForecasts = [];
    const seenDates = new Set();
    
    for (const forecast of forecastList) {
        const forecastDate = new Date(forecast.dt * 1000);
        const dateString = forecastDate.toDateString();
        
        if (!seenDates.has(dateString)) {
            seenDates.add(dateString);
            dailyForecasts.push(forecast);
            
            // Limit to 5 days
            if (dailyForecasts.length >= 5) break;
        }
    }
    
    return dailyForecasts;
}

// Update Weather Chart
function updateWeatherChart(weatherData, forecastData) {
    if (!forecastData || !forecastData.list || !Array.isArray(forecastData.list)) {
        return;
    }
    
    // Get canvas context
    const canvas = document.getElementById('weatherChart');
    if (!canvas) return;
    
    // Destroy previous chart if it exists
    if (window.weatherChart) {
        window.weatherChart.destroy();
    }
    
    // Prepare data for the chart
    const timestamps = [];
    const temperatures = [];
    const humidities = [];
    
    // Use first 8 entries (24 hours) from forecast data
    const hourlyData = forecastData.list.slice(0, 8);
    
    hourlyData.forEach(data => {
        const date = new Date(data.dt * 1000);
        timestamps.push(date.toLocaleTimeString('en-US', { hour: '2-digit' }));
        temperatures.push(Math.round(data.main.temp));
        humidities.push(data.main.humidity);
    });
    
    // Create the chart
    window.weatherChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: temperatures,
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Humidity (%)',
                    data: humidities,
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '24-Hour Forecast',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
    
    // Update forecast chart
    updateForecastChart(forecastData);
}

// Update Forecast Chart
function updateForecastChart(forecastData) {
    if (!forecastData || !forecastData.list || !Array.isArray(forecastData.list)) {
        return;
    }
    
    // Get canvas context
    const canvas = document.getElementById('forecastChart');
    if (!canvas) return;
    
    // Destroy previous chart if it exists
    if (window.forecastChart) {
        window.forecastChart.destroy();
    }
    
    // Get unique daily forecasts
    const dailyForecasts = getUniqueDailyForecasts(forecastData.list);
    
    // Prepare data for the chart
    const days = [];
    const maxTemps = [];
    const minTemps = [];
    
    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        maxTemps.push(Math.round(forecast.main.temp_max));
        minTemps.push(Math.round(forecast.main.temp_min));
    });
    
    // Create the chart
    window.forecastChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                {
                    label: 'Max Temperature (°C)',
                    data: maxTemps,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Min Temperature (°C)',
                    data: minTemps,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '5-Day Temperature Forecast',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Save to Search History
function saveToSearchHistory(city) {
    if (!city) return;
    
    // Get existing history or initialize empty array
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // Remove if already exists (to avoid duplicates)
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== city.toLowerCase());
    
    // Add to beginning of array
    searchHistory.unshift(city);
    
    // Keep only most recent 5 searches
    searchHistory = searchHistory.slice(0, 5);
    
    // Save back to localStorage
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    
    // Update history display
    displaySearchHistory(searchHistory);
}

// Load Search History
function loadSearchHistory() {
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    displaySearchHistory(searchHistory);
}

// Display Search History
function displaySearchHistory(history) {
    const historyContainer = document.getElementById('searchHistory');
    if (!historyContainer) return;
    
    // Clear current history
    historyContainer.innerHTML = '';
    
    // Display history items
    if (history.length > 0) {
        document.querySelector('.history-section').style.display = 'block';
        
        history.forEach(city => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = city;
            historyItem.addEventListener('click', () => {
                document.getElementById('city').value = city;
                getWeather();
            });
            
            historyContainer.appendChild(historyItem);
        });
    } else {
        document.querySelector('.history-section').style.display = 'none';
    }
}

// Format Date
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Utility Functions
function showLoader() {
    const loader = document.getElementById('customLoader');
    if (loader) {
        loader.style.display = 'flex';
    }
}

function hideLoader() {
    const loader = document.getElementById('customLoader');
    if (loader) {
        loader.style.display = 'none';
    }
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.parentElement.style.display = 'block';
    }
}

function clearError() {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.parentElement.style.display = 'none';
    }
}
