(function() {

var echonestApiKey = 'HSDJDTVOTOYRSSBCD';
var sp = getSpotifyApi();
var models = sp.require('$api/models');
var views = sp.require('$api/views');
var player = models.player;

var ctx;
var pixelsPerMs = 0;

var analysis;

$(document).ready(function() {
  console.log("speat");

  ctx = document.getElementById('canvas').getContext('2d');

  var currentTrack = player.track;
  var artist = currentTrack.artists[0];
  var title = currentTrack.name;

  getSongAnalysis(echonestApiKey, artist, title)
    .done(function( data ) {
      console.log("OMG", data);

      analysis = data;

      player.observe(models.EVENT.CHANGE, function(event) {
        console.log("Something changed!");
      });

      console.log("current position", player.position);

      var duration = data.track.duration * 1000; // in ms

      pixelsPerMs = 1600 / duration;

      console.log("pixels / ms", pixelsPerMs);
  
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

  ctx.clearRect(0, 0, 1600, 200);

  drawBeats(analysis.beats);
  drawBars(analysis.bars);
  drawTrackPositionBar();
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

function drawBars(bars) {
  ctx.fillStyle = 'green';

  bars.forEach(function(bar) {
    var xPosition = bar.start * 1000 * pixelsPerMs;
    ctx.fillRect(xPosition, 0, 2, 200);
  });
}

function drawBeats(beats) {
  ctx.fillStyle = 'blue';

  beats.forEach(function(beat) {
    var xPosition = beat.start * 1000 * pixelsPerMs;
    ctx.fillRect(xPosition, 0, 2, 200);
  });
}

}());
