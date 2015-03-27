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
    var _animationModel;
    var _locationModel;
    var _themeModel;

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

    /**
     *
     * @returns {*}
     */
    this.getAnimationModel = function () {
        return _animationModel;
    };

    /**
     *
     * @returns {*}
     */
    this.getLocationModel = function() {
        return _locationModel;
    };

    /**
     *
     * @returns {*}
     */
    this.getThemeModel = function() {
        return _themeModel;
    };


    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        _mapModel = new MapModel();
        _ctaModel = new CTAModel();
        _animationModel = new AnimationModel();
        _locationModel = new LocationModel();
        _themeModel = new ThemeModel();
    }();
}