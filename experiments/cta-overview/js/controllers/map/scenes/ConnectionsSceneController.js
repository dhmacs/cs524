/**
 * @class ConnectionsSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/10/15.
 */
function ConnectionsSceneController() {
    SceneController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _geometryBuffer;
    var _transfers = {};

    var _connectionSize = 35;
    var _connectionOpacity = 0.7;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * Update the model of the scene
     */
    this.update = function() {
        var currentTime = MODEL.getAnimationModel().getTime();
        var deltaTime = MODEL.getAnimationModel().getDeltaTime();

        MODEL.getCTAModel().getTrips(Utils.now(), function(json) {
            var trips = d3.values(json);

            // Handle connections
            var size = _geometryBuffer.attributes.size.array;
            var position = _geometryBuffer.attributes.position.array;
            var color = _geometryBuffer.attributes.customColor.array;
            var opacity = _geometryBuffer.attributes.vertexOpacity.array;

            if(MODEL.getAnimationModel().getState() == AnimationState.START) {
                for(var i = 0; i < size.length; i++) {
                    size[i] = 0;
                    opacity[i] = 0;
                }
            } else {
                var tColor = new THREE.Color();

                /*
                var colorScale = d3.scale.linear()
                    .domain([0, Utils.toSeconds(0, 7, 0), Utils.toSeconds(0, 15, 0)])// TODO: Change to actual maximum transfer time
                    .range(["#a50026", "#fdae61", "#006837"]);*/
                var colorScale = d3.scale.quantize()
                    .domain([0, Utils.toSeconds(0, 15, 0)])// TODO: Change to actual maximum transfer time
                    .range(["#a50026", "#f46d43", "#fee08b", "#66bd63", "#006837"]);

                // Update current state of transfers
                /*
                for(var transferId in _transfers) {
                    for(var stopId in _transfers[transferId]) {
                        var bufferIndex = _transfers[transferId][stopId].bufferIndex;
                        var previousVehicleStopTime = _transfers[transferId][stopId].previousVehicleStopTime;
                        tColor.setStyle(colorScale(currentTime - previousVehicleStopTime));

                        color[bufferIndex * 3] = tColor.r;
                        color[bufferIndex * 3 +1] = tColor.g;
                        color[bufferIndex * 3 +2] = tColor.b;
                    }
                }*/

                // Check if previous index of each vehicles displayed has transfers
                for(var tripId in json) {
                    var vehicleData = json[tripId];

                    // Compute vehicle last stop
                    var previousStopIndex = getLastStopIndex(currentTime, vehicleData["stops"]);

                    // Compute relevance of the vehicle position (if not relevant then do not display it or use low opacity)
                    var relevant = vehicleData["stops"][previousStopIndex +1]["relevant"];
                    relevant = relevant == undefined ? true : relevant;

                    if(previousStopIndex > -1 && relevant) {
                        // Compute next stop time in seconds
                        var next = vehicleData["stops"][previousStopIndex +1]["arrivalTime"];
                        next = Utils.toSeconds(next.hh, next.mm, next.ss);

                        // Compute previous stop time in seconds
                        var previous = vehicleData["stops"][previousStopIndex]["departureTime"];
                        previous = Utils.toSeconds(previous.hh, previous.mm, previous.ss);

                        // Compute time passed from the previous stop
                        var delta = (currentTime - previous) / (next - previous);
                        var lat = d3.interpolateNumber(
                            parseFloat(vehicleData["stops"][previousStopIndex]["lat"]),
                            parseFloat(vehicleData["stops"][previousStopIndex +1]["lat"])
                        )(delta);
                        var lon = d3.interpolateNumber(
                            parseFloat(vehicleData["stops"][previousStopIndex]["lon"]),
                            parseFloat(vehicleData["stops"][previousStopIndex +1]["lon"])
                        )(delta);

                        var projection = MODEL.getMapModel().project(lat, lon);

                        // Check if previous index has transfers
                        var transfers = vehicleData["stops"][previousStopIndex]["transfers"];
                        if(currentTime < (previous + deltaTime) && transfers != undefined && transfers.length > 0) {
                            i = 0;

                            transfers.forEach(function(transferId) {
                                while(i < size.length && size[i] > 0) {
                                    i++;
                                }

                                if(_transfers[transferId] == undefined) {
                                    _transfers[transferId] = {};
                                }
                                _transfers[transferId][vehicleData["stops"][previousStopIndex]["stopId"]] = {
                                    bufferIndex: i,
                                    previousVehicleStopTime: previous
                                };

                                var transferStopIndex =
                                    _.findIndex(json[transferId]["stops"], {
                                        stopId: vehicleData["stops"][previousStopIndex]["stopId"]
                                    });

                                var transferStopTime = json[transferId]["stops"][transferStopIndex]["arrivalTime"];
                                transferStopTime =
                                    Utils.toSeconds(transferStopTime.hh, transferStopTime.mm, transferStopTime.ss);

                                position[i * 3] = projection.x;
                                position[i * 3 +1] = projection.y;
                                position[i * 3 +2] = 1;

                                //tColor.setStyle(colorScale(currentTime - previous));
                                tColor.setStyle(colorScale(transferStopTime - previous));
                                color[i * 3] = tColor.r;
                                color[i * 3 +1] = tColor.g;
                                color[i * 3 +2] = tColor.b;

                                opacity[i] = _connectionOpacity;
                                size[i] = _connectionSize;
                            });
                        }

                        // Check if it is connecting at the previous stop
                        var transfer = _transfers[tripId];
                        if(transfer != undefined) {
                            transfer = transfer[vehicleData["stops"][previousStopIndex]["stopId"]];
                            if(transfer != undefined) {
                                size[transfer.bufferIndex] = 0;
                                opacity[transfer.bufferIndex] = 0;

                                _transfers[tripId][vehicleData["stops"][previousStopIndex]["stopId"]] = undefined;
                                delete _transfers[tripId][vehicleData["stops"][previousStopIndex]["stopId"]];
                            }
                        }
                    }
                }
            }

            _geometryBuffer.attributes.position.needsUpdate = true;
            _geometryBuffer.attributes.size.needsUpdate = true;
            _geometryBuffer.attributes.customColor.needsUpdate = true;
            _geometryBuffer.attributes.vertexOpacity.needsUpdate = true;
        });
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var getLastStopIndex = function(time, stops) {
        var s = 0;
        var stopTimeInSeconds;

        while(s < stops.length) {
            stopTimeInSeconds =
                Utils.toSeconds(
                    stops[s]["arrivalTime"]["hh"],
                    stops[s]["arrivalTime"]["mm"],
                    stops[s]["arrivalTime"]["ss"]
                );
            if(time < stopTimeInSeconds) {
                return s -1;
            }
            s++;
        }

        return -1;
    };

    var init = function () {
        MODEL.getCTAModel().getTrips(Utils.now(), function(json) {
            // Initialize WebGL variables
            var attributes = {
                size: {	type: 'f', value: [] },
                customColor: { type: 'c', value: [] },
                vertexOpacity: { type: 'f', value: [] }
            };

            var texture = THREE.ImageUtils.loadTexture( "img/circle.png" );
            texture.minFilter = THREE.LinearFilter;

            var uniforms = {
                texture:   { type: "t", value: /*THREE.ImageUtils.loadTexture( "img/circle.png" )*/texture }
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

            // Handling connections
            var trips = d3.values(json);

            var connectionsNumber = d3.sum(trips, function(d) {
                return d3.sum(d["stops"], function(stop) {
                    return stop["transfers"] != undefined ? stop["transfers"].length : 0;
                });
            });

            _geometryBuffer = new THREE.BufferGeometry();
            var buffer = new Float32Array(connectionsNumber * 3);
            _geometryBuffer.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
            buffer = new Float32Array(connectionsNumber * 3);
            _geometryBuffer.addAttribute('customColor', new THREE.BufferAttribute(buffer, 3));
            buffer = new Float32Array(connectionsNumber);
            _geometryBuffer.addAttribute('size', new THREE.BufferAttribute(buffer, 1));
            buffer = new Float32Array(connectionsNumber);
            _geometryBuffer.addAttribute('vertexOpacity', new THREE.BufferAttribute(buffer, 1));
            var mesh = new THREE.PointCloud( _geometryBuffer, shaderMaterial );

            self.getScene().add(mesh);

            var size = _geometryBuffer.attributes.size.array;
            //var connectionPosition = _geometryBuffer.attributes.position.array;
            //var connectionColor = _geometryBuffer.attributes.customColor.array;
            var opacity = _geometryBuffer.attributes.vertexOpacity.array;

            for(var i = 0; i < size.length; i++) {
                size[i] = 0;
                opacity[i] = 0;
            }

        });
    }();
}

Utils.extend(ConnectionsSceneController, SceneController);