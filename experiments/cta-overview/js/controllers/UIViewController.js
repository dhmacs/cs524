/**
 * @class UIViewController
 * @description
 *
 * @author Massimo De Marchi
 * @created 1/24/15.
 */
function UIViewController(/**view=UISVGView*/view) {
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _view;

    var _parentController;
    var _children = [];

    /*------------------ PUBLIC METHODS ------------------*/

    /**
     * Add a child controller to the View Controller children list and calls updateView of the child
     * @param childController
     */
    this.add = function(childController) {
        _children.push(childController);
        childController.setParentController(self);
        self.getView().add(childController.getView());
        childController.viewDidAppear();
    };

    /**
     * Remove the given child from the children
     * @param childController
     */
    this.remove = function(childController) {
        childController.dispose();
        self.getView().remove(childController.getView());
        _children = _.without(_children, childController);
    };

    /**
     * Removes all children in the sub-hierarchy
     */
    this.removeAllChildren = function() {
        for(var i = self.getChildren().length -1; i >= 0; i--) {
            self.remove(self.getChildren()[i]);
        }
    };

    /**
     * Returns all the children controllers
     * @returns {Array}
     */
    this.getChildren = function() {
        return _children;
    };


    /**
     * This methods handles views updates.
     * It is first called when the UIViewController is added to a parent view controller.
     * @override Subclasses should override this method
     */
    this.viewDidAppear = function() {
        _children.forEach(function(child) {
            child.viewDidAppear();
        });
    };

    /**
     * Sets UIViewController's parent controller
     * @param viewController
     */
    this.setParentController = function(viewController) {
        _parentController = viewController;
    };

    /**
     * Return UIViewController's parent controller
     * @returns {*}
     */
    this.getParentController = function() {
        return _parentController;
    };

    /**
     * Returns UIViewController's view
     * @returns {UIView}
     */
    this.getView = function() {
        return _view;
    };

    /**
     * Override if need to clean stuff before the controller gets destroyed
     * @override
     */
    this.dispose = function() {
        _children.forEach(function(child) {
            child.dispose();
        });
    };

    /**
     *
     * @returns {*}
     */
    this.getModel = function() {
        return _parentController.getModel();
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        _view = (typeof view === "undefined") ? new UISVGView() : view;
        _view.addClass("ui-view-controller");
    }();
}