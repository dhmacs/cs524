/**
 * @class UIMapViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 1/24/15.
 */
function UIMapViewController() {
    UIViewController.call(this, new UIView(document.createElement('div')));

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _canvas;
    /*------------------ PUBLIC METHODS ------------------*/



    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        self.getView().addClass("ui-map-view-controller");
        self.getView().setId("map");
        self.getView().getD3Layer().style("overflow", "hidden");
        self.getView().setInteraction(true);

        mapboxgl.accessToken = 'pk.eyJ1IjoibWFjczkxIiwiYSI6Ik9JM050anMifQ.F7_I4Vj2A3EyBEynwIcr0w';

        mapboxgl.util.getJSON('https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v6.json', function (err, style) {
            if (err) throw err;

            var map = new mapboxgl.Map({
                container: 'map',
                style: style,
                center: [41.876795, -87.731782],
                zoom: 10.5
            });

            self.getModel().getMapModel().setMap(map);

            _canvas = new UIBusCanvasViewController();
            self.add(_canvas);
        });
    }();
}

Utils.extend(UIMapViewController, UIViewController);