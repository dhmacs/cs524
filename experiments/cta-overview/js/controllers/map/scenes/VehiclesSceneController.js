/**
 * @class VehiclesSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/26/15.
 */
function VehiclesSceneController() {
    SceneController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _trips = null;
    var _needUpdate = false;

    // WebGL variables
    var _geometryBuffer;
    var _mesh = null;

    // UI
    var _vehicleOpacity = {
        nearby: 0.95,
        transfer: 0.65
    };
    var _busSize = 18 * window.devicePixelRatio;
    var _trainSize = 20 * window.devicePixelRatio;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * @override
     * Update the model of the scene
     */
    this.update = function() {
        //debugger;
        if(_trips != null) {
            if(__model.getAnimationModel().getState() == AnimationState.START && _needUpdate) {
                _trips = __model.getCTAModel().getTrips();
                updateAnimation();
                _needUpdate = false;
            } else {
                computeScene(__model.getAnimationModel().getTime());
                _geometryBuffer.attributes.position.needsUpdate = true;
                _geometryBuffer.attributes.customColor.needsUpdate = true;
                _geometryBuffer.attributes.size.needsUpdate = true;
                _geometryBuffer.attributes.vertexOpacity.needsUpdate = true;
            }

        } else if(_needUpdate) {
            _trips = __model.getCTAModel().getTrips();
            updateAnimation();
            _needUpdate = false;
        }
    };

    this.dataUpdated = function() {
        _needUpdate = true;
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var computeScene = function(time) {
        var vehicleColor = new THREE.Color();
        var positions = _geometryBuffer.attributes.position.array;
        var colors = _geometryBuffer.attributes.customColor.array;
        var opacities = _geometryBuffer.attributes.vertexOpacity.array;
        var sizes = _geometryBuffer.attributes.size.array;

        for(var i = 0; i < opacities.length; i++) {
            opacities[i] = 0;
        }

        var vehicleIndex = 0;
        for(var tripId in _trips) {
            var trip = _trips[tripId];

            var lastRelevantStopIndex = Utils.cta.getLastStopIndex(time, trip["stops"]);

            var finalStopIndex = trip["stops"].length -1;
            var finalDestinationTime = Utils.cta.toSeconds(trip["stops"][finalStopIndex]["arrivalTime"]);

            var relevant = trip["hop"] == 0 || lastRelevantStopIndex >= trip["closestStopIndex"];

            if(lastRelevantStopIndex != -1 && relevant) {
                var next = Utils.cta.toSeconds(trip["stops"][lastRelevantStopIndex +1]["arrivalTime"]);
                var previous = Utils.cta.toSeconds(trip["stops"][lastRelevantStopIndex]["departureTime"]);

                // Compute time passed from the previous stop
                var delta = (time - previous) / (next - previous);
                var lat = d3.interpolateNumber(
                    parseFloat(trip["stops"][lastRelevantStopIndex]["lat"]),
                    parseFloat(trip["stops"][lastRelevantStopIndex +1]["lat"])
                )(delta);
                var lon = d3.interpolateNumber(
                    parseFloat(trip["stops"][lastRelevantStopIndex]["lon"]),
                    parseFloat(trip["stops"][lastRelevantStopIndex +1]["lon"])
                )(delta);

                var projection = __model.getMapModel().project(lat, lon);

                positions[vehicleIndex * 3] = projection.x;
                positions[vehicleIndex * 3 + 1] = projection.y;
                positions[vehicleIndex * 3 + 2] = 1;


                if(trip["color"] != undefined) {
                    vehicleColor.setStyle("#" + trip["color"]);
                    sizes[vehicleIndex] = _trainSize;
                } else {
                    vehicleColor.setStyle(__model.getThemeModel().busColor());
                    sizes[vehicleIndex] = _busSize;
                }

                if(trip["hop"] == 0) {
                    opacities[vehicleIndex] = _vehicleOpacity.nearby;
                } else {
                    var grayShade = new THREE.Color();
                    if(parseInt(trip["type"]) == 3) {
                        grayShade.setStyle(__model.getThemeModel().shadowColor());
                    } else {
                        grayShade.setStyle(__model.getThemeModel().trainShadowColor());
                    }

                    vehicleColor.lerp(grayShade, 0.3);

                    opacities[vehicleIndex] = _vehicleOpacity.transfer;
                }

                colors[vehicleIndex * 3] = vehicleColor.r;
                colors[vehicleIndex * 3 + 1] = vehicleColor.g;
                colors[vehicleIndex * 3 + 2] = vehicleColor.b;
            } else if(time >= finalDestinationTime) {
                lat = parseFloat(trip["stops"][finalStopIndex]["lat"]);
                lon = parseFloat(trip["stops"][finalStopIndex]["lon"]);

                projection = __model.getMapModel().project(lat, lon);
                positions[vehicleIndex * 3] = projection.x;
                positions[vehicleIndex * 3 + 1] = projection.y;
                positions[vehicleIndex * 3 + 2] = 1;

                if(trip["color"] != undefined) {
                    vehicleColor.setStyle("#" + trip["color"]);
                    sizes[vehicleIndex] = _trainSize;
                } else {
                    vehicleColor.setStyle(__model.getThemeModel().busColor());
                    sizes[vehicleIndex] = _busSize;
                }

                if(trip["hop"] == 0) {
                    opacities[vehicleIndex] = 0.2;
                } else {
                    grayShade = new THREE.Color();
                    grayShade.setStyle("#969696");

                    vehicleColor.lerp(grayShade, 0.5);

                    opacities[vehicleIndex] = 0.2;
                }

                colors[vehicleIndex * 3] = vehicleColor.r;
                colors[vehicleIndex * 3 + 1] = vehicleColor.g;
                colors[vehicleIndex * 3 + 2] = vehicleColor.b;
            }

            vehicleIndex++;
        }
    };

    var updateAnimation = function() {
        // Initialize WebGL variables
        var attributes = {
            size: {	type: 'f', value: [] },
            customColor: { type: 'c', value: [] },
            vertexOpacity: { type: 'f', value: [] }
        };

        var uniforms = {
            texture:   { type: "t", value: Utils.gl.circleTexture() }
        };

        var shaderMaterial = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   document.getElementById( 'vertexshader' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

            depthTest:      false,
            transparent:    true,
            sizeAttenuation: false,
            vertexColors: THREE.VertexColors
        });

        // Handling trails
        var trips = d3.values(_trips);

        _geometryBuffer = new THREE.BufferGeometry();
        var buffer = new Float32Array(trips.length * 3);
        _geometryBuffer.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(trips.length * 3);
        _geometryBuffer.addAttribute('customColor', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(trips.length);
        _geometryBuffer.addAttribute('size', new THREE.BufferAttribute(buffer, 1));
        buffer = new Float32Array(trips.length);
        _geometryBuffer.addAttribute('vertexOpacity', new THREE.BufferAttribute(buffer, 1));

        if(_mesh != null) {
            self.getScene().remove(_mesh);
        }
        _mesh = new THREE.PointCloud( _geometryBuffer, shaderMaterial );


        var sizes = _geometryBuffer.attributes.size.array;
        var opacities = _geometryBuffer.attributes.vertexOpacity.array;

        for(var i = 0; i < sizes.length; i++) {
            sizes[i] = _busSize;
        }

        self.getScene().add(_mesh);
    };

    var init = function () {
        __notificationCenter.subscribe(self, self.dataUpdated, Notifications.CTA.TRIPS_UPDATED);
    }();
}

Utils.extend(VehiclesSceneController, SceneController);