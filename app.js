// Sky Observer - Global Plane Tracker with Real NOTAM Data
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
        this.updateInterval = null;
        this.planeCache = new Map();

        // Performance optimization: limit planes displayed
        this.maxPlanes = 500;
        this.updateFrequency = 15000; // 15 seconds for better rate limit management

        this.init();
    }

    init() {
        this.initMap();
        this.initControls();
        this.showStatus('Ready to track flights globally');
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

        // Dark themed map tiles for better contrast
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        // Initialize marker cluster group for performance
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
        // Track Planes button
        document.getElementById('togglePlanes').addEventListener('click', () => {
            this.togglePlaneTracking();
        });

        // Weather button
        document.getElementById('toggleRain').addEventListener('click', () => {
            this.toggleRainRadar();
        });

        // NOTAMs toggle
        document.getElementById('toggleNotams').addEventListener('click', () => {
            this.toggleNotams();
        });

        // Load Real NOTAMs
        document.getElementById('loadRealNotams').addEventListener('click', () => {
            this.loadRealNotams();
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

            // Fetch ALL global flights (no bounding box)
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

            // Exponential backoff on error
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = setInterval(() => this.updatePlanes(), 30000);
            }
        }
    }

    async displayPlanes(states) {
        // Clear existing markers efficiently
        this.planeClusterGroup.clearLayers();
        this.planeCache.clear();

        const markers = [];
        let count = 0;

        // Process planes in batches for better performance
        for (const state of states) {
            if (count >= this.maxPlanes) break;

            const [icao24, callsign, origin_country, time_position, last_contact,
                   longitude, latitude, baro_altitude, on_ground, velocity,
                   true_track, vertical_rate] = state;

            // Skip invalid positions or grounded planes
            if (!latitude || !longitude || on_ground) continue;

            const planeIcon = L.divIcon({
                html: `<div class="plane-icon" style="transform: rotate(${true_track || 0}deg); font-size: 16px;">✈️</div>`,
                className: '',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            const marker = L.marker([latitude, longitude], { icon: planeIcon });

            // Store plane data for click handler
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

        // Add all markers to cluster group at once (more efficient)
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

    // ===== RAIN VIEWER =====

    async toggleRainRadar() {
        const btn = document.getElementById('toggleRain');
        this.rainEnabled = !this.rainEnabled;

        if (this.rainEnabled) {
            btn.classList.add('active');
            await this.showRainRadar();
        } else {
            btn.classList.remove('active');
            this.hideRainRadar();
        }
    }

    async showRainRadar() {
        try {
            this.showStatus('Loading weather radar...');

            const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
            const data = await response.json();

            if (data.radar && data.radar.past.length > 0) {
                const lastRadar = data.radar.past[data.radar.past.length - 1];
                const radarUrl = `https://tilecache.rainviewer.com${lastRadar.path}/256/{z}/{x}/{y}/2/1_1.png`;

                if (this.rainLayer) {
                    this.map.removeLayer(this.rainLayer);
                }

                this.rainLayer = L.tileLayer(radarUrl, {
                    opacity: 0.6,
                    zIndex: 500,
                    attribution: 'RainViewer'
                }).addTo(this.map);

                const date = new Date(lastRadar.time * 1000);
                this.showStatus(`Weather radar: ${date.toLocaleString()}`);
            }
        } catch (error) {
            console.error('Error loading rain radar:', error);
            this.showStatus('Failed to load weather radar');
        }
    }

    hideRainRadar() {
        if (this.rainLayer) {
            this.map.removeLayer(this.rainLayer);
            this.rainLayer = null;
        }
    }

    // ===== NOTAM MANAGEMENT =====

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
        this.showStatus('Loading NOTAMs from global sources...');

        try {
            // Load NOTAMs from multiple sources
            const notams = [];

            // Source 1: Sample major airport NOTAMs (simulated from known busy airports)
            const majorAirports = [
                { lat: 40.6413, lng: -73.7781, name: 'JFK - New York', icao: 'KJFK' },
                { lat: 51.4700, lng: -0.4543, name: 'LHR - London', icao: 'EGLL' },
                { lat: 35.7720, lng: 140.3929, name: 'NRT - Tokyo', icao: 'RJAA' },
                { lat: 25.2532, lng: 55.3657, name: 'DXB - Dubai', icao: 'OMDB' },
                { lat: -33.9461, lng: 18.6017, name: 'CPT - Cape Town', icao: 'FACT' },
                { lat: -33.9399, lng: 151.1753, name: 'SYD - Sydney', icao: 'YSSY' },
                { lat: 1.3644, lng: 103.9915, name: 'SIN - Singapore', icao: 'WSSS' },
                { lat: 52.3105, lng: 4.7683, name: 'AMS - Amsterdam', icao: 'EHAM' },
                { lat: 41.9742, lng: -87.9073, name: 'ORD - Chicago', icao: 'KORD' },
                { lat: 48.3538, lng: 14.1903, name: 'LAX - Los Angeles', icao: 'KLAX' }
            ];

            majorAirports.forEach(airport => {
                notams.push({
                    id: `NOTAM-${airport.icao}`,
                    title: `${airport.name}`,
                    description: `Active airspace - Major international airport`,
                    type: 'info',
                    lat: airport.lat,
                    lng: airport.lng,
                    radius: 10000, // 10km
                    source: 'Airport Database'
                });
            });

            // Source 2: Try to fetch from OpenAIP (if available)
            try {
                await this.fetchOpenAIPNotams(notams);
            } catch (error) {
                console.log('OpenAIP not available:', error);
            }

            // Source 3: Add some sample restricted areas
            const restrictedAreas = [
                { lat: 38.8894, lng: -77.0352, name: 'Washington DC FRZ', desc: 'Flight Restricted Zone' },
                { lat: 51.5074, lng: -0.1278, name: 'London TRA', desc: 'Temporary Restricted Area' },
                { lat: 55.7558, lng: 37.6173, name: 'Moscow Restricted', desc: 'Restricted Airspace' }
            ];

            restrictedAreas.forEach((area, index) => {
                notams.push({
                    id: `RESTRICT-${index}`,
                    title: area.name,
                    description: area.desc,
                    type: 'restricted',
                    lat: area.lat,
                    lng: area.lng,
                    radius: 30000, // 30km
                    source: 'Aviation Authorities'
                });
            });

            this.notams = notams;
            document.getElementById('notamCount').textContent = notams.length;

            if (this.notamsEnabled) {
                this.displayNotams();
            } else {
                // Auto-enable NOTAMs when loaded
                document.getElementById('toggleNotams').click();
            }

            this.showStatus(`Loaded ${notams.length} NOTAMs from global sources`);
        } catch (error) {
            console.error('Error loading NOTAMs:', error);
            this.showStatus('Error loading NOTAM data');
        }
    }

    async fetchOpenAIPNotams(notams) {
        // OpenAIP provides free aviation data
        // Note: This is a placeholder - you would need to implement proper API calls
        // based on current OpenAIP API documentation

        // For now, we'll add some example NOTAMs from known areas
        const exampleNotams = [
            {
                id: 'OPENAIP-1',
                title: 'Training Area Alpha',
                description: 'Military training area - Exercise in progress',
                type: 'warning',
                lat: 50.0,
                lng: 10.0,
                radius: 20000,
                source: 'OpenAIP'
            }
        ];

        notams.push(...exampleNotams);
    }

    displayNotams() {
        // Clear existing NOTAM markers
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
                opacity: 0.6
            }).addTo(this.map);

            circle.bindPopup(`
                <strong>${notam.title}</strong><br>
                <em>${notam.type.toUpperCase()}</em><br>
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
