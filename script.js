var PLAY_STATES = {
    stopped: 0,
    playing: 1,
    paused: 2
};

var cached = {
    clickCount: 0,
    clickTimer: null,
    defaultArtwork: null,
    mouseDownAt: null,
    rating: null
};


function updateRating(rating) {
    var offClassName = 'off';
    if (cached.rating && rating === cached.rating) return;
    cached.rating = rating;
    $('#rating').children().each(function () {
        if (rating >= parseInt(this.id, 10)) {
            $(this).removeClass(offClassName);
        }
        else {
            $(this).addClass(offClassName);
        }
    });
}


function bowtieThemeReady() {
    // Grab the default artwork image from the HTML.
    cached.defaultArtwork = $('#artwork').attr('src');

    $('#artwork').bind('mousedown', function (e) {
        cached.mouseDownAt = new Date();
    });

    // Album cover single-click to play/pause, double-click to advance to the
    // next track, triple-click to return to the previous track.
    $('#artwork').bind('click', function (e) {
        // Attempt to ignore drags.
        var clickDuration = new Date() - cached.mouseDownAt;
        if (clickDuration > 500) return;

        ++cached.clickCount;
        clearTimeout(cached.clickTimer);
        cached.clickTimer = setTimeout(function () {
            if (iTunes.playState() !== PLAY_STATES.playing) {
                iTunes.playPause();
            }
            else {
                switch (cached.clickCount) {
                    case 1: iTunes.playPause(); break;
                    case 2: iTunes.nextTrack(); break;
                    case 3: iTunes.previousTrack(); break;
                }
            }
            cached.clickCount = 0;
        }, 200);
    });

    // Update the rating on click.
    $('#rating').bind('click', function (e) {
        if (e.target.tagName.toLowerCase() === 'a') {
            var newRating = parseInt(e.target.id, 10);
            iTunes.setRating(newRating);
            updateRating(newRating);
        }
        return false;
    });
}


function bowtieArtworkChange(url) {
    url = url || cached.defaultArtwork;
    $('figure').addClass('swapping');
    $('#artwork-cache').attr('src', url)
        .bind('webkitTransitionEnd', function () {
            $('#artwork').attr('src', url);
            $('figure').removeClass('swapping');
        });
}


function bowtiePlayStateChange(state) {
    if (state === PLAY_STATES.playing) {
        $('body').removeClass('paused');
    }
    else {
        $('body').addClass('paused');
    }
}


function bowtieTrackChange(track) {
    $('#title').text($.trim(track.property('title')));
    $('#artist').text($.trim(track.property('artist')));
    $('#album').text($.trim(track.property('album')));
    bowtiePolling();
}


function bowtiePolling () {
    // Update rating and track progress.
    var track = iTunes.currentTrack();
    updateRating(iTunes.rating());
    if (track) {
        var percent = Math.round(
            iTunes.playerPosition() / track.property('length') * 100);
        $('#progress mark').css('width', percent + '%');
    }
}
