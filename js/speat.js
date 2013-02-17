(function() {

var echonestApiKey = 'HSDJDTVOTOYRSSBCD';
var sp = getSpotifyApi();
var models = sp.require('$api/models');
var views = sp.require('$api/views');
var player = models.player;

var ctx;
var pixelsPerMs = 0;

var analysis;

var pitchCanvas;

var colorList = [rgb(255,64,64), rgb(255,170,0), rgb(255,251,191), rgb(255,238,0), rgb(170,255,0), rgb(64,191,255), rgb(191,200,255), rgb(68,0,255), rgb(255,128,246), rgb(255,128,162), rgb(61,133,242), rgb(61,85,242), rgb(229,161,115), rgb(115,230,130), rgb(217,58,0), rgb(54,217,184), rgb(163,206,217), rgb(173,0,217), rgb(217,163,177), rgb(204,173,153), rgb(156,102,204), rgb(204,0,109), rgb(0,179,191), rgb(152,179,45), rgb(0,24,179), rgb(164,134,179), rgb(178,45,62), rgb(166,88,0), rgb(153,130,38), rgb(35,105,140), rgb(100,128,96), rgb(128,0,119), rgb(115,101,86), rgb(15,115,0), rgb(29,63,115), rgb(102,27,0), rgb(51,102,99), rgb(102,77,90), rgb(89,57,45), rgb(89,60,0), rgb(89,22,67), rgb(61,77,0), rgb(9,0,64), rgb(51,0,0), rgb(51,34,0), rgb(38,51,40), rgb(0,51,14), rgb(13,38,51)];

function rgb(r, g, b) { return 'rgb(' + r + ',' + g + ',' + b + ')'; }

console.log("color list length", colorList.length);

$(document).ready(function() {
  console.log("speat");

  ctx = document.getElementById('canvas').getContext('2d');

  var currentTrack = player.track;
  var artist = currentTrack.artists[0];
  var title = currentTrack.name;

  getSongAnalysis(echonestApiKey, currentTrack.uri)
    .done(function( data ) {
      console.log("OMG", data);

      $("#title").html("speat - " + currentTrack);

      analysis = data;

      player.observe(models.EVENT.CHANGE, function(event) {
        console.log("Something changed!");
      });

      console.log("current position", player.position);

      var duration = data.track.duration * 1000; // in ms

      pixelsPerMs = 2000*10 / duration;

      console.log("pixels / ms", pixelsPerMs);

      pitchCanvas = renderToCanvas(2000*10 + 1200, 400, function(ctx) {
        drawPitch(ctx, analysis.segments);
      });

      mainLoop();

    })
    .always(function() {
      console.log("That's it!");
    })
    .fail(function() {
      console.log("dayum!");
    });
});

function mainLoop() {
  webkitRequestAnimationFrame(mainLoop);

  var dx = player.position * pixelsPerMs;

  ctx.clearRect(0, 0, 1200, 400);

  drawPitchNotaion(ctx);
  ctx.drawImage(pitchCanvas, dx, 0, 1200, 400, 27.5, 0, 1200, 400);

  /*ctx.clearRect(0, 0, 1600, 200);

  drawLines(analysis.tatums, 'purple');
  drawLines(analysis.beats, 'blue');
  drawLines(analysis.bars, 'green');
  drawLines(analysis.sections, 'yellow');

  drawTrackPositionBar();*/
}

function getSongAnalysis(api, trackUri) {
  return $.getJSON(songAudioSummaryUrl(api, trackUri))
      .pipe(function(data) {
        return $.getJSON(data.response.songs[0].audio_summary.analysis_url);
      });
}

function songAudioSummaryUrl(api, trackUri) {  
  trackUri = trackUri.replace('spotify', 'spotify-WW')
  return encodeURI('http://developer.echonest.com/api/v4/song/profile?api_key=' + api + '&format=json&track_id=' + trackUri + '&bucket=audio_summary');
}

function drawTrackPositionBar() {
  var xPosition = player.position * pixelsPerMs;

  ctx.fillStyle = 'red';
  ctx.fillRect(xPosition, 0, 2, 200);
}

function drawLines(what, color) {
  ctx.fillStyle = color;

  what.forEach(function(w) {
    var xPosition = w.start * 1000 * pixelsPerMs;
    ctx.fillRect(xPosition, 0, 2, 200);
  });
}

function drawPitchNotaion(ctx) {
  var notations = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var fontSize = 14;
  var spacing = getPitchNotationBaselineSpacing(fontSize, 400);

  ctx.save();
  ctx.font = fontSize + "px Arial";
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'gray';
  ctx.lineWidth = 1;
  ctx.translate(2 + 0.5, Math.round(notations.length * spacing + spacing/4) + 0.5);

  notations.forEach(function(notation) {
    ctx.translate(0, -spacing);
    ctx.fillText(notation, 0, 0);

    ctx.beginPath();
    ctx.moveTo(fontSize*2, Math.round(spacing/4));
    ctx.lineTo(1600, Math.round(spacing/4));
    ctx.stroke();
  });
  ctx.restore();
}

function drawPitch(ctx, segments) {

  var clusters = clusterSegments(segments, 0.8);

  var baselineSpacing = getPitchNotationBaselineSpacing(14, 400);

  clusters.forEach(function(cluster, clusterIndex) {
    cluster.forEach(function(segment) {

      var xPosition = Math.floor(segment.start * 1000 * pixelsPerMs);
      var width = Math.floor(segment.duration * 1000 * pixelsPerMs);

      ctx.fillStyle = colorList[clusterIndex];
      ctx.fillRect(xPosition - 1, 0, width + 1, 400);

      segment.pitches.forEach(function(pitchVal, pitch) {        
        var yPosition = Math.floor(pitch * baselineSpacing + baselineSpacing / 2 - 6);
        
        var cc = pitchVal;
        ctx.fillStyle = 'rgba(255, 255, 255, ' + cc + ')';

        ctx.fillRect(xPosition, yPosition, width, 11);
      });

    });

  });
}

function getPitchNotationBaselineSpacing(fontSize, height) {
  return Math.round(fontSize + (height / 12 - fontSize));
}

function maxPitch(pitches) {
  var maxPitch = 0;
  var index = 0;

  pitches.forEach(function(pitch, i) {
    if (pitch > maxPitch) {
      maxPitch = pitch;
      index = i;
    }
  });

  return index;
}

var renderToCanvas = function (width, height, renderFunction) {
  var buffer = document.createElement('canvas');
  buffer.width = width;
  buffer.height = height;
  renderFunction(buffer.getContext('2d'));
  return buffer;
};

function euclidianNorm(vs) {
  var norm = 0;
  vs.forEach(function(v) {
    norm += v * v;
  });
  return Math.sqrt(norm);
}


function clusterSegments(segments, tolerance) {
  segments.forEach(function(segment) {
    segment.metric = euclidianNorm(segment.timbre);
  });

  segments.sort(function(a,b) {
    return a.metric - b.metric;
  });
  
  var clusters = [[]];
  var lastMetric = segments[0].metric;

  segments.forEach(function(segment) {
    if (!isWithinTolerance(segment.metric, lastMetric, tolerance)) clusters.push([]);

    clusters[clusters.length - 1].push(segment);

    lastMetric = segment.metric;
  });

  console.log("num of clusters", clusters.length);
  console.log("clusters", clusters);

  return clusters;
}

function isWithinTolerance(newMetric, currentMetric, tolerance) {
  return Math.abs(newMetric - currentMetric) <= tolerance;
}

}());
