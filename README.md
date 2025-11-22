# 🛩️ Sky Observer - Real-Time Plane Tracker

A free, real-time airplane tracking application with weather radar overlay and NOTAM (Notice to Airmen) management capabilities. Built for GitHub Pages using only free APIs - no API keys required!

## ✨ Features

- **✈️ Real-Time Plane Tracking**: Live flight data from OpenSky Network API
- **🌧️ Weather Radar**: Integrated RainViewer radar overlay with adjustable opacity
- **📍 NOTAM Management**: Click-to-place NOTAMs with customizable types and radii
- **📊 Flight Information**: Detailed aircraft data including callsign, altitude, speed, heading, and more
- **💾 Persistent Storage**: NOTAMs saved in browser local storage
- **🎨 Beautiful UI**: Modern, dark-themed interface with smooth animations

## 🚀 Live Demo

Once deployed to GitHub Pages, your app will be available at:
`https://[your-username].github.io/Skyobserver/`

## 🛠️ Technologies Used

- **Leaflet.js** - Interactive map display
- **OpenSky Network API** - Free flight tracking data (no API key required)
- **RainViewer API** - Real-time weather radar tiles
- **LocalStorage** - Client-side NOTAM persistence
- **Vanilla JavaScript** - No frameworks, pure performance

## 📋 How to Use

### Plane Tracking

1. Click **"Start Tracking"** to begin receiving live flight data
2. Planes appear as airplane emojis rotated to match their heading
3. Click any plane to view detailed information in the sidebar
4. Updates automatically every 10 seconds
5. Click **"Stop Tracking"** to pause updates

### Weather Radar

1. Click **"Show Rain"** to overlay weather radar data
2. Use the opacity slider to adjust radar transparency
3. Radar updates to show the most recent weather data
4. Click **"Hide Rain"** to remove the overlay

### NOTAMs (Notices to Airmen)

1. Click **"Place NOTAM"** to enter placement mode
2. Click anywhere on the map to place a NOTAM
3. Fill in the NOTAM details:
   - **Title**: Brief identifier
   - **Description**: Detailed information
   - **Type**: Warning, Restricted Airspace, Danger Area, or Information
   - **Radius**: Area coverage in kilometers
4. Click **"Add NOTAM"** to confirm or **"Cancel"** to abort
5. NOTAMs are displayed as colored circles with popups
6. Click NOTAMs in the sidebar to navigate to their location
7. Delete NOTAMs using the delete button

## 🌐 Deploying to GitHub Pages

1. Push this repository to GitHub
2. Go to repository **Settings** → **Pages**
3. Under **Source**, select the branch (usually `main` or `master`)
4. Click **Save**
5. Your site will be live in a few minutes!

## 📊 API Information

### OpenSky Network API

- **Free tier**: ~100 requests per day (anonymous)
- **Rate limit**: Automatic retry with backoff on errors
- **Coverage**: Global flight data
- **No signup required**
- Learn more: https://opensky-network.org/apidoc/

### RainViewer API

- **Free tier**: Unlimited requests
- **Updates**: Every 10 minutes
- **Coverage**: Global weather radar
- **No API key required**
- Learn more: https://www.rainviewer.com/api.html

## 🔧 Configuration

To customize the app, edit `app.js`:

- **Map center**: Line 25 - Change coordinates in `setView([lat, lng], zoom)`
- **Update interval**: Line 69 - Change `10000` (10 seconds) to your preferred interval
- **Default NOTAM radius**: Line 94 in `index.html` - Change `value="5"`

## 🐛 Troubleshooting

**No planes showing up?**
- Check browser console for errors
- OpenSky API has rate limits - wait a few minutes if you've made many requests
- Zoom in to a specific region for better results
- Try moving the map to a busy airspace (major cities, airports)

**Rain radar not loading?**
- Check your internet connection
- RainViewer may be temporarily unavailable
- Check browser console for error messages

**NOTAMs disappearing?**
- NOTAMs are stored in browser LocalStorage
- Clearing browser data will remove NOTAMs
- Use same browser to see previously added NOTAMs

## 📱 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Modern browsers with ES6+ support required.

## 📄 License

This project is open source and available for free use.

## 🙏 Credits

- Flight data: [OpenSky Network](https://opensky-network.org/)
- Weather radar: [RainViewer](https://www.rainviewer.com/)
- Maps: [OpenStreetMap](https://www.openstreetmap.org/) & [Leaflet](https://leafletjs.com/)

## 🤝 Contributing

Feel free to open issues or submit pull requests with improvements!

---

**Made with ✈️ by Sky Observer Team**
