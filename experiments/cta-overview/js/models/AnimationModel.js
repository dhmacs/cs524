/**
 * @class AnimationModel
 * @description
 *
 * @author Massimo De Marchi
 * @created 3/9/15.
 */
function AnimationModel() {
    /*---------------- PRIVATE ATTRIBUTES ----------------*/
    var self = this;

    var _start;
    var _duration;
    var _step;
    var _current;

    var _state;

    /*------------------ PUBLIC METHODS ------------------*/
    this.setTimeDrivenAnimation = function(start, duration, step) {
        _start = start;
        _duration = duration;
        _step = step;
        _current = start;

        _state = AnimationState.START;
    };

    this.getTime = function() {
        return _current;
    };

    this.getDeltaTime = function() {
        return _step;
    };

    this.step = function() {
        _current += _step;
        _state = _current > _start + _duration ? AnimationState.END : AnimationState.RUNNING;
    };

    this.getState = function() {
        return _state;
    };

    /*------------------ PRIVATE METHODS -----------------*/
    var init = function () {

    }();
}

var AnimationState = {
    START: "start",
    END: "end",
    RUNNING: "running"
};