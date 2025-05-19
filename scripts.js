// ================MAIN================

if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/sw.js")
        .then((serviceWorker) => {
            console.log("Service Worker registered: ", serviceWorker);
        })
        .catch((error) => {
            console.error("Error registering the Service Worker: ", error);
        });
}
const homeView = document.getElementById("home-view");
const searchView = document.getElementById("search-view");
const weatherView = document.getElementById("weather-view");
const notFoundMessage = document.getElementById("notFoundMessage");
const notFoundMessageWeather = document.getElementById(
    "notFoundMessageWeather"
);
notFoundMessage.hidden = true;
notFoundMessageWeather.hidden = true;
homeView.hidden = false;
searchView.hidden = true;
weatherView.hidden = true;
document.getElementById("navHomeButton").addEventListener("click", (event) => {
    event.preventDefault();
    homeView.hidden = false;
    searchView.hidden = true;
    weatherView.hidden = true;
});

document
    .getElementById("navSearchButton")
    .addEventListener("click", (event) => {
        event.preventDefault();
        searchView.hidden = false;
        homeView.hidden = true;
        weatherView.hidden = true;
    });

document
    .getElementById("navWeatherButton")
    .addEventListener("click", (event) => {
        event.preventDefault();
        weatherView.hidden = false;
        homeView.hidden = true;
        searchView.hidden = true;
    });

// ================ SEARCH =================

const searchWeather = () => {
    getLocation().then((data) => {
        if (data == undefined) {
            notFoundMessage.hidden = false;
        } else {
            notFoundMessage.hidden = true;
            saveCityToIndexedDB(data);
            console.log("City saved to IndexedDB:", data.name);
        }
    });
};

const updateHistoryList = () => {
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = ""; // Clear the list

    const historyListButtons = document.getElementById("historyListButtons");
    historyListButtons.innerHTML = ""; // Clear the buttons

    getCitiesFromIndexedDB().then((cities) => {
        if (cities == undefined) {
            console.error("No cities found in IndexedDB");
            return;
        }
        cities.forEach((city) => {
            const li = document.createElement("li");
            li.textContent = `${city.name}, ${city.country}, lat: ${city.lat}, lon: ${city.lon}`;
            historyList.appendChild(li);

            const button = document.createElement("li");
            button.textContent = `${city.name}, ${city.country}, lat: ${city.lat}, lon: ${city.lon}`;
            button.addEventListener("click", () => getWeatherClick(city));
            historyListButtons.appendChild(button);
        });
    });
};

// ================ DATABASE ================= indexedDB

//Open database

let db;
const request = window.indexedDB.open("WeatherDB", 1);
request.onerror = (event) => {
    console.error("Error opening IndexedDB:", event.target.error);
};

request.onsuccess = (event) => {
    console.log("IndexedDB opened successfully:", event.target.result);
    db = event.target.result;
};

request.onupgradeneeded = (event) => {
    const dbUpgrade = event.target.result;
    // Tworzymy store, jeśli nie istnieje
    if (!dbUpgrade.objectStoreNames.contains("cities")) {
        const store = dbUpgrade.createObjectStore("cities", {
            keyPath: "id",
        });
        store.createIndex("name", "name", { unique: false });
    }
};
const saveCityToIndexedDB = (city) => {
    if (!db) {
        console.error("IndexedDB is not initialized yet.");
        return undefined;
    }
    const tx = db.transaction("cities", "readwrite");
    const store = tx.objectStore("cities");

    // Tworzymy unikatowy klucz z miasta i kraju
    const id = `${city.name}_${city.country}`;

    // Dodajemy rekord
    store.put({
        id: id,
        name: city.name,
        country: city.country,
        lat: city.lat,
        lon: city.lon,
        savedAt: new Date().toISOString(),
    });

    tx.oncomplete = function () {
        console.log("City saved in IndexedDB:", city.name);
        updateHistoryList();
        return city.name;
    };

    tx.onerror = function (err) {
        console.error("Error saving to IndexedDB:", err);
        return undefined;
    };
};

// Call updateHistoryList after IndexedDB is initialized (after onsuccess)
request.onsuccess = (event) => {
    console.log("IndexedDB opened successfully:", event.target.result);
    db = event.target.result;
    updateHistoryList(); // <-- This will update the history list after page refresh
};

const getCitiesFromIndexedDB = () => {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error("IndexedDB is not initialized yet.");
            resolve(undefined);
            return;
        }
        const tx = db.transaction("cities", "readonly");
        const store = tx.objectStore("cities");

        const request = store.getAll();

        request.onsuccess = (event) => {
            const cities = event.target.result;
            console.log("Cities from IndexedDB:", cities);
            resolve(cities);
            // Możesz teraz użyć danych o miastach
            // np. wyświetlić je na stronie
        };

        request.onerror = (err) => {
            console.error("Error fetching from IndexedDB:", err);
            resolve(undefined);
        };
    });
};

// ================ WEATHER =================

const API_KEY = "a7d6d47e335165faab25fbc1824f728b";
console.log("API_KEY: ", API_KEY);

const getLocation = () => {
    const city = document.getElementById("searchCity").value;
    const countryCode = document.getElementById("searchCountry").value;
    const API_LOCATION_URL = `http://api.openweathermap.org/geo/1.0/direct?q=${city},${countryCode}&limit=1&appid=${API_KEY}`;
    return fetch(API_LOCATION_URL)
        .then((response) => {
            if (!response.ok) throw new Error("Location not found");
            return response.json();
        })
        .then((data) => {
            console.log("Found location:", data);
            if (data.length === 0) {
                return undefined;
            }
            return {
                name: data[0].name,
                country: data[0].country,
                lat: data[0].lat,
                lon: data[0].lon,
            };
            // You can now use the location data
        })
        .catch((error) => {
            console.error("Error fetching location:", error);
        });
};
const getWeather = (lat, lon) => {
    const API_WEATHER_URL = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&lang=pl&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}`;
    return fetch(API_WEATHER_URL)
        .then((response) => {
            if (!response.ok) throw new Error("Weather not found");
            return response.json();
        })
        .then((data) => {
            console.log("Found weather:", data);
            return data; // Return the weather data for further use
        })
        .catch((error) => {
            console.error("Error fetching weather:", error);
            return undefined;
        });
};
const getWeatherClick = (event) => {
    const weatherDataContainer = document.getElementById("weatherData");
    weatherDataContainer.innerHTML = ""; // Clear the previous data
    getWeather(event.lat, event.lon)
        .then((data) => {
            if (data == undefined) {
                notFoundMessageWeather.hidden = false;
            } else {
                notFoundMessageWeather.hidden = true;
                const weatherData = document.createElement("div");
                weatherData.innerHTML = `
                    <h2>Pogoda w ${event.name}, ${event.country}</h2>
                    <p>Temperatura: ${(data.current.temp - 273.15).toFixed(
                        2
                    )}°C</p>
                    <p>Wilgotność: ${data.current.humidity}%</p>
                    <p>Prędkość wiatru: ${data.current.wind_speed} m/s</p>
                `;
                weatherDataContainer.appendChild(weatherData);
            }
        })
        .catch((error) => {
            console.error("Error fetching weather:", error);
        });
    console.log(event);
};
