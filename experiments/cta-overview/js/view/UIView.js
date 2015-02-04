/**
 * @class UIView
 * @description class based on d3 selection
 *
 * @author Massimo De Marchi
 * @created 1/24/15.
 */
function UIView(htmlElement) {
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _delegate;

    var _htmlLayerElement;

    /*------------------ PUBLIC METHODS ------------------*/
    /**
     * Return a D3 selection of the html layer element
     * @returns {*}
     */
    this.getD3Layer = function() {
        return _htmlLayerElement;
    };

    /**
     * Add a subview to the currentView
     * @param subview (UIView)
     */
    this.add = function (subview) {
        _htmlLayerElement.node().appendChild(subview.getD3Layer().node());
    };

    /**
     * Remove subview
     * @param subview
     */
    this.remove = function (subview) {
        try {
            _htmlLayerElement.node().removeChild(subview.getD3Layer().node());
        } catch (error) {
            console.log("Error in removing child");
        }
    };


    /**
     * Add a CSS class to the view
     * @param className
     */
    this.addClass = function (className) {
        _htmlLayerElement.classed(className, true);
    };


    /**
     * Return true if the view has className class
     * @param className
     * @returns {boolean}
     */
    this.hasClass = function (className) {
        return _htmlLayerElement.classed(className);
    };


    /**
     * Remove a CSS class from the view
     * @param className
     */
    this.removeClass = function (className) {
        _htmlLayerElement.classed(className, false);
    };

    /**
     * Set html element id
     * @param id : String
     */
    this.setId = function(id) {
        _htmlLayerElement.attr("id", id);
    };

    /**
     * Return html element id
     * @returns {String}
     */
    this.getId = function() {
        return _htmlLayerElement.attr("id");
    };


    /**
     * Attach events' callback to the view
     * @param event
     * @param callBack
     * @param params
     */
    this.on = function (event, callBack, /**params=0*/ params) {
        _htmlLayerElement.on(event, function () {
            d3.event.stopPropagation();
            callBack(params);
        });
        _htmlLayerElement.style("pointer-events", "visiblePainted");
    };


    /**
     * Set view delegate
     * @param delegate
     */
    this.setDelegate = function(delegate) {
        _delegate = delegate;
    };

    /**
     * Get view delegate
     * @returns {*}
     */
    this.getDelegate = function() {
        return _delegate;
    };

    /**
     *
     * @param enabled
     */
    this.setInteraction = function(enabled) {
        if (enabled) {
            _htmlLayerElement.style("pointer-events", "visiblePainted");
        } else {
            _htmlLayerElement.style("pointer-events", "none");
        }
    };

    /**
     *
     * @returns {boolean}
     */
    this.isInteractive = function() {
        return _htmlLayerElement.style("pointer-events") == "visiblePainted";
    };

    /**
     *
     */
    this.bringToFront = function () {
        self.getD3Layer().each(function () {
            this.parentNode.appendChild(this);
        });
    };

    /**
     *
     */
    this.hide = function () {
        self.getD3Layer().style("opacity", 0);
    };

    /**
     *
     */
    this.show = function () {
        self.getD3Layer().style("opacity", 1);
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        _htmlLayerElement = d3.select(htmlElement);

        _htmlLayerElement.classed("ui-view", true);
        //_htmlLayerElement.style("pointer-events", "none");
        self.setInteraction(false);
    }();
}