// Sky Observer - Plane Tracker with RainViewer and NOTAMs
// Using OpenSky Network API (free, no API key required)

class SkyObserver {
    constructor() {
        this.map = null;
        this.planeMarkers = {};
        this.notamMarkers = [];
        this.notams = this.loadNotams();
        this.planesEnabled = false;
        this.rainEnabled = false;
        this.notamMode = false;
        this.rainLayer = null;
        this.rainOpacity = 0.7;
        this.selectedPlane = null;
        this.updateInterval = null;
        this.tempNotamMarker = null;

        this.init();
    }

    init() {
        this.initMap();
        this.initControls();
        this.displayNotams();
    }

    initMap() {
        // Initialize Leaflet map centered on US
        this.map = L.map('map').setView([39.8283, -98.5795], 5);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Map click handler for NOTAM placement
        this.map.on('click', (e) => {
            if (this.notamMode) {
                this.showNotamModal(e.latlng);
            }
        });
    }

    initControls() {
        // Plane tracking toggle
        document.getElementById('togglePlanes').addEventListener('click', () => {
            this.togglePlaneTracking();
        });

        // Rain radar toggle
        document.getElementById('toggleRain').addEventListener('click', () => {
            this.toggleRainRadar();
        });

        // Rain opacity slider
        document.getElementById('rainOpacity').addEventListener('input', (e) => {
            this.rainOpacity = e.target.value / 100;
            document.getElementById('rainOpacityValue').textContent = e.target.value + '%';
            if (this.rainLayer) {
                this.rainLayer.setOpacity(this.rainOpacity);
            }
        });

        // NOTAM mode toggle
        document.getElementById('toggleNotamMode').addEventListener('click', () => {
            this.toggleNotamMode();
        });

        // NOTAM form handlers
        document.getElementById('notamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNotam();
        });

        document.getElementById('cancelNotam').addEventListener('click', () => {
            this.hideNotamModal();
        });
    }

    // ===== PLANE TRACKING =====

    async togglePlaneTracking() {
        const btn = document.getElementById('togglePlanes');
        this.planesEnabled = !this.planesEnabled;

        if (this.planesEnabled) {
            btn.textContent = 'Stop Tracking';
            btn.classList.add('active');
            await this.updatePlanes();
            this.updateInterval = setInterval(() => this.updatePlanes(), 10000); // Update every 10 seconds
        } else {
            btn.textContent = 'Start Tracking';
            btn.classList.remove('active');
            clearInterval(this.updateInterval);
            this.clearPlanes();
        }
    }

    async updatePlanes() {
        try {
            const bounds = this.map.getBounds();
            const bbox = `${bounds.getSouth()},${bounds.getNorth()},${bounds.getWest()},${bounds.getEast()}`;

            // OpenSky Network API - Free, no key required
            // Note: Rate limited to ~100 requests per day for anonymous users
            const response = await fetch(`https://opensky-network.org/api/states/all?lamin=${bounds.getSouth()}&lomin=${bounds.getWest()}&lamax=${bounds.getNorth()}&lomax=${bounds.getEast()}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.states) {
                this.displayPlanes(data.states);
            }
        } catch (error) {
            console.error('Error fetching plane data:', error);
            // If we hit rate limit or error, try again in 30 seconds
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = setInterval(() => this.updatePlanes(), 30000);
            }
        }
    }

    displayPlanes(states) {
        const currentPlanes = new Set();

        states.forEach(state => {
            const [icao24, callsign, origin_country, time_position, last_contact,
                   longitude, latitude, baro_altitude, on_ground, velocity,
                   true_track, vertical_rate, sensors, geo_altitude, squawk,
                   spi, position_source] = state;

            if (!latitude || !longitude) return;

            currentPlanes.add(icao24);

            const planeIcon = L.divIcon({
                html: `<div class="plane-icon" style="transform: rotate(${true_track || 0}deg);">✈️</div>`,
                className: 'plane-marker',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            if (this.planeMarkers[icao24]) {
                // Update existing marker
                this.planeMarkers[icao24].setLatLng([latitude, longitude]);
                this.planeMarkers[icao24].setIcon(planeIcon);
            } else {
                // Create new marker
                const marker = L.marker([latitude, longitude], { icon: planeIcon })
                    .addTo(this.map);

                const altitude = geo_altitude || baro_altitude || 'N/A';
                const speed = velocity ? Math.round(velocity * 3.6) : 'N/A';

                marker.on('click', () => {
                    this.showPlaneInfo({
                        callsign: callsign ? callsign.trim() : icao24,
                        icao24,
                        country: origin_country,
                        altitude: altitude !== 'N/A' ? Math.round(altitude) + 'm' : 'N/A',
                        speed: speed !== 'N/A' ? speed + ' km/h' : 'N/A',
                        heading: true_track ? Math.round(true_track) + '°' : 'N/A',
                        vertical_rate: vertical_rate ? Math.round(vertical_rate) + ' m/s' : 'N/A',
                        on_ground: on_ground ? 'Yes' : 'No'
                    });
                });

                this.planeMarkers[icao24] = marker;
            }
        });

        // Remove planes that are no longer in view
        Object.keys(this.planeMarkers).forEach(icao24 => {
            if (!currentPlanes.has(icao24)) {
                this.map.removeLayer(this.planeMarkers[icao24]);
                delete this.planeMarkers[icao24];
            }
        });

        document.getElementById('planeCount').textContent = `Planes: ${currentPlanes.size}`;
    }

    showPlaneInfo(plane) {
        const infoDiv = document.getElementById('planeInfo');
        infoDiv.innerHTML = `
            <strong>Callsign:</strong> ${plane.callsign}<br>
            <strong>ICAO24:</strong> ${plane.icao24}<br>
            <strong>Country:</strong> ${plane.country}<br>
            <strong>Altitude:</strong> ${plane.altitude}<br>
            <strong>Speed:</strong> ${plane.speed}<br>
            <strong>Heading:</strong> ${plane.heading}<br>
            <strong>V-Rate:</strong> ${plane.vertical_rate}<br>
            <strong>On Ground:</strong> ${plane.on_ground}
        `;
    }

    clearPlanes() {
        Object.values(this.planeMarkers).forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.planeMarkers = {};
        document.getElementById('planeCount').textContent = 'Planes: 0';
        document.getElementById('planeInfo').innerHTML = 'Click on a plane to see details';
    }

    // ===== RAIN VIEWER =====

    async toggleRainRadar() {
        const btn = document.getElementById('toggleRain');
        this.rainEnabled = !this.rainEnabled;

        if (this.rainEnabled) {
            btn.textContent = 'Hide Rain';
            btn.classList.add('active');
            await this.showRainRadar();
        } else {
            btn.textContent = 'Show Rain';
            btn.classList.remove('active');
            this.hideRainRadar();
        }
    }

    async showRainRadar() {
        try {
            // Get available radar timestamps from RainViewer API
            const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
            const data = await response.json();

            if (data.radar && data.radar.past.length > 0) {
                // Get the most recent radar image
                const lastRadar = data.radar.past[data.radar.past.length - 1];
                const radarUrl = `https://tilecache.rainviewer.com${lastRadar.path}/256/{z}/{x}/{y}/2/1_1.png`;

                // Remove existing rain layer if present
                if (this.rainLayer) {
                    this.map.removeLayer(this.rainLayer);
                }

                // Add rain layer
                this.rainLayer = L.tileLayer(radarUrl, {
                    opacity: this.rainOpacity,
                    zIndex: 1000,
                    attribution: 'Rain data © RainViewer'
                }).addTo(this.map);

                // Update timestamp
                const date = new Date(lastRadar.time * 1000);
                document.getElementById('radarTimestamp').textContent =
                    `Updated: ${date.toLocaleTimeString()}`;
            }
        } catch (error) {
            console.error('Error loading rain radar:', error);
            alert('Failed to load rain radar data');
        }
    }

    hideRainRadar() {
        if (this.rainLayer) {
            this.map.removeLayer(this.rainLayer);
            this.rainLayer = null;
        }
        document.getElementById('radarTimestamp').textContent = '';
    }

    // ===== NOTAM MANAGEMENT =====

    toggleNotamMode() {
        const btn = document.getElementById('toggleNotamMode');
        this.notamMode = !this.notamMode;

        if (this.notamMode) {
            btn.textContent = 'Cancel';
            btn.classList.add('active');
            this.map.getContainer().style.cursor = 'crosshair';
        } else {
            btn.textContent = 'Place NOTAM';
            btn.classList.remove('active');
            this.map.getContainer().style.cursor = '';
            if (this.tempNotamMarker) {
                this.map.removeLayer(this.tempNotamMarker);
                this.tempNotamMarker = null;
            }
        }
    }

    showNotamModal(latlng) {
        const modal = document.getElementById('notamModal');
        modal.classList.add('show');
        modal.dataset.lat = latlng.lat;
        modal.dataset.lng = latlng.lng;

        // Add temporary marker
        if (this.tempNotamMarker) {
            this.map.removeLayer(this.tempNotamMarker);
        }
        this.tempNotamMarker = L.circle(latlng, {
            radius: 5000,
            color: '#ff6b6b',
            fillColor: '#ff6b6b',
            fillOpacity: 0.2
        }).addTo(this.map);
    }

    hideNotamModal() {
        const modal = document.getElementById('notamModal');
        modal.classList.remove('show');
        document.getElementById('notamForm').reset();
        if (this.tempNotamMarker) {
            this.map.removeLayer(this.tempNotamMarker);
            this.tempNotamMarker = null;
        }
        this.notamMode = false;
        this.toggleNotamMode(); // Reset mode
    }

    addNotam() {
        const modal = document.getElementById('notamModal');
        const lat = parseFloat(modal.dataset.lat);
        const lng = parseFloat(modal.dataset.lng);

        const notam = {
            id: Date.now(),
            title: document.getElementById('notamTitle').value,
            description: document.getElementById('notamDescription').value,
            type: document.getElementById('notamType').value,
            radius: parseFloat(document.getElementById('notamRadius').value) * 1000, // Convert to meters
            lat,
            lng
        };

        this.notams.push(notam);
        this.saveNotams();
        this.displayNotams();
        this.hideNotamModal();
    }

    displayNotams() {
        // Clear existing NOTAM markers
        this.notamMarkers.forEach(marker => this.map.removeLayer(marker));
        this.notamMarkers = [];

        // Display NOTAMs on map
        this.notams.forEach(notam => {
            const colors = {
                warning: '#ffa502',
                restricted: '#ff4757',
                danger: '#ff6348',
                info: '#00d4ff'
            };

            const circle = L.circle([notam.lat, notam.lng], {
                radius: notam.radius,
                color: colors[notam.type] || '#ff6b6b',
                fillColor: colors[notam.type] || '#ff6b6b',
                fillOpacity: 0.2,
                weight: 2
            }).addTo(this.map);

            circle.bindPopup(`
                <strong>${notam.title}</strong><br>
                <em>${notam.type.toUpperCase()}</em><br>
                ${notam.description}<br>
                <small>Radius: ${(notam.radius / 1000).toFixed(1)} km</small>
            `);

            this.notamMarkers.push(circle);
        });

        // Update NOTAM list in sidebar
        const listDiv = document.getElementById('notamList');
        listDiv.innerHTML = '';

        this.notams.forEach(notam => {
            const item = document.createElement('div');
            item.className = 'notam-item';
            item.innerHTML = `
                <div class="notam-item-title">${notam.title}</div>
                <div class="notam-item-desc">${notam.description}</div>
                <button class="notam-delete" onclick="skyObserver.deleteNotam(${notam.id})">Delete</button>
            `;
            item.onclick = (e) => {
                if (!e.target.classList.contains('notam-delete')) {
                    this.map.setView([notam.lat, notam.lng], 10);
                }
            };
            listDiv.appendChild(item);
        });
    }

    deleteNotam(id) {
        this.notams = this.notams.filter(n => n.id !== id);
        this.saveNotams();
        this.displayNotams();
    }

    saveNotams() {
        localStorage.setItem('skyobserver-notams', JSON.stringify(this.notams));
    }

    loadNotams() {
        const saved = localStorage.getItem('skyobserver-notams');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize app when DOM is loaded
let skyObserver;
document.addEventListener('DOMContentLoaded', () => {
    skyObserver = new SkyObserver();
});
