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

    var _director;
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
                center: [41.876795, -87.710610],
                zoom: 11.5//10.5
            });

            self.getModel().getMapModel().setMap(map);

            //_canvas = new UIBusCanvasViewController();
            //_canvas = new UITransitViewController();
            //self.add(_canvas);

            _director = new DirectorViewController();

            var layer;


            layer = new UserLocationSceneController();
            _director.addScene(layer, 0, "location");

            layer = new TrailsSceneController();
            _director.addScene(layer, 6, "trails");


            layer = new BusNumbersSceneController();
            _director.addScene(layer, 9, "numbers");

            layer = new StopsSceneController();
            _director.addScene(layer, 7, "stops");

            layer = new ConnectionsSceneController();
            _director.addScene(layer, 3, "connections");

            layer = new VehiclesPositionSceneController();
            _director.addScene(layer, 12, "vehiclesPositions");

            layer = new VehiclesLabelSceneController();
            _director.addScene(layer, 15, "vehiclesLabels");

            // Start cta model updates
            __model.getCTAModel().startUpdates();

            self.add(_director);
            _director.getView().getCamera().position.z = 5;
            __model.getAnimationModel()
                .setTimeDrivenAnimation(Utils.nowToSeconds(), Utils.toSeconds(1, 0, 0), 5);

            _director.play(function() {
                __model.getAnimationModel().step();
                if(__model.getAnimationModel().getState() == AnimationState.END) {
                    __model.getAnimationModel()
                        .setTimeDrivenAnimation(Utils.nowToSeconds(), Utils.toSeconds(1, 0, 0), 5);
                }
                return false;
            })
        });


    }();
}

Utils.extend(UIMapViewController, UIViewController);
































