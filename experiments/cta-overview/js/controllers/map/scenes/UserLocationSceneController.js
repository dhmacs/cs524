/**
 * @class UserLocationSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/9/15.
 */
function UserLocationSceneController() {
    SceneController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _geometryBuffer;

    var _circlesNumber = 3;

    var _circlesOpacities = {
        max: 1.0,
        min: 0
    };

    var _circleSizes = {
        max: 80,
        min: 20
    };

    var _locationAnimationIncrement = 0.005;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * @override
     * Update the model of the scene
     */
    this.update = function() {
        // Update location animation
        var locationSize = _geometryBuffer.attributes.size.array;
        var locationOpacity = _geometryBuffer.attributes.vertexOpacity.array;

        for(var i = 0; i < _circlesNumber; i++) {
            if(locationOpacity[i] < _circlesOpacities.max) {
                locationOpacity[i] += _locationAnimationIncrement;
            } else {
                locationOpacity[i] = _circlesOpacities.min;
            }
            locationSize[i] = (_circlesOpacities.max - locationOpacity[i]) * 100 + _circleSizes.min;
        }

        _geometryBuffer.attributes.position.needsUpdate = true;
        _geometryBuffer.attributes.size.needsUpdate = true;
        _geometryBuffer.attributes.customColor.needsUpdate = true;
        _geometryBuffer.attributes.vertexOpacity.needsUpdate = true;
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
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

        // Handling Location
        _geometryBuffer = new THREE.BufferGeometry();
        var buffer = new Float32Array(_circlesNumber * 3);
        _geometryBuffer.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(_circlesNumber * 3);
        _geometryBuffer.addAttribute('customColor', new THREE.BufferAttribute(buffer, 3));
        buffer = new Float32Array(_circlesNumber);
        _geometryBuffer.addAttribute('size', new THREE.BufferAttribute(buffer, 1));
        buffer = new Float32Array(_circlesNumber);
        _geometryBuffer.addAttribute('vertexOpacity', new THREE.BufferAttribute(buffer, 1));
        var locationParticles = new THREE.PointCloud( _geometryBuffer, shaderMaterial );
        self.getScene().add(locationParticles);

        var location = MODEL.getMapModel().project(41.869654, -87.648537);
        var locationPosition = _geometryBuffer.attributes.position.array;
        var locationColor = _geometryBuffer.attributes.customColor.array;
        var locationSize = _geometryBuffer.attributes.size.array;
        var locationOpacity = _geometryBuffer.attributes.vertexOpacity.array;

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
    }();
}

Utils.extend(UserLocationSceneController, SceneController);