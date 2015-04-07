/**
 * @class DirectorViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/9/15.
 */
function DirectorViewController() {
    UIMapCanvasViewController.call(this);

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _scenes = [];

    var _shouldStop;

    /*------------------ PUBLIC METHODS ------------------*/
    this.play = function(callBack) {
        _shouldStop = false;

        (function(call) {
            d3.timer(function() {
                update();
                draw();
                call();
                return _shouldStop;
            });
        })(callBack);
    };

    this.stop = function() {
        _shouldStop = true;
    };

    this.addScene = function(sceneController, zindex, tag) {
        var newScene = {
            controller: sceneController,
            tag: tag,
            zindex: zindex
        };
        var i = _.sortedIndex(_scenes, newScene, 'zindex');
        _scenes.splice(i, 0, newScene);
    };

    this.removeScenesWithTag = function(tag) {
        var i = _.findIndex(_scenes, {tag: tag});
        while(i != -1) {
            _scenes.splice(i, 1);
            i = _.findIndex(_scenes, {tag: tag});
        }
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var update = function() {
        _scenes.forEach(function(scene) {
            scene.controller.update();
        });
    };

    var draw = function() {
        self.getView().getRenderer().clearColor();
        _scenes.forEach(function(scene) {
            self.getView().render(scene.controller.getScene());
        });
    };


    var init = function () {
        self.getView().getRenderer().autoClear = false;
        self.getView().addClass("director-view-controller");
        self.getView().getRenderer().setClearColor(new THREE.Color("#fff"), 0.8);
    }();
}

Utils.extend(DirectorViewController, UIMapCanvasViewController);