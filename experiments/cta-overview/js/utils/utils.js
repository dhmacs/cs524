/**
 *
 * @type {Utils|*|{}}
 *
 * @author Massimo De Marchi
 */
var Utils = Utils || {};
Utils.gl = {};
Utils.cta = {};
Utils.scale = {};

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
    now.setHours(12);
    now.setMinutes(0);
    return now;
};




/****************** GL ********************/
Utils.gl.circleTexture = function() {
    var texture = THREE.ImageUtils.loadTexture( "img/circle.png" );
    texture.minFilter = THREE.LinearFilter;
    return texture;
};

Utils.gl.transferTexture = function() {
    var texture = THREE.ImageUtils.loadTexture( "img/connection.png" );
    texture.minFilter = THREE.LinearFilter;
    return texture;
};

Utils.gl.getLabelMesh = function(text, color) {
    var textGeometry = new THREE.TextGeometry(text, {
        font: 'helvetiker',
        //weight: "regular",
        style: "normal",
        size: 6
    });

    var material = new THREE.MeshBasicMaterial({color: color});
    var mesh = new THREE.Mesh(textGeometry, material);

    mesh.rotation.x = Math.PI;

    return mesh;
};

Utils.gl.positionTextMesh = function(mesh, x, y) {
    var textGeometry = mesh.geometry;
    textGeometry.computeBoundingBox();
    var deltaX = -0.5 * ( textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x );
    var deltaY = 0.5 * ( textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y );
    mesh.position.x = x + deltaX -1.5;
    mesh.position.y = y + deltaY;
};




/****************** CTA ********************/
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

Utils.cta.toSeconds = function(ctaTime) {
    return Utils.toSeconds(ctaTime.hh, ctaTime.mm, ctaTime.ss);
};

Utils.cta.secondsToHhMmSs = function(seconds) {
    return {
        hh : Math.floor(seconds / 3600),
        mm : Math.floor((seconds%3600) / 60),
        ss : Math.floor((seconds%3600) % 60)
    };
};


Utils.scale.exponential = function() {
    return function(fun) {
        var domain = [0, 1];
        var range = [0, 1];
        var expDomain = [0, 100];
        var expRange = [0, 1];
        var exponent = 2;
        var smoothness = 2;

        function scale(x) {
            var xPerc = (x - domain[0]) / (domain[1] - domain[0]);
            var x0 = xPerc * (expDomain[1] -  expDomain[0]) + expDomain[0];

            if(x0 == 0)
                return range[0];
            var y = Math.pow(Math.E, -smoothness/(Math.pow(x0, exponent)));

            return y * (range[1] - range[0]) + range[0];
        }

        scale.domain = function(x) {
            if(!arguments.length)
                return domain;
            domain = x;
            return scale;
        };

        scale.range = function(x) {
            if(!arguments.length)
                return range;
            range = x;
            return scale;
        };

        scale.exponent = function(x) {
            if(!arguments.length)
                return exponent;
            exponent = x;
            return scale;
        };

        scale.smoothness = function(x) {
            if(!arguments.length)
                return smoothness;
            smoothness = x;
            return scale;
        };

        return scale;
    } ();
};

Utils.scale.sin = function() {
    return function() {
        var domain = [0, 1];
        var range = [0, 1];
        var expDomain = [0, 1];

        function scale(x) {
            var xPerc = (x - domain[0]) / (domain[1] - domain[0]);
            var x0 = xPerc * (expDomain[1] -  expDomain[0]) + expDomain[0];

            if(xPerc >= 1) {
                return range[1];
            }

            var y = (Math.sin(Math.pow(x0, 0.5) * Math.PI - Math.PI /2) +1)/2;

            return y * (range[1] - range[0]) + range[0];
        }

        scale.domain = function(x) {
            if(!arguments.length)
                return domain;
            domain = x;
            return scale;
        };

        scale.range = function(x) {
            if(!arguments.length)
                return range;
            range = x;
            return scale;
        };

        return scale;
    } ();
};

















