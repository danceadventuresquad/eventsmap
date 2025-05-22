let map;
let currentMarkers = [];
// URL of your Apps Script web app that serves JSON
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyEPikMZ0IYuMbhMG2SX7vPJSUtCKHQ2URTE3fK_TnTpHc6Qo4CcdqZW_1PriKlk8U3/exec"; 
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -33.8688, lng: 151.2093 }, // Center on Sydney
    zoom: 10,
  });
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

function updateMapMarkers(events) {
  // Clear existing markers
  currentMarkers.forEach(marker => marker.setMap(null));
  currentMarkers = [];

  const infowindow = new google.maps.InfoWindow();

  events.forEach(event => {
    if (event.lat == null || event.lng == null) {
        console.warn("Skipping event with missing coordinates:", event.name);
        return; // Skip if no lat/lng
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
      if (event.description) {
        content += `<hr><p>${event.description.replace(/\n/g, "<br>")}</p>`;
      }
      infowindow.setContent(content);
      infowindow.open(map, marker);
    });
    currentMarkers.push(marker);
  });
}
