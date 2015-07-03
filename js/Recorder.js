'use strict';

(function(NS) {
var bufferSize = 1024;

/**
 * 録音機能の実装
 **/
var Recorder = function() {
    var that = this;

    this.adaptEnv();

    this.audioData = [];
    this.audioContext = new AudioContext();
    this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize);
    this.mediastreamsource = null;

    this.initialize();
}

/**
 * ブラウザごとの違いを吸収
 * 対応してなかったらfalse
 * 
 * @return bool 
 **/
Recorder.prototype.adaptEnv = function() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.URL = window.URL || window.webkitURL;

    if (!navigator.getUserMedia) {
        alert('録音機能が未対応のブラウザです。');
        return false;
    }

    return true;
}

/**
 * 初期化
 **/
Recorder.prototype.initialize = function() {
    var that = this
    ;

    navigator.getUserMedia(
        {audio: true}
        , function(stream) {
            that.audioData = [];
            that.mediaStreamSource = that.audioContext.createMediaStreamSource(stream);
            that.mediaStreamSource.connect(that.scriptProcessor);
            that.scriptProcessor.connect(that.audioContext.destination);
        }
        , function(err) { // for error case
            console.log(err);
            alert('error');
        }
    );
}

Recorder.prototype.reset = function() {
    this.audioData = [];
}

Recorder.prototype.start = function() {
    var that = this;

    this.reset();

    this.scriptProcessor.onaudioprocess = function(e) {
        var input = e.inputBuffer.getChannelData(0)
          , bufferData = new Float32Array(bufferSize)
          ;

        for (var i = 0; i < bufferSize; i++) {
            bufferData[i] = input[i];
        }

        that.audioData.push(bufferData);
    }
}

Recorder.prototype.stop = function() {
    this.scriptProcessor.onaudioprocess = null;
}

Recorder.prototype.exportWav = function() {
    var dataview = this.encodeWAV(this.mergeBuffer(this.audioData), this.audioContext.sampleRate)
      , audioBlob = new Blob([dataview], { type: 'audio/wav' })
      ;

    return window.URL.createObjectURL(audioBlob);
};

Recorder.prototype.mergeBuffer = function(audioData) {
    var samples
      , sampleLength = 0
      , sampleIndex = 0
      , len, len2, i, j
      ;

    len = audioData.length;
    for (i = 0; i < len; i++) {
        sampleLength += audioData[i].length;
    }
    samples = new Float32Array(sampleLength);

    for (i = 0; i < len; i++) {
        len2 = audioData[i].length;
        for (j = 0; j < len2; j++) {
            samples[sampleIndex] = audioData[i][j];
            sampleIndex++;
        }
    }

    return samples;
}

Recorder.prototype.encodeWAV = function(samples, sampleRate) {
    var buffer = new ArrayBuffer(44 + samples.length * 2)
      , view = new DataView(buffer)
      , writeString = function(view, offset, string) {
            var len = string.length
              , i
              ;

            for (i = 0; i < len; i++){
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }
      , floatTo16BitPCM = function(output, offset, input) {
            var len = input.length
              ,i, s
              ;

            for (i = 0; i < len; i++, offset += 2){
                s = Math.max(-1, Math.min(1, input[i]));
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        }
        ;

    writeString(view, 0, 'RIFF');  // RIFFヘッダ
    view.setUint32(4, 32 + samples.length * 2, true); // これ以降のファイルサイズ
    writeString(view, 8, 'WAVE'); // WAVEヘッダ
    writeString(view, 12, 'fmt '); // fmtチャンク
    view.setUint32(16, 16, true); // fmtチャンクのバイト数
    view.setUint16(20, 1, true); // フォーマットID
    view.setUint16(22, 1, true); // チャンネル数
    view.setUint32(24, sampleRate, true); // サンプリングレート
    view.setUint32(28, sampleRate * 2, true); // データ速度
    view.setUint16(32, 2, true); // ブロックサイズ
    view.setUint16(34, 16, true); // サンプルあたりのビット数
    writeString(view, 36, 'data'); // dataチャンク
    view.setUint32(40, samples.length * 2, true); // 波形データのバイト数
    floatTo16BitPCM(view, 44, samples); // 波形データ

    return view;
}

NS.Recorder = Recorder;
})(NS);