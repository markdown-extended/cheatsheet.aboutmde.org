
'use strict';

// over-write this for per-fork config
var USER_OPTIONS = {

    // pages list like:
    // name => { data: data-file.yml , template: template.j2 , dest: destination.html }

    // callback to transform data sent to templates
    processData:    function(data){

        // cheatsheet specific
        var markdown = require('marked');

        // add the search_query

        // the mde_data for the cheatsheet
        if (data.mde_data !== undefined) {
            for (var k=0; k<data.mde_data.length; k++) {
                var item = data.mde_data[k];
                if (item.type == 'typo') {
                    data.mde_data[k].type_name  = "Typographic";
                    data.mde_data[k].long_type  = "typographic";
                    data.mde_data[k].short_type = "T";
                } else if (item.type == 'block') {
                    data.mde_data[k].type_name  = "Block";
                    data.mde_data[k].long_type  = "block";
                    data.mde_data[k].short_type = "B";
                } else if (item.type == 'misc') {
                    data.mde_data[k].type_name  = "Miscellaneous";
                    data.mde_data[k].long_type  = "miscellaneous";
                    data.mde_data[k].short_type = "M";
                }
                for (var l=0; l<item.samples.length; l++) {
                    var new_sample = {};
                    new_sample.sample = item.samples[l];
                    new_sample.mde_sample = markdown(new_sample.sample);
                    data.mde_data[k].samples[l] = new_sample;
                }
            }
        }

        return data;
    }

};

// grunt compilation
module.exports = function(grunt) {

    // create the app catching init errors
    try {
        var PageModel = require('./tasks/page_model');
        var app       = new PageModel(USER_OPTIONS, grunt);
    } catch (err) {
        grunt.fail.fatal(err);
    }

/*/
//var p_config = app.getTaskOptions('markdown');
//var p_files = app.getTaskFiles('markdown');
//console.dir(p_config);
//console.dir(p_files);
return;
//*/

    // third-parties configs
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-markdown');
    grunt.loadNpmTasks('grunt-merge-data');
    grunt.loadNpmTasks('grunt-nunjucks-render');
    grunt.initConfig({
        clean:              {},
        markdown:           { options: app.getTaskOptions('markdown') },
        merge_data:         { options: app.getTaskOptions('merge_data') },
        nunjucks_render:    { options: app.getTaskOptions('nunjucks_render') }
    });

    // page(s) rendering
    grunt.registerTask('render', 'the page-model renderer', function() {
        var page        = (arguments.length>0 ? arguments[0] : 'all');
        var count       = 0;
        var page_names  = [];

        // get concerned pages
        try {
            var pages = app.getTaskPagesList(page);
        } catch (err) {
            grunt.fail.fatal(err);
        }

        // global markdown for now ...        
        grunt.config.set(
            'markdown.all',
            app.getTaskFiles('markdown')
        );

        // setup all tasks for each page
        for (var p in pages) {
            page_names.push(p);
            grunt.config.set('merge_data.' + p, app.getTaskFiles('merge_data', p));
            grunt.config.set('nunjucks_render.' + p, app.getTaskFiles('nunjucks_render', p));
            count++;
        }

        // call tasks
        grunt.log.writeln('Processing ' + count + ' pages: ' + page_names.join(', '));
        grunt.task.run('markdown','merge_data','nunjucks_render');
    });


    // page(s) cleaning
    grunt.registerTask('cleanup', 'the page-model cleaner', function() {
        var page = (arguments.length>0 ? arguments[0] : 'all');

        // get concerned pages
        try {
            var pages = app.getTaskPagesList(page);
        } catch (err) {
            grunt.fail.fatal(err);
        }

        // setup all tasks for each page
        for (var p in pages) {
            grunt.config.set('clean.' + p, app.getTaskFiles('clean', p));
        }

        // call "clean" task
        grunt.task.run('clean');
    });

    // help string
    grunt.registerTask('help', 'see cli available options', function() {
        grunt.log.write(PageModel.help_string);
    });

    // common tasks
    grunt.registerTask('default',       ['render']);
    grunt.registerTask('rebuild',       ['cleanup','render']);
};
