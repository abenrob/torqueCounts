var map = L.map('map',{
    zoomControl: false,
    attributionControl: false,
    center: [39.828175, -98.5795],
    zoom: 4
});

var CartoDB_DarkMatterNoLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 18
}).addTo(map);

var style =
'Map {' +
    '-torque-frame-count:512;' +
    '-torque-animation-duration:8;' +
    '-torque-time-attribute:"loc_date";' +
    '-torque-aggregation-function:"count(cartodb_id)";' +
    '-torque-resolution:2;' +
    '-torque-data-aggregation:cumulative;' +
'}' +
'#timestamped_locations{' +
    'comp-op: lighter;' +
    'marker-fill-opacity: 0.2;' +
    'marker-line-color: #FFF;' +
    'marker-line-width: 0;' +
    'marker-line-opacity: 1;' +
    'marker-type: ellipse;' +
    'marker-width: 2;' +
    'marker-fill: #09929e;' +
'}' +
'#timestamped_locations[frame-offset=1] {' +
    'marker-width:4;' +
    'marker-fill-opacity:0.1; ' +
'}' +
'#timestamped_locations[frame-offset=2] {' +
    'marker-width:6;' +
    'marker-fill-opacity:0.05; ' +
'}' +
'#timestamped_locations[frame-offset=3] {' +
    'marker-width:8;' +
    'marker-fill-opacity:0.03333333333333333; ' +
'}' +
'#timestamped_locations[frame-offset=4] {' +
    'marker-width:10;' +
    'marker-fill-opacity:0.025; ' +
'}' +
'#timestamped_locations[frame-offset=5] {' +
    'marker-width:12;' +
    'marker-fill-opacity:0.02; ' +
'}' +
'#timestamped_locations[frame-offset=6] {' +
    'marker-width:14;' +
    'marker-fill-opacity:0.016666666666666666; ' +
'}';

var torqueLayer;
var counts = [];
var curTot = 0;
var firstDay, lastDay, numDays;
var maxYear = 0, maxCount = 0;

function setTorque(){
    torqueLayer = new L.TorqueLayer({
        user: 'abenrob',
        table: 'Timestamped_locations',
        cartocss: style.replace('alldayz',String(numDays)),
        blendmode: 'lighter',
        tiler_protocol: 'https',
        loop: false,
        tiler_port: 443
    });

    torqueLayer.addTo(map);
};

function playTorque(){
    torqueLayer.setStep(1);
    torqueLayer.on('change:time', function(changes) {
        var torqueDate = changes.time.toDateString();
        var tYear = changes.time.getFullYear()||firstDay.getFullYear();

        var match = _.find(counts, function(rec){
            var thisDate = new Date(rec.date).toDateString();
            return thisDate == torqueDate;
        });

        if (match) {
            curTot = match.count
        }

        maxYear = Math.max(maxYear,tYear);
        maxCount = Math.max(maxCount,curTot);

        $('#counter').html(tYear+': '+curTot.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        // when we hit max 
        if (changes.step === torqueLayer.options.steps) { 
            // remove change watch  
            torqueLayer.off('change:time');
            // pause in case changes object catches max before pauseMax
            torqueLayer.pause();
            // fade in play control after 3 seconds
            window.setTimeout(function(){$('#playControl').fadeIn();},3000);
        }
    });

    torqueLayer.play();
    $('#playControl').fadeOut();
    
};

function clearPlay(){
    torqueLayer.off('change:time');
    torqueLayer.stop();
    $('#counter').html('');
    curTot = 0;
    playTorque();
};

var qry = 'SELECT DISTINCT date_part(\'epoch\',loc_date)*1000 AS date,count(*) OVER (ORDER BY date_trunc(\'day\', "loc_date")) AS count FROM   timestamped_locations ORDER  BY 1';

$.ajax({
    url: "http://abenrob.cartodb.com/api/v2/sql?q="+qry,
    dataType: "json",
    cache: true,
    success: function (data) {
        counts = data.rows;
        firstDay = new Date(counts[0].date);
        lastDay = new Date(counts[counts.length-1].date);
        numDays = (lastDay-firstDay)/(1000*60*60*24);
        setTorque();
        $('#playControl').on('click',function(){
            clearPlay();
        })
    }
});

