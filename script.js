const width = window.innerWidth;
const height = window.innerHeight;

// Initialize SVG Canvas
const svg = d3.select("#map-container").append("svg")
    .attr("width", width).attr("height", height);

const g = svg.append("g");
const projection = d3.geoNaturalEarth1().scale(width / 5.5).translate([width / 2, height / 2]);
const pathGenerator = d3.geoPath().projection(projection);

// Clean pan & zoom setup
svg.call(d3.zoom().scaleExtent([1, 20]).on("zoom", (e) => g.attr("transform", e.transform)));

const slider = document.getElementById("slider");
const yearDisplay = document.getElementById("year-display");

// Set up slider range to represent one fluid scale: -2000 to 2026
slider.min = -2000;
slider.max = 2026;
slider.step = 1;
slider.value = 1000; // Default view starts at 1000 CE

// Array of explicit ancient files available to avoid 404 network crashes
const ancientSnapshots = [-2000, -1500, -1000, -500, -400, -323, -300, -200, -100, -1, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

function getHistoricalColor(d) {
    const name = d.properties.NAME || d.properties.name || d.properties.subjecto || "Territory";
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return `hsla(${Math.abs(hash % 360)}, 50%, 42%, 0.85)`;
}

function processHistoricalRender(val) {
    const targetYear = parseInt(val);
    let url = "";

    // Format text inside HUD display box
    if (targetYear < 0) {
        yearDisplay.textContent = `${Math.abs(targetYear)} BCE`;
    } else if (targetYear === 0) {
        yearDisplay.textContent = "1 CE";
    } else {
        yearDisplay.textContent = `${targetYear} CE`;
    }

    // Dataset router mapping to highest resolution files available
    if (targetYear <= 1000) {
        // Antiquity / Prehistory: Route to nearest historical point array chunk
        const closest = ancientSnapshots.reduce((p, c) => Math.abs(c - targetYear) < Math.abs(p - targetYear) ? c : p);
        const fileString = closest < 0 ? `world_bc${Math.abs(closest)}` : `world_${closest}`;
        url = `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/${fileString}.geojson`;
    } else if (targetYear > 1000 && targetYear < 1900) {
        // High Precision Middle Ages to Colonial Era: Rounds to closest 10-year step maps
        const roundedDecade = Math.floor(targetYear / 10) * 10;
        url = `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_${roundedDecade}.geojson`;
    } else {
        // Contemporary history: Direct routing to modern multi-polygon vector files
        url = `https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson`;
    }

    // Execute safe async query fetch
    d3.json(url).then(geojson => {
        g.selectAll("path").remove();
        
        if (!geojson || !geojson.features) return;

        g.selectAll("path")
            .data(geojson.features)
            .enter().append("path")
            .attr("class", "region")
            .attr("d", pathGenerator)
            .style("fill", d => getHistoricalColor(d))
            .style("stroke", "#080a0f")
            .style("stroke-width", "0.4px")
            .append("title")
            .text(d => d.properties.NAME || d.properties.name || "Tribal Group / Power");
    }).catch(err => {
        console.warn(`Layer data transition matching skipped for year frame: ${targetYear}`, err);
    });
}

// Event Listeners
slider.addEventListener("input", (e) => processHistoricalRender(e.target.value));
window.addEventListener('resize', () => { svg.attr("width", window.innerWidth).attr("height", window.innerHeight); });

// Initial compilation execution 
processHistoricalRender(slider.value);
