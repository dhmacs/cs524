/**
 * @class BusNumbersSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/10/15.
 */
function BusNumbersSceneController() {
    SceneController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    // Text
    var _vehiclesLabelGroup;
    var _vehiclesLabels = {};
    var _textScene;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * Update the model of the scene
     */
    this.update = function() {
        var currentTime = MODEL.getAnimationModel().getTime();
        MODEL.getCTAModel().getTrips(new Date(), function(json) {
            var trips = d3.values(json);

            if(MODEL.getAnimationModel().getState() == AnimationModel.START) {

            } else {
                for(var tripId in trips) {
                    var vehicleData = trips[tripId];

                    // Compute vehicle last stop
                    var previousStopIndex = getLastStopIndex(currentTime, vehicleData["stops"]);

                    // Compute relevance of the vehicle position (if not relevant then do not display it or use low opacity)
                    var relevant = vehicleData["stops"][previousStopIndex +1]["relevant"];
                    relevant = relevant == undefined ? true : relevant;

                    if(previousStopIndex > -1 && relevant) {
                        // Compute next stop time in seconds
                        var next = vehicleData["stops"][previousStopIndex +1]["arrivalTime"];
                        next = Utils.toSeconds(next.hh, next.mm, next.ss);

                        // Compute previous stop time in seconds
                        var previous = vehicleData["stops"][previousStopIndex]["departureTime"];
                        previous = Utils.toSeconds(previous.hh, previous.mm, previous.ss);

                        // Compute time passed from the previous stop
                        var delta = (currentTime - previous) / (next - previous);
                        var lat = d3.interpolateNumber(
                            parseFloat(vehicleData["stops"][previousStopIndex]["lat"]),
                            parseFloat(vehicleData["stops"][previousStopIndex +1]["lat"])
                        )(delta);
                        var lon = d3.interpolateNumber(
                            parseFloat(vehicleData["stops"][previousStopIndex]["lon"]),
                            parseFloat(vehicleData["stops"][previousStopIndex +1]["lon"])
                        )(delta);

                        var projection = MODEL.getMapModel().project(lat, lon);

                        var tColor = new THREE.Color();
                        tColor.setStyle("#fff");

                        if(_vehiclesLabels[tripId] == undefined) {
                            _vehiclesLabels[tripId] = getLabelMesh(vehicleData["routeId"], tColor);
                            _vehiclesLabelGroup.add(_vehiclesLabels[tripId]);
                        }
                        positionTextMesh(_vehiclesLabels[tripId], projection.x, projection.y);
                    } else if(_vehiclesLabels[tripId] != undefined) {
                        _vehiclesLabelGroup.remove(_vehiclesLabels[tripId]);
                        _vehiclesLabels[tripId] = undefined;
                    }
                }
            }
        });
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var getLabelMesh = function(text, color) {
        var textGeometry = new THREE.TextGeometry(text, {
            font: 'helvetiker',
            //weight: "regular",
            style: "normal",
            size: 7
        });
        //shape.computeBoundingBox();
        //var centerOffset = -0.5 * ( shape.boundingBox.max.x - shape.boundingBox.min.x );

        var material = new THREE.MeshBasicMaterial({color: color});
        var mesh = new THREE.Mesh(textGeometry, material);

        //var projection = self.project(41.876795, -87.710610);

        //words.position.x = projection.x;
        //words.position.y = projection.y;
        mesh.rotation.x = Math.PI;

        return mesh;
    };

    var positionTextMesh = function(mesh, x, y) {
        var textGeometry = mesh.geometry;
        textGeometry.computeBoundingBox();
        var deltaX = -0.5 * ( textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x );
        var deltaY = 0.5 * ( textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y );
        mesh.position.x = x + deltaX -1.5;
        mesh.position.y = y + deltaY;
    };

    var getLastStopIndex = function(time, stops) {
        var s = 0;
        var stopTimeInSeconds;

        while(s < stops.length) {
            stopTimeInSeconds =
                Utils.toSeconds(
                    stops[s]["arrivalTime"]["hh"],
                    stops[s]["arrivalTime"]["mm"],
                    stops[s]["arrivalTime"]["ss"]
                );
            if(time < stopTimeInSeconds) {
                return s -1;
            }
            s++;
        }

        return -1;
    };


    var init = function () {
        _vehiclesLabelGroup = new THREE.Group();
        _vehiclesLabelGroup.position.z = 2;
        self.getScene().add(_vehiclesLabelGroup);
    }();
}

Utils.extend(BusNumbersSceneController, SceneController);