
/*
 * -------------------------------------------------------
 * Project: Backbone Computed
 * Version: 0.0.2
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
        root['BackboneComputed'] = factory();
    }
}(this, function() {

    var BackboneComputed = { VERSION: '0.0.2' };

    BackboneComputed.mixin = {

        get: function(attr, options) {
            var parent, computedAttr;

            parent = this.parent ? this.parent : Backbone.Model.prototype.get;
            options = options || {};        

            // Ignore if specifically told so
            if (options.ignoreComputed) { return parent.apply(this, arguments); }

            if (attr in this.computed) {
                computedAttr = this.computed[attr];

                if (_.isFunction(computedAttr)) {
                    return computedAttr.apply(this);
                } else if (_.isObject(computedAttr) && computedAttr.get) {
                    return computedAttr.get.apply(this);
                }
            }
            return parent.apply(this, arguments);
        },

        /**
         * Overwrite Backbone 'set' method to check if a computed setter has
         * been defined, before falling back to Backbine's own 'set' method
         *
         * @param {String|Object} attr - the key of the value your are interested in
         *   setting. Can also be hash of attribute => value.
         * @param {Boolean} options.ignoreComputed - ignore any computed setters
         */
        set: function(attr, value, options) {
            var parent, computedAttr, attrs, opts, settings;

            settings = BackboneComputed.settings;
            parent = this.parent ? this.parent : Backbone.Model.prototype.set;

            // Handle both "key", value and {key: value} -style arguments.
            if (typeof attr === 'object') {
                attrs = attr;
                options = value;
            } else {
                (attrs = {})[attr] = value;
            }

            options = options || {};

            // Ignore if no computed hash or specifically told so
            if (options.ignoreComputed || !this.computed) { 
                return parent.apply(this, arguments); 
            }

            // Prevent nested calls to 'get' from firing 'change' event
            // this._changing = true;
            // this._previousAttributes = _.clone(this.attributes);
            // this.changed = {};

            // Set each attribute with getter on computed attribute or
            // fallback to Backbone set method
            _.each(attrs, function(value, attr) {
                var computedAttr, currentValue;

                // Intercept any collections being set
                if (value instanceof Backbone.Collection) {
                    this.stopListening(this.get('attr'));
                    this.listenTo(value, 'add remove reset sort', this.propagateCollectionEvent);
                }

                if (attr in this.computed) {
                    computedAttr = this.computed[attr];

                    if (_.isObject(computedAttr) && computedAttr.set) {
                        computedAttr.set.call(this, value, options);
                        currentValue = this.get(attr);

                        if (!_.isEqual(currentValue, value)) {
                            this.changed[attr] = value;
                            if (!options.silent) {
                                this.trigger('change:' + attr, this, value, options);
                            }
                        }
                    }
                } else {
                    // parent.apply(this, [attr, value, options]);
                }
            }, this);
            
            // Temporary solution
            parent.apply(this, arguments);

            this.triggerComputed();

            // if (!options.silent) {
            //     this.trigger('change', this, options);
            // }
            // this._changing = false;
        },

        propagateCollectionEvent: function() {
            var collection, attr, collectionChanged;
            // Support arguments for all four collection events:
            // 'add remove reset sort'
            if (arguments[0] instanceof Backbone.Model) {
                collection = arguments[1];
            } else {
                collection = arguments[0];
            }

            // Find attr (key) for collection
            _.each(this.attributes, function(value, key) {
                if (value === collection) {
                    attr = key;
                }
            });

            // Trigger computed informing it that a collection
            // has updated, or remove event listening on collection
            // if it's no longer present in attributes
            if (attr) {
                collectionChanged = {};
                collectionChanged[attr] = collection;
                this.triggerComputed({
                    changed: collectionChanged,
                    externalEvent: true
                });
            } else {
                this.stopListening(collection);
            }
        },

        /*
         * Trigger events for computed attributes
         * if dependencies have changed
         *
         * @param {Boolean} options.externalEvent -
         *   If false: Assume this is called right after 'set' and examine
         *   freshly made 'changed' hash.
         *   If true: This method has been triggered by something else,
         *   and changes in 'changed' are to be considered old.
         * @param {Dict} options.changed - Examine these changed attributes instead,
         *   if options.externalEvent is true.
         */
        triggerComputed: function(options) {
            var changed,
                computedChanged = {},
                depsChanged = {},
                opts = options || {};

            if (opts.externalEvent) {
                changed = opts.changed;
            } else {
                changed = this.changedAttributes();
            }
            if (!changed) { return; }
            this._buildDependencyHash();

            // Calculate list of dependencies that have changed
            // that means the subset of current 'model.changed' that are defined
            // as dependecies in 'computed' hash
            depsChanged = _.pick(this._dependencyHash, _.keys(changed));
            _.each(depsChanged, function(value, key) {
                var computedList = value;

                // For each computed attribute that have an affected
                // dependency, store the computed value with it's value
                // in computedChanged. Note: the same computed attr can be
                // stored many times - overriding the previous one.
                _.each(computedList, function(computedAttr) {
                    computedChanged[computedAttr] = this.get(computedAttr);
                }, this);
            }, this);

            // Merge in 'computed changed' into model.changed so 'change' event
            // handlers AFTER this one, will 'see' them.
            // This works as event callbacks are added to the object itself, in an
            // array - which will always have the same order.
            _.extend(this.changed, computedChanged);

            // Manully trigger events for computed attrs
            // we not passing options array, as it is uncertain have
            // this should be done
            _.each(computedChanged, function(value, key) {
                this.trigger('change:' + key, this, value, {});
            }, this);
        },

        _buildDependencyHash: function() {
            // Construct dependencyHash if not already there
            // Depency hash looks like this:
            //   dependency1: [computed1, computed2],
            //   dependency2: [computed1]
            // 
            // - also add eventhandlers to collection defined as depencies, as
            // these are not changed through 'set' method when collection is updated
            if (!this._dependencyHash) {
                this._dependencyHash = {};
                _.each(this.computed, function(cattr, key) {
                    if (_.isObject(cattr) && _.has(cattr, 'deps')) {
                        _.each(cattr.deps, function(dep) {
                            if (!_.has(this._dependencyHash, dep)) {
                                this._dependencyHash[dep] = [];
                            }
                            this._dependencyHash[dep].push(key);
                        }, this);
                    }
                }, this);
            }
        }
    }


    return BackboneComputed;

}));
