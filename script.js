let map;
let currentMarkers = [];
// URL of your Apps Script web app that serves JSON
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyEPikMZ0IYuMbhMG2SX7vPJSUtCKHQ2URTE3fK_TnTpHc6Qo4CcdqZW_1PriKlk8U3/exec"; 
const REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes in milliseconds

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -33.8688, lng: 151.2093 }, // Center on Sydney
    zoom: 10,
  });

  document.getElementById('weekdayFilter').addEventListener('change', applyAndDisplayFilters);
  
  fetchEvents(); // Initial fetch
  setInterval(fetchEvents, REFRESH_INTERVAL); // Periodic refresh
}

async function fetchEvents() {
  console.log("Fetching events...");
  try {
    const response = await fetch(SCRIPT_URL);
    if (!response.ok) {
      console.error("Error fetching events:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      // Potentially display an error message on the map to the user
      return;
    }
    const events = await response.json();
    if (events.error) {
        console.error("Error from script:", events.error);
        return;
    }
    console.log("Events fetched:", events);
    updateMapMarkers(events);
  } catch (error) {
    console.error("Failed to fetch or process events:", error);
  }
}

function applyAndDisplayFilters() {
  if (!allEvents || allEvents.length === 0) {
    updateMapMarkers([]); // Clear map if no events
    return;
  }

  let filteredEvents = [...allEvents]; // Start with a copy of all events

  // Apply Weekday Filter
  const selectedWeekday = document.getElementById('weekdayFilter').value;
  if (selectedWeekday !== "all") {
    filteredEvents = filteredEvents.filter(event => event.weekday === selectedWeekday);
  }

  // TODO: Implement other filters (date range, category) here
  // Example for a hypothetical category filter:
  // const selectedCategory = document.getElementById('categoryFilter').value;
  // if (selectedCategory !== "all") {
  //   filteredEvents = filteredEvents.filter(event => event.category === selectedCategory);
  // }

  console.log("Applying filters. Displaying events:", filteredEvents.length);
  updateMapMarkers(filteredEvents); // Update map with filtered events
}

function updateMapMarkers(eventsToDisplay) { 
  console.log("Inside updateMapMarkers. Number of events to display:", eventsToDisplay.length);

  currentMarkers.forEach(marker => marker.setMap(null));
  currentMarkers = [];
  const infowindow = new google.maps.InfoWindow();

  eventsToDisplay.forEach(event => {
    if (event.lat == null || event.lng == null || isNaN(parseFloat(event.lat)) || isNaN(parseFloat(event.lng))) {
        console.warn("Skipping event with missing or invalid coordinates:", event.name, event.lat, event.lng);
        return; 
    }

    const marker = new google.maps.Marker({
      position: { lat: event.lat, lng: event.lng },
      map: map,
      title: event.name,
    });

    marker.addListener("click", () => {
      let content = `<h3>${event.name}</h3>`;
      content += `<p><strong>Date:</strong> <span class="math-inline">\{event\.date\} \(</span>{event.weekday})</p>`;
      content += `<p><strong>Time:</strong> ${event.time}</p>`;
      content += `<p><strong>Location:</strong> ${event.location}</p>`;
      content += `<p><a href="${directionsUrl}" target="_blank" title="Open directions in Google Maps">Get Directions</a></p>`; 
      
      if (event.description) {
        content += `<hr><p>${event.description.replace(/\n/g, "<br>")}</p>`;
      }
      infowindow.setContent(content);
      infowindow.open(map, marker);
    });
    currentMarkers.push(marker);
  });
  console.log("Total markers on map:", currentMarkers.length);  
}
