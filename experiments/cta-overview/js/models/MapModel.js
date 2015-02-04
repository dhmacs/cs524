/**
 * @class MapModel
 * @description
 *
 * @author Massimo De Marchi
 * @created 1/24/15.
 */
function MapModel() {
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _map;

    /*------------------ PUBLIC METHODS ------------------*/

    /**
     *
     * @param map
     */
    this.setMap = function(map) {
        _map = map;
    };

    /**
     *
     * @returns {*}
     */
    this.getMap = function() {
        return _map;
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {

    }();
}