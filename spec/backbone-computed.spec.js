
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

    describe('Improper setup', function() {
        describe('Missing computed', function() {
            var computed;
            beforeEach(function() {
                computed = Model.prototype.computed;
                delete Model.prototype.computed;
            });

            afterEach(function() {
                Model.prototype['computed'] = computed;
            });

            it('Get is undefined if no computed attributes exists on the model', function() {
                model = new Model();
                controlModel = new Backbone.Model();

                expect(controlModel.get('fullname')).toBeUndefined();
                expect(model.get('fullname')).toBeUndefined();
            });

            it('Set will set true attribute', function() {
                model = new Model();
                controlModel = new Backbone.Model();

                controlModel.set('fullname', 'Bruce Banner');
                model.set('fullname', 'Bruce Banner');

                expect(controlModel.attributes['fullname']).toBeDefined();
                expect(model.attributes['fullname']).toBeDefined();
            });
        });

        describe('Computed attribute with wrong types', function() {
            it('Attribute is not function or object', function() {
                Model.prototype.computed.fullname1 = null;
                Model.prototype.computed.fullname2 = undefined;
                Model.prototype.computed.fullname3 = '';
                Model.prototype.computed.fullname4 = [1, 2, 3];
                console.log(Model.prototype.computed);

                model = new Model();

                model.set('fullname1', 'Peter Parker');
                model.set('fullname2', 'Peter Parker');
                model.set('fullname3', 'Peter Parker');
                model.set('fullname4', 'Peter Parker');

                expect(model.get('fullname1')).toBeUndefined();
                expect(model.get('fullname2')).toBeUndefined();
                expect(model.get('fullname3')).toBeUndefined();
                expect(model.get('fullname4')).toBeUndefined();
            });

            it('Attribute is incomplete object', function() {
                Model.prototype.fullname1 = {};
                Model.prototype.fullname2 = {get: ''};
                Model.prototype.fullname3 = {set: ''};
                Model.prototype.fullname3 = {set: function(value, options) { this.set('test', 123); }}; 

                model.set('fullname1', 'Peter Parker');
                model.set('fullname2', 'Peter Parker');
                model.set('fullname3', 'Peter Parker');
                model.set('fullname4', 'Peter Parker');

                expect(model.get('fullname1')).toBeUndefined();
                expect(model.get('fullname2')).toBeUndefined();
                expect(model.get('fullname3')).toBeUndefined();
                expect(model.get('fullname4')).toBeUndefined();
            });
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
            expect(model.get('fullname')).toBeUndefined();
            expect(model.get('fullname', { ignoreComputed: true })).toEqual('Peter Parker');
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
            // the changed hash will contain changes as they are succesfully executed
            
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
            model.on('change:lastname', function(model, value, options) {
                lastnameSpy(value, model.changedAttributes());
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

            // Change for fullname computed attribute should contain all nested changes
            expect(fullnameSpy).toHaveBeenCalledWith('Peter Parker', expectedChangeHash);
            // change for firstname true attribute should contain only firstname
            expect(firstnameSpy).toHaveBeenCalledWith('Peter', _.pick(expectedChangeHash, 'firstname'));
            // change for lastname true attribute should contain firstname, and lastname
            expect(lastnameSpy).toHaveBeenCalledWith('Parker', _.omit(expectedChangeHash, 'fullname'));
            // global change event should contain all changed attributes
            expect(changeSpy).toHaveBeenCalledWith(expectedChangeHash);
        });

        it('triggers changes correctly when setting true attribute from a change handler', function() {
            var occupationSpy = jasmine.createSpy('- occupation change spy -'),
                heightSpy = jasmine.createSpy('- height change spy-'),
                changeSpy = jasmine.createSpy('- change change spy -'),
                controlSpy = jasmine.createSpy('- control change spy -'),
                controlChangeSpy = jasmine.createSpy('- control change change spy -'),
                expectedFullnameChangeHash,
                expectedOccupationChangeHash;

            var controlModel = new Backbone.Model();
            controlModel.on('change:firstname', function(model, value, options) {
                controlSpy(value, model.changedAttributes());
            });
            controlModel.on('change:lastname', function(model, value, options) {
                controlSpy(value, model.changedAttributes());
                model.set('firstname', 'Hulk');
                model.set('lens', '35mm');
            });
            controlModel.on('change', function(model, value, options) {
                controlChangeSpy(model.changedAttributes());
            });

            model.on('change:fullname', function(model, value, options) {
                model.set('occupation', 'photographer');
            });            
            model.on('change:occupation', function(model, value, options) {
                occupationSpy(value, model.changedAttributes());
            });
            model.on('change:height', function(model, value, options) {
                heightSpy(value, model.changedAttributes());
            });
            model.on('change', function(model, options) {
                changeSpy(model.changedAttributes());
            });

            /*
             * Control Model Set should trigger:
             *
             * change:lastname
             * change:firstname
             * change
             */
            controlModel.set('lastname', 'Hogan');

            model.set('height', 178);
            model.set('fullname', 'Peter Parker');

            expectedFullnameChangeHash = {
                fullname: 'Peter Parker',
                lastname: 'Parker',
                firstname: 'Peter'
            };
            expectedOccupationChangeHash = {
                occupation: 'photographer'
            };
            expectedHeightChangeHash = {
                height: 178
            }

            /*
             * These control model change events
             * are setup to show, how backbone handles nested
             * set calls
             *
             * The backbone-computed set method should
             * work the same way
             */
            expect(controlSpy.calls.count()).toBe(2); // One for each change:* event
            expect(controlSpy.calls.allArgs()).toEqual([
                ['Hogan', {lastname: 'Hogan'}], // First change event
                ['Hulk', {lastname: 'Hogan', firstname: 'Hulk'}] // Second, nested, change event
            ]);

            expect(controlChangeSpy.calls.count()).toBe(1); // One for one top-level Model.set
            expect(controlChangeSpy).toHaveBeenCalledWith({lastname: 'Hogan', firstname: 'Hulk', lens: '35mm'}); // All nested changes

            expect(heightSpy.calls.count()).toBe(1);
            expect(heightSpy).toHaveBeenCalledWith(178, expectedHeightChangeHash);

            expect(occupationSpy.calls.count()).toBe(1);
            expect(occupationSpy).toHaveBeenCalledWith('photographer', _.extend({}, expectedOccupationChangeHash, expectedFullnameChangeHash));

            expect(changeSpy.calls.count()).toBe(2);
            expect(changeSpy.calls.allArgs()).toEqual([[expectedHeightChangeHash], [_.extend(expectedFullnameChangeHash, expectedOccupationChangeHash)]]);
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

        beforeEach(function() {
            Model.prototype.computed.peersCount = {
                deps: ['peers'],
                get: function() {
                    return this.get('peers').size();
                }
            }
            model = new Model({
                peers: new Backbone.Collection([
                    {
                        name: 'Kent Clark'
                    }
                ])
            });
        });

        it('triggers change event for computed when dependency is a collection', function() {
            var changeSpy = jasmine.createSpy('- peersCount change spy -');
            model.on('change:peersCount', changeSpy);

            model.get('peers').add({ name: 'Wonder Woman' });
            expect(changeSpy).toHaveBeenCalledWith(model, 2, {});
        });

        it('triggers change event for computed when dependency is a collection, and collection has been changed on model', function() {
            // Also makes sure eventhandlers are removed on old collection
            var changeSpy = jasmine.createSpy('- peersCount change spy -');
            model.on('change:peersCount', changeSpy);

            model.set('peers', new Backbone.Collection([]));
            model.get('peers').add({ name: 'Wonder Woman' });

            expect(changeSpy).toHaveBeenCalledWith(model, 1, {});
        });
    });
});
