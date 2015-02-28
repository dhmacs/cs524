/**
 * @class UITransitViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 2/11/15.
 */
function UITransitViewController() {
    UIMapCanvasViewController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _trips;

    var _vehicles = {};

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * @override
     */
    var super_viewDidAppear = self.viewDidAppear;
    this.viewDidAppear = function() {
        // Call super
        super_viewDidAppear.call(self);

        // Draw stuff
        //self.getView().getRenderer().setClearColor(0xbbbbbb, 0.6);//new THREE.Color("#ffffff"), 0.5);

        self.getModel().getCTAModel().getTrips(new Date(), function(json) {
            console.log("ok");
            _trips = json;

            self.getView().getCamera().position.z = 5;

            d3.timer(function() {
                update();
                draw();
            });
        });
    };

    /**
     * @override
     */
    this.onMapMove = function() {
        //drawVehicles();
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var update = function() {
        var trips = d3.values(_trips);
        _vehicles.coordinates = new Float32Array( trips.length * 3 );
        _vehicles.colors = new Float32Array( trips.length * 3 );

        var color = new THREE.Color();
        var now = new Date();
        now = Utils.toSeconds(now.getHours(), now.getMinutes(), now.getSeconds());
        var projection;

        trips.forEach(function(trip, i) {
            var j = i * 3;
            var t = 0;
            while(t < trip["stops"].length &&
            now > Utils.toSeconds(trip["stops"][t]["arrivalTime"]["hh"], trip["stops"][t]["arrivalTime"]["mm"], trip["stops"][t]["arrivalTime"]["ss"])) {
                t++;
            }

            if(t == 0) {
                projection = self.project(parseFloat(trip["stops"][t]["lat"]), parseFloat(trip["stops"][t]["lon"]));

                // Positions
                _vehicles.coordinates[j] = projection.x;
                _vehicles.coordinates[j +1] = projection.y;
                _vehicles.coordinates[j +2] = 1;

                // Colors
                _vehicles.colors[ j ]     = 0;
                _vehicles.colors[ j + 1 ] = 0;
                _vehicles.colors[ j + 2 ] = 0;
            }
            else if(t == trip["stops"].length) {
                projection = self.project(parseFloat(trip["stops"][t-1]["lat"]), parseFloat(trip["stops"][t-1]["lon"]));

                // Positions
                _vehicles.coordinates[j] = projection.x;
                _vehicles.coordinates[j +1] = projection.y;
                _vehicles.coordinates[j +2] = 1;

                // Colors
                _vehicles.colors[ j ]     = 0;
                _vehicles.colors[ j + 1 ] = 0;
                _vehicles.colors[ j + 2 ] = 0;
            } else {
                var next = trip["stops"][t]["arrivalTime"];
                next = Utils.toSeconds(next.hh, next.mm, next.ss);
                var previous = trip["stops"][t-1]["departureTime"];
                previous = Utils.toSeconds(previous.hh, previous.mm, previous.ss);
                var delta = (now - previous) / (next - previous);
                delta = d3.ease("sin")(delta);
                var lat = d3.interpolateNumber(parseFloat(trip["stops"][t-1]["lat"]), parseFloat(trip["stops"][t]["lat"]))(delta);
                var lon = d3.interpolateNumber(parseFloat(trip["stops"][t-1]["lon"]), parseFloat(trip["stops"][t]["lon"]))(delta);
                //var coords = d3.geo.interpolate([trip["ns"][t-1]["lon"], trip["ns"][t-1]["lat"]], [trip["ns"][t]["lon"], trip["ns"][t-1]["lat"]])(delta);
                projection = self.project(lat, lon);

                // Positions
                _vehicles.coordinates[j] = projection.x;
                _vehicles.coordinates[j +1] = projection.y;
                _vehicles.coordinates[j +2] = 1;

                // colors
                var hexColor = "#" + (trip.color != "" ? trip.color : "3182bd");
                color.setStyle(hexColor);

                _vehicles.colors[ j ]     = color.r;
                _vehicles.colors[ j + 1 ] = color.g;
                _vehicles.colors[ j + 2 ] = color.b;
            }
        });
    };

    var draw = function() {
        var scene = new THREE.Scene();
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute( 'position', new THREE.BufferAttribute( _vehicles.coordinates, 3 ) );
        geometry.addAttribute( 'color', new THREE.BufferAttribute( _vehicles.colors, 3 ) );
        geometry.computeBoundingSphere();

        var material = new THREE.PointCloudMaterial( { size: 7, vertexColors: THREE.VertexColors, sizeAttenuation: false } );

        var particleSystem = new THREE.PointCloud( geometry, material );
        scene.add( particleSystem );
        self.getView().render(scene);
    };

    /*
    var drawVehicles = function() {
        _scene = new THREE.Scene();
        self.getView().getCamera().position.z = 5;

        var trips = d3.values(_json);

        var geometry = new THREE.BufferGeometry();

        var positions = new Float32Array( trips.length * 3 );
        var colors = new Float32Array( trips.length * 3 );

        var color = new THREE.Color();

        trips.forEach(function(trip, i) {
            // positions
            var projection = self.project(trip["ns"][0]["lat"], trip["ns"][0]["lon"]);

            var j = i * 3;
            positions[j] = projection.x;
            positions[j +1] = projection.y;
            positions[j +2] = 1;

            // colors
            var hexColor = "#" + (trip.color != "" ? trip.color : "3182bd");
            color.setStyle(hexColor);

            colors[ j ]     = color.r;
            colors[ j + 1 ] = color.g;
            colors[ j + 2 ] = color.b;

        });

        geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

        geometry.computeBoundingSphere();

        var material = new THREE.PointCloudMaterial( { size: 7, vertexColors: THREE.VertexColors, sizeAttenuation: false } );

        var particleSystem = new THREE.PointCloud( geometry, material );
        _scene.add( particleSystem );
    };*/

    var init = function () {

    }();
}

Utils.extend(UITransitViewController, UIMapCanvasViewController);