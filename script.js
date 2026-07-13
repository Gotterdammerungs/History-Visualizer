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
    .scaleExtent([1, 12])
    .on("zoom", (event) => g.attr("transform", event.transform))
);

// Helper function to convert numeric slider values to proper BC/AD labels
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

// Map color generator based on tribal power names to separate boundaries visually
function getRegionColor(d) {
    const name = d.properties.NAME || d.properties.subjecto || "Tribal Territory";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Generate soft, historical looking pastel colors from string hashes
    const h = Math.abs(hash % 360);
    return `hsla(${h}, 45%, 40%, 0.7)`;
}

// Dynamic Loader Engine
function updateHistoricalData(numericYear) {
    // Convert to the exact catalog names used by the historical-basemaps database
    let fileYear = parseInt(numericYear);
    
    // Fallback normalization for older centuries missing specific files
    if (fileYear === 0) fileYear = 1;

    // Direct path targeting public raw GeoJSON data entries
    const url = `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_${fileYear}.geojson`;

    d3.json(url).then(geojson => {
        // Clear previous layer assets completely
        g.selectAll("path").remove();

        // Bind and paint the ancient boundaries
        g.selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("class", "region")
            .attr("d", pathGenerator)
            .style("fill", d => getRegionColor(d))
            .append("title") // Hover tooltip text showing the tribe/empire name
            .text(d => d.properties.NAME || d.properties.subjecto || "Unknown Tribe");

    }).catch(error => {
        console.warn(`Data layer missing for year ${fileYear}, rendering base map wireframe.`, error);
    });
}

// Controller Hooks
const slider = document.getElementById("slider");
const yearDisplay = document.getElementById("year-display");

// Initialize map view state on first script execution
yearDisplay.textContent = formatYearLabel(slider.value);
updateHistoricalData(slider.value);

// Track continuous user slider interactions
slider.addEventListener("input", (e) => {
    const selectedValue = e.target.value;
    yearDisplay.textContent = formatYearLabel(selectedValue);
    updateHistoricalData(selectedValue);
});

// Dynamic layout viewport resize handlers
window.addEventListener('resize', () => {
    svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
});
