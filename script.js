const width = window.innerWidth;
const height = window.innerHeight;

// 1. Initialize SVG Canvas
const svg = d3.select("#map-container").append("svg")
    .attr("width", width).attr("height", height);
const g = svg.append("g");
const projection = d3.geoNaturalEarth1().scale(width / 5.5).translate([width / 2, height / 2]);
const pathGenerator = d3.geoPath().projection(projection);

svg.call(d3.zoom().scaleExtent([1, 20]).on("zoom", (e) => g.attr("transform", e.transform)));

// 2. DOM Elements
const slider = document.getElementById("slider");
const yearDisplay = document.getElementById("year-display");
const datasetSelect = document.getElementById("dataset-select");

// 3. The Curated Milestones Array
const timelineMilestones = [
    { label: "2000 BCE - Early Bronze Age", file: "world_bc2000.geojson" },
    { label: "1500 BCE", file: "world_bc1500.geojson" },
    { label: "1000 BCE - Iron Age", file: "world_bc1000.geojson" },
    { label: "500 BCE", file: "world_bc500.geojson" },
    { label: "400 BCE", file: "world_bc400.geojson" },
    { label: "323 BCE - Death of Alexander", file: "world_bc323.geojson" },
    { label: "300 BCE", file: "world_bc300.geojson" },
    { label: "200 BCE", file: "world_bc200.geojson" },
    { label: "100 BCE", file: "world_bc100.geojson" },
    { label: "1 BCE", file: "world_bc1.geojson" },
    { label: "100 CE - Roman Empire Peak", file: "world_100.geojson" },
    { label: "200 CE", file: "world_200.geojson" },
    { label: "300 CE", file: "world_300.geojson" },
    { label: "400 CE", file: "world_400.geojson" },
    { label: "500 CE - Fall of Western Rome", file: "world_500.geojson" },
    { label: "600 CE", file: "world_600.geojson" },
    { label: "700 CE", file: "world_700.geojson" },
    { label: "800 CE", file: "world_800.geojson" },
    { label: "900 CE", file: "world_900.geojson" },
    { label: "1000 CE", file: "world_1000.geojson" },
    { label: "1100 CE", file: "world_1100.geojson" },
    { label: "1200 CE", file: "world_1200.geojson" },
    { label: "1279 CE - Mongol Empire", file: "world_1279.geojson" },
    { label: "1300 CE", file: "world_1300.geojson" },
    { label: "1400 CE", file: "world_1400.geojson" },
    { label: "1492 CE - Age of Discovery", file: "world_1492.geojson" },
    { label: "1500 CE", file: "world_1500.geojson" },
    { label: "1530 CE", file: "world_1530.geojson" },
    { label: "1600 CE", file: "world_1600.geojson" },
    { label: "1650 CE", file: "world_1650.geojson" },
    { label: "1700 CE", file: "world_1700.geojson" },
    { label: "1715 CE", file: "world_1715.geojson" },
    { label: "1783 CE - Post-US Revolution", file: "world_1783.geojson" },
    { label: "1800 CE", file: "world_1800.geojson" },
    { label: "1815 CE - Congress of Vienna", file: "world_1815.geojson" },
    { label: "1880 CE", file: "world_1880.geojson" },
    { label: "1900 CE", file: "world_1900.geojson" },
    { label: "1914 CE - WWI Begins", file: "world_1914.geojson" },
    { label: "1920 CE - Post-WWI Borders", file: "world_1920.geojson" },
    { label: "1938 CE - Pre-WWII", file: "world_1938.geojson" },
    { label: "1945 CE - Post-WWII", file: "world_1945.geojson" },
    { label: "1960 CE - Decolonization", file: "world_1960.geojson" },
    { label: "1994 CE - Post-Soviet Era", file: "world_1994.geojson" },
    { label: "Modern Day", isModern: true }
];

let currentMode = "milestones";

function getHistoricalColor(d) {
    const name = d.properties.NAME || d.properties.name || d.properties.subjecto || "Territory";
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return `hsla(${Math.abs(hash % 360)}, 60%, 35%, 0.8)`;
}

// 4. Configures the slider based on the dropdown selection
function configureEngine() {
    currentMode = datasetSelect.value;
    
    if (currentMode === "milestones") {
        slider.min = 0;
        slider.max = timelineMilestones.length - 1;
        slider.step = 1;
        slider.value = 33; // Starts around 1800 CE
    } else if (currentMode === "decades") {
        slider.min = 1000;
        slider.max = 1930;
        slider.step = 10;
        slider.value = 1500;
    } else if (currentMode === "centuries") {
        slider.min = -2000;
        slider.max = 1000;
        slider.step = 100;
        slider.value = -500;
    }
    
    processHistoricalRender(slider.value);
}

// 5. Data Fetching & Rendering Engine
function processHistoricalRender(val) {
    let url = "";
    
    // Determine the URL and Text Label based on current mode
    if (currentMode === "milestones") {
        const era = timelineMilestones[parseInt(val)];
        yearDisplay.textContent = era.label;
        if (era.isModern) {
            url = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";
        } else {
            url = `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/${era.file}`;
        }
    } 
    else if (currentMode === "decades") {
        const year = parseInt(val);
        yearDisplay.textContent = `${year} CE`;
        url = `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_${year}.geojson`;
    } 
    else if (currentMode === "centuries") {
        const year = parseInt(val);
        if (year < 0) yearDisplay.textContent = `${Math.abs(year)} BCE`;
        else if (year === 0) yearDisplay.textContent = `1 CE`;
        else yearDisplay.textContent = `${year} CE`;
        
        const fileString = year < 0 ? `world_bc${Math.abs(year)}` : `world_${year === 0 ? 1 : year}`;
        url = `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/${fileString}.geojson`;
    }

    // Render logic
    d3.json(url).then(geojson => {
        g.selectAll("path").remove();
        if (!geojson || !geojson.features) return;

        g.selectAll("path")
            .data(geojson.features)
            .enter().append("path")
            .attr("class", "region")
            .attr("d", pathGenerator)
            .style("fill", d => getHistoricalColor(d))
            .append("title")
            .text(d => d.properties.NAME || d.properties.name || d.properties.subjecto || "Unknown Territory");
            
    }).catch(err => console.warn(`Missing data for year/index: ${val}`, err));
}

// 6. Listeners
datasetSelect.addEventListener("change", configureEngine);
slider.addEventListener("input", (e) => processHistoricalRender(e.target.value));
window.addEventListener('resize', () => { svg.attr("width", window.innerWidth).attr("height", window.innerHeight); });

// Boot Sequence
configureEngine();
