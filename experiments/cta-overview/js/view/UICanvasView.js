/**
 * @class UICanvasView
 * @description
 *
 * @author Massimo De Marchi
 * @created 2/11/15.
 */
function UICanvasView() {
    var _renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        //precision: "highp",
        premultipliedAlpha: false
    });
    UIView.call(this, _renderer.domElement);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _devicePixelRatio = (window.devicePixelRatio) ? window.devicePixelRatio : 1;

    var _camera;
    var _delegate;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     *
     * @returns {THREE.WebGLRenderer}
     */
    this.getRenderer = function() {
        return _renderer;
    };

    /**
     *
     * @param camera
     */
    this.setCamera = function(camera) {
        _camera = camera;
    };

    /**
     *
     * @returns {*}
     */
    this.getCamera = function() {
        return _camera;
    };

    /**
     *
     * @param width
     * @param height
     */
    this.setRendererSize = function(width, height) {
        _renderer.setSize( width, height);
        self.getD3Layer()
            .style("position", "absolute")
            //.style("z-index", "2")
            .style("overflow", "hidden")
            .style("width", width + "px")
            .style("height", height + "px");
        _camera = new THREE.OrthographicCamera( 0, width, 0, height, 0.1, 1000 );
    };

    /**
     *
     * @returns {number}
     */
    this.getDevicePixelRatio = function() {
        return _devicePixelRatio;
    };

    /**
     *
     * @param scene
     */
    this.render = function(scene) {
        _renderer.render(scene, _camera);
    };

    this.startRendering = function(callback) {
        function render() {
            requestAnimationFrame( render );
            callback();
        }
        render();
    };


    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        _renderer.setPixelRatio(_devicePixelRatio);
    }();
}

Utils.extend(UICanvasView, UIView);