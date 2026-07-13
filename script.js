const width = window.innerWidth;
const height = window.innerHeight;

// Initialize SVG Canvas
const svg = d3.select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const g = svg.append("g");

// Set up Natural Earth map projection
const projection = d3.geoNaturalEarth1()
    .scale(width / 5.5)
    .translate([width / 2, height / 2]);

const pathGenerator = d3.geoPath().projection(projection);

// Enable smooth Pan & Zoom
svg.call(d3.zoom()
    .scaleExtent([1, 15])
    .on("zoom", (event) => g.attr("transform", event.transform))
);

// Formatter to turn slider values into correct text UI strings
function formatYearLabel(yearVal) {
    const val = parseInt(yearVal);
    if (val < 0) {
        return `${Math.abs(val)} BCE`;
    } else if (val === 0) {
        return "1 CE";
    } else {
        return `${val} CE`;
    }
}

// Generate unique colors based on tribe/empire names for visual contrast
function getRegionColor(d) {
    const name = d.properties.NAME || d.properties.subjecto || "Tribal Lands";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsla(${h}, 50%, 45%, 0.75)`;
}

// Map the slider value to the closest valid snapshot available in the github database
function getClosestAvailableYear(val) {
    const target = parseInt(val);
    
    // Exact list of prehistoric / ancient snapshot files present in the data repository
    const validYears = [
        -2000, -1500, -1000, -500, -400, -323, -300, -200, -100, -1,
        100, 200, 300, 400, 500, 600, 700, 800, 900, 1000
    ];
    
    // Find the closest year in the array
    return validYears.reduce((prev, curr) => 
        Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
    );
}

// Main Loader Engine
function updateHistoricalData(numericYear) {
    const actualYear = getClosestAvailableYear(numericYear);
    let fileName = "";

    if (actualYear < 0) {
        fileName = `world_bc${Math.abs(actualYear)}.geojson`;
    } else {
        fileName = `world_${actualYear}.geojson`;
    }

    const url = `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/${fileName}`;

    d3.json(url).then(geojson => {
        // Clear out old elements completely
        g.selectAll("path").remove();

        // Map and render prehistorical tribal areas
        g.selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("class", "region")
            .attr("d", pathGenerator)
            .style("fill", d => getRegionColor(d))
            .append("title") 
            .text(d => d.properties.NAME || d.properties.subjecto || "Tribal Group / Culture");

    }).catch(error => {
        console.error(`Failed to load historical layer file (${fileName}):`, error);
    });
}

// Attach listeners to DOM
const slider = document.getElementById("slider");
const yearDisplay = document.getElementById("year-display");

// Run map rendering
yearDisplay.textContent = formatYearLabel(slider.value);
updateHistoricalData(slider.value);

// Listen to timeline adjustments
slider.addEventListener("input", (e) => {
    const selectedValue = e.target.value;
    yearDisplay.textContent = formatYearLabel(selectedValue);
    updateHistoricalData(selectedValue);
});

// Viewport resize handler
window.addEventListener('resize', () => {
    svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
});
