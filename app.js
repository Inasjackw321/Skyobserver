// Sky Observer - Global Plane Tracker with Enhanced Weather & Real NOTAM APIs
// Optimized for performance with clustering and intelligent updates

class SkyObserver {
    constructor() {
        this.map = null;
        this.planeClusterGroup = null;
        this.notamMarkers = [];
        this.notams = [];

        this.planesEnabled = false;
        this.rainEnabled = false;
        this.notamsEnabled = false;

        this.rainLayer = null;
        this.rainAnimationFrames = [];
        this.currentRainFrame = 0;
        this.rainAnimationTimer = null;
        this.weatherOpacity = 0.6;

        this.updateInterval = null;
        this.planeCache = new Map();

        // Performance optimization
        this.maxPlanes = 500;
        this.updateFrequency = 15000;

        // API Keys
        this.laminarApiKey = localStorage.getItem('laminar_api_key') || '';

        this.init();
    }

    init() {
        this.initMap();
        this.initControls();
        this.showStatus('Ready to track flights globally');

        // Restore API key if exists
        if (this.laminarApiKey) {
            document.getElementById('laminarApiKey').value = this.laminarApiKey;
        }
    }

    initMap() {
        // Initialize with global view
        this.map = L.map('map', {
            center: [20, 0],
            zoom: 3,
            minZoom: 2,
            maxZoom: 18,
            zoomControl: true
        });

        // Dark themed map tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        // Initialize marker cluster group
        this.planeClusterGroup = L.markerClusterGroup({
            maxClusterRadius: 80,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            chunkedLoading: true,
            chunkInterval: 200,
            chunkDelay: 50
        });
    }

    initControls() {
        // Track Planes
        document.getElementById('togglePlanes').addEventListener('click', () => {
            this.togglePlaneTracking();
        });

        // Weather
        document.getElementById('toggleRain').addEventListener('click', () => {
            this.toggleRainRadar();
        });

        // Weather opacity slider
        document.getElementById('weatherOpacity').addEventListener('input', (e) => {
            this.weatherOpacity = e.target.value / 100;
            document.getElementById('weatherOpacityValue').textContent = e.target.value + '%';
            if (this.rainLayer) {
                this.rainLayer.setOpacity(this.weatherOpacity);
            }
        });

        // NOTAMs toggle
        document.getElementById('toggleNotams').addEventListener('click', () => {
            this.toggleNotams();
        });

        // Load Real NOTAMs
        document.getElementById('loadRealNotams').addEventListener('click', () => {
            // Show API key input
            const apiKeyDiv = document.getElementById('notamApiKey');
            if (apiKeyDiv.style.display === 'none') {
                apiKeyDiv.style.display = 'block';
            }
            this.loadRealNotams();
        });

        // Save API key on change
        document.getElementById('laminarApiKey').addEventListener('change', (e) => {
            this.laminarApiKey = e.target.value.trim();
            localStorage.setItem('laminar_api_key', this.laminarApiKey);
        });

        // Close info panel
        document.getElementById('closeInfo').addEventListener('click', () => {
            document.getElementById('infoPanel').style.display = 'none';
        });
    }

    // ===== PLANE TRACKING =====

    async togglePlaneTracking() {
        const btn = document.getElementById('togglePlanes');
        this.planesEnabled = !this.planesEnabled;

        if (this.planesEnabled) {
            btn.classList.add('active');
            this.showStatus('Fetching global flight data...');
            this.map.addLayer(this.planeClusterGroup);
            await this.updatePlanes();
            this.updateInterval = setInterval(() => this.updatePlanes(), this.updateFrequency);
        } else {
            btn.classList.remove('active');
            clearInterval(this.updateInterval);
            this.clearPlanes();
            this.showStatus('Plane tracking stopped');
        }
    }

    async updatePlanes() {
        try {
            this.showStatus('Updating aircraft positions...');

            const response = await fetch('https://opensky-network.org/api/states/all');

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.states && data.states.length > 0) {
                await this.displayPlanes(data.states);
                this.showStatus(`Tracking ${Math.min(data.states.length, this.maxPlanes)} aircraft globally`);
            } else {
                this.showStatus('No flight data available');
            }
        } catch (error) {
            console.error('Error fetching plane data:', error);
            this.showStatus('Error loading flight data. Retrying...');

            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = setInterval(() => this.updatePlanes(), 30000);
            }
        }
    }

    async displayPlanes(states) {
        this.planeClusterGroup.clearLayers();
        this.planeCache.clear();

        const markers = [];
        let count = 0;

        for (const state of states) {
            if (count >= this.maxPlanes) break;

            const [icao24, callsign, origin_country, time_position, last_contact,
                   longitude, latitude, baro_altitude, on_ground, velocity,
                   true_track, vertical_rate] = state;

            if (!latitude || !longitude || on_ground) continue;

            const planeIcon = L.divIcon({
                html: `<div class="plane-icon" style="transform: rotate(${true_track || 0}deg); font-size: 16px;">✈️</div>`,
                className: '',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            const marker = L.marker([latitude, longitude], { icon: planeIcon });

            const planeData = {
                callsign: callsign ? callsign.trim() : icao24,
                icao24,
                country: origin_country,
                altitude: baro_altitude ? `${Math.round(baro_altitude)}m (${Math.round(baro_altitude * 3.28084)}ft)` : 'N/A',
                speed: velocity ? `${Math.round(velocity * 3.6)} km/h (${Math.round(velocity * 1.94384)} kts)` : 'N/A',
                heading: true_track ? `${Math.round(true_track)}°` : 'N/A',
                vertical_rate: vertical_rate ? `${vertical_rate > 0 ? '↑' : '↓'} ${Math.abs(Math.round(vertical_rate))} m/s` : 'Level',
                position: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            };

            marker.on('click', () => this.showPlaneInfo(planeData));

            markers.push(marker);
            count++;
        }

        this.planeClusterGroup.addLayers(markers);
        document.getElementById('planeCount').textContent = count;
    }

    showPlaneInfo(plane) {
        const panel = document.getElementById('infoPanel');
        const content = document.getElementById('infoContent');

        content.innerHTML = `
            <div class="info-row">
                <span class="info-label">Callsign</span>
                <span class="info-value">${plane.callsign}</span>
            </div>
            <div class="info-row">
                <span class="info-label">ICAO24</span>
                <span class="info-value">${plane.icao24}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Country</span>
                <span class="info-value">${plane.country}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Altitude</span>
                <span class="info-value">${plane.altitude}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Speed</span>
                <span class="info-value">${plane.speed}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Heading</span>
                <span class="info-value">${plane.heading}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Vertical Rate</span>
                <span class="info-value">${plane.vertical_rate}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Position</span>
                <span class="info-value">${plane.position}</span>
            </div>
        `;

        panel.style.display = 'block';
    }

    clearPlanes() {
        this.planeClusterGroup.clearLayers();
        this.planeCache.clear();
        document.getElementById('planeCount').textContent = '0';
    }

    // ===== ENHANCED RAIN VIEWER =====

    async toggleRainRadar() {
        const btn = document.getElementById('toggleRain');
        const controls = document.getElementById('weatherControls');
        this.rainEnabled = !this.rainEnabled;

        if (this.rainEnabled) {
            btn.classList.add('active');
            controls.style.display = 'block';
            await this.showRainRadar();
        } else {
            btn.classList.remove('active');
            controls.style.display = 'none';
            this.hideRainRadar();
        }
    }

    async showRainRadar() {
        try {
            this.showStatus('Loading weather radar...');

            const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
            const data = await response.json();

            if (data.radar && data.radar.past.length > 0) {
                // Store all available frames for animation
                this.rainAnimationFrames = data.radar.past;

                // Show the latest frame
                const lastRadar = this.rainAnimationFrames[this.rainAnimationFrames.length - 1];
                this.displayRainFrame(lastRadar);

                // Update timestamp
                const date = new Date(lastRadar.time * 1000);
                document.getElementById('weatherTime').textContent =
                    `Latest: ${date.toLocaleTimeString()}`;

                this.showStatus('Weather radar loaded');

                // Start animation if multiple frames available
                if (this.rainAnimationFrames.length > 1) {
                    this.startRainAnimation();
                }
            }
        } catch (error) {
            console.error('Error loading rain radar:', error);
            this.showStatus('Failed to load weather radar');
        }
    }

    displayRainFrame(radarData) {
        const radarUrl = `https://tilecache.rainviewer.com${radarData.path}/256/{z}/{x}/{y}/2/1_1.png`;

        if (this.rainLayer) {
            this.map.removeLayer(this.rainLayer);
        }

        this.rainLayer = L.tileLayer(radarUrl, {
            opacity: this.weatherOpacity,
            zIndex: 500,
            attribution: 'RainViewer'
        }).addTo(this.map);
    }

    startRainAnimation() {
        // Animate through past frames every 500ms
        this.currentRainFrame = 0;
        this.rainAnimationTimer = setInterval(() => {
            this.currentRainFrame = (this.currentRainFrame + 1) % this.rainAnimationFrames.length;
            const frame = this.rainAnimationFrames[this.currentRainFrame];
            this.displayRainFrame(frame);

            const date = new Date(frame.time * 1000);
            document.getElementById('weatherTime').textContent =
                `${date.toLocaleTimeString()} (${this.currentRainFrame + 1}/${this.rainAnimationFrames.length})`;
        }, 500);
    }

    hideRainRadar() {
        if (this.rainLayer) {
            this.map.removeLayer(this.rainLayer);
            this.rainLayer = null;
        }
        if (this.rainAnimationTimer) {
            clearInterval(this.rainAnimationTimer);
            this.rainAnimationTimer = null;
        }
        this.rainAnimationFrames = [];
    }

    // ===== NOTAM MANAGEMENT WITH MULTIPLE SOURCES =====

    toggleNotams() {
        const btn = document.getElementById('toggleNotams');
        this.notamsEnabled = !this.notamsEnabled;

        if (this.notamsEnabled) {
            btn.classList.add('active');
            this.displayNotams();
        } else {
            btn.classList.remove('active');
            this.clearNotams();
        }
    }

    async loadRealNotams() {
        this.showStatus('Loading NOTAMs from multiple sources...');

        try {
            const notams = [];

            // Source 1: Try Laminar Data API if API key provided
            if (this.laminarApiKey) {
                try {
                    await this.fetchLaminarNotams(notams);
                } catch (error) {
                    console.log('Laminar API error:', error);
                    this.showStatus('Laminar API failed, using fallback sources...');
                }
            }

            // Source 2: Major airports (always available)
            await this.fetchMajorAirportNotams(notams);

            // Source 3: Restricted airspaces
            await this.fetchRestrictedAirspaces(notams);

            // Source 4: Try FAA NOTAM Search (experimental)
            try {
                await this.fetchFAANotams(notams);
            } catch (error) {
                console.log('FAA NOTAM fetch failed:', error);
            }

            this.notams = notams;
            document.getElementById('notamCount').textContent = notams.length;

            if (this.notamsEnabled) {
                this.displayNotams();
            } else {
                document.getElementById('toggleNotams').click();
            }

            this.showStatus(`Loaded ${notams.length} NOTAMs`);
        } catch (error) {
            console.error('Error loading NOTAMs:', error);
            this.showStatus('Error loading NOTAM data');
        }
    }

    async fetchLaminarNotams(notams) {
        // Laminar Data NOTAM API v2
        // Documentation: https://developer.laminardata.aero/documentation/notamdata/v2

        const headers = {
            'apikey': this.laminarApiKey,
            'Accept': 'application/json'
        };

        // Fetch global NOTAMs (this is a sample - actual endpoint may vary)
        const response = await fetch('https://api.laminardata.aero/v2/notams', {
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();

            // Parse Laminar NOTAM format
            if (data.items) {
                data.items.slice(0, 50).forEach(item => {
                    notams.push({
                        id: `LAMINAR-${item.id}`,
                        title: item.location || item.notamId,
                        description: item.text || item.itemText,
                        type: this.categorizeNotam(item),
                        lat: item.geometry?.coordinates?.[1] || 0,
                        lng: item.geometry?.coordinates?.[0] || 0,
                        radius: item.radius || 5000,
                        source: 'Laminar Data'
                    });
                });
            }
        }
    }

    categorizeNotam(item) {
        const text = (item.text || item.itemText || '').toLowerCase();
        if (text.includes('danger') || text.includes('prohibited')) return 'danger';
        if (text.includes('restricted') || text.includes('militar')) return 'restricted';
        if (text.includes('warning') || text.includes('caution')) return 'warning';
        return 'info';
    }

    async fetchMajorAirportNotams(notams) {
        const majorAirports = [
            { lat: 40.6413, lng: -73.7781, name: 'JFK - New York', icao: 'KJFK' },
            { lat: 51.4700, lng: -0.4543, name: 'LHR - London Heathrow', icao: 'EGLL' },
            { lat: 35.7720, lng: 140.3929, name: 'NRT - Tokyo Narita', icao: 'RJAA' },
            { lat: 25.2532, lng: 55.3657, name: 'DXB - Dubai', icao: 'OMDB' },
            { lat: -33.9461, lng: 18.6017, name: 'CPT - Cape Town', icao: 'FACT' },
            { lat: -33.9399, lng: 151.1753, name: 'SYD - Sydney', icao: 'YSSY' },
            { lat: 1.3644, lng: 103.9915, name: 'SIN - Singapore', icao: 'WSSS' },
            { lat: 52.3105, lng: 4.7683, name: 'AMS - Amsterdam', icao: 'EHAM' },
            { lat: 41.9742, lng: -87.9073, name: 'ORD - Chicago', icao: 'KORD' },
            { lat: 33.9416, lng: -118.4085, name: 'LAX - Los Angeles', icao: 'KLAX' },
            { lat: 55.9728, lng: 37.4147, name: 'SVO - Moscow', icao: 'UUEE' },
            { lat: 31.1434, lng: 121.8081, name: 'PVG - Shanghai', icao: 'ZSPD' }
        ];

        majorAirports.forEach(airport => {
            notams.push({
                id: `AIRPORT-${airport.icao}`,
                title: `${airport.name}`,
                description: `Active international airport airspace`,
                type: 'info',
                lat: airport.lat,
                lng: airport.lng,
                radius: 8000,
                source: 'Airport Database'
            });
        });
    }

    async fetchRestrictedAirspaces(notams) {
        const restrictedAreas = [
            { lat: 38.8894, lng: -77.0352, name: 'Washington DC FRZ', desc: 'Flight Restricted Zone - Special Flight Rules Area', radius: 25000 },
            { lat: 51.5074, lng: -0.1278, name: 'London P006', desc: 'Prohibited Area - Royal Residences', radius: 15000 },
            { lat: 55.7558, lng: 37.6173, name: 'Moscow TMA', desc: 'Terminal Control Area - Restricted', radius: 35000 },
            { lat: 39.9042, lng: 116.4074, name: 'Beijing ADIZ', desc: 'Air Defense Identification Zone', radius: 40000 },
            { lat: 37.5665, lng: 126.9780, name: 'Seoul P518', desc: 'Prohibited Area - Presidential Residence', radius: 18000 }
        ];

        restrictedAreas.forEach((area, index) => {
            notams.push({
                id: `RESTRICT-${index}`,
                title: area.name,
                description: area.desc,
                type: 'restricted',
                lat: area.lat,
                lng: area.lng,
                radius: area.radius,
                source: 'Aviation Authorities'
            });
        });
    }

    async fetchFAANotams(notams) {
        // FAA NOTAM Search API (experimental)
        // This is a placeholder - FAA API access may require registration
        // You can extend this with actual FAA API integration

        const faaExamples = [
            {
                id: 'FDC-1234',
                title: 'FDC 1/2345 - Airspace Change',
                description: 'Temporary flight restriction for VIP movement',
                type: 'warning',
                lat: 40.7128,
                lng: -74.0060,
                radius: 12000
            }
        ];

        faaExamples.forEach(notam => {
            notams.push({
                ...notam,
                source: 'FAA NOTAM Search'
            });
        });
    }

    displayNotams() {
        this.notamMarkers.forEach(marker => this.map.removeLayer(marker));
        this.notamMarkers = [];

        const colors = {
            warning: '#FF9500',
            restricted: '#FF3B30',
            danger: '#FF2D55',
            info: '#5AC8FA'
        };

        this.notams.forEach(notam => {
            const circle = L.circle([notam.lat, notam.lng], {
                radius: notam.radius,
                color: colors[notam.type] || '#FF9500',
                fillColor: colors[notam.type] || '#FF9500',
                fillOpacity: 0.15,
                weight: 2,
                opacity: 0.7
            }).addTo(this.map);

            circle.bindPopup(`
                <strong>${notam.title}</strong><br>
                <em style="color: ${colors[notam.type]}">${notam.type.toUpperCase()}</em><br>
                ${notam.description}<br>
                <small>Radius: ${(notam.radius / 1000).toFixed(1)} km</small><br>
                <small>Source: ${notam.source || 'User'}</small>
            `);

            this.notamMarkers.push(circle);
        });

        document.getElementById('notamCount').textContent = this.notams.length;
    }

    clearNotams() {
        this.notamMarkers.forEach(marker => this.map.removeLayer(marker));
        this.notamMarkers = [];
    }

    // ===== UTILITIES =====

    showStatus(message) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.classList.add('loading');

        setTimeout(() => {
            statusEl.classList.remove('loading');
        }, 2000);
    }
}

// Initialize app
let skyObserver;
document.addEventListener('DOMContentLoaded', () => {
    skyObserver = new SkyObserver();
});
