
/*
 * -------------------------------------------------------
 * Project: Backbone Computed
 * Version: 0.0.1
 *
 * Author:  Blackwood Seven A/S
 * Site:     http://www.blackwoodseven.com
 * Contact: 
 *
 *
 * Copyright (c) 2014 Blackwood Seven A/S
 * -------------------------------------------------------
 */


(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory();
    }
    else if(typeof define === 'function' && define.amd) {
        define([], factory);
    }
    else {
        root['computed'] = factory();
    }
}(this, function() {

    var computed = {};
    
    // Computed mixin
    // overrides set and get method
    computed.mixin = {
        get: function(attr) {
            //.. do nothing
        },
    
        set: function(attr, value, options) {
            // .. do nothing
        }
    }

    return computed;

}));
