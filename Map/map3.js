const apiKey = 'd4c9cb1c5d6e28d97b0022787336707b';

// Initialize the map
const map = L.map('map').setView([30.9, 75.85], 5);
let currentCondition = 'temperature';
let lastWeatherData = null;
let windAnimationEnabled = false;

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
}).addTo(map);

const icons = {
  temperature: '🌡️',
  aqi: '🌍',
  humidity: '💧',
  wind: '💨',
  visibility: '👓'
};    
function getAQIColor(aqi) {
  if (aqi === 1) return '#00FF00'; 
  if (aqi === 2) return '#7CFC00'; 
  if (aqi === 3) return '#FFFF00'; 
  if (aqi === 4) return '#FFA500'; 
  return '#FF0000'; 
}

// Function to fetch AQI data for a specific location
async function fetchAQI(lat, lon) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    const data = await response.json();
    return data.list[0]?.main.aqi;
  } catch (error) {
    console.error("Error fetching AQI data:", error);
    return undefined;
  }
}

// Function to fetch weather data for a specific location
async function fetchWeatherData(lat, lon) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return undefined;
  }
}

// Set the selected condition and update the popup without re-fetching data
function selectCondition(condition) {
  currentCondition = condition;
  if (lastWeatherData) {
    updatePopupContent(lastWeatherData);
  }
}

// Update popup content based on the selected condition
function updatePopupContent(weatherData) {
  const { name, main, wind, visibility, coord } = weatherData;

  let content = `<strong>${name || 'Location'}</strong><br/>`;

  // Log to check if main.temp is present
  console.log("Weather Data:", weatherData);

  // Add icon based on selected condition
  content += `<span style="font-size: 1.2em;">${icons[currentCondition]} </span>`;

  switch (currentCondition) {
    case 'temperature':
      content += `Temperature: ${main?.temp !== undefined ? main.temp + '°C' : 'Data not available'}`;
      break;
    case 'aqi':
      content += `AQI: ${weatherData.aqi !== undefined ? weatherData.aqi : 'N/A'}`;
      break;
    case 'humidity':
      content += `Humidity: ${main.humidity}%`;
      break;
    case 'wind':
      content += `Wind Speed: ${wind.speed} m/s`;
      break;
    case 'visibility':
      content += `Visibility: ${(visibility / 1000).toFixed(1)} km`; // Convert meters to kilometers
      break;
    default:
      content += 'No data';
  }

  const bgColor = currentCondition === 'aqi' ? getAQIColor(weatherData.aqi) : '#333';

  L.popup({ className: 'condition-popup' })
    .setLatLng([coord.lat, coord.lon])
    .setContent(`
      <div style="
        background: ${bgColor}; 
        padding: 10px;
        border-radius: 10px;
        color: white;
        text-align: center;
        width: 200px;">
        ${content}
      </div>
    `)
    .openOn(map);
}

// Display selected condition on map click
map.on('click', async (e) => {
  const { lat, lng } = e.latlng;
  const weatherData = await fetchWeatherData(lat, lng);
  const aqi = await fetchAQI(lat, lng);
  
  if (weatherData) {
    weatherData.aqi = aqi; // Attach AQI data to weather data
    lastWeatherData = weatherData; // Store data for reuse

    document.getElementById('location-input').value = weatherData.name || 'Selected Location';
    updatePopupContent(weatherData); 
  }
});

// Search for a location and display selected weather condition
async function searchLocation() {
  const location = document.getElementById('location-input').value;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const { coord: { lat, lon } } = data;
    const aqi = await fetchAQI(lat, lon);

    data.aqi = aqi; 
    lastWeatherData = data; 

    map.setView([lat, lon], 10); 
    updatePopupContent(data); 
  } catch (error) {
    console.error("Error searching location:", error);
  }
}

// References to popup and its content
const popup = document.getElementById("popup");
const locationName = document.getElementById("location-name");
const updateTime = document.getElementById("update-time");
const aqiValue = document.getElementById("aqi-value");
const aqiStatus = document.getElementById("aqi-status");
const primaryPollutant = document.getElementById("primary-pollutant");
const healthAdvisory = document.getElementById("health-advisory");

// AQI categories and health advisories
const aqiCategories = [
    "Good",
    "Moderate",
    "Unhealthy for Sensitive Groups",
    "Unhealthy",
    "Very Unhealthy",
    "Hazardous"
];

const healthAdvisories = [
    "Air quality is good.",
    "Some pollutants may affect sensitive groups.",
    "Unhealthy for sensitive groups. Limit outdoor activities.",
    "Everyone may begin to experience health effects.",
    "Very unhealthy. Limit exposure to outdoor air.",
    "Health alert. Avoid outdoor air completely."
];

// Function to fetch AQI data and update the popup
async function fetchAQI(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=d4c9cb1c5d6e28d97b0022787336707b`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Extract AQI data
        const aqi = data.list[0].main.aqi;
        const pm25 = data.list[0].components.pm2_5;

        // Update popup content
        locationName.innerText = `Lat: ${lat}, Lon: ${lon}`;
        updateTime.innerText = `Updated at: ${new Date().toLocaleString()}`;
        aqiValue.innerText = aqi;
        aqiStatus.innerText = aqiCategories[aqi - 1];
        primaryPollutant.innerText = `Primary Pollutant: PM2.5 ${pm25} µg/m³`;
        healthAdvisory.innerText = healthAdvisories[aqi - 1];

        // Show popup
        popup.style.display = "block";
    } catch (error) {
        console.error("Error fetching AQI data:", error);
    }
}

// Search Button Event Listener
document.getElementById("search-btn").addEventListener("click", () => {
    const location = document.getElementById("location-input").value;

    // Mock coordinates for demonstration
    const lat = 30.32;
    const lon = 76.38; 
    fetchAQI(lat, lon);
});

// Map Click Event Listener
document.getElementById("map").addEventListener("click", (event) => {
    const lat = 30.32; 
    const lon = 76.38;

    fetchAQI(lat, lon);
});



// Function to show the AQI card with details on the map
function showAQICard(location, aqi, status, primaryPollutant, advisory, updateTime, lat, lon) {
  const card = document.getElementById("aqi-card");
  const locationName = document.getElementById("location-name");
  const updateTimeElem = document.getElementById("update-time");
  const aqiValue = document.getElementById("aqi-value");
  const aqiStatus = document.getElementById("aqi-status");
  const primaryPollutantElem = document.getElementById("primary-pollutant");
  const healthAdvisory = document.getElementById("health-advisory");

  // Populate card content
  locationName.innerText = location;
  updateTimeElem.innerText = `Updated at: ${updateTime}`;
  aqiValue.innerText = `AQI: ${aqi}`;
  aqiStatus.innerText = status;
  primaryPollutantElem.innerText = `Primary Pollutant: ${primaryPollutant}`;
  healthAdvisory.innerText = advisory;

  // Set position of the card on the map (use the coordinates to position it)
  const mapContainer = document.getElementById("map"); 
  const mapBounds = mapContainer.getBoundingClientRect();
  const x = (lon + 180) * (mapContainer.offsetWidth / 360);
  const y = (90 - lat) * (mapContainer.offsetHeight / 180); 

  // Position the card over the map
  card.style.left = `${x}px`;
  card.style.top = `${y}px`;

  // Show the card
  card.classList.remove("hidden");
}

// Close the AQI card when the close button is clicked
document.getElementById("close-card-btn").addEventListener("click", () => {
  const card = document.getElementById("aqi-card");
  card.classList.add("hidden"); 
});

// Example: Show the card on a map click (replace this with your actual map click logic)
map.on('click', function(event) {
  const location = "Rajpura, Punjab"; 
  const aqi = 5;
  const status = "Very Unhealthy";
  const primaryPollutant = "PM2.5";
  const advisory = "Prolonged exposure may lead to respiratory illness, especially for those with lung/heart conditions.";
  const updateTime = "Wed 20, 2 PM GMT+5:30";
  const lat = event.latlng.lat; 
  const lon = event.latlng.lng; 
  
  // Call the function to show the card with the data
  showAQICard(location, aqi, status, primaryPollutant, advisory, updateTime, lat, lon);
});

// Add wind animation overlay to the map
const windOverlay = document.createElement('div');
windOverlay.className = 'wind-animation';
document.getElementById('map').appendChild(windOverlay);

// Toggle wind animation on/off
function toggleWindAnimation() {
  windAnimationEnabled = document.getElementById('wind-toggle').checked;
  windOverlay.style.display = windAnimationEnabled ? 'block' : 'none';
}


