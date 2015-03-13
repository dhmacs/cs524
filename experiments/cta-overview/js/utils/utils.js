/**
 *
 * @type {Utils|*|{}}
 *
 * @author Massimo De Marchi
 */
var Utils = Utils || {};
Utils.gl = {};
Utils.cta = {};

Utils.extend = function (subClass, superClass) {
    // Avoid instantiating the superClass class just to setup inheritance
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
    // for a polyfill
    // Also, do a recursive merge of two prototypes, so we don't overwrite
    // the existing prototype, but still maintain the inheritance chain
    // Thanks to @ccnokes
    var origProto = subClass.prototype;
    subClass.prototype = Object.create(superClass.prototype);
    for (var key in origProto) {
        subClass.prototype[key] = origProto[key];
    }
    // Remember the constructor property was set wrong, let's fix it
    subClass.prototype.constructor = subClass;
    // In ECMAScript5+ (all modern browsers), you can make the constructor property
    // non-enumerable if you define it like subClass instead
    Object.defineProperty(subClass.prototype, 'constructor', {
        enumerable: false,
        value: subClass
    });
};

Utils.toSeconds = function(hh, mm, ss) {
    return hh * 3600 + mm * 60 + ss;
};

Utils.nowToSeconds = function() {
    var now = Utils.now();
    return Utils.toSeconds(now.getHours(), now.getMinutes(), now.getSeconds());
};

Utils.now = function() {
    var now = new Date();
    //now.setHours(13);
    now.setMinutes(15);
    return now;
};

Utils.gl.circleTexture = function() {
    var texture = THREE.ImageUtils.loadTexture( "img/circle.png" );
    texture.minFilter = THREE.LinearFilter;
    return texture;
};

Utils.cta.getLastStopIndex = function(time, stops) {
    var s = 0;
    var stopTimeInSeconds;

    while(s < stops.length) {
        stopTimeInSeconds =
            Utils.toSeconds(
                stops[s]["arrivalTime"]["hh"],
                stops[s]["arrivalTime"]["mm"],
                stops[s]["arrivalTime"]["ss"]
            );
        if(time < stopTimeInSeconds) {
            return s -1;
        }
        s++;
    }

    return -1;
};
