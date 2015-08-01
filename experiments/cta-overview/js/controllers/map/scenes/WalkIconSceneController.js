/**
 * @class WalkIconSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 7/22/15.
 */
function WalkIconSceneController() {
    SceneController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    // WebGL variables
    var _geometryBuffer;


    // UI
    var _iconSize = 23 * window.devicePixelRatio;

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

        var start = __model.getAnimationModel().getStartTime();
        var end = __model.getAnimationModel().getEndTime();

        var distance = d3.scale.linear().domain([start, end]).range([-20, 230]);

        // Location
        sizes[0] = _iconSize;

        color.setStyle("#999");//"#4393c3");
        colors[0] = color.r;
        colors[1] = color.g;
        colors[2] = color.b;

        positions[0] = projection.x;
        positions[1] = projection.y - distance(time);
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
            texture:   { type: "t", value: Utils.gl.walkIconTexture() }
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

Utils.extend(WalkIconSceneController, SceneController);