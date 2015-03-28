/**
 * @class PathSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/25/15.
 */
function PathSceneController() {
    SceneController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _trips = null;
    var _needUpdate = false;

    var _cutPoints = {};
    var _points = {};

    // WebGL variables
    var _geometryBuffer;
    var _mesh = null;

    // UI
    var _opacity = {
        min: 0.2,
        max: 1.0
    };

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
            _geometryBuffer.attributes.color.needsUpdate = true;
            _geometryBuffer.attributes.index.needsUpdate = true;
            _geometryBuffer.attributes.opacity.needsUpdate = true;
        } else if(_needUpdate) {
            _trips = __model.getCTAModel().getTrips();
            updateAnimation();
            _needUpdate = false;
        }
    };

    /**
     *
     */
    this.dataUpdated = function() {
        _needUpdate = true;
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var computeScene = function(time) {
        var trailStartTime = time - __model.getCTAModel().getMaximumTransferTime();
        var positions = _geometryBuffer.attributes.position.array;
        var opacities = _geometryBuffer.attributes.opacity.array;

        var opacityScale = d3.scale.linear()
            .domain([trailStartTime, time])
            .range([_opacity.min, _opacity.max]);

        for(var i = 0; i < opacities.length; i++) {
            opacities[i] = 0;
        }

        trailStartTime = trailStartTime < __model.getAnimationModel().getStartTime() ?
            __model.getAnimationModel().getStartTime() : trailStartTime;


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

            var trailTail = {};
            var trailHead = {};

            var relevant = trip["hop"] == 0 || time >= Utils.cta.toSeconds(trip["stops"][trip["closestStopIndex"]]["arrivalTime"]);

            if(lastRelevantStopIndex != -1 && relevant) {
                var next = Utils.cta.toSeconds(trip["stops"][lastRelevantStopIndex +1]["arrivalTime"]);
                var previous = Utils.cta.toSeconds(trip["stops"][lastRelevantStopIndex]["departureTime"]);

                // Compute time passed from the previous stop
                var delta = (time - previous) / (next - previous);
                trailHead.lat = d3.interpolateNumber(
                    parseFloat(trip["stops"][lastRelevantStopIndex]["lat"]),
                    parseFloat(trip["stops"][lastRelevantStopIndex +1]["lat"])
                )(delta);
                trailHead.lon = d3.interpolateNumber(
                    parseFloat(trip["stops"][lastRelevantStopIndex]["lon"]),
                    parseFloat(trip["stops"][lastRelevantStopIndex +1]["lon"])
                )(delta);

                if(firstRelevantStopIndex == -1) {
                    trailTail.lat = trip["stops"][0]["lat"];
                    trailTail.lon = trip["stops"][0]["lon"];
                } else {
                    next = Utils.cta.toSeconds(trip["stops"][firstRelevantStopIndex +1]["arrivalTime"]);
                    previous = Utils.cta.toSeconds(trip["stops"][firstRelevantStopIndex]["departureTime"]);

                    // Compute time passed from the previous stop
                    delta = (trailStartTime - previous) / (next - previous);
                    trailTail.lat = d3.interpolateNumber(
                        parseFloat(trip["stops"][firstRelevantStopIndex]["lat"]),
                        parseFloat(trip["stops"][firstRelevantStopIndex +1]["lat"])
                    )(delta);
                    trailTail.lon = d3.interpolateNumber(
                        parseFloat(trip["stops"][firstRelevantStopIndex]["lon"]),
                        parseFloat(trip["stops"][firstRelevantStopIndex +1]["lon"])
                    )(delta);
                }

                i = firstRelevantStopIndex != -1 ? firstRelevantStopIndex : 0;

                // Move the final two cut points at the end
                shiftPositions(positions, _cutPoints[tripId][3], _points[tripId] +2 + lastRelevantStopIndex +2, _cutPoints[tripId]);
                _cutPoints[tripId][3] = _points[tripId] +2 + lastRelevantStopIndex +2;
                shiftPositions(positions, _cutPoints[tripId][2], _points[tripId] +2 + lastRelevantStopIndex +1, _cutPoints[tripId]);
                _cutPoints[tripId][2] = _points[tripId] +2 + lastRelevantStopIndex +1;

                var projection = __model.getMapModel().project(trailHead.lat, trailHead.lon);

                positions[_cutPoints[tripId][2] * 3] = projection.x;
                positions[_cutPoints[tripId][2] * 3 +1] = projection.y;
                positions[_cutPoints[tripId][2] * 3 +2] = 1;

                // TODO
                /*
                relevant = trip["hop"] == 0 || lastRelevantStopIndex >= trip["closestStopIndex"];
                if(relevant) {
                    opacities[_cutPoints[tripId][2]] = opacityScale(time);//_opacity.max;
                }*/
                opacities[_cutPoints[tripId][2]] = opacityScale(time);

                positions[_cutPoints[tripId][3] * 3] = projection.x;
                positions[_cutPoints[tripId][3] * 3 +1] = projection.y;
                positions[_cutPoints[tripId][3] * 3 +2] = 1;


                // Move the first two cut points at the beginning
                shiftPositions(positions, _cutPoints[tripId][1], _points[tripId] + i + 2, _cutPoints[tripId]);
                _cutPoints[tripId][1] = _points[tripId] + i +2;
                shiftPositions(positions, _cutPoints[tripId][0], _points[tripId] + i +1, _cutPoints[tripId]);
                _cutPoints[tripId][0] = _points[tripId] + i +1;

                projection = __model.getMapModel().project(trailTail.lat, trailTail.lon);

                positions[_cutPoints[tripId][0] * 3] = projection.x;
                positions[_cutPoints[tripId][0] * 3 +1] = projection.y;
                positions[_cutPoints[tripId][0] * 3 +2] = 1;

                positions[_cutPoints[tripId][1] * 3] = projection.x;
                positions[_cutPoints[tripId][1] * 3 +1] = projection.y;
                positions[_cutPoints[tripId][1] * 3 +2] = 1;

                // TODO
                /*
                relevant = trip["hop"] == 0 || firstRelevantStopIndex >= trip["closestStopIndex"];
                if(relevant) {
                    opacities[_cutPoints[tripId][1]] = opacityScale(Utils.cta.toSeconds(trip["stops"][i]["arrivalTime"]));//_opacity.min;
                }*/
                opacities[_cutPoints[tripId][1]] = opacityScale(Utils.cta.toSeconds(trip["stops"][i]["arrivalTime"]));

                i++; // Start from the stop after the first relevant one
                for(; i <= lastRelevantStopIndex; i++) {
                    projection = __model.getMapModel().project(trip["stops"][i]["lat"], trip["stops"][i]["lon"]);

                    positions[(_points[tripId] + i +2) * 3] = projection.x;
                    positions[(_points[tripId] + i +2) * 3 +1] = projection.y;
                    positions[(_points[tripId] + i +2) * 3 +2] = 1;

                    relevant = trip["hop"] == 0 || i >= trip["closestStopIndex"];
                    if(relevant) {
                        opacities[_points[tripId] + i +2] = opacityScale(Utils.cta.toSeconds(trip["stops"][i]["arrivalTime"]));
                    }
                }
            }
        }
    };

    var shiftPositions = function(positions, currentIndex, desiredIndex, cutPoints) {
        while(currentIndex > desiredIndex) {
            positions[currentIndex * 3] = positions[(currentIndex -1) * 3];
            positions[currentIndex * 3 +1] = positions[(currentIndex -1) * 3 +1];
            positions[currentIndex * 3 +2] = positions[(currentIndex -1) * 3 +2];

            currentIndex--;
        }
        while(currentIndex < desiredIndex) {
            positions[currentIndex * 3] = positions[(currentIndex +1) * 3];
            positions[currentIndex * 3 +1] = positions[(currentIndex +1) * 3 +1];
            positions[currentIndex * 3 +2] = positions[(currentIndex +1) * 3 +2];

            currentIndex++;
        }
    };

    var updateAnimation = function() {
        _geometryBuffer = new THREE.BufferGeometry();
        var material = new THREE.LineBasicMaterial({
            vertexColors: THREE.VertexColors,
            transparent: true
        });
        var cutPoints = 4;

        var attributes = {
            //color: { type: 'c', value: [] }
            //vertexOpacity: { type: 'f', value: [] }
            opacity: { type: 'f', value: [] }
        };

        var shaderMaterial = new THREE.ShaderMaterial( {
            //uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   document.getElementById( 'pathVertexShader' ).textContent,
            fragmentShader: document.getElementById( 'pathFragmentShader' ).textContent,

            depthTest:      false,
            transparent:    true,
            //sizeAttenuation: false,
            vertexColors: THREE.VertexColors
        });

        var tripElementsArray = d3.values(_trips);

        // Compute total number of points
        var pointsNumber = d3.sum(tripElementsArray, function(trip) {
            return trip["stops"].length + cutPoints; // Adding cutting points
        });

        var buffer = new Float32Array(pointsNumber * 3);
        _geometryBuffer.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(pointsNumber * 3);
        _geometryBuffer.addAttribute('color', new THREE.BufferAttribute(buffer, 3));
        buffer = new Uint16Array((pointsNumber -1) *2 - (tripElementsArray.length -1) *2);
        _geometryBuffer.addAttribute('index', new THREE.BufferAttribute(buffer, 2));
        buffer = new Float32Array(pointsNumber);
        _geometryBuffer.addAttribute('opacity', new THREE.BufferAttribute(buffer, 1));

        _geometryBuffer.computeBoundingSphere();

        if(_mesh != null) {
            self.getScene().remove(_mesh);
        }
        _mesh = new THREE.Line( _geometryBuffer, shaderMaterial, THREE.LinePieces );

        // Add points
        var positions = _geometryBuffer.attributes.position.array;
        var colors = _geometryBuffer.attributes.color.array;
        var indexes = _geometryBuffer.attributes.index.array;
        var opacities = _geometryBuffer.attributes.opacity.array;

        var trailsColor = new THREE.Color();
        trailsColor.setStyle("#000");

        var index = 0;
        var segmentIndex = 0;
        for(var tripId in _trips) {
            var trip = _trips[tripId];
            _cutPoints[tripId] = [];
            _points[tripId] = index;


            if(trip["color"] != undefined) {
                trailsColor.setStyle("#" + trip["color"]);
            } else {
                trailsColor.setStyle(__model.getThemeModel().busColor());
            }

            if(trip["hop"] > 0) {
                var grayShade = new THREE.Color();
                if(parseInt(trip["type"]) == 3) {
                    grayShade.setStyle(__model.getThemeModel().shadowColor());
                } else {
                    grayShade.setStyle(__model.getThemeModel().trainShadowColor());
                }

                trailsColor.lerp(grayShade, 0.5);
            }
            /*
            else {
                trailsColor.setStyle("#95a5a6");
            }*/

            // Add stops
            for(var pos = 0; pos < trip["stops"].length -1; pos++) {
                var stop = trip["stops"][pos];
                var projection = __model.getMapModel().project(stop["lat"], stop["lon"]);

                if(pos == 0) {
                    // Add cut points
                    _cutPoints[tripId].push(index);

                    positions[index * 3] = 0;
                    positions[index * 3 +1] = 0;
                    positions[index * 3 +2] = 1;

                    colors[index *3] = trailsColor.r;
                    colors[index *3 +1] = trailsColor.g;
                    colors[index *3 +2] = trailsColor.b;

                    opacities[index] = 0.0;
                    index++;

                    for(var i = 1; i < cutPoints; i++) {
                        _cutPoints[tripId].push(index);

                        positions[index * 3] = 0;
                        positions[index * 3 +1] = 0;
                        positions[index * 3 +2] = 1;

                        colors[index *3] = trailsColor.r;
                        colors[index *3 +1] = trailsColor.g;
                        colors[index *3 +2] = trailsColor.b;

                        opacities[index] = 0.0;

                        indexes[segmentIndex * 2] = index;
                        indexes[segmentIndex * 2 +1] = index +1;

                        segmentIndex++;
                        index++;
                    }
                }

                positions[index *3] = projection.x;
                positions[index *3 +1] = projection.y;
                positions[index *3 +2] = 1;

                colors[index *3] = trailsColor.r;
                colors[index *3 +1] = trailsColor.g;
                colors[index *3 +2] = trailsColor.b;

                opacities[index] = 0.0;

                indexes[segmentIndex * 2] = index;
                indexes[segmentIndex * 2 +1] = index +1;
                segmentIndex++;

                index++;
            }
        }

        self.getScene().add(_mesh);
    };

    var init = function () {
        __notificationCenter.subscribe(self, self.dataUpdated, Notifications.CTA.TRIPS_UPDATED);
    }();
}

Utils.extend(PathSceneController, SceneController);