/**
 * @class UIWindowController
 * @description
 *
 * @htmlContainer an html node that represents the application window (e.g. body element)
 *
 * @author Massimo De Marchi
 * @created 1/24/15.
 */
function UIWindowController(htmlContainer) {
    UIViewController.call(this, new UIView(htmlContainer));
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _model;

    /*------------------ PUBLIC METHODS ------------------*/

    /**
     * @override returns the application model
     * @returns {*}
     */
    this.getModel = function() {
        return _model;
    };


    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        // Initialize model
        _model = new AppModel();

        // TODO: debug
        __DEBUGModel = _model;

        self.getView().addClass("ui-window-controller");

        self.add(new UIMapViewController());
    }();
}

Utils.extend(UIWindowController, UIViewController);