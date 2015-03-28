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
                center: [41.876795, -87.680610],
                zoom: 11.5//10.5
            });

            self.getModel().getMapModel().setMap(map);

            // Set location
            //__model.getLocationModel().setLocation(41.869654, -87.648537);
            __model.getLocationModel().setLocation(41.894591, -87.624161);

            //_canvas = new UIBusCanvasViewController();
            //_canvas = new UITransitViewController();
            //self.add(_canvas);

            _director = new DirectorViewController();

            var layer;

            layer = new UserLocationSceneController();
            _director.addScene(layer, 0, "location");

            layer = new PathSceneController();
            _director.addScene(layer, 6, "paths");

            layer = new VehiclesStopsSceneController();
            _director.addScene(layer, 9, "stops");

            layer = new TransfersSceneController();
            _director.addScene(layer, 12, "transfers");

            layer = new VehiclesSceneController();
            _director.addScene(layer, 15, "vehicles");

            layer = new VehiclesLabelSceneController();
            _director.addScene(layer, 18, "vehiclesLabels");

            /*

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
            _director.addScene(layer, 15, "vehiclesLabels");*/

            // Start cta model updates
            __model.getCTAModel().startUpdates();

            var forwardSpeedFunction = Utils.scale.exponential();//d3.scale.pow();
            forwardSpeedFunction.exponent(2);
            forwardSpeedFunction.range([0.1, 4]);

            var backwardSpeedFunction = Utils.scale.exponential();//d3.scale.pow();
            backwardSpeedFunction.exponent(2);
            backwardSpeedFunction.range([2, 5.5]);

            self.add(_director);
            _director.getView().getCamera().position.z = 5;


            _director.play(function() {
                switch (__model.getAnimationModel().getState()) {
                    case AnimationState.START:
                        var currentTime = Utils.nowToSeconds();
                        var duration = Utils.toSeconds(1, 0, 0);

                        __model.getAnimationModel().setTimeDrivenAnimation(currentTime, duration);

                        forwardSpeedFunction.domain([currentTime, currentTime + duration]);
                        backwardSpeedFunction.domain([currentTime, currentTime + duration]);

                        __model.getAnimationModel().step(forwardSpeedFunction(__model.getAnimationModel().getTime()));
                        break;
                    case AnimationState.RUNNING:
                        __model.getAnimationModel().step(forwardSpeedFunction(__model.getAnimationModel().getTime()));
                        break;
                    case AnimationState.RUNNING_BACK:
                        currentTime = Utils.nowToSeconds();
                        if(__model.getAnimationModel().getTime() <= currentTime) {
                            duration = Utils.toSeconds(1, 0, 0);
                            __model.getAnimationModel().setTimeDrivenAnimation(currentTime, duration);

                            forwardSpeedFunction.domain([currentTime, currentTime + duration]);
                            backwardSpeedFunction.domain([currentTime, currentTime + duration]);

                            __model.getAnimationModel().step(forwardSpeedFunction(__model.getAnimationModel().getTime()));
                        } else {
                            __model.getAnimationModel().stepBack(backwardSpeedFunction(__model.getAnimationModel().getTime()));
                        }
                        break;
                    case AnimationState.END:
                        __model.getAnimationModel().stepBack(backwardSpeedFunction(__model.getAnimationModel().getTime()));
                        break;
                }
                return false;
            });


            // Add side bar
            /*
            var sideController = new UISideInfoBarViewController();
            var map = __model.getMapModel().getMap();
            var size = {
                width: 300,
                height: map.canvas.canvas.height
            };
            sideController.getView().getD3Layer().style("position", "absolute");
            sideController.getView().getD3Layer().style("top", "0px");
            sideController.getView().getD3Layer().style("right", "0px");
            sideController.getView().getD3Layer().style("height", size.height + "px");
            sideController.getView().getD3Layer().style("width", size.width + "px");
            sideController.getView().setViewBox(0, 0, size.width, size.height);
            self.add(sideController);*/


            // Add animation time view controller
            var animationTimeVC = new UIAnimationTimeViewController();
            animationTimeVC.getView().getD3Layer().style("position", "absolute");
            animationTimeVC.getView().getD3Layer().style("bottom", "0px");
            animationTimeVC.getView().getD3Layer().style("left", "0px");
            self.add(animationTimeVC);
        });


    }();
}

Utils.extend(UIMapViewController, UIViewController);
































