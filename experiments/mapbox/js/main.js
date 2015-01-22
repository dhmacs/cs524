/**
 * Created by Macs on 1/16/15.
 */

$(document).ready(function() {
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFjczkxIiwiYSI6Ik9JM050anMifQ.F7_I4Vj2A3EyBEynwIcr0w';
    var map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'https://www.mapbox.com/mapbox-gl-styles/styles/mapbox-streets-v6.json', //stylesheet location
        center: [41.8841, -87.6263], // starting position
        zoom: 13 // starting zoom
    });
});
