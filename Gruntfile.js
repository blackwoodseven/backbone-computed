"use strict";

module.exports = function(grunt) {

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.initConfig({

        // Define Directory
        dirs: {
            js:     "src/js",
            build:  "dist"
        },

        // Metadata
        pkg: grunt.file.readJSON("package.json"),
        banner:
            "\n" +
            "/*\n" +
            " * -------------------------------------------------------\n" +
            " * Project: <%= pkg.title %>\n" +
            " * Version: <%= pkg.version %>\n" +
            " *\n" +
            " * Author:  <%= pkg.author.name %>\n" +
            " * Site:     <%= pkg.author.url %>\n" +
            " * Contact: <%= pkg.author.email %>\n" +
            " *\n" +
            " *\n" +
            " * Copyright (c) <%= grunt.template.today(\"yyyy\") %> <%= pkg.author.name %>\n" +
            " * -------------------------------------------------------\n" +
            " */\n" +
            "\n",

        usebanner: {
            computed: {
                options: {
                    position: 'top',
                    banner: '<%= banner %>',
                    linebreak: false
                },
                files: {
                    src: [ "<%= dirs.build %>/backbone-computed.js" ]
                }
            }
        },

        // Wrap files in UMD
        umd: {
            computed: {
                src: "<%= dirs.js %>/backbone-computed.js",
                dest: "<%= dirs.build %>/backbone-computed.js",
                objectToExport: 'BackboneComputed',
                indent: '    ' // Indent by 4 spaces
            }
        },

        // Minify and Concat archives
        uglify: {
            options: {
                mangle: false,
                banner: "<%= banner %>"
            },
            dist: {
                files: {
                    "<%= dirs.build %>/backbone-computed.min.js": "<%= dirs.build %>/backbone-computed.js"
                }
            }
        }
    });


// Register Taks
// --------------------------

// Observe changes, concatenate, minify and validate files
grunt.registerTask( "default", [ "umd:computed", "uglify", "usebanner:computed" ]);

};