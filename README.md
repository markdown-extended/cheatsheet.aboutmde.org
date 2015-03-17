Page model for aboutmde.org
===========================


Usage of the model
------------------

Create a new GIT repository:

    $ mkdir my-aboutmde-page && cd $_
    $ git init

Install dependencies with [npm](https://www.npmjs.com/):

    $ npm install

Then, setup your repository to "fork" the original <http://github.com/markdown-extended/page-model>:

    $ git remote add upstream https://github.com/markdown-extended/page-model.git
    $ git remote update
    $ git pull upstream master

Then you can update the following files to customize the page:

    data/page.yml                       // required
    templates/page-content.mustache     // optional
    templates/page-styles.mustache      // optional
    templates/page-scripts.mustache     // optional

Then run [Grunt](http://gruntjs.com/):

    $ grunt
    # or
    $ grunt --debug --verbose

The page is finally generated as `www/index.html`.

To auto-synchronize the website on the server with [DevTools](http://github.com/piwi/dev-tools), 
you MUST update the `.devtools` config file:

    DEFAULT_SYNC_SERVER="-f ../aboutmde-ftp.conf www/{SUBDIR}"


Dependencies
------------

### NPM plugins

-   <http://gruntjs.com/>
-   <https://www.npmjs.com/package/grunt-mustache-render>
-   <https://github.com/janl/mustache.js/>
-   <https://github.com/shinnn/grunt-merge-data>
-   <https://github.com/shinnn/grunt-markdown>

### External assets libraries

-   <http://jquery.com> (manual: <http://api.jquery.com/>)
-   <http://getbootstrap.com>
-   <http://fortawesome.github.io/Font-Awesome/> (icons list: <http://fortawesome.github.io/Font-Awesome/icons/>)
