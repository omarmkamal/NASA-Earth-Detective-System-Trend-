# 🌍 NASA-EARTH Detective Trend

> **NASA International Space Apps Challenge**  
> An interactive web application for detecting, visualizing, and statistically verifying long-term environmental trends using real NASA satellite observations and atmospheric models.

---

## 🚀 How to Host on GitHub Pages (Free, 2 Minutes)

GitHub Pages gives you a permanent, rock-solid, 100% free URL that never pauses or expires:

1. **Create a new repository on GitHub:**
   - Go to [https://github.com/new](https://github.com/new)
   - Name it `nasa-earth-detective-trend` (or any name you like).
   - Set visibility to **Public**.
   - Do **NOT** check "Initialize with README" (we already have all files ready).
   - Click **Create repository**.

2. **Push this folder to your GitHub repo:**
   Open a terminal (PowerShell or Command Prompt) in this folder and run:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/nasa-earth-detective-trend.git
   git branch -M main
   git push -u origin main
   ```
   *(Or drag and drop the folder contents into GitHub Desktop)*

3. **Activate GitHub Pages:**
   - In your repository on GitHub, click **Settings** (top right tab).
   - In the left sidebar, click **Pages**.
   - Under **Build and deployment > Source**, select **Deploy from a branch**.
   - Under **Branch**, select `main` and folder `/(root)`, then click **Save**.
   - Within 60 seconds, your website will be live at:
     **`https://YOUR_GITHUB_USERNAME.github.io/nasa-earth-detective-trend/`**
   - You can submit this exact link to the NASA Space Apps Challenge!

---

## 🌟 Key Features

### 1. NASA Satellite & Model Data Integration
- Powered by the **NASA POWER API** (Prediction Of Worldwide Energy Resources).
- Derived from NASA satellite observations and global reanalysis models including **MERRA-2** and **GLDAS**.
- **17 Earth Science Variables** across 6 core categories:
  - 🌡️ **Temperature:** Surface Air Temperature, Max/Min Temperature, Dew Point, Earth Skin Temperature.
  - 🌧️ **Precipitation:** Corrected Daily/Monthly Precipitation.
  - 💧 **Humidity:** Relative Humidity, Specific Humidity.
  - 🌬️ **Wind Speed:** Surface Wind Speeds at 2m, 10m, and 50m heights.
  - ☀️ **Solar Radiation:** All-Sky Shortwave, Clear-Sky Shortwave, Downward Longwave.
  - 🌐 **Atmosphere:** Surface Air Pressure, Cloud Amount.
- Historical records spanning from **1981 to present** at both monthly and daily resolutions.

### 2. Interactive Global Map & Search
- High-resolution **NASA Blue Marble** and satellite basemaps.
- Global geocoding search bar with instant autocomplete to find any city, region, or landmark.
- 12 preset global biomes (Arctic, Amazon Rainforest, Sahara Desert, Himalayas, Pacific, etc.).
- Direct manual latitude/longitude coordinate entry.

### 3. Unrestricted 3D Earth Globe & 360° "Inside Place" View
- **Interactive 3D Earth:** Rendered with Three.js, featuring photorealistic atmospheric scattering, 360° orbital rotation, and starry background.
- **Deep Unrestricted Zoom:** Zoom smoothly from deep outer space all the way down to the planet surface and location pin with zero artificial limits.
- **360° 3D "Inside Place" Photosphere:**
  - Inverted sphere geometry with first-person perspective $(0, 0, 0)$.
  - Drag in 360° horizontally and vertically with mouse or touch.
  - Field of View (FOV) zooming from wide-angle ($105^\circ$) to telephoto zoom ($30^\circ$).
  - Live real-time compass heading indicator (`🧭 Facing: North (0°)`).
- **6 Rich Procedural Biomes:**
  - ❄️ **Polar Ice:** Glaciers, crevasses, polar sun halo, aurora ribbons, NASA Arctic Station.
  - 🏙️ **City / Urban:** 360° skyscraper skyline, observation deck, glass railing, NASA urban Doppler radar.
  - 🌲 **Forest Canopy:** Tall rainforest canopy, crepuscular sunbeams (god rays), NASA carbon flux tower.
  - 🏜️ **Desert Dunes:** Sweeping dunes, canyon mesas, blazing sun, NASA solar radiation station.
  - 🏔️ **Mountain Summit:** Alpine peaks, snow caps, granite scree, AWS weather station.
  - 🌊 **Coastal Shore:** Turquoise ocean, sandy beach, wave surf, NASA coastal climate buoy.
- **Real-World Integrations:** Direct 1-click links to Google Street View 360° and Google Earth 3D.

### 4. Rigorous Statistical Engine (`js/stats.js`)
All statistical tests are pure JavaScript with zero external mathematical dependencies:
- **Linear Regression (Ordinary Least Squares):** Slope, intercept, coefficient of determination ($R^2$), $t$-statistic, two-tailed $p$-value, and standard error.
- **Mann-Kendall Trend Test:** Non-parametric test with tie correction, Kendall's $\tau$, $S$ statistic, Var($S$), and $Z$-score for robust trend significance without normality assumptions.
- **Sen's Slope Estimator:** Non-parametric median-of-slopes estimator resistant to outliers.
- **Confidence Intervals:** Exact 95% confidence bands for regression trends.
- **Seasonal Decomposition & Moving Average:** 12-month centered moving average and additive seasonal component isolation.
- **Anomaly Detection:** Monthly baseline climatological departure calculations.

### 5. User Account & Analysis History
- Local persistent authentication system (Profile avatar, name, email, background).
- Search and investigation history saving all results, variables, coordinates, and statistics with **1-click instant restoration**.
- Welcome modal explaining the mission and scientific approach.

---

## 📁 Repository Structure

```
nasa-earth-detective-trend/
├── index.html          # Main HTML structure, wizard steps, modals, 3D containers
├── README.md           # Documentation, quick start, and NASA Space Apps submission guide
├── css/
│   └── styles.css      # Responsive styles, mobile optimizations, NASA dark theme
└── js/
    ├── app.js          # Application controller, API fetcher, Three.js 3D/360 engine, auth, history
    └── stats.js        # Pure JS statistical engine (OLS, Mann-Kendall, Sen's Slope)
```

---

## 🛠️ Technology Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics & Panoramas:** [Three.js r128](https://threejs.org/) & OrbitControls
- **Interactive Charts:** [Plotly.js](https://plot.ly/javascript/)
- **Mapping:** [Leaflet.js](https://leafletjs.com/) with ESRI & NASA Worldview tiles
- **Data Source:** [NASA POWER Project](https://power.larc.nasa.gov/)
- **Hosting:** Fully compatible with [GitHub Pages](https://pages.github.com/), Netlify, Vercel, or any static host.

---

## 📄 License & Attribution

- Built for the **NASA International Space Apps Challenge**.
- Atmospheric & meteorological data provided courtesy of the **NASA Langley Research Center POWER Project**.
- Open source under the MIT License.
