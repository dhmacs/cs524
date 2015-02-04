/**
 * @class AppModel
 * @description
 *
 * @author Massimo De Marchi
 * @created 1/24/15.
 */
function AppModel() {
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _mapModel;
    var _ctaModel;

    /*------------------ PUBLIC METHODS ------------------*/

    /**
     *
     * @returns {*}
     */
    this.getMapModel = function() {
        return _mapModel;
    };

    /**
     *
     * @returns {*}
     */
    this.getCTAModel = function() {
        return _ctaModel;
    };


    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        _mapModel = new MapModel();
        _ctaModel = new CTAModel();
    }();
}