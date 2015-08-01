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

        /*'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v6.json'*/
        mapboxgl.util.getJSON('https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v7.json', function (err, style) {
            if (err) throw err;

            // Set location
            //__model.getLocationModel().setLocation(41.869654, -87.648537);
            //__model.getLocationModel().setLocation(41.894591, -87.624161);


            // Set wayfinding parameters
            // UIC 41.869904, -87.647522
            // Navy 41.891604, -87.609666
            // Magnificent Mile 41.892482, -87.624215
            __model.getWayFindingModel().setOriginLocation(41.869904, -87.647522);
            __model.getWayFindingModel().setNearbyMaximumRadius(400);
            __model.getWayFindingModel().setMaximumWaitingTime(Utils.toSeconds(0, 15, 0));
            __model.getWayFindingModel().setLookAheadTime(Utils.toSeconds(1, 0, 0));
            __model.getWayFindingModel().setWalkingSpeed(1.38); // Average human walking speed
            __model.getWayFindingModel().setMaximumTransferWalkingTime(Utils.toSeconds(0, 10, 0));

            var zoom = {
                min: 12.0,
                max: 13
            };
            var map = new mapboxgl.Map({
                container: 'map',
                style: style,
                center: [__model.getWayFindingModel().getOriginLocation().lat, __model.getWayFindingModel().getOriginLocation().lon],
                zoom: zoom.max//11.5//10.5
            });

            self.getModel().getMapModel().setMap(map);



            //_canvas = new UIBusCanvasViewController();
            //_canvas = new UITransitViewController();
            //self.add(_canvas);

            _director = new DirectorViewController();

            var layer;

            layer = new WalkingWaveSceneController();
            _director.addScene(layer, 0, "walk");

            layer = new WalkIconSceneController();
            _director.addScene(layer, 1, "walkIcon");

            layer = new WalkTimeSceneController();
            _director.addScene(layer, 3, "walkTime");

            layer = new LocationSceneController();
            _director.addScene(layer, 3, "location");

            layer = new PathSceneController();
            _director.addScene(layer, 6, "paths");

            layer = new VehiclesStopsSceneController();
            _director.addScene(layer, 9, "stops");

            /*
            layer = new TransfersSceneController();
            _director.addScene(layer, 12, "transfers");*/

            layer = new VehiclesSceneController();
            _director.addScene(layer, 15, "vehicles");

            layer = new VehiclesLabelSceneController();
            _director.addScene(layer, 18, "vehiclesLabels");


            // Start cta model updates
            __model.getCTAModel().startUpdates();

            var forwardSpeedFunction = Utils.scale.exponential();//.sin();//d3.scale.pow();
            forwardSpeedFunction.exponent(4);
            forwardSpeedFunction.smoothness(1/10);
            forwardSpeedFunction.range([0.2, 4]);

            var backwardSpeedFunction = d3.scale.linear();//Utils.scale.exponential();//.sin();//d3.scale.pow();
            //backwardSpeedFunction.smoothness(1/5);
            //backwardSpeedFunction.exponent(4);
            backwardSpeedFunction.range([3, 6]);


            var zoomFunction = Utils.scale.sin();
            //zoomFunction.exponent(6);
            //zoomFunction.smoothness(100);
            zoomFunction.range([12.6, 11.7]);

            var mapCenterFunction = Utils.scale.sin();
            mapCenterFunction.range([0, 1]);

            var easingRatio = 1;

            self.add(_director);
            _director.getView().getCamera().position.z = 5;

            var animatingView = false;

            _director.play(function() {
                var animationTime;// = __model.getAnimationModel().getTime();
                var now = __model.getWayFindingModel().getDepartureTime();
                var duration, bounds;

                var handle = {
                    first: Utils.toSeconds(0, 10, 0),
                    second: Utils.toSeconds(0, 30, 0)
                };

                var location = __model.getWayFindingModel().getOriginLocation();

                if(__model.getCTAModel().getTrips() != null) {
                    switch (__model.getAnimationModel().getState()) {
                        case AnimationState.START:
                            animatingView = false;
                            duration = __model.getWayFindingModel().getLookAheadTime();
                            __model.getAnimationModel().setTimeDrivenAnimation(now, duration);

                            // Set domains
                            forwardSpeedFunction.domain([now, now + (duration * easingRatio)]);
                            backwardSpeedFunction.domain([now, now + (duration * easingRatio)]);
                            zoomFunction.domain([now, now + duration * easingRatio]);
                            mapCenterFunction.domain([now, now + (duration) * easingRatio]);

                            __model.getAnimationModel().step(forwardSpeedFunction(__model.getAnimationModel().getTime()));
                            break;
                        case AnimationState.RUNNING:
                            animationTime = __model.getAnimationModel().getTime();

                            if(__model.getAnimationModel().getElapsedTime() > handle.first && !animatingView) {

                                var centroid = __model.getCTAModel().getCentroid();
                                __model.getMapModel().getMap()
                                    .easeTo(new mapboxgl.LatLng(centroid.lat, centroid.lon), zoom.min, undefined, {
                                        duration: 10000
                                    });
                                animatingView = true;
                            }

                            // Step forward
                            __model.getAnimationModel().step(forwardSpeedFunction(animationTime));
                            break;
                        case AnimationState.RUNNING_BACK:
                            if(__model.getAnimationModel().getTime() <= now) {
                                animatingView = false;
                                duration = __model.getWayFindingModel().getLookAheadTime();
                                __model.getAnimationModel().setTimeDrivenAnimation(now, duration);

                                // Set domains
                                forwardSpeedFunction.domain([now, now + (duration * easingRatio)]);
                                backwardSpeedFunction.domain([now, now + (duration * easingRatio)]);
                                zoomFunction.domain([now, now + duration * easingRatio]);
                                mapCenterFunction.domain([now, now + (duration) * easingRatio]);

                                animationTime = __model.getAnimationModel().getTime();
                            } else {
                                animationTime = __model.getAnimationModel().getTime();

                                if(__model.getAnimationModel().getElapsedTime() < handle.second && !animatingView) {
                                    __model.getMapModel().getMap()
                                        .easeTo(new mapboxgl.LatLng(location.lat, location.lon), zoom.max, undefined, {
                                            duration: 10500
                                        });
                                    animatingView = true;
                                }
                                __model.getAnimationModel().stepBack(backwardSpeedFunction(animationTime));
                            }

                            break;
                        case AnimationState.END:
                            animatingView = false;
                            animationTime = __model.getAnimationModel().getTime();
                            __model.getAnimationModel().stepBack(backwardSpeedFunction(animationTime));
                            break;
                    }
                }

                return false;
            });


            // Add animation time view controller
            /*
            var animationTimeVC = new UIAnimationTimeViewController();
            animationTimeVC.getView().getD3Layer().style("position", "absolute");
            animationTimeVC.getView().getD3Layer().style("bottom", "0px");
            animationTimeVC.getView().getD3Layer().style("left", "0px");
            self.add(animationTimeVC);*/
        });


    }();
}

Utils.extend(UIMapViewController, UIViewController);
































