/**
 * @class TrailsSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/9/15.
 */
function TrailsSceneController() {
    SceneController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _trips = null;
    var _needUpdate = false;

    var _geometryBuffer;
    var _mesh = null;

    // Animation settings
    var _trailLength = 400;
    var _headSize = 30;
    var _maxTrailSize = 7;
    var _minTrailSize = 4;
    var _decrementPerFrame = 0.02;
    var _minOpacity = 0.1;
    var _maxOpacity = 0.7;
    var _deltaOpacity = 0.03;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * @override
     * Update the model of the scene
     */
    this.update = function() {
        if(_trips != null) {

            if(__model.getAnimationModel().getState() == AnimationState.START) {
                _trips = __model.getCTAModel().getTrips();
                updateAnimation();
                _needUpdate = false;
            } else {
                //var trips = d3.values(_trips);
                var currentTime = __model.getAnimationModel().getTime();

                var size = _geometryBuffer.attributes.size.array;
                var position = _geometryBuffer.attributes.position.array;
                var color = _geometryBuffer.attributes.customColor.array;
                var opacity = _geometryBuffer.attributes.vertexOpacity.array;


                var i = 0;
                for(; i < size.length; i++) {
                    if(size[i] == _headSize) {
                        size[i] = _maxTrailSize;
                    } else if(size[i] > _minTrailSize) {
                        size[i] = size[i] - _decrementPerFrame;
                    } else {
                        size[i] = 0;
                        opacity[i] = _maxOpacity;
                    }
                    opacity[i] = opacity[i] > _minOpacity ? opacity[i] - _deltaOpacity : _minOpacity;
                }

                for(var tripId in _trips) {
                    var vehicleData = _trips[tripId];

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

                        var projection = __model.getMapModel().project(lat, lon);

                        i = 0;
                        while(i < size.length && size[i] > 0) {
                            i++;
                        }

                        size[i] = _headSize;

                        position[i * 3] = projection.x;
                        position[i * 3 +1] = projection.y;
                        position[i * 3 +2] = 1;

                        var tColor = new THREE.Color();

                        if(vehicleData["hop"] == 0) {
                            tColor.setStyle("#3182bd");
                        } else {
                            tColor.setStyle("#95a5a6");
                        }
                        color[i * 3] = tColor.r;
                        color[i * 3 +1] = tColor.g;
                        color[i * 3 +2] = tColor.b;
                    }
                }
            }

            _geometryBuffer.attributes.position.needsUpdate = true;
            _geometryBuffer.attributes.size.needsUpdate = true;
            _geometryBuffer.attributes.customColor.needsUpdate = true;
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

            //blending:       THREE.AdditiveBlending,
            depthTest:      false,
            transparent:    true,
            sizeAttenuation: false,
            vertexColors: THREE.VertexColors
        });

        // Handling trails
        var trips = d3.values(_trips);

        _geometryBuffer = new THREE.BufferGeometry();
        var buffer = new Float32Array(trips.length * _trailLength * 3);
        _geometryBuffer.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(trips.length * _trailLength * 3);
        _geometryBuffer.addAttribute('customColor', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(trips.length * _trailLength);
        _geometryBuffer.addAttribute('size', new THREE.BufferAttribute(buffer, 1));
        buffer = new Float32Array(trips.length * _trailLength);
        _geometryBuffer.addAttribute('vertexOpacity', new THREE.BufferAttribute(buffer, 1));

        if(_mesh != null) {
            self.getScene().remove(_mesh);
        }
        _mesh = new THREE.PointCloud( _geometryBuffer, shaderMaterial );


        var size = _geometryBuffer.attributes.size.array;
        var opacity = _geometryBuffer.attributes.vertexOpacity.array;

        for(var i = 0; i < size.length; i++) {
            size[i] = 0;
            opacity[i] = 1;
        }

        self.getScene().add(_mesh);
    };


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
        __notificationCenter.subscribe(self, self.dataUpdated, Notifications.CTA.TRIPS_UPDATED);
    }();
}

Utils.extend(TrailsSceneController, SceneController);