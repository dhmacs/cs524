/**
 * @namespace Notifications
 * @description Notifications is the namespace for every notification that the application has to deal with.
 * Ideally each components that has to publish notifications should define here its own notifications under
 * its sub-namespace.
 */
var Notifications = Notifications || {};


/**
 * VisualizationModuleController notifications sub-namespace
 */
Notifications.CTA = {
    //whenever a map change its position / zoom
    TRIPS_UPDATED: "com.TransitVis.cta.tripsUpdated"
};

Notifications.Animation = {
    ANIMATION_STEP: "com.TransitVis.Animation.AnimationStep"
};
