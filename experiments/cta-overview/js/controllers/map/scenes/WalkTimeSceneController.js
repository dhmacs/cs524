/**
 * @class WalkTimeSceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 7/22/15.
 */
function WalkTimeSceneController() {
    SceneController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    // WebGL variables
    var _geometryBuffer;

    var _timeGroupLabel = null;

    var _iconSize = 25 * window.devicePixelRatio;

    var _elapsedTimeTextMesh;

    var _updateTime = true;
    var _elapsedTime = -1;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * @override
     * Update the model of the scene
     */
    this.update = function() {
        computeScene(__model.getAnimationModel().getTime());

        //_geometryBuffer.attributes.position.needsUpdate = true;
        //_geometryBuffer.attributes.customColor.needsUpdate = true;
        //_geometryBuffer.attributes.size.needsUpdate = true;
        //_geometryBuffer.attributes.vertexOpacity.needsUpdate = true;
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var computeScene = function(time) {
        if(time != undefined) {
            var color = new THREE.Color();
            var location = __model.getWayFindingModel().getOriginLocation();
            var projection = __model.getMapModel().project(location.lat, location.lon);

            var start = __model.getAnimationModel().getStartTime();
            var end = __model.getAnimationModel().getEndTime();

            var distance = d3.scale.linear().domain([start, end]).range([-35, 210]);

            color.setStyle("#999999");

            var hhmmss = Utils.cta.secondsToHhMmSs(time - start);
            var newTime = hhmmss.hh * 60 + Math.floor(hhmmss.mm);
            _updateTime = _elapsedTime == -1 || (newTime % 5 == 0 && newTime != _elapsedTime);

            if(_updateTime) {
                _elapsedTime = newTime;
                if(_timeGroupLabel.children.length > 0) {
                    _timeGroupLabel.remove(_elapsedTimeTextMesh);
                }
                _elapsedTimeTextMesh = Utils.gl.getTimeLabelMesh("+" + _elapsedTime + " min", color);
                _timeGroupLabel.add(_elapsedTimeTextMesh);
            }

            Utils.gl.positionTextMesh(_elapsedTimeTextMesh, projection.x, projection.y - distance(time));
        }
    };

    var init = function () {
        _timeGroupLabel = new THREE.Group();
        _timeGroupLabel.position.z = 2;
        self.getScene().add(_timeGroupLabel);
    }();
}

Utils.extend(WalkTimeSceneController, SceneController);