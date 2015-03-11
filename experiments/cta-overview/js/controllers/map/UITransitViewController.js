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

    var _vehicles = {};


    var _data;
    var _animationTime;
    var _animationEndTime;
    var _animationIncrement = 5;

    var _geometry;
    var _uniforms;
    var _attributes;
    var _shaderMaterial;

    var _particleSystem;
    var _scene;

    // Animation settings
    var _trailLength = 400;
    var _headSize = 40;
    var _maxTrailSize = 7;
    var _minTrailSize = 4;
    var _decrementPerFrame = 0.02;
    var _minOpacity = 0.2;
    var _deltaOpacity = 0.03;

    // Text
    var _vehiclesLabelGroup;
    var _vehiclesLabels = {};
    var _textScene;


    // User location
    var _locationScene;
    var _locationGeometryBuffer;
    var _circlesNumber = 3;
    var _circleSizes = {
        max: 80,
        min: 20
    };
    var _locationAnimationIncrement = 0.005;
    var _circlesOpacities = {
        max: 1.0,
        min: 0
    };

    // Connections
    var _connectionsScene;
    var _connectionsGeometryBuffer;
    var _connectionsVisibility = {};
    var _connectionsOpacity = {
        max: 0.5,
        min: 0.1,
        delta: 0.001
    };
    var _connectionsSizeOpacityRatio = 50;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * @override
     */
    var super_viewDidAppear = self.viewDidAppear;
    this.viewDidAppear = function() {
        // Call super
        super_viewDidAppear.call(self);

        // Draw stuff
        self.getView().getRenderer().setClearColor(new THREE.Color("#ffffff"), 0.7);

        self.getModel().getCTAModel().getTrips(new Date(), function(json) {
            console.log("ok");
            _data = json;


            self.getView().getCamera().position.z = 5;

            // Initialize animation time
            _animationTime = Utils.toSeconds(12, 15, 0);//Utils.nowToSeconds();
            _animationEndTime = _animationTime + Utils.toSeconds(1, 0, 0) /*1 hour*/;

            // Initialize WebGL variables
            _attributes = {
                size: {	type: 'f', value: [] },
                customColor: { type: 'c', value: [] },
                vertexOpacity: { type: 'f', value: [] }
            };
            _uniforms = {
                texture:   { type: "t", value: THREE.ImageUtils.loadTexture( "img/circle.png" ) }
            };

            _shaderMaterial = new THREE.ShaderMaterial( {
                uniforms:       _uniforms,
                attributes:     _attributes,
                vertexShader:   document.getElementById( 'vertexshader' ).textContent,
                fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

                //blending:       THREE.AdditiveBlending,
                depthTest:      false,
                transparent:    true,
                sizeAttenuation: false,
                vertexColors: THREE.VertexColors
            });

            var trips = d3.values(_data);
            _vehicles.coordinates = new Float32Array( (trips.length * _trailLength) * 3 );
            _vehicles.colors = new Float32Array( (trips.length * _trailLength) * 3 );
            _vehicles.sizes = new Float32Array( (trips.length * _trailLength) );
            _vehicles.opacities = new Float32Array( (trips.length * _trailLength) );

            _geometry = new THREE.BufferGeometry();
            _geometry.addAttribute( 'position', new THREE.BufferAttribute( _vehicles.coordinates, 3 ) );
            _geometry.addAttribute( 'customColor', new THREE.BufferAttribute( _vehicles.colors, 3 ) );
            _geometry.addAttribute( 'size', new THREE.BufferAttribute( _vehicles.sizes, 1 ) );
            _geometry.addAttribute( 'vertexOpacity', new THREE.BufferAttribute( _vehicles.opacities, 1 ) );

            _particleSystem = new THREE.PointCloud( _geometry, _shaderMaterial );
            _scene = new THREE.Scene();
            _scene.add( _particleSystem );


            // Handling bus id text
            self.getView().getRenderer().autoClear = false;
            _vehiclesLabelGroup = new THREE.Group();
            _vehiclesLabelGroup.position.z = 2;
            _textScene = new THREE.Scene();
            _textScene.add(_vehiclesLabelGroup);

            // Handling Location
            _locationGeometryBuffer = new THREE.BufferGeometry();
            var buffer = new Float32Array(_circlesNumber * 3);
            _locationGeometryBuffer.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
            buffer = new Float32Array(_circlesNumber * 3);
            _locationGeometryBuffer.addAttribute('customColor', new THREE.BufferAttribute(buffer, 3));
            buffer = new Float32Array(_circlesNumber);
            _locationGeometryBuffer.addAttribute('size', new THREE.BufferAttribute(buffer, 1));
            buffer = new Float32Array(_circlesNumber);
            _locationGeometryBuffer.addAttribute('vertexOpacity', new THREE.BufferAttribute(buffer, 1));
            var locationParticles = new THREE.PointCloud( _locationGeometryBuffer, _shaderMaterial );
            _locationScene = new THREE.Scene();
            _locationScene.add(locationParticles);

            var location = self.project(41.869654, -87.648537);
            var locationPosition = _locationGeometryBuffer.attributes.position.array;
            var locationColor = _locationGeometryBuffer.attributes.customColor.array;
            var locationSize = _locationGeometryBuffer.attributes.size.array;
            var locationOpacity = _locationGeometryBuffer.attributes.vertexOpacity.array;

            var tmpColor = new THREE.Color();
            tmpColor.setStyle("#3498db");
            for(var i = 0; i < _circlesNumber; i++) {
                locationPosition[i * 3] = location.x;
                locationPosition[i * 3 +1] = location.y;
                locationPosition[i * 3 +2] = 1;

                locationColor[i * 3] = tmpColor.r;
                locationColor[i * 3 +1] = tmpColor.g;
                locationColor[i * 3 +2] = tmpColor.b;

                locationOpacity[i] = (1 / _circlesNumber) * i;
                locationSize[i] = (_circlesOpacities.max - locationOpacity[i]) * 100 + _circleSizes.min;
            }

            // Handling connections
            _connectionsGeometryBuffer = new THREE.BufferGeometry();

            var connectionsNumber = d3.sum(d3.values(_data), function(d) {
                return d3.sum(d["stops"], function(stop) {
                    return stop["transfers"] != undefined ? stop["transfers"].length : 0;
                });
            });

            buffer = new Float32Array(connectionsNumber * 3);
            _connectionsGeometryBuffer.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
            buffer = new Float32Array(connectionsNumber * 3);
            _connectionsGeometryBuffer.addAttribute('customColor', new THREE.BufferAttribute(buffer, 3));
            buffer = new Float32Array(connectionsNumber);
            _connectionsGeometryBuffer.addAttribute('size', new THREE.BufferAttribute(buffer, 1));
            buffer = new Float32Array(connectionsNumber);
            _connectionsGeometryBuffer.addAttribute('vertexOpacity', new THREE.BufferAttribute(buffer, 1));
            var connectionsParticles = new THREE.PointCloud( _connectionsGeometryBuffer, _shaderMaterial );
            _connectionsScene = new THREE.Scene();
            _connectionsScene.add(connectionsParticles);

            var connectionSize = _connectionsGeometryBuffer.attributes.size.array;
            var connectionPosition = _connectionsGeometryBuffer.attributes.position.array;
            var connectionColor = _connectionsGeometryBuffer.attributes.customColor.array;
            var connectionOpacity = _connectionsGeometryBuffer.attributes.vertexOpacity.array;

            for(i = 0; i < connectionSize.length; i++) {
                connectionSize[i] = 0;
                connectionOpacity[i] = 0;
            }

            d3.timer(function() {
                update();
                draw();
            });
        });
    };


    /*------------------ PRIVATE METHODS -----------------*/
    var update = function() {
        var i;
        var size = _geometry.attributes.size.array;
        var position = _geometry.attributes.position.array;
        var color = _geometry.attributes.customColor.array;
        var opacity = _geometry.attributes.vertexOpacity.array;

        // Update animation time
        _animationTime += _animationIncrement;
        if(_animationTime >= _animationEndTime) {
            _animationTime = Utils.toSeconds(12, 15, 0);//Utils.nowToSeconds();
            _animationEndTime = _animationTime + Utils.toSeconds(1, 0, 0);

            i = 0;
            for(; i < _vehicles.sizes.length; i++) {
                size[i] = 0;
                opacity[i] = 1;
            }
        } else {
            /*Update previous vertices*/
            i = 0;
            for(; i < _vehicles.sizes.length; i++) {
                if(size[i] == _headSize) {
                    size[i] = _maxTrailSize;
                } else if(size[i] > _minTrailSize) {
                    size[i] = size[i] - _decrementPerFrame;
                } else {
                    size[i] = 0;
                    opacity[i] = 1;
                }
                opacity[i] = opacity[i] > _minOpacity ? opacity[i] - _deltaOpacity : _minOpacity;
            }
        }

        /*Add new vertices*/
        var tColor = new THREE.Color();

        for(var tripId in _data) {
            var vehicleData = _data[tripId];

            // Compute vehicle last stop
            var previousStopIndex = getLastStopIndex(_animationTime, vehicleData["stops"]);

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
                var delta = (_animationTime - previous) / (next - previous);
                var lat = d3.interpolateNumber(
                    parseFloat(vehicleData["stops"][previousStopIndex]["lat"]),
                    parseFloat(vehicleData["stops"][previousStopIndex +1]["lat"])
                )(delta);
                var lon = d3.interpolateNumber(
                    parseFloat(vehicleData["stops"][previousStopIndex]["lon"]),
                    parseFloat(vehicleData["stops"][previousStopIndex +1]["lon"])
                )(delta);

                var projection = self.project(lat, lon);

                i = 0;
                while(i < size.length && size[i] > 0) {
                    i++;
                }

                position[i * 3] = projection.x;
                position[i * 3 +1] = projection.y;
                position[i * 3 +2] = 1;

                if(vehicleData["hop"] == 0) {
                    tColor.setStyle("#3182bd");
                } else {
                    tColor.setStyle("#95a5a6");
                }
                color[i * 3] = tColor.r;
                color[i * 3 +1] = tColor.g;
                color[i * 3 +2] = tColor.b;

                // Add text
                tColor.setStyle("#fff");

                if(_vehiclesLabels[tripId] == undefined) {
                    _vehiclesLabels[tripId] = getLabelMesh(vehicleData["routeId"], tColor);
                    _vehiclesLabelGroup.add(_vehiclesLabels[tripId]);
                }
                positionTextMesh(_vehiclesLabels[tripId], projection.x, projection.y);

                size[i] = _headSize;

                // Handle connections
                var connectionSize = _connectionsGeometryBuffer.attributes.size.array;
                var connectionPosition = _connectionsGeometryBuffer.attributes.position.array;
                var connectionColor = _connectionsGeometryBuffer.attributes.customColor.array;
                var connectionOpacity = _connectionsGeometryBuffer.attributes.vertexOpacity.array;

                // Update CONNECTIONS signals
                var currentConnectionVisibilityIndex = _connectionsVisibility[tripId];
                currentConnectionVisibilityIndex =
                    currentConnectionVisibilityIndex != undefined ?
                        currentConnectionVisibilityIndex[vehicleData["stops"][previousStopIndex]["stopId"]] : undefined;
                if(currentConnectionVisibilityIndex != undefined) {
                    connectionOpacity[currentConnectionVisibilityIndex] -= _connectionsOpacity.delta;
                    _connectionsVisibility[tripId][vehicleData["stops"][previousStopIndex]["stopId"]] = undefined;
                }

                for(i = 0; i < connectionOpacity.length; i++) {
                    if(connectionOpacity[i] < 0) {
                        connectionOpacity[i] = 0;
                        connectionSize[i] = 0;
                    } else if(connectionOpacity[i] > 0 && connectionOpacity[i] < _connectionsOpacity.max) {
                        connectionOpacity[i] -= _connectionsOpacity.delta;
                        connectionSize[i] = connectionOpacity[i] * _connectionsSizeOpacityRatio;
                    }
                }

                i = 0;
                var transfers = vehicleData["stops"][previousStopIndex]["transfers"];
                if(_animationTime < (previous + _animationIncrement) && transfers != undefined && transfers.length > 0) {
                    transfers.forEach(function(transferId) {
                        while(i < connectionSize.length && connectionSize[i] > 0) {
                            i++;
                        }

                        if(_connectionsVisibility[transferId] == undefined) {
                            _connectionsVisibility[transferId] = {};
                        }
                        _connectionsVisibility[transferId][vehicleData["stops"][previousStopIndex]["stopId"]] = i;

                        connectionPosition[i * 3] = projection.x;
                        connectionPosition[i * 3 +1] = projection.y;
                        connectionPosition[i * 3 +2] = 1;

                        tColor.setStyle("#e74c3c");
                        connectionColor[i * 3] = tColor.r;
                        connectionColor[i * 3 +1] = tColor.g;
                        connectionColor[i * 3 +2] = tColor.b;

                        connectionOpacity[i] = _connectionsOpacity.max;
                        connectionSize[i] = connectionOpacity[i] * _connectionsSizeOpacityRatio;
                    });
                }

            } else if(_vehiclesLabels[tripId] != undefined) {
                _vehiclesLabelGroup.remove(_vehiclesLabels[tripId]);
                _vehiclesLabels[tripId] = undefined;
            }
        }

        // Update location animation
        var locationSize = _locationGeometryBuffer.attributes.size.array;
        var locationOpacity = _locationGeometryBuffer.attributes.vertexOpacity.array;

        for(i = 0; i < _circlesNumber; i++) {
            if(locationOpacity[i] < _circlesOpacities.max) {
                locationOpacity[i] += _locationAnimationIncrement;
            } else {
                locationOpacity[i] = _circlesOpacities.min;
            }
            locationSize[i] = (_circlesOpacities.max - locationOpacity[i]) * 100 + _circleSizes.min;
        }
    };

    var draw = function() {
        _geometry.attributes.position.needsUpdate = true;
        _geometry.attributes.size.needsUpdate = true;
        _geometry.attributes.customColor.needsUpdate = true;
        _geometry.attributes.vertexOpacity.needsUpdate = true;

        _locationGeometryBuffer.attributes.position.needsUpdate = true;
        _locationGeometryBuffer.attributes.size.needsUpdate = true;
        _locationGeometryBuffer.attributes.customColor.needsUpdate = true;
        _locationGeometryBuffer.attributes.vertexOpacity.needsUpdate = true;

        _connectionsGeometryBuffer.attributes.position.needsUpdate = true;
        _connectionsGeometryBuffer.attributes.size.needsUpdate = true;
        _connectionsGeometryBuffer.attributes.customColor.needsUpdate = true;
        _connectionsGeometryBuffer.attributes.vertexOpacity.needsUpdate = true;

        _geometry.computeBoundingSphere();
        self.getView().getRenderer().clearColor();
        self.getView().render(_locationScene);
        self.getView().render(_connectionsScene);
        self.getView().render(_scene);
        self.getView().render(_textScene);
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

    function getLabelMesh(text, color) {
        var textGeometry = new THREE.TextGeometry(text, {
            font: 'helvetiker',
            //weight: "regular",
            style: "normal",
            size: 7
        });
        //shape.computeBoundingBox();
        //var centerOffset = -0.5 * ( shape.boundingBox.max.x - shape.boundingBox.min.x );

        var material = new THREE.MeshBasicMaterial({color: color});
        var mesh = new THREE.Mesh(textGeometry, material);

        //var projection = self.project(41.876795, -87.710610);

        //words.position.x = projection.x;
        //words.position.y = projection.y;
        mesh.rotation.x = Math.PI;

        return mesh;
    }

    function positionTextMesh(mesh, x, y) {
        var textGeometry = mesh.geometry;
        textGeometry.computeBoundingBox();
        var deltaX = -0.5 * ( textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x );
        var deltaY = 0.5 * ( textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y );
        mesh.position.x = x + deltaX -1.5;
        mesh.position.y = y + deltaY;
    }

    var init = function () {

    }();
}

Utils.extend(UITransitViewController, UIMapCanvasViewController);