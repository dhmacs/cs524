/**
 * @class TransfersSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/26/15.
 */
function TransfersSceneController() {
    SceneController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _trips = null;
    var _transfers = null;
    var _needUpdate = false;

    // WebGL variables
    var _geometryBuffer;
    var _mesh = null;

    // UI
    var _transferSize = 15 * window.devicePixelRatio;
    var _transferOpacity = {
        min: 0.3,
        max: 0.6
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
        var transferColor = new THREE.Color();

        transferColor.setStyle(__model.getThemeModel().transferSymbolColor());

        var positions = _geometryBuffer.attributes.position.array;
        var colors = _geometryBuffer.attributes.customColor.array;
        var opacities = _geometryBuffer.attributes.vertexOpacity.array;
        var sizes = _geometryBuffer.attributes.size.array;

        for(var i = 0; i < opacities.length; i++) {
            opacities[i] = 0;
        }

        var pointIndex = 0;
        for(var tripId in _transfers) {
            for(var transferId in _transfers[tripId]) {
                _transfers[tripId][transferId].forEach(function(transfer) {
                    if(_trips[transferId] != undefined) {
                        var getOnTime = Utils.cta.toSeconds(_trips[transferId]["stops"][transfer.getOnStopIndex]["arrivalTime"]);
                        var getOffTime = Utils.cta.toSeconds(_trips[tripId]["stops"][transfer.getOffStopIndex]["arrivalTime"]);

                        if(time >= getOffTime && time <= getOnTime) {
                            var opacityScale = d3.scale.linear()
                                .domain([getOffTime, getOnTime])
                                .range([_transferOpacity.max, _transferOpacity.min]);

                            var getOffLocationProj =__model.getMapModel().project(
                                _trips[tripId]["stops"][transfer.getOffStopIndex]["lat"],
                                _trips[tripId]["stops"][transfer.getOffStopIndex]["lon"]
                            );
                            var getOnLocationProj = __model.getMapModel().project(
                                _trips[transferId]["stops"][transfer.getOnStopIndex]["lat"],
                                _trips[transferId]["stops"][transfer.getOnStopIndex]["lon"]
                            );

                            // Position
                            positions[pointIndex *3] = getOffLocationProj.x;
                            positions[pointIndex *3 +1] = getOffLocationProj.y;
                            positions[pointIndex *3 +2] = 1;

                            // Color
                            colors[pointIndex *3] = transferColor.r;
                            colors[pointIndex *3 +1] = transferColor.g;
                            colors[pointIndex *3 +2] = transferColor.b;

                            // Size
                            sizes[pointIndex] = _transferSize;

                            // Opacity
                            opacities[pointIndex] = opacityScale(time);

                            pointIndex++;
                        }
                    }
                });
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
            texture:   { type: "t", value: Utils.gl.transferTexture() }
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

        _transfers = {};

        var transfersNumber = 0;
        for(var tripId in _trips) {
            var trip = _trips[tripId];
            trip["stops"].forEach(function(stop, stopIndex) {
                if(stop["transfers"] != undefined) {
                    stop["transfers"].forEach(function(transfer) {
                        if(_transfers[tripId] == undefined) {
                            _transfers[tripId] = {};
                        }
                        if(_transfers[tripId][transfer["tripId"]] == undefined) {
                            _transfers[tripId][transfer["tripId"]] = [];
                        }
                        _transfers[tripId][transfer["tripId"]].push({
                            getOffStopIndex: stopIndex,
                            getOnStopIndex: transfer["stopIndex"]
                        });
                    });
                    transfersNumber += stop["transfers"].length;
                }
            });
        }

        _geometryBuffer = new THREE.BufferGeometry();
        var buffer = new Float32Array(transfersNumber * 3);
        _geometryBuffer.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(transfersNumber * 3);
        _geometryBuffer.addAttribute('customColor', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(transfersNumber);
        _geometryBuffer.addAttribute('size', new THREE.BufferAttribute(buffer, 1));
        buffer = new Float32Array(transfersNumber);
        _geometryBuffer.addAttribute('vertexOpacity', new THREE.BufferAttribute(buffer, 1));

        var opacities = _geometryBuffer.attributes.vertexOpacity.array;

        for(var i = 0; i < opacities.length; i++) {
            opacities[i] = 0;
        }

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

Utils.extend(TransfersSceneController, SceneController);