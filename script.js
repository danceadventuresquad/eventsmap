// At the top of script.js
let map;
let currentMarkers = []; // This will now store AdvancedMarkerElement instances
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyEPikMZ0IYuMbhMG2SX7vPJSUtCKHQ2URTE3fK_TnTpHc6Qo4CcdqZW_1PriKlk8U3/exec";
const REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes
let allEvents = [];
let AdvancedMarkerElement; // To store the class after importing

// Make initMap an async function to use await for importLibrary
async function initMap() {
  try {
    // Import the 'maps' library for the Map class
    const { Map } = await google.maps.importLibrary("maps");
    // Import the 'marker' library for AdvancedMarkerElement
    const { AdvancedMarkerElement: AdvMarker } = await google.maps.importLibrary("marker");
    AdvancedMarkerElement = AdvMarker; // Store it for use in other functions

    map = new Map(document.getElementById("map"), {
      center: { lat: -33.8688, lng: 151.2093 }, // Center on Sydney
      zoom: 10,
      mapId: "d9bb12f1843d325493da7801" // Optional: Recommended for advanced markers & cloud styling. Create in Cloud Console.
    });

    // Setup filter listeners
    document.getElementById('weekdayFilter').addEventListener('change', applyAndDisplayFilters);
    // Add event listeners for any other filter controls

    fetchEvents(); // Initial fetch
    setInterval(fetchEvents, REFRESH_INTERVAL); // Periodic refresh

  } catch (error) {
    console.error("Error loading Google Maps libraries:", error);
    // Display an error message to the user on the page if map loading fails
    document.getElementById("map").innerHTML = "Error loading map. Please check the console.";
  }
}

async function fetchEvents() {
  console.log("Fetching events...");
  // ... (your existing fetchEvents logic remains the same) ...
  // ... it will eventually call applyAndDisplayFilters() ...
  try {
    const response = await fetch(SCRIPT_URL);
    if (!response.ok) {
        console.error("Error fetching events:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error details:", errorText);
        return;
    }
    const eventsJson = await response.json();
    if (eventsJson.error) {
        console.error("Error from script:", eventsJson.error);
        return;
    }
    allEvents = eventsJson; 
    console.log("All events fetched/updated:", allEvents.length);
    applyAndDisplayFilters();
  } catch (error) {
    console.error("Failed to fetch or process events:", error);
  }
}

function applyAndDisplayFilters() {
  // ... (your existing applyAndDisplayFilters logic remains the same) ...
  // ... it will eventually call updateMapMarkers(filteredEvents) ...
  if (!allEvents || allEvents.length === 0) {
    updateMapMarkers([]);
    return;
  }
  let filteredEvents = [...allEvents];
  const selectedWeekday = document.getElementById('weekdayFilter').value;
  if (selectedWeekday !== "all") {
    filteredEvents = filteredEvents.filter(event => event.weekday === selectedWeekday);
  }
  console.log("Applying filters. Displaying events:", filteredEvents.length);
  updateMapMarkers(filteredEvents);
}

// Modify updateMapMarkers to use AdvancedMarkerElement
function updateMapMarkers(eventsToDisplay) {
  console.log("Inside updateMapMarkers. Number of events to display:", eventsToDisplay.length);

  // Clear existing markers
  currentMarkers.forEach(marker => {
    marker.map = null; // Setting map to null removes the AdvancedMarkerElement
  });
  currentMarkers = [];

  if (!AdvancedMarkerElement) {
    console.error("AdvancedMarkerElement library not loaded yet.");
    return;
  }

  const infowindow = new google.maps.InfoWindow();

  eventsToDisplay.forEach(event => {
    if (event.lat == null || event.lng == null || isNaN(parseFloat(event.lat)) || isNaN(parseFloat(event.lng))) {
      console.warn("Skipping event with missing or invalid coordinates:", event.name, event.lat, event.lng);
      return;
    }

    // Create an AdvancedMarkerElement
    const marker = new AdvancedMarkerElement({
      position: { lat: parseFloat(event.lat), lng: parseFloat(event.lng) },
      map: map,
      title: event.name,
      // For custom icons with AdvancedMarkerElement, you'd typically use the 'content' property
      // with a DOM element, e.g., an <img> or a styled <div>.
      // For default markers, this is fine.
    });

    marker.addListener("click", () => {
      let destinationQuery;
      if (event.lat && event.lng) {
        destinationQuery = `${event.lat},${event.lng}`;
      } else {
        destinationQuery = encodeURIComponent(event.location);
      }
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`;

      let content = `<h3>${event.name}</h3>`;
      content += `<p><strong>Date:</strong> ${event.date} (${event.weekday})</p>`;
      content += `<p><strong>Time:</strong> ${event.time}</p>`;
      content += `<p><strong>Location:</strong> ${event.location}</p>`;
      content += `<p><a href="${directionsUrl}" target="_blank" title="Open directions in Google Maps">Get Directions</a></p>`;
      if (event.description) {
        content += `<hr><p>${event.description.replace(/\n/g, "<br>")}</p>`;
      }
      infowindow.setContent(content);
      // For AdvancedMarkerElement, it's often better to open InfoWindow like this:
      infowindow.open({
          anchor: marker, // The AdvancedMarkerElement instance
          map: map,
      });
    });
    currentMarkers.push(marker);
  });
  console.log("Total markers on map:", currentMarkers.length);
}
