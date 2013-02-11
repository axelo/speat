$(document).ready(function() {
  console.log("speat");

  var sp = getSpotifyApi();
  var models = sp.require('$api/models');
  var views = sp.require('$api/views');
  
  var player = models.player;

  var echonestApiKey = 'HSDJDTVOTOYRSSBCD';

  var currentTrack = player.track;

  var artist = currentTrack.artists[0];
  var title = currentTrack.name;

  getSongAnalysis(echonestApiKey, artist, title)
    .done(function( data ) {
      console.log("OMG", data);

      data.track.codestring = 'HIDDEN';
      data.track.echoprintstring = 'HIDDEN';
      data.track.synchstring = 'HIDDEN';

      var prettyData = JSON.stringify(data, null, 4);

      $('#analysis').html(prettyData);
    })
    .always(function() {
      console.log("That's it!");
    })
    .fail(function() {
      console.log("dayum!");
    });
});

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
