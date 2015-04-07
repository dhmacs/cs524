/**
 * @class VehiclesStopsSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/26/15.
 */
function VehiclesStopsSceneController() {
    SceneController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _trips = null;
    var _needUpdate = false;

    // WebGL variables
    var _geometryBuffer;
    var _mesh = null;

    // UI
    var _stopOpacity = {
        min: 0.4,
        max: 0.8
    };
    var _busStopSize = 4 * window.devicePixelRatio;
    var _trainStopSize = 6 * window.devicePixelRatio;


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

            }
            computeScene(__model.getAnimationModel().getTime());
            _geometryBuffer.attributes.position.needsUpdate = true;
            _geometryBuffer.attributes.customColor.needsUpdate = true;
            _geometryBuffer.attributes.size.needsUpdate = true;
            _geometryBuffer.attributes.vertexOpacity.needsUpdate = true;
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
        var trailStartTime = time - __model.getCTAModel().getMaximumTransferTime();
        var stopColor = new THREE.Color();

        var opacityScale = d3.scale.linear()
            .domain([trailStartTime, time])
            .range([_stopOpacity.min, _stopOpacity.max]);

        var positions = _geometryBuffer.attributes.position.array;
        var colors = _geometryBuffer.attributes.customColor.array;
        var opacities = _geometryBuffer.attributes.vertexOpacity.array;
        var sizes = _geometryBuffer.attributes.size.array;

        for(var k = 0; k < opacities.length; k++) {
            opacities[k] = 0;
        }

        var pointIndex = 0;
        for(var tripId in _trips) {
            var trip = _trips[tripId];

            trailStartTime = time - __model.getCTAModel().getMaximumTransferTime();
            trailStartTime = trailStartTime < __model.getAnimationModel().getStartTime() ?
                __model.getAnimationModel().getStartTime() : trailStartTime;

            var firstRelevantStopIndex = Utils.cta.getLastStopIndex(trailStartTime, trip["stops"]);
            if(trip["hop"] > 0 && firstRelevantStopIndex < trip["closestStopIndex"]) {
                firstRelevantStopIndex = trip["closestStopIndex"];
                trailStartTime = Utils.cta.toSeconds(trip["stops"][firstRelevantStopIndex]["arrivalTime"]);
            }

            var lastRelevantStopIndex = Utils.cta.getLastStopIndex(time, trip["stops"]);

            var relevant = trip["hop"] == 0 || (lastRelevantStopIndex +1) >= trip["closestStopIndex"];

            if(lastRelevantStopIndex != -1 && relevant) {

                if(trip["color"] != undefined) {
                    stopColor.setStyle("#" + trip["color"]);
                } else {
                    stopColor.setStyle(__model.getThemeModel().busColor());
                }

                if(trip["hop"] > 0) {
                    var grayShade = new THREE.Color();
                    if(parseInt(trip["type"]) == 3) {
                        grayShade.setStyle(__model.getThemeModel().shadowColor());
                    } else {
                        grayShade.setStyle(__model.getThemeModel().trainShadowColor());
                    }

                    stopColor.lerp(grayShade, 0.5);
                }
                /*
                if(trip["color"] != undefined) {
                    stopColor.setStyle("#" + trip["color"]);
                } else if(trip["hop"] == 0) {
                    stopColor.setStyle("#3182bd");
                } else {
                    stopColor.setStyle("#95a5a6");
                }*/

                var vehicleSize = parseInt(trip["type"]) == 3 ? _busStopSize : _trainStopSize;

                //var i = firstRelevantStopIndex != -1 ? firstRelevantStopIndex : 0;
                var i = firstRelevantStopIndex +1;

                for(; i <= lastRelevantStopIndex; i++) {
                    // Position
                    var projection = __model.getMapModel().project(trip["stops"][i]["lat"], trip["stops"][i]["lon"]);
                    positions[pointIndex * 3] = projection.x;
                    positions[pointIndex * 3 +1] = projection.y;
                    positions[pointIndex * 3 +2] = 1;

                    // Color
                    colors[pointIndex * 3] = stopColor.r;
                    colors[pointIndex * 3 +1] = stopColor.g;
                    colors[pointIndex * 3 +2] = stopColor.b;

                    // Size
                    sizes[pointIndex] = vehicleSize;

                    // Opacity
                    relevant = trip["hop"] == 0 || i >= trip["closestStopIndex"];
                    if(relevant) {
                        opacities[pointIndex] = opacityScale(Utils.cta.toSeconds(trip["stops"][i]["arrivalTime"]));
                    }

                    pointIndex++;
                }
            }
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
            texture:   { type: "t", value: Utils.gl.roundTexture() }
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

        var stopsNumber = d3.sum(d3.values(_trips), function(trip) {
            return trip["stops"].length;
        });

        _geometryBuffer = new THREE.BufferGeometry();
        var buffer = new Float32Array(stopsNumber * 3);
        _geometryBuffer.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(stopsNumber * 3);
        _geometryBuffer.addAttribute('customColor', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(stopsNumber);
        _geometryBuffer.addAttribute('size', new THREE.BufferAttribute(buffer, 1));
        buffer = new Float32Array(stopsNumber);
        _geometryBuffer.addAttribute('vertexOpacity', new THREE.BufferAttribute(buffer, 1));

        if(_mesh != null) {
            self.getScene().remove(_mesh);
        }
        _mesh = new THREE.PointCloud( _geometryBuffer, shaderMaterial );

        self.getScene().add(_mesh);
    };

    var init = function () {
        __notificationCenter.subscribe(self, self.dataUpdated, Notifications.CTA.TRIPS_UPDATED);
    }();
}

Utils.extend(VehiclesStopsSceneController, SceneController);
















