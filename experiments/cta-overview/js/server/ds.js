/**
 * @author Massimo De Marchi
 * @created 2/14/15.
 */
!function() {
    var root = this;
    var ds = {
        version: "0"
    };
    ds.Graph = function() {
        return new _Graph();
    };
    function _Graph() {
        var self = this;
        var _nodes = {};
        var _edges = {};

        self.addNode = function(nodeId, data) {
            _nodes[nodeId] = data;
            //console.log(Object.keys(_nodes).length);
        };
        self.setEdge = function(fromNodeId, toNodeId, edgeData) {
            if(_edges[fromNodeId] == undefined) {
                _edges[fromNodeId] = {}
            }
            if(_edges[fromNodeId][toNodeId] == undefined) {
                _edges[fromNodeId][toNodeId] = [];
            }
            _edges[fromNodeId][toNodeId].push(edgeData);
        };

        self.getEdges = function(fromNodeId, toNodeId) {
            if(_edges[fromNodeId] != undefined && _edges[fromNodeId][toNodeId] != undefined) {
                return _edges[fromNodeId][toNodeId];
            }
            return [];
        };

        self.getNodesIds = function() {
            return Object.keys(_nodes);
        };

        self.getNodeData = function(nodeId) {
            return _nodes[nodeId];
        };
        self.getNeighbors = function(nodeId) {
            if(_edges[nodeId] != undefined) {
                return Object.keys(_edges[nodeId]);
            }
            return [];
        }
    }
    ds.timeToSeconds = function(hours, minutes, seconds) {
        return parseInt(hours) * 3600 +  parseInt(minutes) * 60 + parseInt(seconds);
    };

    ds.secondsToTime = function(seconds) {
        return {
            hh : Math.floor(seconds / 3600),
            mm : Math.floor((seconds%3600) / 60),
            ss : Math.floor((seconds%3600) % 60)
        };
    };

    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = ds;
        }
        exports.ds = ds;
    } else {
        root.ds = ds;
    }
    // AMD registration happens at the end for compatibility with AMD loaders
    // that may not enforce next-turn semantics on modules. Even though general
    // practice for AMD registration is to be anonymous, underscore registers
    // as a named module because, like jQuery, it is a base library that is
    // popular enough to be bundled in a third party lib, but not be part of
    // an AMD load request. Those cases could generate an error when an
    // anonymous define() is called outside of a loader request.
    if (typeof define === 'function' && define.amd) {
        define('ds', [], function() {
            return ds;
        });
    }
} ();

































