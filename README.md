# Backbone-computed

The computed attributes for Backbone.Model your parents would never let you have.

## Boring documentation stuff

Backbone-computed is a backbone plugin offered up as a mixin to Backbone.Model. 

### Install

Backbone-computed can either be used by getting either the compressed or the uncompressed version from the (/dist) folder or by installing it with the bower package manager as shown below.

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
    
