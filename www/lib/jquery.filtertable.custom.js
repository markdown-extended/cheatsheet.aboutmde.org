/**
 * jquery.filterTable
 *
 * This plugin will add a search filter to tables. When typing in the filter,
 * any rows that do not contain the filter will be hidden.
 *
 * Utilizes bindWithDelay() if available. https://github.com/bgrins/bindWithDelay
 *
 * @version v1.5
 * @author Sunny Walker, swalker@hawaii.edu
 */
(function($) {
	var jversion = $.fn.jquery.split('.'), jmajor = parseFloat(jversion[0]), jminor = parseFloat(jversion[1]);
	if (jmajor<2 && jminor<8) { // build the pseudo selector for jQuery < 1.8
		$.expr[':'].filterTableFind = function(a, i, m) { // build the case insensitive filtering functionality as a pseudo-selector expression
            var _match = false;
            if ($(a).data('filter-value')!==undefined) {
                _match = $(a).data('filter-value').toUpperCase().indexOf(m[3].toUpperCase())>=0;
            } else {
                _match = $(a).text().toUpperCase().indexOf(m[3].toUpperCase())>=0;
            }
            return _match;
		};
	} else { // build the pseudo selector for jQuery >= 1.8
		$.expr[':'].filterTableFind = jQuery.expr.createPseudo(function(arg) {
			return function(el) {
			    var _match = false;
			    if ($(el).data('filter-value')!==undefined) {
    				_match = $(el).data('filter-value').toUpperCase().indexOf(arg.toUpperCase())>=0;
			    } else {
    				_match = $(el).text().toUpperCase().indexOf(arg.toUpperCase())>=0;
			    }
				return _match;
			};
		});
	}
	$.fn.filterTable = function(options) { // define the filterTable plugin
		var defaults = { // start off with some default settings
				callback:          null,                // callback function: function(term, table){}
				containerClass:    'filter-table',      // class to apply to the container
				containerTag:      'p',                 // tag name of the container
				hideTFootOnFilter: false,               // if true, the table's tfoot(s) will be hidden when the table is filtered
				highlightClass:    'alt',               // class applied to cells containing the filter term
				inputName:         '',                  // name of filter input field
				inputType:         'search',            // tag name of the filter input tag
				label:             'Filter:',           // text to precede the filter input tag
				minRows:           8,                   // don't show the filter on tables with less than this number of rows
				placeholder:       'search this table', // HTML5 placeholder text for the filter field
				quickList:         [],                  // list of phrases to quick fill the search
				quickListClass:    'quick',             // class of each quick list item
				quickListGroupTag: '',                  // tag surrounding quick list items (e.g., ul)
				quickListTag:      'a',                 // tag type of each quick list item (e.g., a or li)
				visibleClass:      'visible',           // class applied to visible rows
				filterContainer: 	null,				// id of an existing filter container 
				quickListContainer: null				// id of an existing quick list container 
			},
			hsc = function(text) { // mimic PHP's htmlspecialchars() function
				return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			},
			settings = $.extend({}, defaults, options); // merge the user's settings into the defaults

		var doFiltering = function(table, q) { // handle the actual table filtering
				var tbody=table.find('tbody'); // cache the tbody element
				if (q==='') { // if the filtering query is blank
					tbody.find('tr').show().addClass(settings.visibleClass); // show all rows
					tbody.find('td').removeClass(settings.highlightClass); // remove the row highlight from all cells
					if (settings.hideTFootOnFilter) { // show footer if the setting was specified
						table.find('tfoot').show();
					}
				} else { // if the filter query is not blank
					tbody.find('tr').hide().removeClass(settings.visibleClass); // hide all rows, assuming none were found
					if (settings.hideTFootOnFilter) { // hide footer if the setting was specified
						table.find('tfoot').hide();
					}
					// highlight (class=alt) only the cells that match the query and show their rows
					tbody.find('td').removeClass(settings.highlightClass);
					$.each(tbody.find('td').filter(':filterTableFind("'+q.replace(/(['"])/g,'\\$1')+'")'), function() {
                        var _td = $(this),
                            _tr = _td.closest('tr');
                        _td.addClass(settings.highlightClass);
                        if (_tr.data('rows')!==undefined) {
                            _tr.show().addClass(settings.visibleClass);
                            var _ntr = _tr;
                            for (i=1; i<=(_tr.data('rows')-1); i++) {
                                _ntr = _ntr.next('tr');
                                _ntr.show().addClass(settings.visibleClass);
                            }
                        } else {
                            _tr.show().addClass(settings.visibleClass);
                        }
					});
				}
				if (settings.callback) { // call the callback function
					settings.callback(q, table);
				}
			}; // doFiltering()

		return this.each(function() {
			var t = $(this), // cache the table
				tbody = t.find('tbody'), // cache the tbody
				container = null, // placeholder for the filter field container DOM node
				quicks = null, // placeholder for the quick list items
				filter = null; // placeholder for the field field DOM node
			if (t[0].nodeName==='TABLE' && tbody.length>0 && (settings.minRows===0 || (settings.minRows>0 && tbody.find('tr').length>settings.minRows)) && !t.prev().hasClass(settings.containerClass)) { // only if object is a table and there's a tbody and at least minRows trs and hasn't already had a filter added
				if (settings.filterContainer!==null && $(settings.filterContainer).length>0) {
					container = $(settings.filterContainer); // get the existing container tag for the filter field
					var label = container.find('label');
					if (label===undefined || label.length==0) {
						container.prepend(settings.label+' '); // add the label for the filter field
					}
					filter = $(container).find('input[name="'+settings.inputName+'"]'); // get the filter field
				} else {
					container = $('<'+settings.containerTag+' />'); // build the container tag for the filter field
					container.prepend(settings.label+' '); // add the label for the filter field
					filter = $('<input type="'+settings.inputType+'" placeholder="'+settings.placeholder+'" name="'+settings.inputName+'" />'); // build the filter field
					container.append(filter); // add the filter field to the container
					t.before(container); // add the filter field and quick list container to just before the table
				}
				if (settings.containerClass!=='') { // add any classes that need to be added
					container.addClass(settings.containerClass);
				}
				if ($.fn.bindWithDelay) { // does bindWithDelay() exist?
					filter.bindWithDelay('keyup', function() { // bind doFiltering() to keyup (delayed)
						doFiltering(t, $(this).val());
					}, 200);
				} else { // just bind to onKeyUp
					filter.bind('keyup', function() { // bind doFiltering() to keyup
						doFiltering(t, $(this).val());
					});
				} // keyup binding block
				filter.bind('click search blur', function() { // bind doFiltering() to click and search events
					doFiltering(t, $(this).val());
				});
				if (filter.val()!=='') { // if value on load
				    doFiltering(t, filter.val());
				}
				if (settings.quickList.length>0) { // are there any quick list items to add?
                    if (settings.quickListContainer!==null && $(settings.quickListContainer).length>0) {
    					quicks = $(settings.quickListContainer); // get the existing container tag for the quick list
                    } else {
    					quicks = settings.quickListGroupTag ? $('<'+settings.quickListGroupTag+' />') : container;
                    }
					$.each(settings.quickList, function(index, value) { // for each quick list item...
						var q = $('<'+settings.quickListTag+' class="'+settings.quickListClass+'" />'); // build the quick list item link
						q.text(hsc(value)); // add the item's text
						if (q[0].nodeName==='A') {
							q.attr('href', '#'); // add a (worthless) href to the item if it's an anchor tag so that it gets the browser's link treatment
						}
						q.bind('click', function(e) { // bind the click event to it
							e.preventDefault(); // stop the normal anchor tag behavior from happening
							filter.val(value).focus().trigger('click'); // send the quick list value over to the filter field and trigger the event
						});
						
						console.debug(quicks);
						
						quicks.append(q); // add the quick list link to the quick list groups container
					}); // each quick list item
					if (quicks!==container && (settings.quickListContainer===null || $(settings.quickListContainer).length==0)) {
						container.append(quicks); // add the quick list groups container to the DOM if it isn't already there
					}
				} // if quick list items
			} // if the functionality should be added
		}); // return this.each
	}; // $.fn.filterTable
})(jQuery);
