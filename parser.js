/* npx tsc --lib ES6 parser.ts */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseSong(content, title, artist, capo, meterNum, meterDen) {
    if (title === void 0) { title = ""; }
    if (artist === void 0) { artist = ""; }
    if (capo === void 0) { capo = ""; }
    if (meterNum === void 0) { meterNum = ""; }
    if (meterDen === void 0) { meterDen = ""; }
    var notes = ['A', 'A#', 'Bb', 'B', 'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab'];
    var qualities = ['', 'm', '7', 'maj7', 'min7', 'add9', 'sus2', 'sus4', 'm7', 'maj7', 'mMaj7', '2', '5', '6', '7', '9', '11', 'dim', '°'];
    function isChord(text) {
        for (var _i = 0, notes_1 = notes; _i < notes_1.length; _i++) {
            var note = notes_1[_i];
            for (var _a = 0, qualities_1 = qualities; _a < qualities_1.length; _a++) {
                var quality = qualities_1[_a];
                if (text == note + quality) {
                    return true;
                }
            }
            if (text.slice(0, note.length + 1) == note + '/') {
                for (var _b = 0, notes_2 = notes; _b < notes_2.length; _b++) {
                    var bass = notes_2[_b];
                    if (text == note + '/' + bass) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    ;
    var Verse = 0;
    var Chorus = 1;
    function beginSection(kind) {
        if (kind === void 0) { kind = Verse; }
        if (kind == Chorus) {
            return "\\beginchorus";
        }
        else {
            return "\\beginverse";
        }
    }
    function endSection(kind) {
        if (kind === void 0) { kind = Verse; }
        if (kind == Chorus) {
            return "\\endchorus";
        }
        else {
            return "\\endverse";
        }
    }
    var lines = content.split(/\r?\n/);
    var output = [];
    var section = null;
    var chordBuffer;
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        if (line.trim().length > 0) {
            if (line.match(/^[\s]*\[/)) { // verse or chorus
                var sec = null;
                var label = line.toLowerCase().match(/\[(.*)\]/)[1]; //[1];
                if (label.startsWith("chorus") || label.startsWith("refrain")) {
                    sec = Chorus;
                }
                else {
                    sec = Verse;
                }
                if (section !== null) {
                    output.push(endSection(section));
                }
                else if (output.length > 0) {
                    output.unshift(beginSection());
                    output.push(endSection());
                }
                output.push(beginSection(sec));
                section = sec;
            }
            else if (line.match(/^#/)) { // title
                title = line.slice(1).trim();
            }
            else if (chordBuffer == null) { // no chords in buffer
                var chords = line.split(/[\s]+/);
                var accum = 0;
                var total = 0;
                for (var _a = 0, chords_1 = chords; _a < chords_1.length; _a++) {
                    var chord = chords_1[_a];
                    if (chord != "") {
                        total++;
                        if (isChord(chord)) {
                            accum++;
                        }
                    }
                }
                if (accum > 0 && accum == total) { // may want to proceed if 90% or something...
                    chordBuffer = [];
                    var start = 0;
                    for (var _b = 0, chords_2 = chords; _b < chords_2.length; _b++) {
                        var chord = chords_2[_b];
                        if (chord != "") {
                            var loc = line.indexOf(chord, start);
                            start = loc;
                            chordBuffer.push({ name: chord, pos: loc });
                        }
                    }
                }
                else {
                    output.push(line);
                }
            }
            else { // content
                var ln = "";
                var pos = 0;
                for (var _c = 0, chordBuffer_1 = chordBuffer; _c < chordBuffer_1.length; _c++) {
                    var cp = chordBuffer_1[_c];
                    ln += line.slice(pos, cp.pos);
                    ln += '\\[' + cp.name + ']';
                    pos = cp.pos;
                }
                ln += line.slice(pos) + '\\\\';
                output.push(ln);
                chordBuffer = null;
            }
        }
    }
    if (capo != "") {
        output.unshift("\\capo " + capo);
    }
    if (meterNum != "" && meterDen != "") {
        output.unshift("\\meter{" + meterNum + "}{" + meterDen + "}");
    }
    if (artist != "") {
        output.unshift("\\beginsong{" + title + "}[by={" + artist + "}]");
    }
    else {
        output.unshift("\\beginsong{" + title + "}");
    }
    output.push(endSection(section));
    output.push("\\endsong");
    return output.join("\n");
}
