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

var pitch = {
  notation: 'C',
  baseline: 12
}

$(document).ready(function() {
  console.log("speat");

  ctx = document.getElementById('canvas').getContext('2d');

  var currentTrack = player.track;
  var artist = currentTrack.artists[0];
  var title = currentTrack.name;

  getSongAnalysis(echonestApiKey, artist, title)
    .done(function( data ) {
      console.log("OMG", data);

      $("#title").html("speat - " + currentTrack);

      analysis = data;

      player.observe(models.EVENT.CHANGE, function(event) {
        console.log("Something changed!");
      });

      console.log("current position", player.position);

      var duration = data.track.duration * 1000; // in ms

      pixelsPerMs = 1600*10 / duration;

      console.log("pixels / ms", pixelsPerMs);

      // mainLoop();
      pitchCanvas = renderToCanvas(1600*10 + 800, 400, function(ctx) {
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

  ctx.clearRect(0, 0, 800, 400);

  drawPitchNotaion(ctx);
  ctx.drawImage(pitchCanvas, dx, 0, 800, 400, 27.5, 9, 800, 400);

  /*ctx.clearRect(0, 0, 1600, 200);

  drawLines(analysis.tatums, 'purple');
  drawLines(analysis.beats, 'blue');
  drawLines(analysis.bars, 'green');
  drawLines(analysis.sections, 'yellow');

  drawTrackPositionBar();*/
}

function getSongAnalysis(api, artist, title) {
  return $.getJSON(searchSongUrl(api, artist, title))
      .pipe(function(data) {
        return $.getJSON(songAudioSummaryUrl(api, data.response.songs[0].id));
      })
      .pipe(function(data) {
        return $.getJSON(data.response.songs[0].audio_summary.analysis_url);
      });
}

function searchSongUrl(api, artist, title) {
  return encodeURI('http://developer.echonest.com/api/v4/song/search?api_key=' + api + '&title=' + title + '&artist=' + artist);
}

function songAudioSummaryUrl(api, id) {
  return encodeURI('http://developer.echonest.com/api/v4/song/profile?api_key=' + api + '&format=json&id=' + id + '&bucket=audio_summary');
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
  ctx.fillStyle = 'white';

  var baselineSpacing = getPitchNotationBaselineSpacing(14, 400);

  segments.forEach(function(segment, i) {
    //if (i > 0) return;

    var pitch = maxPitch(segment.pitches);
    var xPosition = Math.round(segment.start * 1000 * pixelsPerMs);
    var yPosition = Math.round((pitch + 1) * baselineSpacing + baselineSpacing/4 - 6);
    var width = Math.round(segment.duration * 1000 * pixelsPerMs);

    ctx.fillRect(xPosition, yPosition, width, 11);

    //console.log(xPosition + "," + yPosition + " " + width + ", 10");
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

}());
