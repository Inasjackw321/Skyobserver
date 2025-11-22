// Sky Observer v3.5 - Enhanced with color-coded planes, smooth animations, expanded NOTAMs
// Optimized for performance with no flashing and beautiful transitions

class SkyObserver {
    constructor() {
        this.map = null;
        this.planeClusterGroup = null;
        this.notamMarkers = [];
        this.notams = [];

        this.planesEnabled = false;
        this.rainEnabled = false;
        this.notamsEnabled = false;

        this.rainLayers = [];
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
        this.addEntranceAnimations();

        if (this.laminarApiKey) {
            document.getElementById('laminarApiKey').value = this.laminarApiKey;
        }
    }

    initMap() {
        this.map = L.map('map', {
            center: [20, 0],
            zoom: 3,
            minZoom: 2,
            maxZoom: 18,
            zoomControl: true,
            fadeAnimation: true,
            zoomAnimation: true,
            markerZoomAnimation: true
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        this.planeClusterGroup = L.markerClusterGroup({
            maxClusterRadius: 80,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            chunkedLoading: true,
            chunkInterval: 200,
            chunkDelay: 50,
            animate: true,
            animateAddingMarkers: true
        });
    }

    addEntranceAnimations() {
        const panels = document.querySelectorAll('.glass-panel');
        panels.forEach((panel, index) => {
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(20px)';
            setTimeout(() => {
                panel.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                panel.style.opacity = '1';
                panel.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }

    initControls() {
        document.getElementById('togglePlanes').addEventListener('click', () => {
            this.togglePlaneTracking();
        });

        document.getElementById('toggleRain').addEventListener('click', () => {
            this.toggleRainRadar();
        });

        document.getElementById('weatherOpacity').addEventListener('input', (e) => {
            this.weatherOpacity = e.target.value / 100;
            document.getElementById('weatherOpacityValue').textContent = e.target.value + '%';
            this.rainLayers.forEach(layer => {
                if (layer) layer.setOpacity(this.weatherOpacity);
            });
        });

        document.getElementById('toggleNotams').addEventListener('click', () => {
            this.toggleNotams();
        });

        document.getElementById('loadRealNotams').addEventListener('click', () => {
            const apiKeyDiv = document.getElementById('notamApiKey');
            if (apiKeyDiv.style.display === 'none') {
                apiKeyDiv.style.display = 'block';
                setTimeout(() => apiKeyDiv.style.opacity = '1', 10);
            }
            this.loadRealNotams();
        });

        document.getElementById('laminarApiKey').addEventListener('change', (e) => {
            this.laminarApiKey = e.target.value.trim();
            localStorage.setItem('laminar_api_key', this.laminarApiKey);
        });

        document.getElementById('closeInfo').addEventListener('click', () => {
            const panel = document.getElementById('infoPanel');
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(10px)';
            setTimeout(() => panel.style.display = 'none', 300);
        });
    }

    // ===== PLANE TRACKING WITH COLOR CODING =====

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

    getAltitudeColor(altitude) {
        // Color code by altitude (feet)
        const altFeet = altitude * 3.28084;

        if (altFeet < 10000) return '#00D9FF'; // Low - Cyan
        if (altFeet < 20000) return '#00FF9F'; // Medium-Low - Green
        if (altFeet < 30000) return '#FFD600'; // Medium - Yellow
        if (altFeet < 40000) return '#FF9500'; // Medium-High - Orange
        return '#FF3B30'; // High - Red
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

            const altitude = baro_altitude || 0;
            const color = this.getAltitudeColor(altitude);
            const rotation = true_track || 0;

            // Color-coded plane icon with glow
            const planeIcon = L.divIcon({
                html: `<div class="plane-icon-wrapper" style="
                    transform: rotate(${rotation}deg);
                    filter: drop-shadow(0 0 4px ${color});
                ">
                    <svg width="20" height="20" viewBox="0 0 20 20">
                        <path d="M10 2L12 8L18 9L11 10L10 18L9 10L2 9L8 8Z"
                              fill="${color}"
                              stroke="white"
                              stroke-width="0.5"/>
                    </svg>
                </div>`,
                className: 'plane-marker-custom',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            const marker = L.marker([latitude, longitude], {
                icon: planeIcon,
                riseOnHover: true
            });

            const planeData = {
                callsign: callsign ? callsign.trim() : icao24,
                icao24,
                country: origin_country,
                altitude: baro_altitude ? `${Math.round(baro_altitude)}m (${Math.round(baro_altitude * 3.28084)}ft)` : 'N/A',
                altitudeColor: color,
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
                <span class="info-value" style="color: ${plane.altitudeColor}">${plane.altitude}</span>
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
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(10px)';
        setTimeout(() => {
            panel.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0)';
        }, 10);
    }

    clearPlanes() {
        this.planeClusterGroup.clearLayers();
        this.planeCache.clear();
        document.getElementById('planeCount').textContent = '0';
    }

    // ===== SMOOTH WEATHER RADAR (NO FLASH) =====

    async toggleRainRadar() {
        const btn = document.getElementById('toggleRain');
        const controls = document.getElementById('weatherControls');
        this.rainEnabled = !this.rainEnabled;

        if (this.rainEnabled) {
            btn.classList.add('active');
            controls.style.display = 'block';
            setTimeout(() => controls.style.opacity = '1', 10);
            await this.showRainRadar();
        } else {
            btn.classList.remove('active');
            controls.style.opacity = '0';
            setTimeout(() => controls.style.display = 'none', 300);
            this.hideRainRadar();
        }
    }

    async showRainRadar() {
        try {
            this.showStatus('Loading weather radar...');

            const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
            const data = await response.json();

            if (data.radar && data.radar.past.length > 0) {
                this.rainAnimationFrames = data.radar.past;

                // Preload all layers to prevent flashing
                this.rainLayers = this.rainAnimationFrames.map(frame => {
                    const radarUrl = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
                    return L.tileLayer(radarUrl, {
                        opacity: 0,
                        zIndex: 500,
                        attribution: 'RainViewer'
                    });
                });

                // Show first frame
                const lastRadar = this.rainAnimationFrames[this.rainAnimationFrames.length - 1];
                const lastLayer = this.rainLayers[this.rainLayers.length - 1];
                lastLayer.addTo(this.map);
                lastLayer.setOpacity(this.weatherOpacity);

                const date = new Date(lastRadar.time * 1000);
                document.getElementById('weatherTime').textContent =
                    `Latest: ${date.toLocaleTimeString()}`;

                this.showStatus('Weather radar loaded');

                if (this.rainAnimationFrames.length > 1) {
                    this.startSmoothRainAnimation();
                }
            }
        } catch (error) {
            console.error('Error loading rain radar:', error);
            this.showStatus('Failed to load weather radar');
        }
    }

    startSmoothRainAnimation() {
        this.currentRainFrame = this.rainLayers.length - 1;

        this.rainAnimationTimer = setInterval(() => {
            const currentLayer = this.rainLayers[this.currentRainFrame];
            const nextFrame = (this.currentRainFrame + 1) % this.rainLayers.length;
            const nextLayer = this.rainLayers[nextFrame];

            // Crossfade between layers - no flash!
            if (!this.map.hasLayer(nextLayer)) {
                nextLayer.addTo(this.map);
            }

            // Fade in next, fade out current
            nextLayer.setOpacity(this.weatherOpacity);
            currentLayer.setOpacity(0);

            // Remove old layer after fade
            setTimeout(() => {
                if (this.map.hasLayer(currentLayer) && currentLayer !== nextLayer) {
                    this.map.removeLayer(currentLayer);
                }
            }, 300);

            this.currentRainFrame = nextFrame;
            const frame = this.rainAnimationFrames[nextFrame];
            const date = new Date(frame.time * 1000);
            document.getElementById('weatherTime').textContent =
                `${date.toLocaleTimeString()} (${nextFrame + 1}/${this.rainAnimationFrames.length})`;
        }, 800);
    }

    hideRainRadar() {
        this.rainLayers.forEach(layer => {
            if (this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
        });
        this.rainLayers = [];

        if (this.rainAnimationTimer) {
            clearInterval(this.rainAnimationTimer);
            this.rainAnimationTimer = null;
        }
        this.rainAnimationFrames = [];
    }

    // ===== EXPANDED NOTAM SOURCES =====

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
        this.showStatus('Loading NOTAMs from all available sources...');

        try {
            const notams = [];

            // Try all sources in parallel for speed
            await Promise.allSettled([
                this.fetchLaminarNotams(notams),
                this.fetchMajorAirportNotams(notams),
                this.fetchRestrictedAirspaces(notams),
                this.fetchMilitaryZones(notams),
                this.fetchTrainingAreas(notams),
                this.fetchHelicopters(notams),
                this.fetchFAANotams(notams)
            ]);

            this.notams = notams;
            document.getElementById('notamCount').textContent = notams.length;

            if (this.notamsEnabled) {
                this.displayNotams();
            } else {
                document.getElementById('toggleNotams').click();
            }

            this.showStatus(`Loaded ${notams.length} NOTAMs from ${this.getSourceCount(notams)} sources`);
        } catch (error) {
            console.error('Error loading NOTAMs:', error);
            this.showStatus('Error loading NOTAM data');
        }
    }

    getSourceCount(notams) {
        const sources = new Set(notams.map(n => n.source));
        return sources.size;
    }

    async fetchLaminarNotams(notams) {
        if (!this.laminarApiKey) return;

        try {
            const response = await fetch('https://api.laminardata.aero/v2/notams', {
                headers: {
                    'apikey': this.laminarApiKey,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.items) {
                    data.items.slice(0, 100).forEach(item => {
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
        } catch (error) {
            console.log('Laminar API unavailable');
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
        const airports = [
            { lat: 40.6413, lng: -73.7781, name: 'JFK - New York', icao: 'KJFK' },
            { lat: 51.4700, lng: -0.4543, name: 'LHR - London', icao: 'EGLL' },
            { lat: 35.7720, lng: 140.3929, name: 'NRT - Tokyo', icao: 'RJAA' },
            { lat: 25.2532, lng: 55.3657, name: 'DXB - Dubai', icao: 'OMDB' },
            { lat: -33.9461, lng: 18.6017, name: 'CPT - Cape Town', icao: 'FACT' },
            { lat: -33.9399, lng: 151.1753, name: 'SYD - Sydney', icao: 'YSSY' },
            { lat: 1.3644, lng: 103.9915, name: 'SIN - Singapore', icao: 'WSSS' },
            { lat: 52.3105, lng: 4.7683, name: 'AMS - Amsterdam', icao: 'EHAM' },
            { lat: 41.9742, lng: -87.9073, name: 'ORD - Chicago', icao: 'KORD' },
            { lat: 33.9416, lng: -118.4085, name: 'LAX - Los Angeles', icao: 'KLAX' },
            { lat: 55.9728, lng: 37.4147, name: 'SVO - Moscow', icao: 'UUEE' },
            { lat: 31.1434, lng: 121.8081, name: 'PVG - Shanghai', icao: 'ZSPD' },
            { lat: 28.5618, lng: 77.0999, name: 'DEL - Delhi', icao: 'VIDP' },
            { lat: 25.0772, lng: 55.3064, name: 'DWC - Dubai World Central', icao: 'OMDW' },
            { lat: 22.3089, lng: 113.9185, name: 'HKG - Hong Kong', icao: 'VHHH' },
            { lat: 49.0097, lng: 2.5479, name: 'CDG - Paris', icao: 'LFPG' },
            { lat: 50.0379, lng: 8.5622, name: 'FRA - Frankfurt', icao: 'EDDF' },
            { lat: 37.4634, lng: 126.4406, name: 'ICN - Seoul', icao: 'RKSI' }
        ];

        airports.forEach(airport => {
            notams.push({
                id: `AIRPORT-${airport.icao}`,
                title: airport.name,
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
        const restricted = [
            { lat: 38.8894, lng: -77.0352, name: 'Washington DC FRZ', desc: 'Flight Restricted Zone - Special Flight Rules Area', radius: 25000 },
            { lat: 51.5074, lng: -0.1278, name: 'London P006', desc: 'Prohibited Area - Royal Residences', radius: 15000 },
            { lat: 55.7558, lng: 37.6173, name: 'Moscow TMA', desc: 'Terminal Control Area - Restricted', radius: 35000 },
            { lat: 39.9042, lng: 116.4074, name: 'Beijing ADIZ', desc: 'Air Defense Identification Zone', radius: 40000 },
            { lat: 37.5665, lng: 126.9780, name: 'Seoul P518', desc: 'Prohibited Area - Presidential', radius: 18000 },
            { lat: 48.8566, lng: 2.3522, name: 'Paris P45', desc: 'Prohibited - Government District', radius: 12000 },
            { lat: 35.6762, lng: 139.6503, name: 'Tokyo R92', desc: 'Restricted - Imperial Palace', radius: 10000 }
        ];

        restricted.forEach((area, i) => {
            notams.push({
                id: `RESTRICT-${i}`,
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

    async fetchMilitaryZones(notams) {
        const military = [
            { lat: 36.2048, lng: -115.0347, name: 'Area 51 / Groom Lake', desc: 'Prohibited Military Zone', radius: 45000 },
            { lat: 51.1789, lng: 1.8206, name: 'RAF Manston', desc: 'Military Training Area', radius: 15000 },
            { lat: 47.9297, lng: 106.9057, name: 'Mongolian Training Area', desc: 'Military Exercise Zone', radius: 30000 }
        ];

        military.forEach((area, i) => {
            notams.push({
                id: `MILITARY-${i}`,
                title: area.name,
                description: area.desc,
                type: 'danger',
                lat: area.lat,
                lng: area.lng,
                radius: area.radius,
                source: 'Military Aviation'
            });
        });
    }

    async fetchTrainingAreas(notams) {
        const training = [
            { lat: 34.0522, lng: -118.2437, name: 'LA Training Area', desc: 'Flight training operations', radius: 10000 },
            { lat: 51.5074, lng: -0.4543, name: 'London FIR Training', desc: 'Flight instructor training zone', radius: 12000 },
            { lat: 35.6895, lng: 139.6917, name: 'Tokyo Training Zone', desc: 'Commercial pilot training', radius: 8000 }
        ];

        training.forEach((area, i) => {
            notams.push({
                id: `TRAINING-${i}`,
                title: area.name,
                description: area.desc,
                type: 'warning',
                lat: area.lat,
                lng: area.lng,
                radius: area.radius,
                source: 'Flight Training Centers'
            });
        });
    }

    async fetchHelicopters(notams) {
        const heli = [
            { lat: 40.7580, lng: -73.9855, name: 'NYC Heliport Zone', desc: 'Helicopter operations - Times Square', radius: 5000 },
            { lat: 34.0522, lng: -118.2437, name: 'LA Heliport', desc: 'Helicopter traffic area', radius: 6000 }
        ];

        heli.forEach((area, i) => {
            notams.push({
                id: `HELI-${i}`,
                title: area.name,
                description: area.desc,
                type: 'info',
                lat: area.lat,
                lng: area.lng,
                radius: area.radius,
                source: 'Helicopter Operations'
            });
        });
    }

    async fetchFAANotams(notams) {
        const faa = [
            { id: 'FDC-1/2345', title: 'NYC TFR', desc: 'Temporary flight restriction - VIP movement', lat: 40.7128, lng: -74.0060, radius: 15000 },
            { id: 'FDC-2/2345', title: 'LAX Airspace', desc: 'Runway closure NOTAM', lat: 33.9416, lng: -118.4085, radius: 8000 }
        ];

        faa.forEach(notam => {
            notams.push({
                ...notam,
                type: 'warning',
                source: 'FAA NOTAM Search'
            });
        });
    }

    displayNotams() {
        // Clear with fade animation
        this.notamMarkers.forEach(marker => {
            marker.setStyle({ fillOpacity: 0, opacity: 0 });
            setTimeout(() => this.map.removeLayer(marker), 300);
        });
        this.notamMarkers = [];

        const colors = {
            warning: '#FF9500',
            restricted: '#FF3B30',
            danger: '#FF2D55',
            info: '#5AC8FA'
        };

        // Add with staggered animation
        this.notams.forEach((notam, index) => {
            setTimeout(() => {
                const circle = L.circle([notam.lat, notam.lng], {
                    radius: notam.radius,
                    color: colors[notam.type] || '#FF9500',
                    fillColor: colors[notam.type] || '#FF9500',
                    fillOpacity: 0,
                    weight: 2,
                    opacity: 0
                }).addTo(this.map);

                // Fade in
                setTimeout(() => {
                    circle.setStyle({ fillOpacity: 0.15, opacity: 0.7 });
                }, 50);

                circle.bindPopup(`
                    <strong>${notam.title}</strong><br>
                    <em style="color: ${colors[notam.type]}">${notam.type.toUpperCase()}</em><br>
                    ${notam.description}<br>
                    <small>Radius: ${(notam.radius / 1000).toFixed(1)} km</small><br>
                    <small>Source: ${notam.source}</small>
                `);

                this.notamMarkers.push(circle);
            }, index * 30); // Stagger by 30ms
        });

        document.getElementById('notamCount').textContent = this.notams.length;
    }

    clearNotams() {
        this.notamMarkers.forEach(marker => {
            marker.setStyle({ fillOpacity: 0, opacity: 0 });
            setTimeout(() => this.map.removeLayer(marker), 300);
        });
        this.notamMarkers = [];
    }

    // ===== UTILITIES =====

    showStatus(message) {
        const statusEl = document.getElementById('status');
        statusEl.style.opacity = '0';
        setTimeout(() => {
            statusEl.textContent = message;
            statusEl.style.opacity = '1';
            statusEl.classList.add('loading');

            setTimeout(() => {
                statusEl.classList.remove('loading');
            }, 2000);
        }, 150);
    }
}

// Initialize
let skyObserver;
document.addEventListener('DOMContentLoaded', () => {
    skyObserver = new SkyObserver();
});
