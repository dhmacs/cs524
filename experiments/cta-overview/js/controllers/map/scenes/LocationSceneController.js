/**
 * @class LocationSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 4/3/15.
 */
function LocationSceneController() {
    SceneController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    // WebGL variables
    var _geometryBuffer;


    // UI
    var _locationSize = 5 * window.devicePixelRatio;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * @override
     * Update the model of the scene
     */
    this.update = function() {
        computeScene(__model.getAnimationModel().getTime());

        _geometryBuffer.attributes.position.needsUpdate = true;
        _geometryBuffer.attributes.customColor.needsUpdate = true;
        _geometryBuffer.attributes.size.needsUpdate = true;
        _geometryBuffer.attributes.vertexOpacity.needsUpdate = true;
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var computeScene = function(time) {
        var positions = _geometryBuffer.attributes.position.array;
        var colors = _geometryBuffer.attributes.customColor.array;
        var opacities = _geometryBuffer.attributes.vertexOpacity.array;
        var sizes = _geometryBuffer.attributes.size.array;

        var color = new THREE.Color();
        var location = __model.getWayFindingModel().getOriginLocation();
        var projection = __model.getMapModel().project(location.lat, location.lon);

        // Location
        sizes[0] = _locationSize;

        color.setStyle("#4393c3");
        colors[0] = color.r;
        colors[1] = color.g;
        colors[2] = color.b;

        positions[0] = projection.x;
        positions[1] = projection.y;
        positions[2] = 1;

        opacities[0] = 1.0;
    };

    var init = function () {
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

        var points = 1;
        _geometryBuffer = new THREE.BufferGeometry();
        var buffer = new Float32Array(points * 3);
        _geometryBuffer.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(points * 3);
        _geometryBuffer.addAttribute('customColor', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(points);
        _geometryBuffer.addAttribute('size', new THREE.BufferAttribute(buffer, 1));
        buffer = new Float32Array(points);
        _geometryBuffer.addAttribute('vertexOpacity', new THREE.BufferAttribute(buffer, 1));

        var mesh = new THREE.PointCloud( _geometryBuffer, shaderMaterial );
        self.getScene().add(mesh);
    }();
}

Utils.extend(LocationSceneController, SceneController);