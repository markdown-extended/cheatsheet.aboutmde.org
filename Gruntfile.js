
// global app config
var _GRUNT, 
    _ENV    = 'prod', 
    _FLAGS  = {},
    _APP    = {
        // default cli options
        default_options: {
            dev:                false,
            root:               false,
            maintenance:        false
        },

        // app paths
        env_dir:                './build/env/',
        data_dir:               './build/data/',
        pages_dir:              './build/pages/',
        templates_dir:          './build/templates/',
        tmp_dir:                './tmp/',
        www_dir:                './www/',

        // env configs
        data_env:               'env.yml',
        user_env:               './env.yml',

        // files masks
        html_ext:               '.html',
        pages_src_all:          '*.md',
        data_src_all:           '*.yml',

        // mde contents
        md_template:            'md-template.html',

        // templates(s)
        template_page:          'page-template.mustache',
        template_meta_page:     'meta-page-template.mustache',
        template_htaccess:      'htaccess.mustache',

        // .htaccess
        web_htaccess:           '.htaccess',
        data_htaccess:          'config-htaccess.json',

        // index page
        web_index:              'index.html',
        data_index:             'config-index.json',
        data_src_index:         'page.yml',

        // 404 meta page
        web_404:                '404.html',
        data_404:               'config-404.json',
        data_src_404:           '404/page.yml',

        // maintenance meta page
        web_maintenance:        'maintenance.html',
        data_maintenance:       'config-maintenance.json',
        data_src_maintenance:   'maintenance/page.yml',

        // tasks options
        markdown_options: function(){
            return {
                template:       this.md_template,
                htmlExtension:  this.html_ext
            };
        },
        merge_data_options: function(){
            return {
                data:           function(data){ return transformData(data); }
            };
        },
        mustache_render_options: function(){
            return {
                clear_cache:    true,
                directory:      this.templates_dir
            };
        },

        // environment
        getEnvConfigPath:       function() {
            // user environment ?
            var envfile     = this.env_dir + _ENV + '/' + this.data_env,
                userenvfile = this.user_env;
            if (_ENV=='dev' && _GRUNT.file.exists(userenvfile)) {
                return userenvfile;
            } else {
                if (!_GRUNT.file.exists(envfile)) {
                    _GRUNT.fail.fatal('environment config file "'+envfile+'" not found!');
                }
                return envfile;
            }
        }
    },
    _APP_HELP = "\
### \n\
usage:    grunt (-d) (-v) [<task = 'default'>] [--dev] [–-root] [--maintenance] \n\
\n\
tasks:    htaccess          : generate the 'www/.htaccess' file \n\
          index             : generate the 'www/index.html' file (based on 'build/pages/page.yml') \n\
          404               : generate the 'www/404.html' file (based on 'build/pages/404/page.yml') \n\
          maintenance       : generate the 'www/maintenance.html' file (based on 'build/pages/maintenance/page.yml') \n\
          cleanup           : clean all generated and temporary files \n\
          default           : 'htaccess' + 'index' + '404' + 'maintenance' tasks \n\
          rebuild           : 'cleanup' + 'default' tasks \n\
\n\
options:  --dev             : load the 'dev' environment settings \n\
          --root            : use this for 'root.aboutmde.org' \n\
          --maintenance     : use this to enable the 'maintenance' mode \n\
\n\
All logic is stored in the 'Gruntfile.js'. \n\
The special 'test' and 'debug' tasks can be used during development. \n\
### \n\
"
    ;

// custom data transformation
var transformData = function (data)
{
    // current env info
    data.is_dev         = (_ENV==='dev');
    data.is_maintenance = (_FLAGS.maintenance===true);
    data.is_root        = (_FLAGS.root===true);

    if (data.page==undefined) {
        return data;
    }

    // cheatsheet specific
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
    for (var i=0; i<data.env.menu.length; i++) {
        var slug = data.env.menu[i].slug,
            active = data.page.page_active || '';
        if (slug == active) {
            data.env.menu[i].is_active = true;
            data.page.page_link = data.env.menu[i].url;
            if (data.page.page_title == undefined) {
                data.page.page_title = data.env.menu[i].title;
            }
        } else {
            data.env.menu[i].is_active = false;
        }
    }

    // organize contents
    if (data.page.contents != undefined) {
        for (var j=0; j<data.page.contents.length; j++) {
            // markdown content
            if (data.page.contents[j].markdown != undefined) {
                var filename = data.page.contents[j].markdown,
                    mdfile = _APP.tmp_dir + _APP.pages_dir + filename.replace(_APP.html_ext, '') + _APP.html_ext;
                data.page.contents[j].content = _GRUNT.file.read(mdfile);
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

    _GRUNT  = grunt;

    // cli arguments
    var opt;
    for (var index in _APP.default_options) {
        opt = grunt.option(index);
        _FLAGS[index] = opt || _APP.default_options[index];
    }
    // env flag
    if (_FLAGS.dev==true) {
        _ENV = 'dev';
    }
    grunt.log.writeflags(_FLAGS, 'App flags');

    grunt.loadNpmTasks('grunt-markdown');
    grunt.loadNpmTasks('grunt-merge-data');
    grunt.loadNpmTasks('grunt-mustache-render');

    grunt.initConfig({

        markdown: {
            options:            _APP.merge_data_options(),
            index: {
                files: [{
                    expand:     true,
                    src:        _APP.pages_dir + _APP.pages_src_all,
                    dest:       _APP.tmp_dir,
                    ext:        _APP.html_ext
                }]
            }
        },

        merge_data: {
            options:            _APP.merge_data_options(),
            htaccess: {
                src:            [ _APP.getEnvConfigPath() , _APP.data_dir + _APP.data_src_all ],
                dest:           _APP.tmp_dir + _APP.data_htaccess
            },
            index: {
                src:            [ _APP.getEnvConfigPath() , _APP.data_dir + _APP.data_src_all , _APP.pages_dir + _APP.data_src_index ],
                dest:           _APP.tmp_dir + _APP.data_index
            },
            meta_404: {
                src:            [ _APP.getEnvConfigPath() , _APP.data_dir + _APP.data_src_all , _APP.pages_dir + _APP.data_src_404 ],
                dest:           _APP.tmp_dir + _APP.data_404
            },
            meta_maintenance: {
                src:            [ _APP.getEnvConfigPath() , _APP.data_dir + _APP.data_src_all , _APP.pages_dir + _APP.data_src_maintenance ],
                dest:           _APP.tmp_dir + _APP.data_maintenance
            }
        },

        mustache_render: {
            options:            _APP.mustache_render_options(),
            htaccess: {
                files : [{
                    template:   _APP.templates_dir + _APP.template_htaccess,
                    data:       _APP.tmp_dir + _APP.data_htaccess,
                    dest:       _APP.www_dir + _APP.web_htaccess
                }]
            },
            index: {
                files : [{
                    template:   _APP.templates_dir + _APP.template_page,
                    data:       _APP.tmp_dir + _APP.data_index,
                    dest:       _APP.www_dir + _APP.web_index
                }]
            },
            meta_404: {
                files : [{
                    template:   _APP.templates_dir + _APP.template_meta_page,
                    data:       _APP.tmp_dir + _APP.data_404,
                    dest:       _APP.www_dir + _APP.web_404
                }]
            },
            meta_maintenance: {
                files : [{
                    template:   _APP.templates_dir + _APP.template_meta_page,
                    data:       _APP.tmp_dir + _APP.data_maintenance,
                    dest:       _APP.www_dir + _APP.web_maintenance
                }]
            }
        }

    });

    grunt.registerTask('htaccess',      ['merge_data:htaccess','mustache_render:htaccess']);
    grunt.registerTask('index',         ['markdown:index','merge_data:index','mustache_render:index']);
    grunt.registerTask('404',           ['merge_data:meta_404','mustache_render:meta_404']);
    grunt.registerTask('maintenance',   ['merge_data:meta_maintenance','mustache_render:meta_maintenance']);

    grunt.registerTask('cleanup', 'cleanup generated files', function(){
        _GRUNT.file.delete(_APP.tmp_dir);
        _GRUNT.file.delete(_APP.www_dir + _APP.web_htaccess);
        _GRUNT.file.delete(_APP.www_dir + _APP.web_index);
        _GRUNT.file.delete(_APP.www_dir + _APP.web_404);
        _GRUNT.file.delete(_APP.www_dir + _APP.web_maintenance);
    });

    grunt.registerTask('help', 'see cli available options', function() {
        _GRUNT.log.write(_APP_HELP);
    });

    grunt.registerTask('debug', 'show current app options', function() {
        _GRUNT.log.subhead('current app object:');
        _GRUNT.log.writeflags(_APP);
    });

    grunt.registerTask('test', 'a simple test space ...', function() {
        _GRUNT.log.write('todo ...');
    });

    grunt.registerTask('default',       ['htaccess','index','404','maintenance']);
    grunt.registerTask('rebuild',       ['cleanup','default']);
};
