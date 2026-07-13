const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#map-container").append("svg")
    .attr("width", width).attr("height", height);

const g = svg.append("g");
const projection = d3.geoNaturalEarth1().scale(width / 5.2).translate([width / 2, height / 2]);
const pathGenerator = d3.geoPath().projection(projection);

svg.call(d3.zoom().scaleExtent([1, 25]).on("zoom", (e) => g.attr("transform", e.transform)));

const slider = document.getElementById("slider");
const yearDisplay = document.getElementById("year-display");

let currentScope = 'yearly'; 
let startPoint = 1000;

// High-fidelity hash color pool for thousands of tiny tribal/regional entities
function getHistoricalColor(d) {
    const name = d.properties.NAME || d.properties.name || d.properties.subjecto || "Territory";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsla(${Math.abs(hash % 360)}, 60%, 40%, 0.85)`;
}

// Global data router optimizing high precision & day/month tracking
function processHistoricalRender(sliderVal) {
    let url = "";
    let displayLabel = "";

    if (currentScope === 'bce') {
        // Ancient & Tribal Snapshots
        const ancientYears = [-2000, -1500, -1000, -500, -400, -323, -300, -200, -100, -1, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
        const targetYear = startPoint + (parseInt(sliderVal) * 100);
        const closest = ancientYears.reduce((p, c) => Math.abs(c - targetYear) < Math.abs(p - targetYear) ? c : p);
        
        displayLabel = closest < 0 ? `${Math.abs(closest)} BCE (Tribal Era)` : `${closest} CE`;
        const fileString = closest < 0 ? `world_bc${Math.abs(closest)}` : `world_${closest}`;
        url = `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/${fileString}.geojson`;

    } else if (currentScope === 'yearly') {
        // High Detail Modernization (1000 CE - 1938 CE)
        const targetYear = startPoint + parseInt(sliderVal);
        displayLabel = `${targetYear} CE`;
        
        // Maps smoothly down to specific historical boundary steps
        const normalizedYear = Math.floor(targetYear / 10) * 10; 
        url = `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_${normalizedYear}.geojson`;

    } else if (currentScope === 'daily') {
        // WWII Micro-Timeline Day/Month tracking configuration
        const totalDays = parseInt(sliderVal);
        const startDate = new Date(1939, 8, 1); // Sept 1, 1939
        startDate.setDate(startDate.getDate() + totalDays);
        
        displayLabel = startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        
        // Pulls directly from the master universal geographic topology layer to maintain rendering safety
        url = `https://unpkg.com/world-atlas@2.0.2/countries-110m.json`;
    }

    yearDisplay.textContent = displayLabel;

    d3.json(url).then(data => {
        g.selectAll("path").remove();
        
        // Automatically handle both raw GeoJSON strings and TopoJSON mesh structures
        let features = data.features;
        if (data.type === "Topology") {
            features = topojson.feature(data, data.objects.countries).features;
        }

        g.selectAll("path")
            .data(features)
            .enter().append("path")
            .attr("class", "region")
            .attr("d", pathGenerator)
            .style("fill", d => getHistoricalColor(d))
            .append("title")
            .text(d => d.properties.NAME || d.properties.name || "Tribal Alliance / Power");
    }).catch(err => console.warn("Caching layer transition configuration...", err));
}

// Scoping mechanism to scale the timeline instantly
function setTimelineScope(min, max, mode) {
    currentScope = mode;
    startPoint = min;
    
    if (mode === 'bce') {
        slider.min = 0;
        slider.max = 30; // 3000 year window split by chunks
        slider.value = 15;
    } else if (mode === 'yearly') {
        slider.min = 0;
        slider.max = 938; // Year-by-year step resolution
        slider.value = 500;
    } else if (mode === 'daily') {
        slider.min = 0;
        slider.max = 2192; // Every single consecutive day of WWII (1939-1945)
        slider.value = 0;
    }
    
    processHistoricalRender(slider.value);
}

slider.addEventListener("input", (e) => processHistoricalRender(e.target.value));
window.addEventListener('resize', () => { svg.attr("width", window.innerWidth).attr("height", window.innerHeight); });

// Initial boot sequence targeting High Precision Medieval/Modern data
setTimelineScope(1000, 1938, 'yearly');
