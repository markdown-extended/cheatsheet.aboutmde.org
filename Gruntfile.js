
// global app config
var GLOBAL_GRUNT,
    PAGE_MODEL = {
    // app paths
    data_dir:       './data/',
    pages_dir:      './pages/',
    templates_dir:  './templates/',
    tmp_dir:        './var/',
    www_dir:        './www/',
    // files
    template:       './templates/page-model.mustache',
    md_template:    './templates/md-template.html',
    data_target:    './var/config.json',
    web_target:     './www/index.html',
    // files masks
    html_ext:       '.html',
    pages_src:      './pages/*.md',
    data_src:       './data/*.yml'
};

// custom data transformation
var transformData = function (data)
{
    var markdown = require('marked');

    // add the search_query

    // the mde_data for the cheatsheet
    if (data.mde_data != undefined) {
        for (var k=0; k<data.mde_data.length; k++) {
            var item = data.mde_data[k];
            data.mde_data[k].samples_count = item.samples.length;
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
        	    if (l>0) {
                    new_sample.add_tr = true;
        	    }
                new_sample.sample = item.samples[l];
                new_sample.mde_sample = markdown(new_sample.sample);
                data.mde_data[k].samples[l] = new_sample;
        	}
        }
    }

    // current page
    if (data.page.page_logo == undefined) {
        data.page.page_logo = data.website.logo;
    }
    for (var i=0; i<data.website.menu.length; i++) {
        var slug = data.website.menu[i].slug,
            active = data.page.page_active || '';
        if (slug == active) {
            data.website.menu[i].is_active = true;
            data.page.page_link = data.website.menu[i].url;
            if (data.page.page_title == undefined) {
                data.page.page_title = data.website.menu[i].title;
            }
        } else {
            data.website.menu[i].is_active = false;
        }
    }

    // organize contents
    if (data.page.contents != undefined) {
        for (var j=0; j<data.page.contents.length; j++) {
            // markdown content
            if (data.page.contents[j].markdown != undefined) {
                var filename = data.page.contents[j].markdown,
                    mdfile = PAGE_MODEL.tmp_dir + 'pages/' + filename.replace(PAGE_MODEL.html_ext, '') + PAGE_MODEL.html_ext;
                data.page.contents[j].content = GLOBAL_GRUNT.file.read(mdfile);
            } else {
                if (data.page.contents[j].notes && data.page.contents[j].notes.length>0) {
                    data.page.contents[j].has_notes = true;
                }
            }
            if (j<(data.page.contents.length-1)) {
                data.page.contents[j].show_hr = true;
            }
        }
    }

    // always return the full data
    return data;
};

// grunt compilation
module.exports = function(grunt) {
    GLOBAL_GRUNT = grunt;
    grunt.initConfig({
        markdown: {
            all: {
                options: {
                    template: PAGE_MODEL.md_template
                },
                files: [{
                    expand: true,
                    src:    PAGE_MODEL.pages_src,
                    dest:   PAGE_MODEL.tmp_dir,
                    ext:    PAGE_MODEL.html_ext
                }]
            }
        },
        merge_data: {
            options: {
                data:   function(data){ return transformData(data); }
            },
            all: {
                src:    PAGE_MODEL.data_src,
                dest:   PAGE_MODEL.data_target
            }
        },
        mustache_render: {
            options: {
                clear_cache:    true,
                directory:      PAGE_MODEL.templates_dir
            },
            all: {
                files : [{
                    template: PAGE_MODEL.template,
                    data:     PAGE_MODEL.data_target,
                    dest:     PAGE_MODEL.web_target
                }]
            }
        }
    });
    grunt.loadNpmTasks('grunt-markdown');
    grunt.loadNpmTasks('grunt-merge-data');
    grunt.loadNpmTasks('grunt-mustache-render');
    grunt.registerTask('default', ['markdown','merge_data','mustache_render']);
};
