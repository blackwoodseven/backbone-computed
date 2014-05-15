# Backbone-computed

The computed attributes for Backbone.Model your parents would never let you have.

## Boring documentation stuff

Backbone-computed is a backbone plugin offered up as a mixin to Backbone.Model. 

### Install

    bower install backbone-computed

### Usage

    var _ = require('underscore'),
        Backbone = require('backbone'),
        Computed = require('backbone-computed');
    
    var MyModel = Backbone.Model.extend({
      defaults: {
        firstname: "Peter",
        lastname: "Parker"
      },
      computed: {
        fullname: function() {
          return this.get('firstname') + ' ' + this.get('lastname');
        }
      }
    });
    _.extend(MyModel.prototype, Computed.mixin);
    
    var model = new MyModel();
    console.log(model.get('fullname'));
    // > Peter Parker
    
