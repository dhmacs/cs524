/**
 * @class UIMapCanvasViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 1/24/15.
 */
function UIMapSVGViewController() {
    UIViewController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _bounds = {
        north: 43,
        east: -86,
        west: -89,
        south: 41
    };

    var _canvasFrame = {};

    /*------------------ PUBLIC METHODS ------------------*/

    /**
     * @override
     */
    var super_viewDidAppear = self.viewDidAppear;
    this.viewDidAppear = function() {
        var map = self.getModel().getMapModel().getMap();


        _canvasFrame.x = map.project([_bounds.north, _bounds.west]).x;
        _canvasFrame.y = map.project([_bounds.north, _bounds.west]).y;
        _canvasFrame.width = map.project([_bounds.south, _bounds.east]).x - _canvasFrame.x;
        _canvasFrame.height = map.project([_bounds.south, _bounds.east]).y - _canvasFrame.y;


        self.getView().setViewBox(0, 0, _canvasFrame.width, _canvasFrame.height);
        self.getView().getD3Layer().style("position", "absolute");
        self.getView().getD3Layer().style("left", _canvasFrame.x);
        self.getView().getD3Layer().style("top", _canvasFrame.y);
        self.getView().getD3Layer().style("width", _canvasFrame.width);
        self.getView().getD3Layer().style("height", _canvasFrame.height);

        map.on("move", function(e) {
            var _canvasFrame = {};
            var map = self.getModel().getMapModel().getMap();

            _canvasFrame.x = map.project([_bounds.north, _bounds.west]).x;
            _canvasFrame.y = map.project([_bounds.north, _bounds.west]).y;
            _canvasFrame.width = map.project([_bounds.south, _bounds.east]).x - _canvasFrame.x;
            _canvasFrame.height = map.project([_bounds.south, _bounds.east]).y - _canvasFrame.y;
            self.getView().getD3Layer().style("left", _canvasFrame.x);
            self.getView().getD3Layer().style("top", _canvasFrame.y);
            self.getView().getD3Layer().style("width", _canvasFrame.width);
            self.getView().getD3Layer().style("height", _canvasFrame.height);

            //self.getView().setViewBox(0, 0, _canvasFrame.width, _canvasFrame.height);
        });

        // Call super
        super_viewDidAppear.call(self);
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
            x: map.project([lat, lng]).x  - _canvasFrame.x,
            y: map.project([lat, lng]).y  - _canvasFrame.y
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
        self.getView().addClass("ui-map-svg-view-controller");
    }();
}

Utils.extend(UIMapSVGViewController, UIViewController);