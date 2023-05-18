/* npx tsc --lib ES6 parser.ts */

"use strict";
import console = require("console");

function parseSong(content: string, title: string = "", artist: string = "", capo: string = "", meterNum = "", meterDen = ""): string {
	const notes = ['A', 'A#', 'Bb', 'B', 'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab'];
	const qualities = ['', 'm', '7', 'maj7', 'min7', 'add9', 'sus2', 'sus4', 'm7', 'maj7', 'mMaj7', '2', '5', '6', '7', '9', '11', 'dim', '°'];

	function isChord (text: string): boolean {
		for (var note of notes) {
			for (var quality of qualities) {
				if (text == note + quality) {
					return true;
				}
			}

			if (text.slice(0, note.length + 1) == note + '/') {
				for (var bass of notes) {
					if (text == note + '/' + bass) {
						return true;
					}
				}
			}
		}

		return false;

	};

	type ChordPos = {
		name: string;
		pos: number;
	};
	const Verse = 0;
	const Chorus = 1;
	type Section = number | null;

	function beginSection(kind: Section = Verse): string {
		if (kind == Chorus) {
			return "\\beginchorus";
		} else {
			return "\\beginverse";
		}
	}

	function endSection(kind: Section = Verse): string {
		if (kind == Chorus) {
			return "\\endchorus";
		} else {
			return "\\endverse";
		}
	}


	let lines = content.split(/\r?\n/);
	let output: string[] = [];
	let section: Section = null;
	let chordBuffer: ChordPos[] | null;

	for (var line of lines) {
		if (line.trim().length > 0) {
			if (line.match(/^[\s]*\[/)) { // verse or chorus
				let sec = null;
				let label = line.toLowerCase().match(/\[(.*)\]/)[1]; //[1];
				if (label.startsWith("chorus") || label.startsWith("refrain")) {
					sec = Chorus;
				} else {
					sec = Verse;
				}

				if (section !== null) {
					output.push(endSection(section));
				} else if (output.length > 0) {
					output.unshift(beginSection());
					output.push(endSection());
				}
				output.push(beginSection(sec));
				section = sec;

			} else if (line.match(/^#/)) { // title
				title = line.slice(1).trim();

			} else if (chordBuffer == null) { // no chords in buffer
				let chords = line.split(/[\s]+/);
				let accum = 0;
				let total = 0;

				for (var chord of chords) {
					if (chord != "") {
						total++;
						if (isChord(chord)) {
							accum++;
						}
					}
				}

				if (accum > 0 && accum == total) { // may want to proceed if 90% or something...
					chordBuffer = [];
					let start = 0

					for (var chord of chords) {
						if (chord != "") {
							let loc = line.indexOf(chord, start);
							start = loc;
							chordBuffer.push({name: chord, pos: loc});
						}
					}
				} else {
					output.push(line);
				}

			} else { // content
				let ln = "";
				let pos = 0;

				for (var cp of chordBuffer) {
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
	} else {
		output.unshift("\\beginsong{" + title + "}");
	}


	output.push(endSection(section));
	output.push("\\endsong");
	return output.join("\n");
}


/*
console.log(isChord("Am"));
console.log(isChord("Asus4"));
console.log(isChord("A/C"));
console.log(isChord("A#/C#"));
console.log(isChord("Ab/B"));
console.log(isChord("A/Eb"));
console.log(isChord("A"));
console.log(isChord("Asus7"));

let song = `# Will the circle be unbroken
G                       G7         C               G
I was standing by my window on one cold and cloudy day`;

console.log(parse(song));
*/
