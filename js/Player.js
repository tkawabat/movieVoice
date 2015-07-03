'use strict';

(function(NS) {
/**
 * 録音機など含めプレーヤーの実装
 * UI部分への命令も担当
 *
 * @param movie videoタグのid
 * @param audio audioタグのid
 **/
var Player = function(movie, audio) {
    this.movie = null;
    this.audio = []; // 0番目は録音したもの
    this.recorder = new NS.Recorder();

    this.setMovie(movie);
    this.addAudio(audio);
    this.adaptEnv();
}

Player.prototype.adaptEnv = function(id) {
    if (!window.HTMLAudioElement) {
        alert('audio機能が未対応のブラウザです。');
    }

    return true;
}

Player.prototype.setMovie = function(id) {
    var that = this
    ;

    videojs(id, {}, function(){
        that.movie = this;
        that.movie.on('seeked', function() {
            var time = that.movie.currentTime();
            if (!that.audio) {
                audio.currentTime = time;
            }
        });
    });
}

Player.prototype.addAudio = function(id) {
    this.audio.push(document.getElementById(id));
}

Player.prototype.record = function() {
    this.seek(0);
    this.play();
    this.audio[0].pause(); // 録音ラインだけストップ
    this.recorder.start();
}

Player.prototype.recordStop = function() {
    this.recorder.stop();
    this.pause();
    this.audio[0].src = this.recorder.exportWav();
    this.seek(0);
}

Player.prototype.play = function() {
    this.seek(0);
    this.movie.play();
    // TODO
    this.audio[0].play();
}

Player.prototype.pause = function() {
    this.movie.pause();
    // TODO
    this.audio[0].pause();
}

Player.prototype.seek = function(time) {
    var len = this.audio.length
      , i
      ;

    this.movie.currentTime(time);
    for (i = 0; i < len; i++) {
        this.audio[i].currentTime = time;
    }
}

NS.Player = Player;
})(NS);