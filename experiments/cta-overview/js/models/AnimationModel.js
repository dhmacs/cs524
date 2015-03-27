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
    var _current;
    var _lastStep;
    var _state;

    /*------------------ PUBLIC METHODS ------------------*/
    this.setTimeDrivenAnimation = function(start, duration) {
        _start = start;
        _duration = duration;
        _current = start;

        _state = AnimationState.START;
    };

    this.getTime = function() {
        return _current;
    };

    this.getDeltaTime = function() {
        return _lastStep;
    };

    this.step = function(step) {
        _lastStep = step;
        _current += step;
        _state = _current > _start + _duration ? AnimationState.END : AnimationState.RUNNING;
        __notificationCenter.dispatch(Notifications.Animation.ANIMATION_STEP);
    };

    /*
    this.getStepInterval = function() {
        return _forwardStep;
    };*/

    this.stepBack = function(step) {
        _lastStep = step;
        _current -= step;
        _state = _current < _start ? AnimationState.START : AnimationState.RUNNING_BACK;
        __notificationCenter.dispatch(Notifications.Animation.ANIMATION_STEP);
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
    RUNNING: "running",
    RUNNING_BACK: "running back"
};