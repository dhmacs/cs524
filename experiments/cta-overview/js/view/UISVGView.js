/**
 * @class UISVGView
 * @description
 *
 * @author Massimo De Marchi
 * @created 1/24/15.
 */
function UISVGView() {
    UIView.call(this, document.createElementNS('http://www.w3.org/2000/svg', 'svg'));

    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    /*------------------ PUBLIC METHODS ------------------*/

    /**
     * Set the view position and size in parent coordinates
     * @param x
     * @param y
     * @param width
     * @param height
     */
    this.setFrame = function (x, y, width, height) {
        self.getD3Layer().attr("x", x);
        self.getD3Layer().attr("y", y);
        self.getD3Layer().attr("width", width);
        self.getD3Layer().attr("height", height);

        if(self.getDelegate() != null && typeof self.getDelegate().frameDidChange == "function") {
            self.getDelegate().frameDidChange();
        }
    };

    /**
     * Return a frame object
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    this.getFrame = function () {
        return {
            x: self.getFrameX(),
            y: self.getFrameY(),
            width: self.getFrameWidth(),
            height: self.getFrameHeight()
        };
    };

    /**
     * Return the x frame position (position of the svg within its parent)
     * @returns {number}
     */
    this.getFrameX = function () {
        var x = self.getD3Layer().attr("x");
        x = x != null ? x : 0;
        return x;
    };

    /**
     * Return the x frame position (position of the svg within its parent)
     * @returns {number}
     */
    this.getFrameY = function () {
        var y = self.getD3Layer().attr("y");
        y = y != null ? y : 0;
        return y;
    };

    /**
     * Return frame width (which is the svg element width)
     * @returns {number}
     */
    this.getFrameWidth = function () {
        var width = self.getD3Layer().attr("width");
        width = width != null ? width : 0;
        return width;
    };

    /**
     * Return frame height (which is the svg element height)
     * @returns {number}
     */
    this.getFrameHeight = function () {
        var height = self.getD3Layer().attr("height");
        height = height != null ? height : 0;
        return height;
    };


    /**
     * Set the view viewBox
     * @param x
     * @param y
     * @param width
     * @param height
     */
    this.setViewBox = function (x, y, width, height) {
        self.getD3Layer().attr("viewBox", x + " " + y + " " + width + " " + height);

        if(self.getDelegate() != null && typeof self.getDelegate().viewBoxDidChange == "function") {
            self.getDelegate().viewBoxDidChange();
        }
    };


    /**
     * Return a viewBox object
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    this.getViewBox = function () {
        return {
            x: self.getViewBoxX(),
            y: self.getViewBoxY(),
            width: self.getViewBoxWidth(),
            height: self.getViewBoxHeight()
        };
    };

    /**
     * Returns viewBox x position
     * @returns {number}
     */
    this.getViewBoxX = function () {
        var viewBox = self.getD3Layer().attr("viewBox");
        return viewBox != null ? viewBox.split(/\s+|,/)[0] : null;
    };

    /**
     * Returns viewBox y position
     * @returns {number}
     */
    this.getViewBoxY = function () {
        var viewBox = self.getD3Layer().attr("viewBox");
        return viewBox != null ? viewBox.split(/\s+|,/)[1] : null;
    };

    /**
     * Return viewBox height
     * @returns {number}
     */
    this.getViewBoxHeight = function () {
        var viewBox = self.getD3Layer().attr("viewBox");
        return viewBox != null ? viewBox.split(/\s+|,/)[3] : null;
    };

    /**
     * Return viewBox width
     * @returns {number}
     */
    this.getViewBoxWidth = function () {
        var viewBox = self.getD3Layer().attr("viewBox");
        return viewBox != null ? viewBox.split(/\s+|,/)[2] : null;
    };


    /**
     * Set the preserveAspectRatio attribute of the svg
     * @param options {String}
     */
    this.setAspectRatioOptions = function (options) {
        self.getD3Layer().attr("preserveAspectRatio", options);
    };

    /**
     * Set the UIView background color
     * @param color
     */
    this.setBackgroundColor = function (color) {
        self.getD3Layer().style("fill", color);
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {
        self.setAspectRatioOptions("xMinYMin meet");
    }();
}

Utils.extend(UISVGView, UIView);