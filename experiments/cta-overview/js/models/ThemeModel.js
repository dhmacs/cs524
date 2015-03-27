/**
 * @class ThemeModel
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/26/15.
 */
function ThemeModel() {
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     *
     * @returns {string}
     */
    this.busColor = function() {
        return "#4292c6";
    };

    /**
     *
     * @returns {string}
     */
    this.shadowColor = function() {
        return "#bdbdbd";
    };

    /**
     *
     * @returns {string}
     */
    this.transferSymbolColor = function() {
        return "rgb(51,46,33)";
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {

    }();
}