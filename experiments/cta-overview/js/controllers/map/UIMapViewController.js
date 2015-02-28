/**
 * @class UIMapViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 1/24/15.
 */
function UIMapViewController() {
    UIViewController.call(this, new UIView(document.createElement('div')));

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _canvas;
    /*------------------ PUBLIC METHODS ------------------*/



    /*------------------ PRIVATE METHODS -----------------*/
    var drawOnCanvas = function() {
        // Get map
        var map = self.getModel().getMapModel().getMap();

        var WW = window.innerWidth;
        var HH = window.innerHeight;
        var DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;

        var scene = new THREE.Scene();
        var camera = new THREE.OrthographicCamera( 0, WW * DPR, 0, HH * DPR, 0.1, 1000 );//PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        var renderer = new THREE.WebGLRenderer({
            alpha: true
        });


        renderer.setSize( WW * DPR, HH * DPR);
        //renderer.setViewport( 0, 0, WW*DPR, HH*DPR );

        document.body.appendChild( renderer.domElement );
        d3.select(renderer.domElement)
            .style("position", "absolute")
            .style("z-index", "2")
            .style("overflow", "hidden")
            .style("width", WW + "px")
            .style("height", HH + "px");

        self.getModel().getCTAModel().getTrips(new Date(), function(json) {
            console.log("ok");

            // Create a cube
            d3.values(json).forEach(function(trip) {
                var proj = map.project([trip["ns"][0]["lat"], trip["ns"][0]["lon"]]);
                var geometry = new THREE.BoxGeometry( 5, 5, 1);
                geometry.applyMatrix( new THREE.Matrix4().makeTranslation(proj.x * DPR, proj.y * DPR, 1) );
                var material = new THREE.MeshBasicMaterial( { color: "#000" } );
                var cube = new THREE.Mesh( geometry, material );
                scene.add( cube );
            });

            camera.position.z = 5;

            function render() {
                requestAnimationFrame( render );

                //cube.rotation.x += 0.01;
                //cube.rotation.y += 0.01;

                renderer.render( scene, camera );
            }
            render();
        });
    };

    var init = function () {
        self.getView().addClass("ui-map-view-controller");
        self.getView().setId("map");
        self.getView().getD3Layer().style("overflow", "hidden");
        self.getView().setInteraction(true);

        mapboxgl.accessToken = 'pk.eyJ1IjoibWFjczkxIiwiYSI6Ik9JM050anMifQ.F7_I4Vj2A3EyBEynwIcr0w';

        mapboxgl.util.getJSON('https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v6.json', function (err, style) {
            if (err) throw err;

            var map = new mapboxgl.Map({
                container: 'map',
                style: style,
                center: [41.876795, -87.731782],
                zoom: 10.5
            });

            self.getModel().getMapModel().setMap(map);

            _canvas = new UIBusCanvasViewController();
            //_canvas = new UITransitViewController();
            self.add(_canvas);



            //drawOnCanvas();
        });


    }();
}

Utils.extend(UIMapViewController, UIViewController);
































