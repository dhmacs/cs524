/**
 * @class BusStopsSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/12/15.
 */
function StopsSceneController() {
    SceneController.call(this);
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _trips;
    var _dataAvailable;

    var _geometryBuffer;

    var _stopSize = 10;
    var _stopOpacityMax = 0.4;
    var _deltaOpacity = 0.002;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * @override
     * Update the model of the scene
     */
    this.update = function() {
        var currentTime = MODEL.getAnimationModel().getTime();
        var deltaTime = MODEL.getAnimationModel().getDeltaTime();

        if(_dataAvailable) {
            var size = _geometryBuffer.attributes.size.array;
            var color = _geometryBuffer.attributes.customColor.array;
            var position = _geometryBuffer.attributes.position.array;
            var opacity = _geometryBuffer.attributes.vertexOpacity.array;

            if(MODEL.getAnimationModel().getState() == AnimationState.START) {
                for(var i = 0; i < size.length; i++) {
                    size[i] = 0;
                    opacity[i] = _stopOpacityMax;
                }
            } else {
                for(i = 0; i < size.length; i++) {
                    if(size[i] > 0) {
                        opacity[i] -= _deltaOpacity;
                        opacity[i] = opacity[i] > 0 ? opacity[i] : 0;
                    }
                }

                for(var tripId in _trips) {
                    var vehicleData = _trips[tripId];

                    // Compute vehicle last stop
                    var previousStopIndex = Utils.cta.getLastStopIndex(currentTime, vehicleData["stops"]);

                    // Compute relevance of the vehicle position (if not relevant then do not display it or use low opacity)
                    var relevant = vehicleData["stops"][previousStopIndex +1]["relevant"];
                    relevant = relevant == undefined ? true : relevant;

                    if(previousStopIndex > -1 && relevant) {
                        // Compute previous stop time in seconds
                        var previous = vehicleData["stops"][previousStopIndex]["departureTime"];
                        previous = Utils.toSeconds(previous.hh, previous.mm, previous.ss);

                        if(currentTime < (previous + deltaTime)) {
                            var lat = parseFloat(vehicleData["stops"][previousStopIndex]["lat"]);
                            var lon = parseFloat(vehicleData["stops"][previousStopIndex]["lon"]);

                            var projection = MODEL.getMapModel().project(lat, lon);

                            var tColor = new THREE.Color();
                            tColor.setStyle("#3182bd");
                            if(parseInt(vehicleData["hop"]) == 0) {
                                tColor.setStyle("#3182bd");
                            } else {
                                tColor.setStyle("#95a5a6");
                            }

                            i = 0;
                            while(i < size.length && size[i] > 0) {
                                i++;
                            }

                            size[i] = _stopSize;
                            position[i * 3] = projection.x;
                            position[i * 3 +1] = projection.y;
                            position[i * 3 +2] = 1;

                            color[i * 3] = tColor.r;
                            color[i * 3 +1] = tColor.g;
                            color[i * 3 +2] = tColor.b;
                        }
                    }
                }
            }

            _geometryBuffer.attributes.position.needsUpdate = true;
            _geometryBuffer.attributes.size.needsUpdate = true;
            _geometryBuffer.attributes.customColor.needsUpdate = true;
            _geometryBuffer.attributes.vertexOpacity.needsUpdate = true;
        }
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        _dataAvailable = false;
        MODEL.getCTAModel().getTrips(Utils.now(), function(json) {
            _trips = json;

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

                //blending:       THREE.AdditiveBlending,
                depthTest:      false,
                transparent:    true,
                sizeAttenuation: false,
                vertexColors: THREE.VertexColors
            });

            var stopCount = d3.sum(d3.values(_trips), function(trip) {
                return trip["stops"].length;
            });

            _geometryBuffer = new THREE.BufferGeometry();
            var buffer = new Float32Array(stopCount * 3);
            _geometryBuffer.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
            buffer = new Float32Array(stopCount * 3);
            _geometryBuffer.addAttribute('customColor', new THREE.BufferAttribute(buffer, 3));
            buffer = new Float32Array(stopCount);
            _geometryBuffer.addAttribute('size', new THREE.BufferAttribute(buffer, 1));
            buffer = new Float32Array(stopCount);
            _geometryBuffer.addAttribute('vertexOpacity', new THREE.BufferAttribute(buffer, 1));
            var mesh = new THREE.PointCloud( _geometryBuffer, shaderMaterial );

            self.getScene().add(mesh);

            var size = _geometryBuffer.attributes.size.array;
            var position = _geometryBuffer.attributes.position.array;
            var color = _geometryBuffer.attributes.customColor.array;
            var opacity = _geometryBuffer.attributes.vertexOpacity.array;

            //var tColor = new THREE.Color();
            //tColor.setStyle("#3182bd");

            /*
            var i = 0;
            for(var tripId in _trips) {
                var vehicleData = _trips[tripId];
                if(parseInt(vehicleData["hop"]) == 0) {
                    tColor.setStyle("#3182bd");
                } else {
                    tColor.setStyle("#95a5a6");
                }
                vehicleData["stops"].forEach(function() {
                    size[i] = 0;
                    opacity[i] = _stopOpacityMax;

                    color[i * 3] = tColor.r;
                    color[i * 3 +1] = tColor.g;
                    color[i * 3 +2] = tColor.b;
                    i++;
                });
            }*/

            for(var i = 0; i < size.length; i++) {
                size[i] = 0;
                opacity[i] = _stopOpacityMax;

                /*
                color[i * 3] = tColor.r;
                color[i * 3 +1] = tColor.g;
                color[i * 3 +2] = tColor.b;*/
            }

            _dataAvailable = true;
        });
    }();
}

Utils.extend(StopsSceneController, SceneController);