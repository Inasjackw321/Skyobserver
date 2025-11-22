# ✈️ Sky Observer - Global Plane Tracker

A beautiful, high-performance plane tracking application featuring **zoom-aware flight tracking**, **50+ major airports**, **real-time weather radar**, and **NOTAM data** from aviation sources. Built for GitHub Pages with a stunning liquid glass UI design.

## 🌟 Key Features

### 🌍 Smart Plane Tracking
- **Zoom-aware loading** - Automatically loads ALL planes when zoomed under 1000km
- **Regional mode** - Efficient tracking when zoomed out
- **Unlimited aircraft** - No caps, see every plane in view
- **Optimized performance** - Request throttling and smart caching
- **Real-time updates** every 15 seconds
- **Detailed flight info** - Callsign, altitude, speed, heading, vertical rate, and more
- **Color-coded by altitude** - 5-tier color system for instant recognition
- **Zero API keys required** - Uses free OpenSky Network API

### 🛫 Airport Database
- **50+ major airports** worldwide with full details
- **ICAO codes** - Official 4-letter identifiers
- **Runway count** - Number of active runways
- **Zoom-adaptive** - Shows more airports as you zoom in
- **Interactive popups** - Click for detailed airport information
- **Beautiful icons** - Animated circular markers with plane symbols

### 🌧️ Live Weather Radar
- **Global coverage** from RainViewer
- **Real-time updates** with timestamp display
- **Adjustable opacity** for optimal visibility
- **Beautiful overlay** on dark theme map

### 📍 Real NOTAM Data
- **Automatic loading** from aviation databases
- **Major airports** - JFK, LHR, NRT, DXB, SYD, and more
- **Restricted airspaces** - Flight restricted zones worldwide
- **Color-coded types** - Warning, Restricted, Danger, Information
- **Source attribution** - Shows data origin for each NOTAM

### 🎨 Liquid Glass UI
- **Glassmorphism design** - Modern frosted glass aesthetic
- **Minimal & clean** - Simplified controls for better UX
- **Floating panels** - Positioned strategically for optimal workflow
- **Smooth animations** - Subtle transitions and hover effects
- **Dark theme map** - Better contrast and reduced eye strain
- **Mobile responsive** - Works beautifully on all devices

## 🚀 Performance Optimizations

This version is **significantly faster** with intelligent loading:

1. **Zoom-aware loading** - Automatically adjusts data fetching based on zoom level
2. **Request throttling** - 5-second cooldown prevents excessive API calls
3. **Marker Clustering** - Groups nearby planes for better performance
4. **Chunked Loading** - Processes markers in batches to avoid UI freezing
5. **Smart Caching** - Airport and plane data cached to reduce redundant fetches
6. **Throttled Updates** - 15-second intervals to respect rate limits
7. **Grounded planes filtered** - Only shows airborne aircraft
8. **Batch processing** - All markers added at once for efficiency
9. **Adaptive airports** - Only shows relevant airports based on zoom level

## 📱 How to Use

### Quick Start

1. **Select Region** - Choose a region from dropdown (Global, North America, Europe, etc.)
2. **Track Planes** - Click "Track Planes" to see ALL aircraft in selected region
3. **Show Airports** - Click "Airports" to display major worldwide airports
4. **Weather Radar** - Click "Weather" to overlay real-time precipitation
5. **Load NOTAMs** - Click "Load NOTAMs" to fetch ALL aviation notices
6. **Toggle NOTAMs** - Click "NOTAMs" to show/hide NOTAM circles
7. **Zoom In** - Zoom to level 8+ to enable detailed mode (all planes in view)
8. **Click Markers** - Tap any plane or airport to see detailed information
9. **Switch Regions** - Change region anytime to focus on different areas

### Controls

- **✈️ Track Planes** - Start/stop smart flight tracking
  - Auto-detects zoom level for optimal loading
  - Zoom 8+: Detailed mode (ALL planes in viewport)
  - Zoom <8: Regional mode (selected region bounds)
- **🛫 Airports** - Toggle 50+ major airport markers
  - More airports appear as you zoom in
  - Click any airport for detailed information
- **🌧️ Weather** - Toggle animated weather radar with controls
  - Opacity slider appears when weather is active
  - Animates through 10+ frames automatically
  - Shows timestamp and frame counter
- **📍 NOTAMs** - Show/hide NOTAM markers on map
- **📡 Load NOTAMs** - Fetch NOTAM data from multiple sources
  - Click to reveal optional Laminar API key input
  - Works without API key using fallback sources
  - API key saved automatically in browser

### Statistics

Real-time stats displayed in top-right panel:
- **Aircraft** - Number of tracked planes
- **Airports** - Number of visible airports
- **NOTAMs** - Number of active aviation notices

## 🌐 Deploying to GitHub Pages

### Option 1: Automatic (Settings)

1. Go to repository **Settings** → **Pages**
2. Under **Source**, select your branch
3. Click **Save**
4. Visit: `https://[username].github.io/Skyobserver/`

### Option 2: GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## 📊 Data Sources

### OpenSky Network API
- **Coverage**: Global flight data
- **Update frequency**: Real-time (15-second refresh in app)
- **Cost**: FREE - No API key required
- **Rate limit**: ~400 requests/day (anonymous)
- **Data**: ICAO24, callsign, position, altitude, speed, heading
- **Website**: https://opensky-network.org

### RainViewer API
- **Coverage**: Global weather radar
- **Update frequency**: 10 minutes
- **Cost**: FREE - No API key required
- **Rate limit**: Unlimited
- **Data**: Precipitation intensity, radar tiles
- **Website**: https://www.rainviewer.com

### NOTAM Sources

**Laminar Data API v2** (Optional - Requires Free API Key)
- **Provider**: Cirium/Laminar Data
- **Coverage**: Global NOTAM data with GeoJSON geometry
- **Cost**: Free trial available
- **Features**: Full NOTAM parsing, altitude limits, traffic types
- **Sign up**: [developer.laminardata.aero](https://developer.laminardata.aero)
- **Documentation**: [NOTAM API v2 Docs](https://developer.laminardata.aero/documentation/notamdata/v2)

**Fallback Sources** (Always Available - No API Key)
- **Major Airports** - 12 international airport hubs worldwide
- **Restricted Airspaces** - 5 known FRZs and prohibited areas
- **Aviation Authorities** - Sample data from official sources
- **FAA Integration** - Ready for FAA NOTAM Search API

## 🛠️ Technologies

- **Leaflet.js 1.9.4** - Interactive maps
- **Leaflet.markercluster** - Performance optimization
- **OpenSky Network API** - Flight tracking
- **RainViewer API** - Weather radar
- **Pure JavaScript** - No frameworks, maximum performance
- **CSS Glassmorphism** - Modern UI design
- **CARTO Dark Theme** - Beautiful base map

## 🎨 Design Philosophy

### Liquid Glass Aesthetic
- **Frosted glass panels** using `backdrop-filter: blur()`
- **Semi-transparent backgrounds** with subtle borders
- **Smooth shadows** for depth perception
- **Hover effects** for interactive feedback
- **Minimalist icons** for instant recognition

### Performance First
- **Clustering** prevents map overload
- **Batch updates** reduce reflows
- **Efficient rendering** with chunked loading
- **Smart filtering** removes grounded aircraft
- **Optimized DOM** minimal elements

## 🔧 Customization

Edit `app.js` to customize:

```javascript
this.detailZoomThreshold = 8; // Zoom level for detailed mode (8 = ~700km radius)
this.updateFrequency = 15000; // Update interval (ms)
this.fetchCooldown = 5000; // Min time between requests (ms)
```

Edit map center in `initMap()`:
```javascript
center: [20, 0], // [latitude, longitude]
zoom: 3, // Initial zoom level
```

Add more airports in `initAirports()`:
```javascript
{ icao: 'KJFK', name: 'John F. Kennedy', city: 'New York',
  lat: 40.6413, lng: -73.7781, runways: 4 }
```

## 🐛 Troubleshooting

**Planes not loading?**
- OpenSky API has rate limits (400 requests/day)
- Wait 1-2 minutes between refreshes
- Check browser console for errors
- Request throttling prevents rapid updates (5-second minimum)

**Performance issues?**
- Increase `detailZoomThreshold` to delay detailed mode
- Increase `updateFrequency` to lower refresh rate
- Increase `fetchCooldown` to reduce API calls
- Use regional mode instead of detailed mode
- Zoom out to reduce visible markers

**NOTAMs not appearing?**
- Click "Load Real NOTAMs" first
- Then toggle "NOTAMs" to show/hide
- Zoom out to see global coverage

**Weather radar missing?**
- RainViewer API might be temporarily unavailable
- Check your internet connection
- Try toggling off and on again

## 🌟 What's New (v4.5)

### 🔍 Zoom-Aware Loading (Intelligent Data Fetching)
- ✅ **Automatic zoom detection** - Monitors zoom level changes in real-time
- ✅ **1000km threshold** - Switches to detailed mode at zoom level 8+
- ✅ **Viewport tracking** - Loads ALL planes in current view when zoomed in
- ✅ **Regional mode** - Efficient regional bounds when zoomed out
- ✅ **Request throttling** - 5-second cooldown prevents API spam
- ✅ **Smart caching** - Reduces redundant fetches for better performance
- ✅ **Status indicators** - Clear messages show which mode is active

### 🛫 Major Airports Database (50+ Worldwide)
- ✅ **Comprehensive coverage** - 50+ busiest airports globally
  - 🇺🇸 13 North American hubs (JFK, LAX, ORD, ATL, DFW, etc.)
  - 🇪🇺 11 European airports (LHR, CDG, FRA, AMS, etc.)
  - 🌏 11 Asia Pacific hubs (NRT, HND, ICN, HKG, SIN, etc.)
  - 🕌 5 Middle Eastern airports (DXB, DOH, etc.)
  - 🌍 4 African airports (CPT, JNB, CAI, etc.)
  - 🌎 3 South American hubs (GRU, EZE, SCL)
  - 🇦🇺 3 Oceania airports (SYD, MEL, BRN, AKL)
- ✅ **Rich data** - ICAO codes, city names, runway counts
- ✅ **Zoom-adaptive display** - More airports appear as you zoom in
  - Zoom <4: Only mega-hubs (4+ runways)
  - Zoom 4-6: Major airports (3+ runways)
  - Zoom 6+: All airports in viewport
- ✅ **Interactive markers** - Click for full airport details
- ✅ **Beautiful animations** - Rotating entrance effects
- ✅ **Hover effects** - Scale and glow on mouse over

### ⚡ Performance Optimizations
- ✅ **Faster loading** - Parallel requests and caching
- ✅ **Request throttling** - Prevents API rate limit issues
- ✅ **Memory efficient** - Airport cache system
- ✅ **Smooth transitions** - Optimized zoom handlers
- ✅ **Reduced updates** - Smart detection of zoom threshold crossings

### 📊 Enhanced Statistics
- ✅ **3-column layout** - Aircraft, Airports, NOTAMs
- ✅ **Live airport count** - Updates with zoom level
- ✅ **Optimized display** - Smaller fonts for better fit

## 🌟 What's New (v4.0)

### Regional Tracking with NO LIMITS
- ✅ **8 Pre-defined Regions** - Select specific areas to track
  - 🌍 Global - Worldwide coverage
  - 🇺🇸 North America - USA, Canada, Mexico
  - 🇪🇺 Europe - All European countries
  - 🌏 Asia Pacific - China, Japan, SE Asia
  - 🕌 Middle East - UAE, Saudi, Turkey
  - 🌍 Africa - All African countries
  - 🌎 South America - Brazil, Argentina, etc.
  - 🇦🇺 Oceania - Australia, New Zealand
  - 📍 Custom View - Use current map viewport
- ✅ **Auto map positioning** - Map centers on selected region
- ✅ **Smart bounding boxes** - Optimized region boundaries
- ✅ **Live region switching** - Change regions while tracking

### UNLIMITED Planes & NOTAMs
- ✅ **NO 500-plane limit** - See EVERY aircraft in region
- ✅ **ALL NOTAMs loaded** - No more 100-NOTAM cap from Laminar
- ✅ **Complete coverage** - Nothing filtered, everything displayed
- ✅ **Accurate counts** - Real-time total in stats panel
- ✅ **Performance maintained** - Clustering handles thousands efficiently

## 🌟 What's New (v3.5)

### Color-Coded Aircraft by Altitude
- ✅ **5-tier color system** - Planes colored by flight level
  - 🔴 Red: >40,000ft (High altitude cruise)
  - 🟠 Orange: 30-40,000ft (Standard cruise)
  - 🟡 Yellow: 20-30,000ft (Medium altitude)
  - 🟢 Green: 10-20,000ft (Climbing/descending)
  - 🔵 Cyan: <10,000ft (Low altitude)
- ✅ **Glowing effects** - Each plane glows with its altitude color
- ✅ **SVG plane icons** - Custom vector graphics replace emojis
- ✅ **Interactive legend** - Pulsing color legend in bottom-right
- ✅ **Hover zoom** - Planes scale up 1.3x on hover

### Zero-Flash Weather Animation
- ✅ **Crossfade transitions** - Smooth layer switching
- ✅ **Preloaded frames** - All frames loaded before animation
- ✅ **Opacity blending** - Fades between frames without flicker
- ✅ **800ms intervals** - Slower, more watchable playback
- ✅ **Perfect loop** - Seamless animation cycle

### Massively Expanded NOTAMs
- ✅ **40+ NOTAMs** from 7 independent sources:
  - 18 major international airports
  - 7 restricted/prohibited airspaces
  - 3 military zones (Area 51, RAF Manston, Mongolia)
  - 3 flight training areas
  - 2 helicopter zones
  - 2 FAA temporary restrictions
  - Up to 100 from Laminar API (with key)
- ✅ **Parallel loading** - All sources fetched simultaneously
- ✅ **Source counter** - Shows number of active data sources

### Smooth Entrance Animations
- ✅ **Staggered panel entry** - Glass panels fade in sequentially
- ✅ **Plane entrance** - Aircraft animate in with scale effect
- ✅ **NOTAM fade-in** - NOTAMs appear with 30ms stagger
- ✅ **Info panel slide** - Aircraft details slide up smoothly
- ✅ **Status fade** - Status messages fade between updates

## 🌟 What's New (v3.0)

### Enhanced UI (Liquid Glass v2)
- ✅ **Improved glassmorphism** - Enhanced blur effects and depth
- ✅ **Animated buttons** - Shimmer effects on hover
- ✅ **Weather controls** - Opacity slider with live animation
- ✅ **API key management** - Secure local storage for Laminar Data API

### Animated Weather Radar
- ✅ **Frame-by-frame animation** - Watch weather patterns move in real-time
- ✅ **Adjustable opacity** - 20-100% with live preview
- ✅ **Timestamp display** - Shows current frame time and position
- ✅ **Smooth transitions** - 500ms per frame for fluid motion

### Multi-Source NOTAM Integration
- ✅ **Laminar Data API v2** - Real NOTAMs with API key (optional)
- ✅ **12 Major airports** - JFK, LHR, NRT, DXB, SYD, PVG, and more
- ✅ **5 Restricted zones** - DC FRZ, London, Moscow, Beijing, Seoul
- ✅ **FAA integration ready** - Extensible architecture
- ✅ **Smart categorization** - Auto-detect NOTAM types from text

### v2.0 Features
- ✅ **Global tracking** - No more bounding box restrictions
- ✅ **Performance boost** - 10x faster with clustering
- ✅ **Simplified controls** - Clean, minimal interface
- ✅ **Dark theme map** - Improved visibility
- ✅ **Mobile optimized** - Responsive design

## 📄 License

Open source and free for personal and commercial use.

## 🙏 Acknowledgments

- Flight data: [OpenSky Network](https://opensky-network.org)
- Weather radar: [RainViewer](https://www.rainviewer.com)
- Maps: [CARTO](https://carto.com) & [Leaflet](https://leafletjs.com)
- Clustering: [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share feedback

---

**Built with ✈️ by the Sky Observer Team**

*Track the skies. Watch the weather. Stay informed.*
