// EarthTrend Explorer - Main Application
// Handles UI, data fetching, visualization, and analysis orchestration

document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    // VARIABLE DEFINITIONS
    // ============================================================
    // Define all available variables with metadata
    // Each variable: { id, name, description, unit, category, nasaParam, community }
    // nasaParam is the NASA POWER API parameter name
    // community is the NASA POWER community code ("AG", "RE", or "SB")

    const VARIABLES = [
        // Temperature
        { id: 'T2M', name: 'Surface Air Temperature',
          description: 'Air temperature at 2 meters above the ground. This is the standard measurement height for weather stations and is the most commonly reported temperature.',
          unit: '°C', category: 'temperature', nasaParam: 'T2M', community: 'AG',
          icon: '🌡️' },
        { id: 'T2M_MAX', name: 'Maximum Temperature',
          description: 'The highest temperature recorded during each time period at 2 meters above the ground. Important for studying heat waves and extreme weather.',
          unit: '°C', category: 'temperature', nasaParam: 'T2M_MAX', community: 'AG',
          icon: '🌡️' },
        { id: 'T2M_MIN', name: 'Minimum Temperature',
          description: 'The lowest temperature recorded during each time period at 2 meters above the ground. Important for studying frost events and cold extremes.',
          unit: '°C', category: 'temperature', nasaParam: 'T2M_MIN', community: 'AG',
          icon: '🌡️' },
        { id: 'T2MDEW', name: 'Dew Point Temperature',
          description: 'The temperature at which air becomes saturated and water vapor condenses. Higher dew points mean more moisture in the air, affecting comfort and precipitation.',
          unit: '°C', category: 'temperature', nasaParam: 'T2MDEW', community: 'AG',
          icon: '💧' },
        { id: 'TS', name: 'Earth Skin Temperature',
          description: 'The temperature of the Earth\'s surface itself (land or ocean), as opposed to the air above it. This is what a satellite infrared sensor measures directly.',
          unit: '°C', category: 'temperature', nasaParam: 'TS', community: 'AG',
          icon: '🌍' },

        // Precipitation
        { id: 'PRECTOTCORR', name: 'Precipitation',
          description: 'Total precipitation (rain and snow) corrected for gauge undercatch. The fundamental measurement of how much water falls from the atmosphere to the surface.',
          unit: 'mm/day', category: 'precipitation', nasaParam: 'PRECTOTCORR', community: 'AG',
          icon: '🌧️' },

        // Humidity
        { id: 'RH2M', name: 'Relative Humidity',
          description: 'The amount of moisture in the air compared to the maximum it could hold at that temperature. 100% means the air is fully saturated. Important for comfort, agriculture, and weather.',
          unit: '%', category: 'humidity', nasaParam: 'RH2M', community: 'AG',
          icon: '💨' },
        { id: 'QV2M', name: 'Specific Humidity',
          description: 'The actual mass of water vapor per mass of air. Unlike relative humidity, this doesn\'t depend on temperature, making it better for tracking real moisture changes.',
          unit: 'g/kg', category: 'humidity', nasaParam: 'QV2M', community: 'AG',
          icon: '💨' },

        // Wind
        { id: 'WS2M', name: 'Wind Speed (2m)',
          description: 'Wind speed measured at 2 meters above the surface. This height is standard for agricultural and environmental monitoring.',
          unit: 'm/s', category: 'wind', nasaParam: 'WS2M', community: 'AG',
          icon: '🌬️' },
        { id: 'WS10M', name: 'Wind Speed (10m)',
          description: 'Wind speed at 10 meters above the surface — the standard height for weather observations and wind energy assessment.',
          unit: 'm/s', category: 'wind', nasaParam: 'WS10M', community: 'RE',
          icon: '🌬️' },
        { id: 'WS50M', name: 'Wind Speed (50m)',
          description: 'Wind speed at 50 meters, approaching the height of wind turbine hubs. Important for wind energy resource assessment.',
          unit: 'm/s', category: 'wind', nasaParam: 'WS50M', community: 'RE',
          icon: '🌬️' },

        // Solar Radiation
        { id: 'ALLSKY_SFC_SW_DWN', name: 'Solar Radiation (All Sky)',
          description: 'Total solar energy reaching the surface under actual sky conditions (including clouds). Measured in energy per area per day. Key for solar energy and agriculture.',
          unit: 'kW-hr/m²/day', category: 'solar', nasaParam: 'ALLSKY_SFC_SW_DWN', community: 'RE',
          icon: '☀️' },
        { id: 'CLRSKY_SFC_SW_DWN', name: 'Solar Radiation (Clear Sky)',
          description: 'Solar energy that would reach the surface if there were no clouds. Comparing this with all-sky values tells you how much solar energy clouds are blocking.',
          unit: 'kW-hr/m²/day', category: 'solar', nasaParam: 'CLRSKY_SFC_SW_DWN', community: 'RE',
          icon: '☀️' },
        { id: 'ALLSKY_SFC_LW_DWN', name: 'Longwave Radiation',
          description: 'Infrared (heat) radiation emitted downward by the atmosphere to the surface. This is the "greenhouse effect" in action — more greenhouse gases increase this value.',
          unit: 'kW-hr/m²/day', category: 'solar', nasaParam: 'ALLSKY_SFC_LW_DWN', community: 'RE',
          icon: '🔥' },

        // Pressure & Clouds
        { id: 'PS', name: 'Surface Pressure',
          description: 'Atmospheric pressure at the Earth\'s surface. Changes in pressure patterns can indicate shifts in weather systems and circulation patterns.',
          unit: 'kPa', category: 'atmosphere', nasaParam: 'PS', community: 'AG',
          icon: '📊' },
        { id: 'CLOUD_AMT', name: 'Cloud Cover',
          description: 'The fraction of the sky covered by clouds, expressed as a percentage. Cloud changes affect both solar energy reaching the surface and the greenhouse effect.',
          unit: '%', category: 'atmosphere', nasaParam: 'CLOUD_AMT', community: 'AG',
          icon: '☁️' },
    ];

    // Category definitions with descriptions
    const CATEGORIES = {
        temperature: { name: 'Temperature', icon: '🌡️',
            description: 'How hot or cold the air and surface are' },
        precipitation: { name: 'Precipitation', icon: '🌧️',
            description: 'Rain and snowfall reaching the ground' },
        humidity: { name: 'Humidity', icon: '💧',
            description: 'Moisture content of the atmosphere' },
        wind: { name: 'Wind', icon: '🌬️',
            description: 'Air movement speed at different heights' },
        solar: { name: 'Solar & Radiation', icon: '☀️',
            description: 'Energy from the sun and atmosphere' },
        atmosphere: { name: 'Atmosphere', icon: '🌐',
            description: 'Pressure and cloud conditions' },
    };

    // Preset regions for quick selection
    const PRESET_REGIONS = [
        { name: 'Amazon Rainforest', lat: -3.4, lon: -60.0, description: 'Tropical rainforest, heavy precipitation' },
        { name: 'Sahara Desert', lat: 23.0, lon: 25.0, description: 'Arid desert, extreme temperatures' },
        { name: 'Arctic (Svalbard)', lat: 78.0, lon: 16.0, description: 'Polar region, rapid warming' },
        { name: 'Los Angeles', lat: 34.05, lon: -118.24, description: 'Urban heat island, coastal city' },
        { name: 'Mumbai, India', lat: 19.08, lon: 72.88, description: 'Monsoon region, tropical coast' },
        { name: 'Great Barrier Reef', lat: -18.3, lon: 147.7, description: 'Ocean warming, coral ecosystem' },
        { name: 'Greenland Ice Sheet', lat: 72.0, lon: -40.0, description: 'Ice mass changes, warming' },
        { name: 'Siberia', lat: 62.0, lon: 130.0, description: 'Permafrost region, extreme cold' },
        { name: 'Sub-Saharan Africa', lat: 7.0, lon: 20.0, description: 'Savanna, changing rainfall patterns' },
        { name: 'Central Europe', lat: 50.1, lon: 14.4, description: 'Temperate, changing seasons' },
        { name: 'Antarctic Peninsula', lat: -65.0, lon: -64.0, description: 'Rapid warming, ice loss' },
        { name: 'Hawaiian Islands', lat: 21.3, lon: -157.8, description: 'Pacific Ocean, trade winds' },
    ];

    // ============================================================
    // STATE
    // ============================================================
    let state = {
        selectedVariable: null,
        selectedLat: null,
        selectedLon: null,
        startYear: 2001,
        endYear: 2023,
        temporal: 'monthly', // 'monthly' or 'daily'
        map: null,
        marker: null,
        currentData: null,
        currentAnalysis: null,
    };

    // ============================================================
    // INITIALIZATION
    // ============================================================

    function init() {
        renderVariableCategories();
        initMap();
        initMapSearch();
        init3DGlobe();
        initTimeControls();
        initDemoExamples();
        initWelcomeModal();
        initAuthSystem();
        initHistorySystem();
        setupEventListeners();
        // Show welcome state
        document.getElementById('results-section').style.display = 'none';
    }

    // ============================================================
    // VARIABLE SELECTION UI
    // ============================================================

    function renderVariableCategories() {
        const container = document.getElementById('variable-categories');
        container.innerHTML = '';

        Object.entries(CATEGORIES).forEach(([catId, cat]) => {
            const vars = VARIABLES.filter(v => v.category === catId);
            const card = document.createElement('div');
            card.className = 'category-card';
            card.dataset.category = catId;
            card.innerHTML = `
                <div class="category-header">
                    <span class="category-icon">${cat.icon}</span>
                    <div>
                        <h3 class="category-name">${cat.name}</h3>
                        <p class="category-desc">${cat.description}</p>
                    </div>
                    <span class="expand-icon">▶</span>
                </div>
                <div class="variable-list" style="display:none;">
                    ${vars.map(v => `
                        <label class="variable-item" data-var-id="${v.id}">
                            <input type="radio" name="variable" value="${v.id}">
                            <div class="variable-info">
                                <span class="variable-name">${v.name}</span>
                                <span class="variable-unit">(${v.unit})</span>
                                <p class="variable-description">${v.description}</p>
                            </div>
                        </label>
                    `).join('')}
                </div>
            `;
            container.appendChild(card);

            // Toggle expansion
            card.querySelector('.category-header').addEventListener('click', () => {
                const list = card.querySelector('.variable-list');
                const icon = card.querySelector('.expand-icon');
                const isOpen = list.style.display !== 'none';
                // Close all others
                document.querySelectorAll('.variable-list').forEach(l => l.style.display = 'none');
                document.querySelectorAll('.expand-icon').forEach(i => i.textContent = '▶');
                document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
                if (!isOpen) {
                    list.style.display = 'block';
                    icon.textContent = '▼';
                    card.classList.add('active');
                }
            });
        });

        // Listen for variable selection
        container.addEventListener('change', (e) => {
            if (e.target.name === 'variable') {
                state.selectedVariable = VARIABLES.find(v => v.id === e.target.value);
                document.querySelectorAll('.variable-item').forEach(item => item.classList.remove('selected'));
                e.target.closest('.variable-item').classList.add('selected');
                updateSelectionSummary();
                // Scroll to next step
                smoothScrollTo('step-region');
            }
        });
    }

    // ============================================================
    // MAP INITIALIZATION (Leaflet)
    // ============================================================

    function initMap() {
        // Initialize Leaflet map
        state.map = L.map('map', {
            center: [20, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 10,
            worldCopyJump: true
        });

        // Add satellite tile layer (Esri World Imagery)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri, Maxar, Earthstar Geographics',
            maxZoom: 18,
        }).addTo(state.map);

        // Add labels overlay so place names are readable on satellite
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 18,
            pane: 'overlayPane',
        }).addTo(state.map);

        // Click to select location
        state.map.on('click', (e) => {
            setLocation(e.latlng.lat, e.latlng.lng);
        });

        // Render preset region buttons
        const presetsContainer = document.getElementById('preset-regions');
        presetsContainer.innerHTML = PRESET_REGIONS.map(r => `
            <button class="preset-btn" data-lat="${r.lat}" data-lon="${r.lon}" title="${r.description}">
                📍 ${r.name}
            </button>
        `).join('');

        presetsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.preset-btn');
            if (btn) {
                const lat = parseFloat(btn.dataset.lat);
                const lon = parseFloat(btn.dataset.lon);
                setLocation(lat, lon);
                state.map.setView([lat, lon], 5);
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });

        // Manual lat/lon inputs
        document.getElementById('lat-input').addEventListener('change', () => {
            const lat = parseFloat(document.getElementById('lat-input').value);
            const lon = parseFloat(document.getElementById('lon-input').value);
            if (!isNaN(lat) && !isNaN(lon)) setLocation(lat, lon);
        });
        document.getElementById('lon-input').addEventListener('change', () => {
            const lat = parseFloat(document.getElementById('lat-input').value);
            const lon = parseFloat(document.getElementById('lon-input').value);
            if (!isNaN(lat) && !isNaN(lon)) setLocation(lat, lon);
        });
    }

    function setLocation(lat, lon) {
        // Clamp values
        lat = Math.max(-90, Math.min(90, lat));
        lon = Math.max(-180, Math.min(180, lon));

        state.selectedLat = Math.round(lat * 100) / 100;
        state.selectedLon = Math.round(lon * 100) / 100;

        const locName = getRegionDisplayName(state.selectedLat, state.selectedLon);
        const popupHtml = `
            <div class="marker-popup-content">
                <div class="marker-popup-title">${locName}</div>
                <div class="marker-popup-coords">${Math.abs(state.selectedLat).toFixed(2)}°${state.selectedLat >= 0 ? 'N' : 'S'}, ${Math.abs(state.selectedLon).toFixed(2)}°${state.selectedLon >= 0 ? 'E' : 'W'}</div>
                <button class="popup-3d-btn" onclick="document.getElementById('open-3d-btn').click()">🌐 3D & 360° View</button>
            </div>
        `;

        // Update marker
        if (state.marker) {
            state.marker.setLatLng([lat, lon]);
            state.marker.setPopupContent(popupHtml);
        } else {
            state.marker = L.marker([lat, lon], {
                draggable: true,
            }).addTo(state.map);
            state.marker.bindPopup(popupHtml);
            state.marker.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                setLocation(pos.lat, pos.lng);
            });
        }

        // Update inputs
        document.getElementById('lat-input').value = state.selectedLat;
        document.getElementById('lon-input').value = state.selectedLon;

        // Update location display
        document.getElementById('selected-location').textContent =
            `${locName} (${Math.abs(state.selectedLat).toFixed(2)}°${state.selectedLat >= 0 ? 'N' : 'S'}, ${Math.abs(state.selectedLon).toFixed(2)}°${state.selectedLon >= 0 ? 'E' : 'W'})`;

        // Enable 3D & 360 view button
        const open3dBtn = document.getElementById('open-3d-btn');
        if (open3dBtn) open3dBtn.disabled = false;

        // Update Google Earth 3D link
        const earthLink = document.getElementById('google-earth-link');
        if (earthLink) {
            earthLink.href = `https://earth.google.com/web/@${state.selectedLat},${state.selectedLon},2000a,35d,35y,0h,0t,0r`;
        }

        // If 3D Globe modal is currently open, update pin position immediately
        if (typeof updateGlobePin === 'function') {
            updateGlobePin();
        }

        updateSelectionSummary();
    }

    // ============================================================
    // REGION HELPER & MAP SEARCH (Nominatim Geocoding)
    // ============================================================

    function getRegionDisplayName(lat, lon) {
        const matchedPreset = PRESET_REGIONS.find(r =>
            Math.abs(r.lat - lat) < 1 && Math.abs(r.lon - lon) < 1
        );
        if (matchedPreset) return matchedPreset.name;

        const searchInput = document.getElementById('map-search-input');
        if (searchInput && searchInput.value.trim()) {
            return searchInput.value.trim().split(',')[0];
        }

        return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
    }

    function initMapSearch() {
        const searchInput = document.getElementById('map-search-input');
        const searchBtn = document.getElementById('map-search-btn');
        const searchClear = document.getElementById('map-search-clear');
        const searchResults = document.getElementById('map-search-results');

        if (!searchInput || !searchBtn) return;

        let debounceTimer = null;

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim();
            if (query.length > 0) {
                searchClear.style.display = 'flex';
            } else {
                searchClear.style.display = 'none';
                searchResults.style.display = 'none';
                return;
            }

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (query.length >= 2) performSearch(query);
            }, 350);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) performSearch(query, true);
            } else if (e.key === 'Escape') {
                searchResults.style.display = 'none';
            }
        });

        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) performSearch(query, true);
        });

        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.style.display = 'none';
            searchResults.style.display = 'none';
            searchInput.focus();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.map-search-bar')) {
                searchResults.style.display = 'none';
            }
        });

        async function performSearch(query, autoSelectFirst = false) {
            try {
                searchResults.innerHTML = '<div class="search-result-item"><span class="item-icon">⏳</span><span class="item-text">Searching locations...</span></div>';
                searchResults.style.display = 'block';

                const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
                const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                if (!res.ok) throw new Error('Search request failed');
                const data = await res.json();

                if (!data || data.length === 0) {
                    searchResults.innerHTML = '<div class="search-result-item"><span class="item-icon">❌</span><span class="item-text">No matching locations found</span></div>';
                    return;
                }

                if (autoSelectFirst && data.length > 0) {
                    selectLocationResult(data[0]);
                    searchResults.style.display = 'none';
                    return;
                }

                searchResults.innerHTML = data.map((item, idx) => `
                    <div class="search-result-item" data-idx="${idx}">
                        <span class="item-icon">📍</span>
                        <span class="item-text" title="${item.display_name}">${item.display_name}</span>
                    </div>
                `).join('');

                searchResults.querySelectorAll('.search-result-item').forEach(el => {
                    el.addEventListener('click', () => {
                        const idx = parseInt(el.dataset.idx);
                        if (!isNaN(idx) && data[idx]) {
                            selectLocationResult(data[idx]);
                            searchResults.style.display = 'none';
                        }
                    });
                });
            } catch (err) {
                console.warn('Geocoding error:', err);
                searchResults.innerHTML = '<div class="search-result-item"><span class="item-icon">⚠️</span><span class="item-text">Search temporarily unavailable</span></div>';
            }
        }

        function selectLocationResult(item) {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            if (isNaN(lat) || isNaN(lon)) return;

            setLocation(lat, lon);
            state.map.flyTo([lat, lon], 6, { duration: 1.5 });
            searchInput.value = item.display_name.split(',')[0];
            searchClear.style.display = 'flex';
            showNotification(`Selected: ${item.display_name.split(',')[0]}`, 'info');
        }
    }

    // ============================================================
    // 3D GLOBE & 360° ORBIT VIEW (Three.js)
    // ============================================================

    let globeScene = null, globeCamera = null, globeRenderer = null, globeControls = null;
    let earthMesh = null, pinMesh = null;
    let isGlobeAutoRotate = true;
    let globeAnimId = null;

    function updateGlobePin() {
        if (!globeScene || state.selectedLat === null || state.selectedLon === null) return;

        if (pinMesh) {
            globeScene.remove(pinMesh);
            pinMesh = null;
        }

        const lat = state.selectedLat;
        const lon = state.selectedLon;
        const radius = 80;

        pinMesh = new THREE.Group();

        // Pin cone
        const coneGeo = new THREE.ConeGeometry(2.5, 9, 16);
        coneGeo.translate(0, 4.5, 0);
        coneGeo.rotateX(Math.PI / 2);
        const coneMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
        const cone = new THREE.Mesh(coneGeo, coneMat);

        // Pin top sphere
        const sphereGeo = new THREE.SphereGeometry(2.6, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.set(0, 0, 9);

        // Pulsing ground ring
        const ringGeo = new THREE.RingGeometry(2.5, 4.5, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x42a5f5, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);

        const marker = new THREE.Group();
        marker.add(cone);
        marker.add(sphere);
        marker.add(ring);

        // Spherical to Cartesian math
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);

        marker.position.set(x, y, z);
        marker.lookAt(x * 2, y * 2, z * 2);

        pinMesh.add(marker);
        if (earthMesh) {
            pinMesh.rotation.y = earthMesh.rotation.y;
        }
        globeScene.add(pinMesh);
    }

    function init3DGlobe() {
        const openBtn = document.getElementById('open-3d-btn');
        const modal = document.getElementById('globe-modal');
        const closeBtn = document.getElementById('globe-modal-close');
        const rotateBtn = document.getElementById('globe-rotate-btn');
        const focusBtn = document.getElementById('globe-focus-btn');
        const resetBtn = document.getElementById('globe-reset-btn');
        const earthLink = document.getElementById('google-earth-link');

        if (!openBtn || !modal) return;

        openBtn.addEventListener('click', open3DGlobeModal);

        closeBtn?.addEventListener('click', close3DGlobeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close3DGlobeModal();
        });

        rotateBtn?.addEventListener('click', () => {
            isGlobeAutoRotate = !isGlobeAutoRotate;
            rotateBtn.classList.toggle('active', isGlobeAutoRotate);
            rotateBtn.innerHTML = isGlobeAutoRotate ? '🔄 360° Auto-Rotate: ON' : '⏸️ 360° Auto-Rotate: OFF';
        });

        focusBtn?.addEventListener('click', () => {
            focusOnSelectedPin();
        });

        resetBtn?.addEventListener('click', () => {
            if (globeControls && globeCamera) {
                globeCamera.position.set(0, 20, 220);
                globeControls.target.set(0, 0, 0);
                globeControls.update();
            }
        });

        function open3DGlobeModal() {
            if (state.selectedLat === null || state.selectedLon === null) {
                showNotification('Please select a region on the map first.', 'warning');
                return;
            }

            modal.style.display = 'flex';
            const locName = getRegionDisplayName(state.selectedLat, state.selectedLon);
            const sub = document.getElementById('globe-modal-subtitle');
            if (sub) {
                sub.textContent = `${locName} (${Math.abs(state.selectedLat).toFixed(2)}°${state.selectedLat >= 0 ? 'N' : 'S'}, ${Math.abs(state.selectedLon).toFixed(2)}°${state.selectedLon >= 0 ? 'E' : 'W'})`;
            }

            if (earthLink) {
                earthLink.href = `https://earth.google.com/web/@${state.selectedLat},${state.selectedLon},2000a,35d,35y,0h,0t,0r`;
            }

            setTimeout(() => {
                setupThreeJSGlobe();
                updateGlobePin();
                focusOnSelectedPin();
            }, 60);
        }

        function close3DGlobeModal() {
            modal.style.display = 'none';
            if (globeAnimId) {
                cancelAnimationFrame(globeAnimId);
                globeAnimId = null;
            }
        }

        function setupThreeJSGlobe() {
            const container = document.getElementById('globe-canvas-container');
            if (!container || typeof THREE === 'undefined') return;

            const width = container.clientWidth || 800;
            const height = container.clientHeight || 500;

            if (!globeRenderer) {
                // Scene
                globeScene = new THREE.Scene();

                // Camera
                globeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
                globeCamera.position.set(0, 20, 220);

                // Renderer
                globeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                globeRenderer.setSize(width, height);
                globeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                container.appendChild(globeRenderer.domElement);

                // OrbitControls for 360 degree rotation
                if (typeof THREE.OrbitControls !== 'undefined') {
                    globeControls = new THREE.OrbitControls(globeCamera, globeRenderer.domElement);
                    globeControls.enableDamping = true;
                    globeControls.dampingFactor = 0.05;
                    globeControls.minDistance = 105;
                    globeControls.maxDistance = 420;
                    globeControls.rotateSpeed = 0.8;
                }

                // Lighting
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
                globeScene.add(ambientLight);

                const sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
                sunLight.position.set(400, 250, 400);
                globeScene.add(sunLight);

                // Earth Sphere (radius = 80)
                const earthGeo = new THREE.SphereGeometry(80, 64, 64);
                const textureLoader = new THREE.TextureLoader();
                const earthTextureUrl = 'https://cdn.jsdelivr.net/npm/three-globe@2.45.6/example/img/earth-blue-marble.jpg';
                const loadingEl = document.getElementById('globe-loading');

                textureLoader.load(earthTextureUrl, (tex) => {
                    tex.anisotropy = globeRenderer.capabilities.getMaxAnisotropy();
                    const earthMat = new THREE.MeshPhongMaterial({
                        map: tex,
                        shininess: 15,
                        specular: new THREE.Color(0x333333),
                    });
                    earthMesh = new THREE.Mesh(earthGeo, earthMat);
                    globeScene.add(earthMesh);

                    // Atmosphere glow
                    const atmosGeo = new THREE.SphereGeometry(81.2, 64, 64);
                    const atmosMat = new THREE.MeshLambertMaterial({
                        color: 0x42a5f5,
                        transparent: true,
                        opacity: 0.15,
                        side: THREE.BackSide,
                    });
                    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
                    globeScene.add(atmosMesh);

                    if (loadingEl) loadingEl.style.display = 'none';
                    updateGlobePin();
                }, undefined, () => {
                    // Fallback
                    const fallbackMat = new THREE.MeshLambertMaterial({ color: 0x1565c0 });
                    earthMesh = new THREE.Mesh(earthGeo, fallbackMat);
                    globeScene.add(earthMesh);
                    if (loadingEl) loadingEl.style.display = 'none';
                    updateGlobePin();
                });

                // Stars
                const starsGeo = new THREE.BufferGeometry();
                const starsCount = 1200;
                const starCoords = new Float32Array(starsCount * 3);
                for (let i = 0; i < starsCount * 3; i++) {
                    starCoords[i] = (Math.random() - 0.5) * 1200;
                }
                starsGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
                const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.85 });
                const starField = new THREE.Points(starsGeo, starsMat);
                globeScene.add(starField);
            } else {
                globeCamera.aspect = width / height;
                globeCamera.updateProjectionMatrix();
                globeRenderer.setSize(width, height);
            }

            // Animation Loop
            function animateGlobe() {
                globeAnimId = requestAnimationFrame(animateGlobe);

                if (isGlobeAutoRotate && earthMesh) {
                    earthMesh.rotation.y += 0.002;
                    if (pinMesh) {
                        pinMesh.rotation.y = earthMesh.rotation.y;
                    }
                }

                if (globeControls) globeControls.update();
                globeRenderer.render(globeScene, globeCamera);
            }

            if (!globeAnimId) animateGlobe();
        }

        function focusOnSelectedPin() {
            if (!globeCamera || !globeControls || state.selectedLat === null || state.selectedLon === null) return;

            const lat = state.selectedLat;
            const lon = state.selectedLon;
            const dist = 180;

            const currentRotY = earthMesh ? earthMesh.rotation.y : 0;
            const adjustedLon = lon + (currentRotY * 180 / Math.PI);

            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (adjustedLon + 180) * (Math.PI / 180);

            const targetX = -(dist * Math.sin(phi) * Math.cos(theta));
            const targetZ = dist * Math.sin(phi) * Math.sin(theta);
            const targetY = dist * Math.cos(phi);

            globeCamera.position.set(targetX, targetY, targetZ);
            globeControls.target.set(0, 0, 0);
            globeControls.update();
        }
    }

    // ============================================================
    // TIME CONTROLS
    // ============================================================

    function initTimeControls() {
        const startInput = document.getElementById('start-year');
        const endInput = document.getElementById('end-year');
        const temporalSelect = document.getElementById('temporal-select');

        startInput.value = state.startYear;
        endInput.value = state.endYear;

        startInput.addEventListener('change', () => {
            state.startYear = parseInt(startInput.value);
            updateSelectionSummary();
        });
        endInput.addEventListener('change', () => {
            state.endYear = parseInt(endInput.value);
            updateSelectionSummary();
        });
        if (temporalSelect) {
            temporalSelect.addEventListener('change', () => {
                state.temporal = temporalSelect.value;
            });
        }
    }

    // ============================================================
    // SELECTION SUMMARY
    // ============================================================

    function updateSelectionSummary() {
        const summary = document.getElementById('selection-summary');
        if (!summary) return;

        const parts = [];
        if (state.selectedVariable) parts.push(`<strong>${state.selectedVariable.name}</strong>`);
        if (state.selectedLat !== null) parts.push(`at ${Math.abs(state.selectedLat)}°${state.selectedLat >= 0 ? 'N' : 'S'}, ${Math.abs(state.selectedLon)}°${state.selectedLon >= 0 ? 'E' : 'W'}`);
        parts.push(`from ${state.startYear} to ${state.endYear}`);

        summary.innerHTML = parts.length > 1 ? parts.join(' ') : 'Select a variable and region to begin';

        // Enable/disable analyze button
        const btn = document.getElementById('analyze-btn');
        btn.disabled = !(state.selectedVariable && state.selectedLat !== null);
    }

    // ============================================================
    // DATA FETCHING - NASA POWER API
    // ============================================================

    async function fetchData() {
        const v = state.selectedVariable;

        // Build NASA POWER API URL
        const baseUrl = 'https://power.larc.nasa.gov/api/temporal';
        const temporal = state.temporal; // 'monthly' or 'daily'

        // For monthly data, format is YYYY, for daily it's YYYYMMDD
        let startDate, endDate;
        if (temporal === 'monthly') {
            startDate = state.startYear;
            endDate = state.endYear;
        } else {
            startDate = state.startYear + '0101';
            endDate = state.endYear + '1231';
        }

        const url = `${baseUrl}/${temporal}/point?` + new URLSearchParams({
            parameters: v.nasaParam,
            community: v.community,
            longitude: state.selectedLon,
            latitude: state.selectedLat,
            start: startDate,
            end: endDate,
            format: 'JSON',
        });

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`NASA POWER API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Parse the response
        // NASA POWER returns data in: data.properties.parameter[PARAM_NAME]
        // which is an object with date keys and values
        const paramData = data.properties.parameter[v.nasaParam];

        if (!paramData) {
            throw new Error('No data returned for the selected variable and location.');
        }

        // Convert to arrays, filtering out annual-average entries.
        // NASA POWER monthly data includes month "13" (annual average) which
        // would corrupt the time series analysis — remove those entries.
        let dates = Object.keys(paramData).sort();
        if (temporal === 'monthly') {
            dates = dates.filter(d => !d.endsWith('13'));
        }
        const values = dates.map(d => paramData[d]);

        // Parse dates into readable format
        const parsedDates = dates.map(d => {
            if (temporal === 'monthly') {
                // Format: YYYYMM
                const year = d.substring(0, 4);
                const month = d.substring(4, 6);
                return `${year}-${month}`;
            } else {
                // Format: YYYYMMDD
                const year = d.substring(0, 4);
                const month = d.substring(4, 6);
                const day = d.substring(6, 8);
                return `${year}-${month}-${day}`;
            }
        });

        return { dates: parsedDates, values, rawDates: dates };
    }

    // ============================================================
    // MAIN ANALYSIS FUNCTION
    // ============================================================

    async function runAnalysis() {
        // Validate inputs
        if (!state.selectedVariable) {
            showNotification('Please select a variable first.', 'warning');
            return;
        }
        if (state.selectedLat === null) {
            showNotification('Please select a region on the map.', 'warning');
            return;
        }
        if (state.endYear <= state.startYear) {
            showNotification('End year must be after start year.', 'warning');
            return;
        }

        // Show loading
        showLoading(true);
        document.getElementById('results-section').style.display = 'none';

        try {
            // Fetch data
            const rawData = await fetchData();
            state.currentData = rawData;

            // Prepare data for analysis
            const x = rawData.values.map((_, i) => i);
            const period = state.temporal === 'monthly' ? 12 : 365;

            // Determine region name
            let regionName = 'selected location';
            const matchedPreset = PRESET_REGIONS.find(r =>
                Math.abs(r.lat - state.selectedLat) < 1 && Math.abs(r.lon - state.selectedLon) < 1
            );
            if (matchedPreset) regionName = matchedPreset.name;
            else regionName = `${Math.abs(state.selectedLat).toFixed(1)}°${state.selectedLat >= 0 ? 'N' : 'S'}, ${Math.abs(state.selectedLon).toFixed(1)}°${state.selectedLon >= 0 ? 'E' : 'W'}`;

            // Run full analysis via EarthStats
            const rawAnalysis = EarthStats.fullAnalysis({
                x: x,
                y: rawData.values,
                period: period,
                variableName: state.selectedVariable.name,
                variableUnit: state.selectedVariable.unit,
                regionName: regionName,
                startYear: state.startYear,
                endYear: state.endYear,
                temporal: state.temporal,
            });

            // Normalize the analysis result to a consistent shape used by rendering code.
            // EarthStats.fullAnalysis returns keys: dataQuality, anomalies, regression,
            // mannKendall, sensSlope, movingAverages (dict), seasonal, summary, x, y.
            // Rendering helpers expect: cleanData, movingAverage, decomposition.
            const analysis = Object.assign({}, rawAnalysis, {
                // cleanData wrapper expected by chart/stats renderers
                cleanData: {
                    cleanData: rawAnalysis.y,
                    validIndices: rawAnalysis.dataQuality
                        ? (() => {
                            // Rebuild valid indices from original data
                            const indices = [];
                            for (let i = 0; i < rawData.values.length; i++) {
                                const v = rawData.values[i];
                                if (v !== null && v !== undefined && !isNaN(v) &&
                                    v !== -999 && v !== -9999 && v !== -999.0 && v !== -9999.0) {
                                    indices.push(i);
                                }
                            }
                            return indices;
                        })()
                        : rawAnalysis.x.map((_, i) => i),
                    missingCount: rawAnalysis.dataQuality ? rawAnalysis.dataQuality.missingCount : 0,
                    missingPercent: rawAnalysis.dataQuality ? rawAnalysis.dataQuality.missingPercent : 0,
                },
                // Pick the period-matched moving average (or the largest available)
                movingAverage: (() => {
                    if (!rawAnalysis.movingAverages) return null;
                    const key = `${period}-point`;
                    if (rawAnalysis.movingAverages[key]) return rawAnalysis.movingAverages[key];
                    // Fallback to the widest window available
                    const keys = Object.keys(rawAnalysis.movingAverages);
                    if (keys.length > 0) return rawAnalysis.movingAverages[keys[keys.length - 1]];
                    return null;
                })(),
                // Map 'seasonal' to 'decomposition' for rendering code
                decomposition: rawAnalysis.seasonal || null,
            });

            state.currentAnalysis = analysis;

            // Render results
            renderChart(rawData, analysis);
            renderStatistics(analysis);
            renderSummary(analysis);

            // Show results
            document.getElementById('results-section').style.display = 'block';
            smoothScrollTo('results-section');
            showNotification('Analysis complete!', 'success');

            // Save to search & analysis history
            if (typeof saveAnalysisToHistory === 'function') {
                saveAnalysisToHistory(state.selectedVariable, regionName, state.selectedLat, state.selectedLon, state.startYear, state.endYear, state.temporal, rawData, analysis);
            }

        } catch (error) {
            console.error('Analysis failed:', error);
            showNotification(`Error: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    }

    // ============================================================
    // CHART RENDERING (Plotly.js)
    // ============================================================

    function renderChart(rawData, analysis) {
        const chartDiv = document.getElementById('chart');

        // Prepare date labels for x-axis
        const dates = rawData.dates;
        const cleanValues = analysis.cleanData.cleanData;
        const validIdx = analysis.cleanData.validIndices;

        // Map clean data back to full date array (nulls for missing)
        const fullValues = rawData.values.map(v => (v === -999 || v === -9999 || v === -99.99) ? null : v);

        // Traces
        const traces = [];

        // 1. Raw data scatter
        traces.push({
            x: dates,
            y: fullValues,
            type: 'scatter',
            mode: 'lines',
            name: 'Observed Data',
            line: { color: '#42a5f5', width: 1.5 },
            opacity: 0.7,
        });

        // 2. Moving average (if we have enough data)
        if (analysis.movingAverage) {
            const maWindow = state.temporal === 'monthly' ? 12 : 365;
            // Map moving average to dates - need to handle the offset
            const maValues = new Array(dates.length).fill(null);
            validIdx.forEach((origIdx, cleanIdx) => {
                if (analysis.movingAverage[cleanIdx] !== null && analysis.movingAverage[cleanIdx] !== undefined) {
                    maValues[origIdx] = analysis.movingAverage[cleanIdx];
                }
            });

            traces.push({
                x: dates,
                y: maValues,
                type: 'scatter',
                mode: 'lines',
                name: `${maWindow}-point Moving Average`,
                line: { color: '#ff9800', width: 2.5 },
            });
        }

        // 3. Linear trend line
        if (analysis.regression) {
            const reg = analysis.regression;
            // Generate trend line across full valid date range
            const firstValid = validIdx[0];
            const lastValid = validIdx[validIdx.length - 1];
            const trendStart = reg.intercept + reg.slope * 0;
            const trendEnd = reg.intercept + reg.slope * (validIdx.length - 1);

            traces.push({
                x: [dates[firstValid], dates[lastValid]],
                y: [trendStart, trendEnd],
                type: 'scatter',
                mode: 'lines',
                name: `Linear Trend (${reg.slope > 0 ? '+' : ''}${reg.slope.toFixed(4)}/${state.temporal === 'monthly' ? 'month' : 'day'})`,
                line: { color: '#c62828', width: 3, dash: 'dash' },
            });

            // 4. Confidence interval band
            if (reg.slopeCI) {
                const ciLowStart = reg.intercept + reg.slopeCI.lower * 0;
                const ciLowEnd = reg.intercept + reg.slopeCI.lower * (validIdx.length - 1);
                const ciHighStart = reg.intercept + reg.slopeCI.upper * 0;
                const ciHighEnd = reg.intercept + reg.slopeCI.upper * (validIdx.length - 1);

                traces.push({
                    x: [dates[firstValid], dates[lastValid], dates[lastValid], dates[firstValid]],
                    y: [ciHighStart, ciHighEnd, ciLowEnd, ciLowStart],
                    fill: 'toself',
                    fillcolor: 'rgba(198, 40, 40, 0.1)',
                    line: { color: 'transparent' },
                    name: '95% Confidence Interval',
                    showlegend: true,
                    type: 'scatter',
                });
            }
        }

        // Layout
        const layout = {
            title: {
                text: `${state.selectedVariable.name} — Time Series & Trend Analysis`,
                font: { size: 18, color: '#1a1a2e' },
            },
            xaxis: {
                title: 'Date',
                showgrid: true,
                gridcolor: '#e0e6ed',
            },
            yaxis: {
                title: `${state.selectedVariable.name} (${state.selectedVariable.unit})`,
                showgrid: true,
                gridcolor: '#e0e6ed',
            },
            legend: {
                orientation: 'h',
                yanchor: 'bottom',
                y: -0.3,
                xanchor: 'center',
                x: 0.5,
            },
            margin: { t: 60, r: 30, b: 80, l: 70 },
            plot_bgcolor: '#fafbfc',
            paper_bgcolor: '#ffffff',
            hovermode: 'x unified',
            font: { family: 'Inter, sans-serif' },
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            displaylogo: false,
        };

        Plotly.newPlot(chartDiv, traces, layout, config);
    }

    // ============================================================
    // STATISTICS DISPLAY
    // ============================================================

    function renderStatistics(analysis) {
        const container = document.getElementById('stats-container');

        const reg = analysis.regression;
        const mk = analysis.mannKendall;
        const sen = analysis.sensSlope;

        // Calculate per-year and per-decade rates
        const divisor = state.temporal === 'monthly' ? 12 : 365;
        const slopePerYear = reg.slope * divisor;
        const slopePerDecade = slopePerYear * 10;
        const senPerYear = sen.slope * divisor;
        const senPerDecade = senPerYear * 10;

        // Significance badge
        const sigClass = mk.significant ? 'sig-yes' : 'sig-no';
        const sigText = mk.pValue < 0.01 ? 'Highly Significant (p < 0.01)' :
                       mk.pValue < 0.05 ? 'Significant (p < 0.05)' :
                       mk.pValue < 0.10 ? 'Marginally Significant (p < 0.10)' :
                       'Not Significant (p ≥ 0.10)';

        // Trend direction arrow
        const trendArrow = mk.trend === 'increasing' ? '↗️' : mk.trend === 'decreasing' ? '↘️' : '→';
        const trendColor = mk.trend === 'increasing' ? '#c62828' : mk.trend === 'decreasing' ? '#1565c0' : '#546e7a';

        container.innerHTML = `
            <div class="trend-header">
                <span class="trend-arrow" style="color: ${trendColor}">${trendArrow}</span>
                <span class="trend-direction" style="color: ${trendColor}">
                    ${mk.trend.charAt(0).toUpperCase() + mk.trend.slice(1)} Trend
                </span>
            </div>

            <div class="significance-badge ${sigClass}">
                ${mk.significant ? '✓' : '✗'} ${sigText}
            </div>

            <div class="stats-grid">
                <div class="stat-group">
                    <h4>📈 Linear Regression</h4>
                    <div class="stat-row">
                        <span class="stat-label">Rate of Change
                            <span class="info-icon" title="The slope of the best-fit straight line through the data, expressed per year.">ⓘ</span>
                        </span>
                        <span class="stat-value">${slopePerYear >= 0 ? '+' : ''}${slopePerYear.toFixed(4)} ${state.selectedVariable.unit}/year</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Per Decade</span>
                        <span class="stat-value">${slopePerDecade >= 0 ? '+' : ''}${slopePerDecade.toFixed(4)} ${state.selectedVariable.unit}/decade</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">R² (Explained Variance)
                            <span class="info-icon" title="How much of the variation in the data is explained by the linear trend. 0 = none, 1 = all.">ⓘ</span>
                        </span>
                        <span class="stat-value">${(reg.rSquared * 100).toFixed(1)}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">p-value (t-test)
                            <span class="info-icon" title="The probability of seeing this trend by random chance alone. Smaller values mean the trend is more likely real.">ⓘ</span>
                        </span>
                        <span class="stat-value">${reg.pValue < 0.001 ? '< 0.001' : reg.pValue.toFixed(4)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">95% CI for Slope</span>
                        <span class="stat-value">[${(reg.slopeCI.lower * divisor).toFixed(4)}, ${(reg.slopeCI.upper * divisor).toFixed(4)}] /year</span>
                    </div>
                </div>

                <div class="stat-group">
                    <h4>📊 Mann-Kendall Test</h4>
                    <div class="stat-row">
                        <span class="stat-label">Kendall's τ (tau)
                            <span class="info-icon" title="A measure of the strength and direction of the trend. Ranges from -1 (strong decrease) to +1 (strong increase).">ⓘ</span>
                        </span>
                        <span class="stat-value">${mk.tau >= 0 ? '+' : ''}${mk.tau.toFixed(4)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">S Statistic</span>
                        <span class="stat-value">${mk.S}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Z Score</span>
                        <span class="stat-value">${mk.Z.toFixed(4)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">p-value (two-tailed)
                            <span class="info-icon" title="Mann-Kendall p-value: non-parametric, doesn't assume data follows a normal distribution. Often preferred for environmental data.">ⓘ</span>
                        </span>
                        <span class="stat-value">${mk.pValue < 0.001 ? '< 0.001' : mk.pValue.toFixed(4)}</span>
                    </div>
                </div>

                <div class="stat-group">
                    <h4>📐 Sen's Slope Estimator</h4>
                    <div class="stat-row">
                        <span class="stat-label">Median Slope
                            <span class="info-icon" title="The median of all pairwise slopes. More robust to outliers than ordinary least squares regression.">ⓘ</span>
                        </span>
                        <span class="stat-value">${senPerYear >= 0 ? '+' : ''}${senPerYear.toFixed(4)} ${state.selectedVariable.unit}/year</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Per Decade</span>
                        <span class="stat-value">${senPerDecade >= 0 ? '+' : ''}${senPerDecade.toFixed(4)} ${state.selectedVariable.unit}/decade</span>
                    </div>
                    ${sen.confidenceInterval ? `
                    <div class="stat-row">
                        <span class="stat-label">95% CI for Slope</span>
                        <span class="stat-value">[${(sen.confidenceInterval.lower * divisor).toFixed(4)}, ${(sen.confidenceInterval.upper * divisor).toFixed(4)}] /year</span>
                    </div>
                    ` : ''}
                </div>

                <div class="stat-group">
                    <h4>📋 Data Quality</h4>
                    <div class="stat-row">
                        <span class="stat-label">Total Data Points</span>
                        <span class="stat-value">${analysis.cleanData.cleanData.length + analysis.cleanData.missingCount}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Valid Data Points</span>
                        <span class="stat-value">${analysis.cleanData.cleanData.length}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Missing Data</span>
                        <span class="stat-value">${analysis.cleanData.missingCount} (${analysis.cleanData.missingPercent.toFixed(1)}%)</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Time Span</span>
                        <span class="stat-value">${state.endYear - state.startYear} years</span>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================================
    // SUMMARY DISPLAY
    // ============================================================

    function renderSummary(analysis) {
        const container = document.getElementById('summary-container');
        container.innerHTML = analysis.summary;
    }

    // ============================================================
    // CHART VIEW TABS (Raw, Deseasonalized, Anomaly)
    // ============================================================

    function setupChartTabs() {
        const tabs = document.querySelectorAll('.chart-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const view = tab.dataset.view;
                if (state.currentData && state.currentAnalysis) {
                    switch (view) {
                        case 'raw':
                            renderChart(state.currentData, state.currentAnalysis);
                            break;
                        case 'deseasonalized':
                            renderDeseasonalizedChart();
                            break;
                        case 'anomaly':
                            renderAnomalyChart();
                            break;
                    }
                }
            });
        });
    }

    function renderDeseasonalizedChart() {
        if (!state.currentAnalysis.decomposition) return;

        const dates = state.currentData.dates;
        const validIdx = state.currentAnalysis.cleanData.validIndices;
        const deseasonalized = state.currentAnalysis.decomposition.deseasonalized;

        const fullDeseasonalized = new Array(dates.length).fill(null);
        validIdx.forEach((origIdx, cleanIdx) => {
            if (deseasonalized[cleanIdx] !== undefined && deseasonalized[cleanIdx] !== null) {
                fullDeseasonalized[origIdx] = deseasonalized[cleanIdx];
            }
        });

        const reg = state.currentAnalysis.regression;
        const firstValid = validIdx[0];
        const lastValid = validIdx[validIdx.length - 1];

        const traces = [
            {
                x: dates, y: fullDeseasonalized,
                type: 'scatter', mode: 'lines',
                name: 'Deseasonalized Data',
                line: { color: '#42a5f5', width: 1.5 },
            },
            {
                x: [dates[firstValid], dates[lastValid]],
                y: [reg.intercept, reg.intercept + reg.slope * (validIdx.length - 1)],
                type: 'scatter', mode: 'lines',
                name: 'Linear Trend',
                line: { color: '#c62828', width: 3, dash: 'dash' },
            }
        ];

        const layout = {
            title: { text: `${state.selectedVariable.name} — Deseasonalized`, font: { size: 18 } },
            xaxis: { title: 'Date', gridcolor: '#e0e6ed' },
            yaxis: { title: `${state.selectedVariable.name} (${state.selectedVariable.unit})`, gridcolor: '#e0e6ed' },
            legend: { orientation: 'h', y: -0.3, xanchor: 'center', x: 0.5 },
            margin: { t: 60, r: 30, b: 80, l: 70 },
            plot_bgcolor: '#fafbfc', paper_bgcolor: '#ffffff',
            hovermode: 'x unified', font: { family: 'Inter, sans-serif' },
        };

        Plotly.newPlot('chart', traces, layout, { responsive: true, displaylogo: false });
    }

    function renderAnomalyChart() {
        if (!state.currentAnalysis.anomalies) return;

        const dates = state.currentData.dates;
        const validIdx = state.currentAnalysis.cleanData.validIndices;
        const anomalies = state.currentAnalysis.anomalies;

        const fullAnomalies = new Array(dates.length).fill(null);
        validIdx.forEach((origIdx, cleanIdx) => {
            if (anomalies[cleanIdx] !== undefined) {
                fullAnomalies[origIdx] = anomalies[cleanIdx];
            }
        });

        // Color bars by positive/negative
        const colors = fullAnomalies.map(v => v === null ? '#ccc' : v >= 0 ? '#c62828' : '#1565c0');

        const traces = [{
            x: dates, y: fullAnomalies,
            type: 'bar',
            name: 'Anomaly',
            marker: { color: colors },
        }];

        const layout = {
            title: { text: `${state.selectedVariable.name} — Anomalies from Climatological Mean`, font: { size: 18 } },
            xaxis: { title: 'Date', gridcolor: '#e0e6ed' },
            yaxis: { title: `Anomaly (${state.selectedVariable.unit})`, gridcolor: '#e0e6ed', zeroline: true, zerolinecolor: '#000', zerolinewidth: 2 },
            legend: { orientation: 'h', y: -0.3, xanchor: 'center', x: 0.5 },
            margin: { t: 60, r: 30, b: 80, l: 70 },
            plot_bgcolor: '#fafbfc', paper_bgcolor: '#ffffff',
            font: { family: 'Inter, sans-serif' },
            bargap: 0,
        };

        Plotly.newPlot('chart', traces, layout, { responsive: true, displaylogo: false });
    }

    // ============================================================
    // DEMO EXAMPLES
    // ============================================================

    function initDemoExamples() {
        const demos = [
            {
                name: '🌡️ Arctic Warming',
                description: 'See rapid temperature rise near Svalbard in the Arctic — one of the fastest-warming regions on Earth.',
                variable: 'T2M',
                lat: 78.0, lon: 16.0,
                startYear: 2001, endYear: 2023,
            },
            {
                name: '🌧️ Sahara Precipitation',
                description: 'Examine precipitation trends in the world\'s largest hot desert.',
                variable: 'PRECTOTCORR',
                lat: 23.0, lon: 25.0,
                startYear: 2001, endYear: 2023,
            },
            {
                name: '☀️ Solar Radiation — Amazon',
                description: 'How is incoming solar radiation changing over the Amazon rainforest? Deforestation and cloud changes affect this.',
                variable: 'ALLSKY_SFC_SW_DWN',
                lat: -3.4, lon: -60.0,
                startYear: 2001, endYear: 2023,
            },
            {
                name: '🔥 Greenhouse Effect — Los Angeles',
                description: 'Track longwave (infrared) radiation in LA — the greenhouse effect in action over a major city.',
                variable: 'ALLSKY_SFC_LW_DWN',
                lat: 34.05, lon: -118.24,
                startYear: 2001, endYear: 2023,
            },
        ];

        const container = document.getElementById('demo-examples');
        if (!container) return;

        container.innerHTML = demos.map((d, i) => `
            <div class="demo-card" data-demo="${i}">
                <h4>${d.name}</h4>
                <p>${d.description}</p>
                <button class="demo-btn" data-demo="${i}">Run This Demo</button>
            </div>
        `).join('');

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.demo-btn');
            if (!btn) return;
            const demo = demos[parseInt(btn.dataset.demo)];

            // Set state
            state.selectedVariable = VARIABLES.find(v => v.id === demo.variable);
            state.startYear = demo.startYear;
            state.endYear = demo.endYear;
            state.temporal = 'monthly';

            // Update UI
            document.getElementById('start-year').value = demo.startYear;
            document.getElementById('end-year').value = demo.endYear;

            // Select variable in UI
            const radio = document.querySelector(`input[value="${demo.variable}"]`);
            if (radio) {
                radio.checked = true;
                // Expand the right category
                const card = radio.closest('.category-card');
                if (card) {
                    document.querySelectorAll('.variable-list').forEach(l => l.style.display = 'none');
                    document.querySelectorAll('.expand-icon').forEach(i => i.textContent = '▶');
                    card.querySelector('.variable-list').style.display = 'block';
                    card.querySelector('.expand-icon').textContent = '▼';
                    card.classList.add('active');
                }
                document.querySelectorAll('.variable-item').forEach(item => item.classList.remove('selected'));
                radio.closest('.variable-item').classList.add('selected');
            }

            // Set location
            setLocation(demo.lat, demo.lon);
            state.map.setView([demo.lat, demo.lon], 5);

            // Update summary
            updateSelectionSummary();

            // Run analysis
            runAnalysis();
        });
    }

    // ============================================================
    // UI HELPERS
    // ============================================================

    function showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    function showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notif = document.createElement('div');
        notif.className = `notification notification-${type}`;
        notif.innerHTML = `
            <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'} ${message}</span>
            <button class="notif-close" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(notif);
        setTimeout(() => notif.classList.add('show'), 10);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 5000);
    }

    function smoothScrollTo(elementId) {
        const el = document.getElementById(elementId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ============================================================
    // WELCOME ONBOARDING MODAL
    // ============================================================

    function initWelcomeModal() {
        const welcomeModal = document.getElementById('welcome-modal');
        const welcomeBtn = document.getElementById('welcome-btn');
        const closeBtn = document.getElementById('welcome-modal-close');
        const startBtn = document.getElementById('welcome-start-btn');
        const demoBtn = document.getElementById('welcome-demo-btn');
        const dontShowCheckbox = document.getElementById('welcome-dont-show-again');

        if (!welcomeModal) return;

        // Automatically show welcome guide on first visit
        const isDismissed = localStorage.getItem('earthtrend_welcome_dismissed');
        if (isDismissed !== 'true') {
            setTimeout(() => {
                welcomeModal.style.display = 'flex';
            }, 500);
        }

        function closeWelcome() {
            welcomeModal.style.display = 'none';
            if (dontShowCheckbox && dontShowCheckbox.checked) {
                localStorage.setItem('earthtrend_welcome_dismissed', 'true');
            }
        }

        welcomeBtn?.addEventListener('click', () => {
            welcomeModal.style.display = 'flex';
        });

        closeBtn?.addEventListener('click', closeWelcome);
        welcomeModal.addEventListener('click', (e) => {
            if (e.target === welcomeModal) closeWelcome();
        });

        startBtn?.addEventListener('click', () => {
            closeWelcome();
            smoothScrollTo('step-variable');
        });

        demoBtn?.addEventListener('click', () => {
            closeWelcome();
            const firstDemoBtn = document.querySelector('.demo-btn[data-demo="0"]');
            if (firstDemoBtn) firstDemoBtn.click();
        });

        dontShowCheckbox?.addEventListener('change', (e) => {
            if (e.target.checked) {
                localStorage.setItem('earthtrend_welcome_dismissed', 'true');
            } else {
                localStorage.removeItem('earthtrend_welcome_dismissed');
            }
        });
    }

    // ============================================================
    // USER ACCOUNT & AUTHENTICATION SYSTEM
    // ============================================================

    function getUsersStore() {
        try {
            return JSON.parse(localStorage.getItem('earthtrend_users')) || [];
        } catch (e) {
            return [];
        }
    }

    function saveUsersStore(users) {
        localStorage.setItem('earthtrend_users', JSON.stringify(users));
    }

    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('earthtrend_current_user'));
        } catch (e) {
            return null;
        }
    }

    function setCurrentUser(user) {
        localStorage.setItem('earthtrend_current_user', JSON.stringify({
            name: user.name,
            email: user.email,
            role: user.role
        }));
    }

    function updateAuthUI() {
        const user = getCurrentUser();
        const authBtnText = document.getElementById('auth-btn-text');
        const authBtnIcon = document.getElementById('auth-btn-icon');
        const authBtn = document.getElementById('auth-btn');

        if (user) {
            if (authBtnIcon) {
                authBtnIcon.textContent = user.role === 'Researcher' ? '🔬' : user.role === 'Student' ? '🎓' : user.role === 'Educator' ? '👩‍🏫' : '👨‍🚀';
            }
            if (authBtnText) {
                authBtnText.textContent = user.name.split(' ')[0];
            }
            authBtn?.classList.add('logged-in');
        } else {
            if (authBtnIcon) authBtnIcon.textContent = '👤';
            if (authBtnText) authBtnText.textContent = 'Sign In';
            authBtn?.classList.remove('logged-in');
        }
    }

    function openAuthModal() {
        const modal = document.getElementById('auth-modal');
        const profileView = document.getElementById('auth-profile-view');
        const formView = document.getElementById('auth-form-view');
        const user = getCurrentUser();

        if (user) {
            profileView.style.display = 'block';
            formView.style.display = 'none';
            document.getElementById('auth-modal-title').textContent = '👤 User Profile';
            document.getElementById('profile-name').textContent = user.name;
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('profile-role').textContent = user.role;
            const history = getHistory();
            document.getElementById('profile-searches-count').textContent = history.length;
        } else {
            profileView.style.display = 'none';
            formView.style.display = 'block';
            document.getElementById('auth-modal-title').textContent = '👤 Sign In';
        }

        modal.style.display = 'flex';
    }

    function initAuthSystem() {
        const authBtn = document.getElementById('auth-btn');
        const authModal = document.getElementById('auth-modal');
        const closeBtn = document.getElementById('auth-modal-close');
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');
        const switchToSignup = document.getElementById('switch-to-signup');
        const switchToSignin = document.getElementById('switch-to-signin');
        const signOutBtn = document.getElementById('sign-out-btn');
        const viewHistoryBtn = document.getElementById('view-user-history-btn');
        const authTabs = document.querySelectorAll('.auth-tab');

        if (!authModal || !authBtn) return;

        updateAuthUI();

        authBtn.addEventListener('click', () => {
            openAuthModal();
        });

        closeBtn?.addEventListener('click', () => {
            authModal.style.display = 'none';
        });

        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) authModal.style.display = 'none';
        });

        // Tab toggle
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (target === 'signin') {
                    signinForm.style.display = 'flex';
                    signupForm.style.display = 'none';
                    document.getElementById('auth-modal-title').textContent = '👤 Sign In';
                } else {
                    signinForm.style.display = 'none';
                    signupForm.style.display = 'flex';
                    document.getElementById('auth-modal-title').textContent = '✨ Create Account';
                }
            });
        });

        switchToSignup?.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.auth-tab[data-tab="signup"]')?.click();
        });

        switchToSignin?.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.auth-tab[data-tab="signin"]')?.click();
        });

        // Sign In
        signinForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signin-email').value.trim();
            const pass = document.getElementById('signin-password').value;

            const users = getUsersStore();
            const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);

            if (found) {
                setCurrentUser(found);
                updateAuthUI();
                authModal.style.display = 'none';
                showNotification(`Welcome back, ${found.name}!`, 'success');
            } else {
                showNotification('Invalid email or password. Please try again.', 'error');
            }
        });

        // Sign Up
        signupForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const role = document.getElementById('signup-role').value;
            const pass = document.getElementById('signup-password').value;

            const users = getUsersStore();
            if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                showNotification('An account with this email already exists.', 'warning');
                return;
            }

            const newUser = {
                name,
                email,
                role,
                password: pass,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            saveUsersStore(users);
            setCurrentUser(newUser);
            updateAuthUI();
            authModal.style.display = 'none';
            signupForm.reset();
            showNotification(`Account created! Welcome, ${newUser.name}.`, 'success');
        });

        // Sign Out
        signOutBtn?.addEventListener('click', () => {
            localStorage.removeItem('earthtrend_current_user');
            updateAuthUI();
            authModal.style.display = 'none';
            showNotification('Signed out successfully.', 'info');
        });

        viewHistoryBtn?.addEventListener('click', () => {
            authModal.style.display = 'none';
            document.getElementById('history-btn')?.click();
        });
    }

    // ============================================================
    // SEARCH & ANALYSIS HISTORY SYSTEM
    // ============================================================

    function getHistory() {
        try {
            return JSON.parse(localStorage.getItem('earthtrend_history')) || [];
        } catch (e) {
            return [];
        }
    }

    function saveHistory(list) {
        try {
            localStorage.setItem('earthtrend_history', JSON.stringify(list));
        } catch (e) {
            console.warn('History storage exceeded limit, pruning oldest items:', e);
            if (list.length > 5) {
                list = list.slice(0, 5);
                localStorage.setItem('earthtrend_history', JSON.stringify(list));
            }
        }
        updateHistoryBadge();
    }

    function updateHistoryBadge() {
        const badge = document.getElementById('history-badge');
        const list = getHistory();
        if (badge) {
            if (list.length > 0) {
                badge.textContent = list.length;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    function saveAnalysisToHistory(variable, regionName, lat, lon, startYear, endYear, temporal, rawData, analysis) {
        const list = getHistory();
        const divisor = temporal === 'monthly' ? 12 : 365;

        const reg = analysis.regression;
        const mk = analysis.mannKendall;
        const sen = analysis.sensSlope;

        const item = {
            id: 'hist_' + Date.now(),
            timestamp: new Date().toISOString(),
            variable: {
                id: variable.id,
                name: variable.name,
                unit: variable.unit,
                category: variable.category,
                icon: variable.icon || '🌡️'
            },
            region: {
                name: regionName,
                lat: lat,
                lon: lon
            },
            time: {
                startYear: startYear,
                endYear: endYear,
                temporal: temporal
            },
            results: {
                trend: mk.trend,
                significant: mk.significant,
                pValue: mk.pValue,
                tau: mk.tau,
                slopePerYear: reg.slope * divisor,
                slopePerDecade: (reg.slope * divisor) * 10,
                senPerYear: sen.slope * divisor,
                rSquared: reg.rSquared
            },
            // Cache full raw data & analysis to allow 1-click full restore
            rawData: rawData,
            analysis: analysis
        };

        // Prepend and limit to 15 entries
        list.unshift(item);
        if (list.length > 15) list.pop();

        saveHistory(list);
    }

    function initHistorySystem() {
        const historyBtn = document.getElementById('history-btn');
        const historyModal = document.getElementById('history-modal');
        const closeBtn = document.getElementById('history-modal-close');
        const clearBtn = document.getElementById('clear-all-history-btn');

        updateHistoryBadge();

        if (!historyBtn || !historyModal) return;

        historyBtn.addEventListener('click', () => {
            renderHistoryModal();
            historyModal.style.display = 'flex';
        });

        closeBtn?.addEventListener('click', () => {
            historyModal.style.display = 'none';
        });

        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) historyModal.style.display = 'none';
        });

        clearBtn?.addEventListener('click', () => {
            if (confirm('Clear all saved search and analysis history?')) {
                saveHistory([]);
                renderHistoryModal();
                showNotification('Search history cleared.', 'info');
            }
        });
    }

    function renderHistoryModal() {
        const container = document.getElementById('history-list');
        const countText = document.getElementById('history-count-text');
        const list = getHistory();

        if (countText) {
            countText.textContent = `${list.length} saved ${list.length === 1 ? 'analysis' : 'analyses'}`;
        }

        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = `
                <div class="empty-history-box">
                    <div class="empty-history-icon">📜</div>
                    <h4>No Search History Yet</h4>
                    <p>Select any Earth science variable and region, then run an analysis to save it in your research history.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = list.map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const res = item.results;
            const trendIcon = res.trend === 'increasing' ? '↗️' : res.trend === 'decreasing' ? '↘️' : '→';
            const trendClass = res.trend === 'increasing' ? 'chip-trend-inc' : res.trend === 'decreasing' ? 'chip-trend-dec' : 'chip-trend-none';
            const sigText = res.significant ? 'Significant (p < 0.05)' : 'Not Significant';

            return `
                <div class="history-card" data-id="${item.id}">
                    <div class="history-card-header">
                        <div class="history-title-area">
                            <span class="history-var-icon">${item.variable.icon || '🛰️'}</span>
                            <div>
                                <div class="history-var-name">${item.variable.name} (${item.variable.unit})</div>
                                <div class="history-loc-name">📍 ${item.region.name} • ${item.time.startYear}–${item.time.endYear} (${item.time.temporal})</div>
                            </div>
                        </div>
                        <span class="history-timestamp">${dateStr}</span>
                    </div>

                    <div class="history-chips">
                        <span class="history-chip ${trendClass}">${trendIcon} ${res.trend.toUpperCase()}</span>
                        <span class="history-chip">${res.slopePerYear >= 0 ? '+' : ''}${res.slopePerYear.toFixed(4)} ${item.variable.unit}/yr</span>
                        <span class="history-chip">p ${res.pValue < 0.001 ? '< 0.001' : res.pValue.toFixed(4)} (${sigText})</span>
                        <span class="history-chip">R² ${(res.rSquared * 100).toFixed(1)}%</span>
                    </div>

                    <div class="history-actions">
                        <button class="history-restore-btn" data-id="${item.id}">
                            🔄 Restore Full Analysis & Chart
                        </button>
                        <button class="history-export-btn" data-id="${item.id}">
                            📥 Export CSV
                        </button>
                        <button class="history-del-btn" data-id="${item.id}" title="Delete from history">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Hook up Restore buttons
        container.querySelectorAll('.history-restore-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                restoreAnalysisFromHistory(id);
            });
        });

        // Hook up Export buttons
        container.querySelectorAll('.history-export-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                exportHistoryItemCSV(id);
            });
        });

        // Hook up Delete buttons
        container.querySelectorAll('.history-del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                deleteHistoryItem(id);
            });
        });
    }

    function restoreAnalysisFromHistory(id) {
        const list = getHistory();
        const item = list.find(h => h.id === id);
        if (!item) return;

        // Restore state
        state.selectedVariable = VARIABLES.find(v => v.id === item.variable.id) || item.variable;
        state.selectedLat = item.region.lat;
        state.selectedLon = item.region.lon;
        state.startYear = item.time.startYear;
        state.endYear = item.time.endYear;
        state.temporal = item.time.temporal;

        // Update inputs
        document.getElementById('start-year').value = state.startYear;
        document.getElementById('end-year').value = state.endYear;
        const temporalSelect = document.getElementById('temporal-select');
        if (temporalSelect) temporalSelect.value = state.temporal;

        // Select radio button in UI
        const radio = document.querySelector(`input[name="variable"][value="${item.variable.id}"]`);
        if (radio) {
            radio.checked = true;
            document.querySelectorAll('.variable-item').forEach(el => el.classList.remove('selected'));
            radio.closest('.variable-item')?.classList.add('selected');
            const card = radio.closest('.category-card');
            if (card) {
                document.querySelectorAll('.variable-list').forEach(l => l.style.display = 'none');
                document.querySelectorAll('.expand-icon').forEach(i => i.textContent = '▶');
                card.querySelector('.variable-list').style.display = 'block';
                card.querySelector('.expand-icon').textContent = '▼';
                card.classList.add('active');
            }
        }

        // Set map location
        setLocation(item.region.lat, item.region.lon);
        state.map.setView([item.region.lat, item.region.lon], 5);

        // Restore cached data & analysis
        state.currentData = item.rawData;
        state.currentAnalysis = item.analysis;

        // Re-render chart, stats, summary
        renderChart(item.rawData, item.analysis);
        renderStatistics(item.analysis);
        renderSummary(item.analysis);

        // Show results & scroll
        document.getElementById('results-section').style.display = 'block';
        document.getElementById('history-modal').style.display = 'none';
        smoothScrollTo('results-section');

        showNotification(`Restored analysis for ${item.variable.name} in ${item.region.name}`, 'info');
    }

    function deleteHistoryItem(id) {
        let list = getHistory();
        list = list.filter(h => h.id !== id);
        saveHistory(list);
        renderHistoryModal();
        showNotification('Item removed from history.', 'info');
    }

    function exportHistoryItemCSV(id) {
        const list = getHistory();
        const item = list.find(h => h.id === id);
        if (!item || !item.rawData || !item.analysis) {
            showNotification('Could not export this item.', 'warning');
            return;
        }

        const analysis = item.analysis;
        const rawData = item.rawData;
        const variable = item.variable;
        const reg = analysis.regression;
        const mk = analysis.mannKendall;
        const sen = analysis.sensSlope;
        const divisor = item.time.temporal === 'monthly' ? 12 : 365;

        const lines = [];
        lines.push('# EarthTrend Explorer — Historical Analysis Report');
        lines.push(`# Saved On: ${item.timestamp}`);
        lines.push(`# Variable: ${variable.name} (${variable.id})`);
        lines.push(`# Unit: ${variable.unit}`);
        lines.push(`# Location: ${item.region.name} (${item.region.lat}, ${item.region.lon})`);
        lines.push(`# Period: ${item.time.startYear} – ${item.time.endYear}`);
        lines.push(`# Temporal: ${item.time.temporal}`);
        lines.push('#');
        lines.push('# === STATISTICAL RESULTS ===');
        lines.push(`# Trend: ${mk.trend}`);
        lines.push(`# Mann-Kendall p-value: ${mk.pValue}`);
        lines.push(`# Mann-Kendall tau: ${mk.tau}`);
        lines.push(`# Linear Slope: ${(reg.slope * divisor).toFixed(6)} ${variable.unit}/year`);
        lines.push(`# Sen's Slope: ${(sen.slope * divisor).toFixed(6)} ${variable.unit}/year`);
        lines.push(`# R²: ${(reg.rSquared * 100).toFixed(2)}%`);
        lines.push('#');
        lines.push('Date,Value,MovingAverage,Anomaly');

        const validIdx = analysis.cleanData.validIndices;
        const ma = analysis.movingAverage;
        const anomalies = analysis.anomalies;

        for (let i = 0; i < rawData.dates.length; i++) {
            const date = rawData.dates[i];
            const rawVal = rawData.values[i];
            const cleanIdx = validIdx.indexOf(i);
            const isValid = cleanIdx !== -1;

            const value = isValid ? rawVal : '';
            const maVal = (isValid && ma && ma[cleanIdx] !== null && ma[cleanIdx] !== undefined)
                ? ma[cleanIdx].toFixed(4) : '';
            const anomVal = (isValid && anomalies && anomalies[cleanIdx] !== undefined && !isNaN(anomalies[cleanIdx]))
                ? anomalies[cleanIdx].toFixed(4) : '';

            lines.push(`${date},${value},${maVal},${anomVal}`);
        }

        const csvContent = lines.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `earthtrend_${variable.id}_${item.region.name.replace(/[^a-zA-Z0-9]/g, '_')}_${item.time.startYear}-${item.time.endYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('Historical analysis exported as CSV!', 'success');
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================

    function setupEventListeners() {
        // Analyze button
        document.getElementById('analyze-btn').addEventListener('click', runAnalysis);

        // Chart tabs
        setupChartTabs();

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportResults);
        }

        // Glossary modal
        const glossaryBtn = document.getElementById('glossary-btn');
        const glossaryModal = document.getElementById('glossary-modal');
        if (glossaryBtn && glossaryModal) {
            glossaryBtn.addEventListener('click', () => {
                glossaryModal.style.display = 'flex';
            });
            glossaryModal.querySelector('.modal-close')?.addEventListener('click', () => {
                glossaryModal.style.display = 'none';
            });
            glossaryModal.addEventListener('click', (e) => {
                if (e.target === glossaryModal) glossaryModal.style.display = 'none';
            });
        }
    }

    // ============================================================
    // EXPORT FUNCTIONALITY
    // ============================================================

    function exportResults() {
        if (!state.currentAnalysis || !state.currentData) {
            showNotification('No analysis results to export. Run an analysis first.', 'warning');
            return;
        }

        const analysis = state.currentAnalysis;
        const rawData = state.currentData;
        const variable = state.selectedVariable;
        const reg = analysis.regression;
        const mk = analysis.mannKendall;
        const sen = analysis.sensSlope;
        const divisor = state.temporal === 'monthly' ? 12 : 365;

        // Determine region name
        let regionName = 'Selected Location';
        const matchedPreset = PRESET_REGIONS.find(r =>
            Math.abs(r.lat - state.selectedLat) < 1 && Math.abs(r.lon - state.selectedLon) < 1
        );
        if (matchedPreset) regionName = matchedPreset.name;
        else regionName = `${Math.abs(state.selectedLat).toFixed(2)}°${state.selectedLat >= 0 ? 'N' : 'S'}, ${Math.abs(state.selectedLon).toFixed(2)}°${state.selectedLon >= 0 ? 'E' : 'W'}`;

        // Build CSV content
        const lines = [];

        // Header section
        lines.push('# EarthTrend Explorer — Analysis Report');
        lines.push(`# Generated: ${new Date().toISOString()}`);
        lines.push(`# Variable: ${variable.name} (${variable.id})`);
        lines.push(`# Unit: ${variable.unit}`);
        lines.push(`# Location: ${regionName} (${state.selectedLat}, ${state.selectedLon})`);
        lines.push(`# Period: ${state.startYear} – ${state.endYear}`);
        lines.push(`# Temporal Resolution: ${state.temporal}`);
        lines.push('#');
        lines.push('# === TREND ANALYSIS RESULTS ===');
        lines.push(`# Trend Direction: ${mk.trend}`);
        lines.push(`# Mann-Kendall p-value: ${mk.pValue < 0.001 ? '< 0.001' : mk.pValue.toFixed(6)}`);
        lines.push(`# Mann-Kendall tau: ${mk.tau.toFixed(6)}`);
        lines.push(`# Significant (α=0.05): ${mk.significant ? 'Yes' : 'No'}`);
        lines.push(`# Linear Regression Slope: ${(reg.slope * divisor).toFixed(6)} ${variable.unit}/year`);
        lines.push(`# Linear Regression R²: ${(reg.rSquared * 100).toFixed(2)}%`);
        lines.push(`# Sen's Slope: ${(sen.slope * divisor).toFixed(6)} ${variable.unit}/year`);
        lines.push(`# Total Data Points: ${analysis.cleanData.cleanData.length + analysis.cleanData.missingCount}`);
        lines.push(`# Valid Data Points: ${analysis.cleanData.cleanData.length}`);
        lines.push(`# Missing Data: ${analysis.cleanData.missingCount} (${analysis.cleanData.missingPercent.toFixed(1)}%)`);
        lines.push('#');

        // Data section header
        lines.push('Date,Value,MovingAverage,Anomaly');

        // Data rows
        const validIdx = analysis.cleanData.validIndices;
        const ma = analysis.movingAverage;
        const anomalies = analysis.anomalies;

        for (let i = 0; i < rawData.dates.length; i++) {
            const date = rawData.dates[i];
            const rawVal = rawData.values[i];

            // Check if this index is a valid data point
            const cleanIdx = validIdx.indexOf(i);
            const isValid = cleanIdx !== -1;

            const value = isValid ? rawVal : '';
            const maVal = (isValid && ma && ma[cleanIdx] !== null && ma[cleanIdx] !== undefined)
                ? ma[cleanIdx].toFixed(4) : '';
            const anomVal = (isValid && anomalies && anomalies[cleanIdx] !== undefined && !isNaN(anomalies[cleanIdx]))
                ? anomalies[cleanIdx].toFixed(4) : '';

            lines.push(`${date},${value},${maVal},${anomVal}`);
        }

        // Create and trigger download
        const csvContent = lines.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `earthtrend_${variable.id}_${regionName.replace(/[^a-zA-Z0-9]/g, '_')}_${state.startYear}-${state.endYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('Results exported as CSV!', 'success');
    }

    // ============================================================
    // KEYBOARD SHORTCUTS
    // ============================================================

    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to run analysis
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runAnalysis();
        }
        // Escape to close modals
        if (e.key === 'Escape') {
            ['glossary-modal', 'globe-modal', 'welcome-modal', 'auth-modal', 'history-modal'].forEach(id => {
                const m = document.getElementById(id);
                if (m) m.style.display = 'none';
            });
            if (globeAnimId) {
                cancelAnimationFrame(globeAnimId);
                globeAnimId = null;
            }
        }
    });

    // ============================================================
    // WINDOW RESIZE HANDLER
    // ============================================================

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Invalidate Leaflet map size on resize
            if (state.map) {
                state.map.invalidateSize();
            }
            // Update 3D globe renderer if open
            const container = document.getElementById('globe-canvas-container');
            const globeModal = document.getElementById('globe-modal');
            if (globeModal && globeModal.style.display !== 'none' && container && globeRenderer && globeCamera) {
                const w = container.clientWidth;
                const h = container.clientHeight;
                globeCamera.aspect = w / h;
                globeCamera.updateProjectionMatrix();
                globeRenderer.setSize(w, h);
            }
        }, 200);
    });

    // ============================================================
    // START THE APP
    // ============================================================

    init();
});
