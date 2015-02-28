/**
 * @class UIMapCanvasViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 1/24/15.
 */
function UIMapCanvasViewController() {
    UIViewController.call(this, new UICanvasView());

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _bounds = {
        north: 43,
        east: -86,
        west: -89,
        south: 41
    };

    var _canvasFrame = {};

    var _delegate = null;

    /*------------------ PUBLIC METHODS ------------------*/

    /**
     *
     * @param delegate
     */
    this.setDelegate = function(delegate) {
        _delegate = delegate;
    };

    /**
     *
     * @returns {*}
     */
    this.getDelegate = function() {
        return _delegate;
    };

    /**
     * @override
     */
    var super_viewDidAppear = self.viewDidAppear;
    this.viewDidAppear = function() {
        var map = self.getModel().getMapModel().getMap();

        var canvas = d3.select(map.canvas.canvas);
        var size = {
            width: parseFloat(canvas.style("width")),
            height: parseFloat(canvas.style("height"))
        };

        self.getView().setRendererSize(size.width, size.height);

        map.on("move", function(e) {
            /*
            if(_delegate != null && typeof _delegate.mapDidMove == "function") {
                _delegate.mapDidMove();
            }*/
            self.onMapMove();
        });

        // Call super
        super_viewDidAppear.call(self);
    };

    this.onMapMove = function() {
        console.log("UIMapCanvasViewController.move");
    };

    /**
     *
     * @param lat
     * @param lng
     * @returns {{x: number, y: number}}
     */
    this.project = function(lat, lng) {
        var map = self.getModel().getMapModel().getMap();
        return {
            x: (map.project([lat, lng]).x),
            y: (map.project([lat, lng]).y)
        };
    };

    /**
     *
     * @param north
     * @param east
     * @param west
     * @param south
     */
    this.setBounds = function(north, east, west, south) {
        _bounds.north = north;
        _bounds.east = east;
        _bounds.west = west;
        _bounds.south = south;
    };

    /**
     *
     * @returns {{north: number, east: number, west: number, south: number}}
     */
    this.getBounds = function() {
        return _bounds;
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        self.getView().addClass("ui-map-canvas-view-controller");
    }();
}

Utils.extend(UIMapCanvasViewController, UIViewController);