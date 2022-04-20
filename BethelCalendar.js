var BethelCalendar = {

    token: "",

    dates: {
        begin: {},
        end: {}
    },
    category: "",

    data: [],

    routes: {
        default: "http://localhost:8080/data/calendar-items-04-05-22.html"
    },

    canvas: false,
    templateDay: "",
    templateItem: "",

    currentView: "grid",

    init: function( conf ) {

        window.cal = this;

        /**
         * Get URL paramaters, set initial begin and end dates
         */

        var url = window.location.href;
        var b = e = false;

        if ( url.indexOf("calendar-begin") > 1 && cal.getURLParameter("calendar-begin") != null ) {
            b = cal.getURLParameter("calendar-begin");
        }
        if ( url.indexOf("calendar-end") > 1 && cal.getURLParameter("calendar-end") != null ) {
            e = cal.getURLParameter("calendar-end");
        }

        cal.createDates(b,e);
        cal.canvas = cal.eID(conf.canvas_id);
        cal.templateDay = conf.template_day;
        cal.templateItem = conf.template_item;

        /**
         * Autoload
         */

        if ( conf.autoload == true ) {

            cal.createCalendar();
        }

        cal.uiFilterListeners();

    },

    createDates: function(begin ,end = false) {

        begin = cal.dateCalc(0,begin);
        if ( begin["object"] == "Invalid Date" ) {
            begin = cal.dateCalc(0);
        }
        
        if ( end == false ) {
            end = cal.dateCalc(13,begin["unformatted"]);
        }
        else {
            end = cal.dateCalc(0,end);
            if ( end["object"] == "Invalid Date" ) {
                end = cal.dateCalc(13,begin["unformatted"]);
            }
            var diff = (end["object"].getTime() - begin["object"].getTime()) / (1000 * 60 * 60 * 24);
            if ( diff > 30 ) {
                end = cal.dateCalc(30,begin["unformatted"]);
            }
        }

        cal.dates["begin"] = begin;
        cal.dates["end"] = end;

        console.log(cal.dates);

    },

    createCalendar: function() {

        cal.canvas.innerHTML = "";
        cal.data = [];

        cal.createDays();

        var params = {
            begin:window.cal.dates.begin["unformatted"],
            end:window.cal.dates.end["unformatted"],
            category:window.cal.category,
            offset:0,
            limit:1000
        }

        window.cal.dataLoader(cal.createItems,params);
        
        // TODO Was there 100 items? Let's load page 2. (Future)
        // TODO Does it span multiple weeks or months? Let's load second end point. (Future)

    },

    createDays: function() {

        cal.data = [];
        for(var currentDate = new Date(cal.dates["begin"]["object"]); currentDate <= new Date(cal.dates["end"]["object"]); currentDate.setDate(currentDate.getDate() + 1)) {
            var d = cal.dateCalc(0, currentDate);
            cal.data[d["unformatted"]] = {
                "date": d["object"],
                "items" : []
            };

            cal.uiAddDay(d["object"],"calendar-day-"+d["unformatted"]);
        }

    },

    createItems: function( items ) {

        items.forEach(function(item) {
            if ( typeof cal.data[item["start_date"]] !== 'undefined' ) { // Looks like the item is within our accepted date range
                
                cal.data[item["start_date"]]["items"].push(item);
                cal.uiAddItem("calendar-day-"+item["start_date"],item);
            }
        });

        cal.uiVisibleDays();
    },

    filterCalendarByCategory: function() {

    },

    /**
     * External Data Loading
     * Default Params could be: begin,end,category,limit,offset
     * Endpoint can be any URL, defaults to routes.default value
     * Translator used to parse the data and render JS object
     */
    dataLoader: function( foo, params = false, endpoint = false, method = "GET", token = false ) {

        // Call our default if none is set
        if ( endpoint == false) {
            endpoint = cal.routes["default"];
        }
        // Append Params for GET queries
        if ( method == "GET" || method == "" ) {
            var str = "";
            for (var key in params) {
                str += ( (str != "") ? "&" : "") + key + "=" + encodeURIComponent(params[key]);
            }
            if ( str.length > 0 ) {
                endpoint += "?" + str;
            }
        }

        // Do the work
        var xhttp = new XMLHttpRequest();
        
        /* Webflow ugly doc*/
        xhttp.responseType = "document";

        xhttp.onreadystatechange = function() {
            if ( this.readyState == 4 ) {

                cal.uiRemoveLoaders();

                if ( this.status == 200 || this.status == 201 ) { // Ok or Resource Created
                    
                    if ( this.getResponseHeader('content-type').indexOf("json") > 0 ) { // If it's JSON, let's parse it cause we did it right!
                        //return cal.translateResponse(JSON.parse(this.responseText));
                    }
                    else {
                        /* Webflow ugly doc*/
                        return foo(cal.parseWebflowHTMLItems(xhttp.responseXML));
                    }

                }
                else {
                    // TODO display error output in UI
                }

            }
        }
        xhttp.open(method, endpoint, true);

        //xhttp.setRequestHeader('content-type', 'application/json');
        //xhttp.setRequestHeader('content-type', 'text/html');

        xhttp.send(params);
    },

    /* Data Translater */
    translateResponse: function( r ) {

        if ( typeof r === 'object' ) { // If OBJECT -> CONGRATS, you've managed to do it right.
            
            // TODO Return only the relevant data
        }
        else {
            
        }

    },

    /* Webflow ugly doc parser */
    parseWebflowHTMLItems: function ( doc ) {

        var data = [];

        doc.querySelectorAll('.data-calendar-item').forEach(function(entry) {
            var categories = [];
            entry.querySelectorAll('.data-category').forEach(function(cat) {
                categories.push(cat.innerHTML.replace("amp;",""));
            });
            var d = {
                'title':entry.querySelectorAll('.data-title')[0].innerHTML,
                'details':entry.querySelectorAll('.data-details')[0].innerHTML.replace("amp;",""),
                'start_date':entry.querySelectorAll('.data-start-date')[0].innerHTML.substring(0, 10),
                'end_date':entry.querySelectorAll('.data-end-date')[0].innerHTML,
                'link':entry.querySelectorAll('a')[0].href,
                'categories':categories
            };
            
            data.push(d);
        });

        return data;
    },

    /**
     * Date calculalator, parser, and formatter
     * Offset = Return date that is number of days from default or passed string
     * day = Pass a date to work from. Defaults to today + offset if no value is set. Format: YYYY-MM-DD
     * */
    dateCalc: function( offset, day = false ) {

        var r = [];
        if ( typeof day === 'string' || day instanceof String ) { // String passed
            // TODO - Make sure this user passed value is A-OK
            var parts = day.split('-');
            var t = new Date(parts[0], parts[1] - 1, parts[2]);
        }
        else if ( day instanceof Date ) {  // Date object passed
            var t = day;

        }
        else {  // Nothing meaningful passed
            var t = new Date();
        }

        t.setDate(t.getDate() + offset);
        var d = t.getDate();
        var m = t.getMonth() + 1;
        var y = t.getFullYear();
        r["formatted"] = m+'/'+d+'/'+y;
        r["unformatted"] = y+'-'+m.toString().padStart(2,0)+'-'+d.toString().padStart(2,0);
        r["object"] = t;
        return r;
    },

    getURLParameter: function ( name ) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
    },

    /* UI Functions */

    /** Remove loader UI elements */
    uiRemoveLoaders: function() {
        var loaders = cal.eClass("bethel-calendar-loader");
        for(var i = 0, length = loaders.length; i < length; i++) {
            loaders[i].remove();
        }
    },

    uiAddDay: function( day, id, items = [] ) {
        var html = cal.templateDay;

        html = html.replace("{id}",id);
        html = html.replace("{day-class}","calendar-day");
        html = html.replace("{day-items-class}","calendar-day-items");
        html = html.replace("{day}",day.getDate().toString().padStart(2,0));
        html = html.replace("{weekday}",day.toLocaleString("en-US", { weekday: "long" }));
        html = html.replace("{month}",day.toLocaleString("en-US", { month: "short" }));

        var html_items = "";

        html = html.replace("{items}","");

        cal.canvas.innerHTML += html;

        cal.uiVisibleDays();

    },

    uiAddItem: function ( id, item ) {

        var html = cal.templateItem;
        html = html.replace("{link}",item.link);
        html = html.replace("{title}",item.title);
        html = html.replace("{details}",item.details);

        var categories_html = "";

        for ( i = 0; i < item.categories.length; i++ ) {
            categories_html += "|"+item.categories[0]+"|";
        }

        html = html.replace("{categories}",categories_html);

        cal.eID(id).getElementsByClassName("calendar-day-items")[0].innerHTML += html;

    },

    uiVisibleDays: function () {
        var days = cal.canvas.querySelectorAll("div.calendar-day");
        days.forEach(function(d, index) {
            var isVisible = false;
            var items = d.querySelectorAll("div.calendar-list-item");
            items.forEach(function(i) {
                if ( i.classList.contains("calendar-hidden") == false ) {
                    isVisible = true;
                }
            });

            if ( isVisible == false ) {
                d.classList.add("calendar-hidden");
            }
            else {
                d.classList.remove("calendar-hidden");
            }
        });
    },

    uiVisibleCategory: function ( category ) {
        // Show all events that have this category, hide all events that don't. Re-run uiVisibleDays

        
        var items = cal.canvas.querySelectorAll("div.calendar-list-item");

        items.forEach(function(i) {
            var atr = i.getAttribute("categories");
            if ( category.length == 0 || atr.indexOf("|"+category+"|") > -1) {
                i.classList.remove("calendar-hidden");
            }
            else {
                i.classList.add("calendar-hidden");
            }
        });

        cal.uiVisibleDays();

    },
    
    uiFilterListeners: function() {
        // Date Change
        cal.eID("calendar-date-filter-go").addEventListener("click", function() {

            // Get date
            var b = e = false;
            var d = cal.eID("calendar-date-filter").value;
            d = d.split("-");
            d[0] = d[0].trim();
            if ( d[0] !== undefined && d[0].length >= 8 ) {
                d[0] = d[0].split("/");
                b = d[0][2]+"-"+d[0][0]+"-"+d[0][1];
            }
            if ( d[1] !== undefined && d[1].length >= 8 ) {
                d[1] = d[1].split("/");
                e = d[1][2]+"-"+d[1][0]+"-"+d[1][1];
            }
            else {
                e = b;
            }

            cal.createDates(b,e);
            cal.createCalendar();

        });

        // Category Change
        var catsList = cal.eID("calendar-category-dropdown").querySelectorAll("a.calendar-category-link");
        catsList.forEach(function(c, index) {
            c.addEventListener("click", function(event) {
                event.preventDefault();

                var n = this.innerHTML.replace("&amp;","&");
                
                cal.eID("calendar-filter-category-text").innerHTML = n;

                if ( n == "View All Categories" ) {
                    n = "";
                }
                cal.uiVisibleCategory( n );
                
            });
        });

        // List/Grid View Change
        cal.eID("toggle-list-view").addEventListener('click', () => {
            cal.canvas.classList.add("list-view");
            cal.currentView = "list";
        });

        cal.eID("toggle-grid-view").addEventListener('click', () => {
            cal.canvas.classList.remove("list-view");
            cal.currentView = "grid";
        });
    },

    /* Function Shortcuts */

    eID: function (i) {
        return document.getElementById(i);
    },
    eClass: function (c) {
        return document.getElementsByClassName(c);
    },
    eCreate: function(e) {
        return document.createElement(e);
    },

}