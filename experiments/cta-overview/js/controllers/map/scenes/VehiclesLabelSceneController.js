/**
 * @class VehiclesLabelSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/10/15.
 */
function VehiclesLabelSceneController() {
    SceneController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _allTrips = null;
    var _trips = null;
    var _needUpdate = false;

    // Text
    var _vehiclesLabelGroup = null;
    var _vehiclesLabels = {};

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * Update the model of the scene
     */
    this.update = function() {
        if(_trips != null) {

            if(__model.getAnimationModel().getState() == AnimationState.START && _needUpdate) {
                _allTrips = __model.getCTAModel().getTrips();
                _vehiclesLabels = {};
                updateAnimation();
                _needUpdate = false;
            } else {

            }
            computeScene(__model.getAnimationModel().getTime());
        } else if(_needUpdate) {
            _allTrips = __model.getCTAModel().getTrips();
            _vehiclesLabels = {};
            updateAnimation();
            _needUpdate = false;
        }
    };

    this.dataUpdated = function() {
        _needUpdate = true;
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var computeScene = function(time) {
        var labelColor = new THREE.Color();
        labelColor.setStyle("#fff");

        for(var tripId in _trips) {
            var trip = _trips[tripId];

            var lastRelevantStopIndex = Utils.cta.getLastStopIndex(time, trip["stops"]);
            var relevant = trip["hop"] == 0 || lastRelevantStopIndex >= trip["closestStopIndex"];

            var finalStopIndex = trip["stops"].length -1;
            var finalDestinationTime = Utils.cta.toSeconds(trip["stops"][finalStopIndex]["arrivalTime"]);

            if(lastRelevantStopIndex != -1 && relevant) {
                var next = Utils.cta.toSeconds(trip["stops"][lastRelevantStopIndex +1]["arrivalTime"]);
                var previous = Utils.cta.toSeconds(trip["stops"][lastRelevantStopIndex]["departureTime"]);

                // Compute time passed from the previous stop
                var delta = (time - previous) / (next - previous);
                var lat = d3.interpolateNumber(
                    parseFloat(trip["stops"][lastRelevantStopIndex]["lat"]),
                    parseFloat(trip["stops"][lastRelevantStopIndex +1]["lat"])
                )(delta);
                var lon = d3.interpolateNumber(
                    parseFloat(trip["stops"][lastRelevantStopIndex]["lon"]),
                    parseFloat(trip["stops"][lastRelevantStopIndex +1]["lon"])
                )(delta);

                var projection = __model.getMapModel().project(lat, lon);

                if(_vehiclesLabels[tripId] == undefined) {
                    if(trip["hop"] == 0) {
                        labelColor.setStyle(__model.getThemeModel().nearbyBusTextColor());
                    } else {
                        labelColor.setStyle(__model.getThemeModel().transferBusTextColor());
                    }
                    _vehiclesLabels[tripId] = Utils.gl.getLabelMesh(trip["routeId"], labelColor);
                    _vehiclesLabelGroup.add(_vehiclesLabels[tripId]);
                }
                Utils.gl.positionTextMesh(_vehiclesLabels[tripId], projection.x, projection.y);
            }
            else if(time >= finalDestinationTime) {
                lat = parseFloat(trip["stops"][finalStopIndex]["lat"]);
                lon = parseFloat(trip["stops"][finalStopIndex]["lon"]);

                projection = __model.getMapModel().project(lat, lon);

                Utils.gl.positionTextMesh(_vehiclesLabels[tripId], projection.x, projection.y);
            }
            else if(_vehiclesLabels[tripId] != undefined) {
                _vehiclesLabelGroup.remove(_vehiclesLabels[tripId]);
                delete _vehiclesLabels[tripId];
            }
        }
    };

    var updateAnimation = function() {
        if(_vehiclesLabelGroup != null) {
            self.getScene().remove(_vehiclesLabelGroup);
        }
        _vehiclesLabelGroup = new THREE.Group();
        _vehiclesLabelGroup.position.z = 2;
        self.getScene().add(_vehiclesLabelGroup);

        _trips = {};
        for (var tripId in _allTrips) {
            if (parseInt(_allTrips[tripId]["type"]) == 3) {
                _trips[tripId] = _allTrips[tripId];
            }
        }
    };

    var init = function () {
        __notificationCenter.subscribe(self, self.dataUpdated, Notifications.CTA.TRIPS_UPDATED);
    }();
}

Utils.extend(VehiclesLabelSceneController, SceneController);