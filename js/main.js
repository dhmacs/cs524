
mapboxgl.accessToken = 'pk.eyJ1IjoibWFjczkxIiwiYSI6Ik9JM050anMifQ.F7_I4Vj2A3EyBEynwIcr0w';
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v6.json', //stylesheet location
    center: [40, -74.50], // starting position
    zoom: 9 // starting zoom
});