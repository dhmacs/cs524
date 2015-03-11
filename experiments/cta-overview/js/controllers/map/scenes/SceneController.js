/**
 * @class SceneController
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/9/15.
 */
function SceneController() {
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;
    var _scene;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * Update the model of the scene
     */
    this.update = function() {

    };

    /**
     * Return the handled scene
     * @returns {*}
     */
    this.getScene = function() {
        return _scene;
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        _scene = new THREE.Scene();
    }();
}