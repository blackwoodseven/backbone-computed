
describe('Backbone Computed', function() {

    var Model, model;

    Model = Backbone.Model.extend({
        defaults: {
            firstname: 'John',
            lastname: 'Doe'
        },

        computed: {}
    });
    _.extend(Model.prototype, BackboneComputed.mixin);

    // Turn pretty printing of Backbone Models into something
    // we can actually use
    Model.prototype.jasmineToString = function() {
        return '<Backbone.Model:' + this.cid + '>';
    }

    describe('Getters', function() {

        it('gets value when computed is a function', function() {
            Model.prototype.computed.fullname = function() {
                return this.get('firstname') + ' ' + this.get('lastname');
            }
            model = new Model();
            expect(model.get('fullname')).toEqual('John Doe');
        });

        it('gets value when computed is a object', function() {
            Model.prototype.computed.fullname = {
                get: function() {
                    return this.get('firstname') + ' ' + this.get('lastname');
                }
            }
            model = new Model();
            expect(model.get('fullname')).toEqual('John Doe');
        });
    });

    describe('Setters', function() {

        beforeEach(function() {
            Model.prototype.computed.fullname = {
                set: function(value, options) {
                    var parts = value.split(' ');
                    this.set('firstname', parts[0]);
                    this.set('lastname', parts[1]);
                }
            }
            model = new Model();
        });

        it('sets value when calling model.set with attribute \'key, value\'', function() {
            spyOn(Model.prototype.computed.fullname, 'set');

            model.set('fullname', 'Peter Parker');
            expect(Model.prototype.computed.fullname.set).toHaveBeenCalledWith('Peter Parker', {});
        });

        it('sets value when calling model.set with attribute hash, ' + 
           'and passes through other attributes', function() {
            spyOn(Model.prototype.computed.fullname, 'set');

            model.set({
                fullname: 'Peter Parker',
                occupation: 'superhero'
            });
            expect(Model.prototype.computed.fullname.set).toHaveBeenCalledWith('Peter Parker', {});
            expect(model.get('occupation')).toEqual('superhero');
        });

        it('Doesn\'t set value with computed setter if options.ignoreComputed', function() {
            spyOn(Model.prototype.computed.fullname, 'set');

            model.set('fullname', 'Peter Parker', { ignoreComputed: true });
            expect(Model.prototype.computed.fullname.set).not.toHaveBeenCalled();
            expect(model.get('fullname')).toEqual('Peter Parker');
        });

        it('triggers change when model.set with attribute \'key, value\'', function() {
            var changeSpy = jasmine.createSpy('- change spy -');
            model.on('change:fullname', changeSpy);

            model.set('fullname', 'Peter Parker');
            expect(changeSpy).toHaveBeenCalledWith(model, 'Peter Parker', {});
        });

        it('triggers change when model.set with attribute hash', function() {
            var fullnameChangeSpy = jasmine.createSpy('- fullname change spy -'),
                occupationChangeSpy = jasmine.createSpy('- occupation change spy -');

            model.on('change:fullname', fullnameChangeSpy);
            model.on('change:occupation', occupationChangeSpy);

            model.set({
                fullname: 'Peter Parker',
                occupation: 'superhero'
            });
            expect(fullnameChangeSpy).toHaveBeenCalledWith(model, 'Peter Parker', {});
            expect(occupationChangeSpy).toHaveBeenCalledWith(model, 'superhero', {});
        });

        it('triggers changes in the correct order', function() {});

        it('triggers changes correctly when computed setter sets other true attributes, ' + 
           'while exposing correct \'changed hash\'', function() {
            // When true attribute is set as a result of a computed attribute being set.
            // - one specific change event for the computed attr should be fired once
            // - one specific change event for the true attr should be fired once
            // - one general change event should be fired for the model
            // the changed hash should contain all changes when executing callbacks
            // for all above events
            
            pending();

            var firstnameSpy = jasmine.createSpy('- firstname change spy -'),
                lastnameSpy = jasmine.createSpy('- lastname change spy -'),
                fullnameSpy = jasmine.createSpy('- fullname change spy -'),
                changeSpy = jasmine.createSpy('- change change spy -'),
                expectedChangeHash;

            model.on('change:fullname', function(model, value, options) {
                fullnameSpy(value, model.changedAttributes());
            });            
            model.on('change:firstname', function(model, value, options) {
                firstnameSpy(value, model.changedAttributes());
            });
            model.on('change', function(model, options) {
                changeSpy(model.changedAttributes());
            });

            model.set('fullname', 'Peter Parker');

            expectedChangeHash = {
                fullname: 'Peter Parker',
                lastname: 'Parker',
                firstname: 'Peter'
            };

            expect(fullnameSpy).toHaveBeenCalledWith('Peter Parker', expectedChangeHash);
            expect(firstnameSpy).toHaveBeenCalledWith('Peter', expectedChangeHash);
            expect(changeSpy).toHaveBeenCalledWith(expectedChangeHash);
        });

    });  

    describe('Unmutable sibling dependencies', function() {

        beforeEach(function() {
            Model.prototype.computed.fullname = {
                deps: ['firstname', 'lastname'],
                set: function(value, options) {
                    var parts = value.split(' ');
                    this.set('firstname', parts[0]);
                    this.set('lastname', parts[1]);
                },
                get: function() {
                    return this.get('firstname') + ' ' + this.get('lastname');
                }
            }
            model = new Model();
        });

        it('triggers change event for computed when single dependency is changed', function() {
            var changeSpy = jasmine.createSpy('- fullname change spy -');
            model.on('change:fullname', changeSpy);

            model.set('firstname', 'Jane');
            expect(changeSpy).toHaveBeenCalledWith(model, 'Jane Doe', {});
        });

        it('triggers change event for computed only once when multiple dependencies is changed', function() {
            var changeSpy = jasmine.createSpy('- fullname change spy -');
            model.on('change:fullname', changeSpy);

            model.set({
                firstname: 'Jane',
                lastname: 'Hanson'
            });
            expect(changeSpy).toHaveBeenCalledWith(model, 'Jane Hanson', {});
            expect(changeSpy.calls.count()).toEqual(1);
        });
    });

    describe('Mutable sibling dependencies', function() {
        // Only collections are supported as mutable objects

        it('triggers change event for computed when dependency is a collection', function() {
            pending();
        });

        it('triggers change event for computed when dependency is a collection, and collection has been changed on model', function() {
            // Also makes sure eventhandlers are removed on old collection
            pending();
        });
    });
});