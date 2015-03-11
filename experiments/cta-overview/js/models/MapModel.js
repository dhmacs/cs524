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

    /**
     *
     * @param lat
     * @param lng
     * @returns {{x: (number|*), y: (number|*)}}
     */
    this.project = function(lat, lng) {
        return {
            x: (_map.project([lat, lng]).x),
            y: (_map.project([lat, lng]).y)
        };
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {

    }();
}