/**
 * GarageBand Pad - a Bluetooth MIDI pad controller for the micro:bit V2.
 *
 * Hold the buttons to send MIDI notes to an iPad over Bluetooth Low Energy.
 * Tilt the board to add pitch bend or modulation while you play.
 *
 * The Bluetooth MIDI transport itself is provided by the "bluetooth-midi"
 * package (RBilsland fork, which builds for micro:bit V2 / CODAL). This
 * package only adds the pad, chord, connection and expression logic on top
 * of it.
 */

/**
 * The control pads on the micro:bit.
 */
enum MidiPad {
    //% block="A"
    A = 0,
    //% block="B"
    B = 1,
    //% block="A+B"
    AB = 2,
    //% block="logo"
    Logo = 3
}

/**
 * Turns a feature on or off.
 */
enum OnOff {
    //% block="on"
    On = 1,
    //% block="off"
    Off = 0
}

/**
 * Note names.
 */
enum NoteName {
    //% block="C"
    C = 0,
    //% block="C#"
    CSharp = 1,
    //% block="D"
    D = 2,
    //% block="D#"
    DSharp = 3,
    //% block="E"
    E = 4,
    //% block="F"
    F = 5,
    //% block="F#"
    FSharp = 6,
    //% block="G"
    G = 7,
    //% block="G#"
    GSharp = 8,
    //% block="A"
    A = 9,
    //% block="A#"
    ASharp = 10,
    //% block="B"
    B = 11
}

/**
 * Chord shapes.
 */
enum Chord {
    //% block="major"
    Major = 0,
    //% block="minor"
    Minor = 1,
    //% block="7th"
    Seventh = 2,
    //% block="sus4"
    Sus4 = 3,
    //% block="power"
    Power = 4,
    //% block="octave"
    Octave = 5
}

/**
 * Play GarageBand on an iPad from the micro:bit buttons.
 */
//% block="GarageBand Pad"
//% icon="\uf001"
//% color="#F0662B"
//% weight=80
//% groups='["Setup", "Pads", "Notes", "RTTTL", "Expression", "Utility", "Classroom"]'
namespace gbpad {
    const PAD_COUNT = 4;
    const BEND_CENTER = 8192;
    const BEND_RANGE = 4096; // ~2 semitones at the default bend range
    const RTTTL_MIN_NOTE_MS = 15; // shorter notes than this would swamp Bluetooth
    const RTTTL_GAP_MS = 15;      // a small gap, so a repeated note is heard twice

    // ---- state -------------------------------------------------------

    let currentChannel = 1;
    let padVelocity = 100;
    let octaveShift = 0;
    let connected = false;
    let engineStarted = false;

    // set while a tune is playing, to make it stop early
    let rtttlStopped = false;
    // values read out of the "d=4,o=6,b=63" part of an RTTTL string
    let rtttlBpm = 63;
    let rtttlDefaultDuration = 4;
    let rtttlDefaultOctave = 6;

    // notes played by each pad while it is held down
    let padNotes: number[][] = null;
    // notes actually sounding for each pad (so releases always match)
    let padActive: number[][] = null;
    // last known physical state of each pad
    let padDown: boolean[] = null;
    // user handlers, indexed by pad
    let pressHandlers: (() => void)[] = null;
    let releaseHandlers: (() => void)[] = null;
    // user handlers for the Bluetooth link
    let connectHandlers: (() => void)[] = null;
    let disconnectHandlers: (() => void)[] = null;

    function emptyNoteLists(): number[][] {
        const r: number[][] = [];
        for (let i = 0; i < PAD_COUNT; i++) r.push([]);
        return r;
    }

    function emptyBools(): boolean[] {
        const r: boolean[] = [];
        for (let i = 0; i < PAD_COUNT; i++) r.push(false);
        return r;
    }

    function emptyHandlers(): (() => void)[] {
        const r: (() => void)[] = [];
        for (let i = 0; i < PAD_COUNT; i++) r.push(null);
        return r;
    }

    function ensureState(): void {
        if (padNotes) return;
        padNotes = emptyNoteLists();
        padActive = emptyNoteLists();
        padDown = emptyBools();
        pressHandlers = emptyHandlers();
        releaseHandlers = emptyHandlers();
        connectHandlers = [];
        disconnectHandlers = [];
    }

    function limit(value: number, low: number, high: number): number {
        const v = Math.round(value);
        if (v < low) return low;
        if (v > high) return high;
        return v;
    }

    function ctrl(): midi.MidiController {
        return midi.channel(currentChannel);
    }

    // ---- board capability --------------------------------------------

    let checkedBoard = false;
    let boardIsV2 = false;

    function v2(): boolean {
        if (!checkedBoard) {
            checkedBoard = true;
            boardIsV2 = control.compareVersion(control.hardwareVersion(), "2.0") >= 0;
        }
        return boardIsV2;
    }

    // ---- pad engine --------------------------------------------------

    function readPad(pad: number): boolean {
        switch (pad) {
            case 0: return input.buttonIsPressed(Button.A) === true;
            case 1: return input.buttonIsPressed(Button.B) === true;
            case 2:
                return input.buttonIsPressed(Button.A) === true
                    && input.buttonIsPressed(Button.B) === true;
            case 3: return v2() && input.logoIsPressed() === true;
        }
        return false;
    }

    function pressPad(pad: number): void {
        const wanted = padNotes[pad];
        const active = padActive[pad];
        for (let i = 0; i < wanted.length; i++) {
            const note = limit(wanted[i] + octaveShift * 12, 0, 127);
            active.push(note);
            ctrl().noteOn(note, padVelocity);
        }
        const handler = pressHandlers[pad];
        if (handler) handler();
    }

    function releasePad(pad: number): void {
        const active = padActive[pad];
        for (let i = 0; i < active.length; i++) {
            ctrl().noteOff(active[i], 0);
        }
        padActive[pad] = [];
        const handler = releaseHandlers[pad];
        if (handler) handler();
    }

    function pollPads(): void {
        for (let i = 0; i < PAD_COUNT; i++) {
            const down = readPad(i);
            if (down != padDown[i]) {
                padDown[i] = down;
                if (down) pressPad(i); else releasePad(i);
            }
        }
    }

    function pollExpression(): void {
        if (bendOn) {
            const roll = limit(input.rotation(Rotation.Roll), -90, 90);
            ctrl().pitchBend(BEND_CENTER + Math.round((roll / 90) * BEND_RANGE));
        }
        if (modulationOn) {
            const pitch = limit(input.rotation(Rotation.Pitch), -90, 90);
            ctrl().controlChange(1, limit(((pitch + 90) / 180) * 127, 0, 127));
        }
    }

    let bendOn = false;
    let modulationOn = false;

    function startEngine(): void {
        ensureState();
        if (engineStarted) return;
        engineStarted = true;

        bluetooth.onBluetoothConnected(() => {
            connected = true;
            basic.showIcon(IconNames.Yes);
            basic.pause(400);
            basic.clearScreen();
            for (let i = 0; i < connectHandlers.length; i++) connectHandlers[i]();
        });

        bluetooth.onBluetoothDisconnected(() => {
            connected = false;
            allNotesOff();
            basic.showIcon(IconNames.No);
            basic.pause(400);
            basic.clearScreen();
            for (let i = 0; i < disconnectHandlers.length; i++) disconnectHandlers[i]();
        });

        control.inBackground(() => {
            while (true) {
                pollPads();
                basic.pause(10);
            }
        });

        control.inBackground(() => {
            while (true) {
                pollExpression();
                basic.pause(25);
            }
        });
    }

    function intervals(chord: Chord): number[] {
        switch (chord) {
            case Chord.Minor: return [0, 3, 7];
            case Chord.Seventh: return [0, 4, 7, 10];
            case Chord.Sus4: return [0, 5, 7];
            case Chord.Power: return [0, 7];
            case Chord.Octave: return [0, 12];
        }
        return [0, 4, 7];
    }

    // ---- setup -------------------------------------------------------

    /**
     * Starts the pad controller: selects the MIDI channel, picks an
     * instrument and shows the Bluetooth connection on the LED display.
     * The MIDI service itself starts automatically.
     * @param channel the MIDI channel, 1 to 16
     * @param instrument the instrument number, 1 to 128
     */
    //% blockId=gbpad_start block="start GarageBand Pad|channel %channel|instrument %instrument"
    //% channel.min=1 channel.max=16 channel.defl=1
    //% instrument.min=1 instrument.max=128 instrument.defl=1
    //% group="Setup" weight=100
    export function start(channel: number, instrument: number): void {
        setChannel(channel);
        setInstrument(instrument);
        startEngine();
    }

    /**
     * Selects the MIDI channel used by every block in this category.
     * @param channel the MIDI channel, 1 to 16
     */
    //% blockId=gbpad_set_channel block="set MIDI channel %channel"
    //% channel.min=1 channel.max=16 channel.defl=1
    //% group="Setup" weight=92
    export function setChannel(channel: number): void {
        currentChannel = limit(channel, 1, 16);
    }

    /**
     * Selects the instrument played on the current channel.
     * @param instrument the instrument number, 1 to 128
     */
    //% blockId=gbpad_set_instrument block="set instrument %instrument"
    //% instrument.min=1 instrument.max=128 instrument.defl=1
    //% group="Setup" weight=90
    export function setInstrument(instrument: number): void {
        ctrl().programChange(limit(instrument, 1, 128) - 1);
    }

    /**
     * Sets how loud the pads play.
     * @param velocity the note velocity, 1 to 127
     */
    //% blockId=gbpad_set_velocity block="set pad velocity %velocity"
    //% velocity.min=1 velocity.max=127 velocity.defl=100
    //% group="Setup" weight=88
    export function setVelocity(velocity: number): void {
        padVelocity = limit(velocity, 1, 127);
        ctrl().setVelocity(padVelocity);
    }

    /**
     * Sets the channel volume (MIDI control change 7).
     * @param volume the volume, 0 to 127
     */
    //% blockId=gbpad_set_volume block="set channel volume %volume"
    //% volume.min=0 volume.max=127 volume.defl=100
    //% group="Setup" weight=86
    export function setVolume(volume: number): void {
        ctrl().controlChange(7, limit(volume, 0, 127));
    }

    /**
     * Runs code when an iPad connects over Bluetooth.
     * @param handler code to run when a device connects
     */
    //% blockId=gbpad_on_connected block="on Bluetooth connected"
    //% group="Setup" weight=84
    export function onConnected(handler: () => void): void {
        startEngine();
        connectHandlers.push(handler);
    }

    /**
     * Runs code when the iPad disconnects.
     * @param handler code to run when the device goes away
     */
    //% blockId=gbpad_on_disconnected block="on Bluetooth disconnected"
    //% group="Setup" weight=82
    export function onDisconnected(handler: () => void): void {
        startEngine();
        disconnectHandlers.push(handler);
    }

    /**
     * Tells whether an iPad is connected over Bluetooth.
     */
    //% blockId=gbpad_is_connected block="Bluetooth connected"
    //% group="Setup" weight=80
    export function isConnected(): boolean {
        startEngine();
        return connected;
    }

    // ---- pads --------------------------------------------------------

    /**
     * Makes a pad play a note for as long as it is held down.
     * @param pad the pad to bind
     * @param note the MIDI note number, eg: 60
     */
    //% blockId=gbpad_bind_pad block="bind pad %pad|to note %note"
    //% note.min=0 note.max=127 note.defl=60
    //% group="Pads" weight=100
    export function bindPad(pad: MidiPad, note: number): void {
        startEngine();
        const i = limit(pad, 0, PAD_COUNT - 1);
        padNotes[i] = [limit(note, 0, 127)];
    }

    /**
     * Makes a pad play a chord for as long as it is held down.
     * @param pad the pad to bind
     * @param root the MIDI note number of the root of the chord, eg: 60
     * @param chord the chord shape
     */
    //% blockId=gbpad_bind_pad_chord block="bind pad %pad|to chord %root|%chord"
    //% root.min=0 root.max=127 root.defl=60
    //% group="Pads" weight=98
    export function bindPadChord(pad: MidiPad, root: number, chord: Chord): void {
        startEngine();
        const i = limit(pad, 0, PAD_COUNT - 1);
        const steps = intervals(chord);
        const notes: number[] = [];
        const base = limit(root, 0, 127);
        for (let k = 0; k < steps.length; k++) {
            notes.push(limit(base + steps[k], 0, 127));
        }
        padNotes[i] = notes;
    }

    /**
     * Removes every note and chord from the pads.
     */
    //% blockId=gbpad_clear_pads block="unbind all pads"
    //% group="Pads" weight=88
    export function clearPads(): void {
        allNotesOff();
        for (let i = 0; i < PAD_COUNT; i++) padNotes[i] = [];
    }

    /**
     * Runs code when a pad is pressed down.
     * @param pad the pad to watch
     * @param handler code to run when the pad is pressed
     */
    //% blockId=gbpad_on_pad_pressed block="on pad %pad|pressed"
    //% group="Pads" weight=96
    export function onPadPressed(pad: MidiPad, handler: () => void): void {
        startEngine();
        pressHandlers[limit(pad, 0, PAD_COUNT - 1)] = handler;
    }

    /**
     * Runs code when a pad is released.
     * @param pad the pad to watch
     * @param handler code to run when the pad is released
     */
    //% blockId=gbpad_on_pad_released block="on pad %pad|released"
    //% group="Pads" weight=94
    export function onPadReleased(pad: MidiPad, handler: () => void): void {
        startEngine();
        releaseHandlers[limit(pad, 0, PAD_COUNT - 1)] = handler;
    }

    /**
     * Tells whether a pad is pressed right now.
     * @param pad the pad to check
     */
    //% blockId=gbpad_pad_is_pressed block="pad %pad|is pressed"
    //% group="Pads" weight=86
    export function padIsPressed(pad: MidiPad): boolean {
        return readPad(limit(pad, 0, PAD_COUNT - 1));
    }

    /**
     * Moves every bound pad up or down by whole octaves.
     * @param octaves how many octaves to shift, eg: 1
     */
    //% blockId=gbpad_shift_octave block="shift pad octave by %octaves"
    //% octaves.min=-4 octaves.max=4 octaves.defl=1
    //% group="Pads" weight=84
    export function shiftOctave(octaves: number): void {
        octaveShift = limit(octaveShift + octaves, -6, 6);
    }

    /**
     * Puts the pad octave back to its original position.
     */
    //% blockId=gbpad_reset_octave block="reset pad octave"
    //% group="Pads" weight=82
    export function resetOctave(): void {
        octaveShift = 0;
    }

    // ---- notes -------------------------------------------------------

    /**
     * Makes a MIDI note number from a note name and an octave.
     * @param name the note name, eg: NoteName.C
     * @param octave the octave, 0 to 8, eg: 4
     */
    //% blockId=gbpad_note block="note %name|octave %octave"
    //% octave.min=0 octave.max=8 octave.defl=4
    //% group="Notes" weight=90
    export function note(name: NoteName, octave: number): number {
        return limit((limit(octave, 0, 8) + 1) * 12 + name, 0, 127);
    }

    /**
     * Starts a note that keeps sounding until it is stopped.
     * @param note the MIDI note number, eg: 60
     * @param velocity the note velocity, 1 to 127
     */
    //% blockId=gbpad_note_on block="note on %note|velocity %velocity"
    //% note.min=0 note.max=127 note.defl=60
    //% velocity.min=1 velocity.max=127 velocity.defl=100
    //% group="Notes" weight=88
    export function noteOn(note: number, velocity: number): void {
        ctrl().noteOn(limit(note, 0, 127), limit(velocity, 1, 127));
    }

    /**
     * Stops a note.
     * @param note the MIDI note number, eg: 60
     */
    //% blockId=gbpad_note_off block="note off %note"
    //% note.min=0 note.max=127 note.defl=60
    //% group="Notes" weight=86
    export function noteOff(note: number): void {
        ctrl().noteOff(limit(note, 0, 127), 0);
    }

    /**
     * Plays a note for a while and then stops it.
     * @param note the MIDI note number, eg: 60
     * @param duration how long to hold the note, in milliseconds
     */
    //% blockId=gbpad_play_note block="play note %note|for %duration ms"
    //% note.min=0 note.max=127 note.defl=60
    //% duration.min=1 duration.max=10000 duration.defl=500
    //% group="Notes" weight=84
    export function playNote(note: number, duration: number): void {
        noteOn(note, padVelocity);
        basic.pause(limit(duration, 1, 60000));
        noteOff(note);
    }

    /**
     * Plays a chord for a while and then stops it.
     * @param root the MIDI note number of the root of the chord, eg: 60
     * @param chord the chord shape
     * @param duration how long to hold the chord, in milliseconds
     */
    //% blockId=gbpad_play_chord block="play chord %root|%chord|for %duration ms"
    //% root.min=0 root.max=127 root.defl=60
    //% duration.min=1 duration.max=10000 duration.defl=500
    //% group="Notes" weight=82
    export function playChord(root: number, chord: Chord, duration: number): void {
        const steps = intervals(chord);
        const base = limit(root, 0, 127);
        for (let i = 0; i < steps.length; i++) {
            noteOn(base + steps[i], padVelocity);
        }
        basic.pause(limit(duration, 1, 60000));
        for (let i = 0; i < steps.length; i++) {
            noteOff(base + steps[i]);
        }
    }

    // ---- RTTTL -------------------------------------------------------

    // RTTTL (Ring Tone Text Transfer Language) is the ringtone format of old
    // mobile phones. A tune is one line of text with three colon separated
    // parts - the name, the default settings, and the notes:
    //
    //     Ode:d=4,o=5,b=125:8e,8e,8f,8g,8g,8f,8e,8d,8c,8c,8d,8e,8e.,8d,4d
    //     ^^^ ^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //     |   |             |
    //     |   |             +-- notes, separated by commas
    //     |   +---------------- defaults, all three optional:
    //     |                     d = note length, o = octave, b = beats per minute
    //     |                     (4, 6 and 63 when a tune does not say)
    //     +---------------------- the name, which may be left out entirely
    //
    // A note is "length + letter + sharp + octave + dot", for example 8c#5.
    // The length is a fraction of a whole note: 4 = quarter, 8 = eighth.
    //
    // The parsing below walks the string once, character by character, and
    // sends each note straight out over Bluetooth MIDI. It never builds
    // substrings, because the micro:bit runs out of memory quickly.

    /**
     * Lower-cases an ASCII character code, so "C" and "c" are the same note.
     */
    function lower(code: number): number {
        return code >= 65 && code <= 90 ? code + 32 : code;
    }

    /**
     * The MIDI note number of an RTTTL pitch. RTTTL puts middle C in octave 4,
     * which is the same convention as the "note" block above, so both agree on
     * where a note sits. Returns 0 for anything that is not a note.
     */
    function rtttlNote(letter: number, sharp: boolean, octave: number): number {
        let step = -1;
        switch (letter) {
            case 99: step = 0; break;    // c
            case 100: step = 2; break;   // d
            case 101: step = 4; break;   // e
            case 102: step = 5; break;   // f
            case 103: step = 7; break;   // g
            case 97: step = 9; break;    // a
            case 98: step = 11; break;   // b
        }
        if (step < 0) return 0;          // "p" (pause), or something unknown
        if (sharp) step++;
        return limit((limit(octave, 0, 8) + 1) * 12 + step, 0, 127);
    }

    /**
     * Reads "d=4,o=6,b=63" into rtttlDefaultDuration / rtttlDefaultOctave /
     * rtttlBpm, keeping the RTTTL defaults for anything that is missing.
     */
    function readRtttlDefaults(tune: string, start: number, end: number): void {
        rtttlDefaultDuration = 4;
        rtttlDefaultOctave = 6;
        rtttlBpm = 63;

        let p = start;
        while (p < end) {
            // the key is the one character in front of the "=", which makes
            // spaces around the separators harmless
            while (p < end && tune.charCodeAt(p) != 61 /* = */) p++;
            if (p >= end) break;
            const key = p > start ? lower(tune.charCodeAt(p - 1)) : 0;
            p++;

            let value = 0;
            let digits = 0;
            while (p < end) {
                const c = tune.charCodeAt(p);
                if (c < 48 || c > 57) break;
                value = value * 10 + (c - 48);
                digits++;
                p++;
            }
            if (digits > 0) {
                if (key == 100 /* d */ && value > 0) rtttlDefaultDuration = value;
                else if (key == 111 /* o */ && value <= 8) rtttlDefaultOctave = value;
                else if (key == 98 /* b */ && value > 0) rtttlBpm = value;
            }
            while (p < end && (tune.charCodeAt(p) == 44 /* , */ || tune.charCodeAt(p) == 32)) p++;
        }
        if (rtttlBpm < 1) rtttlBpm = 63;
    }

    /**
     * Plays a tune written in RTTTL, the ringtone format of old mobile phones.
     *
     * The notes go out over Bluetooth MIDI, so they come out of GarageBand with
     * whatever instrument and channel you picked with "start GarageBand Pad".
     * The block waits until the tune has finished; "stop RTTTL" or
     * "all notes off" cuts it short.
     *
     * Tunes are easy to find on the web ("rtttl" plus a song title). Smaller
     * "b=" means slower.
     *
     * @param tune an RTTTL string, eg: "Ode:d=4,o=5,b=125:8e,8e,8f,8g,8g,8f"
     */
    //% blockId=gbpad_rtttl_play block="play RTTTL %tune"
    //% tune.defl="Ode:d=4,o=5,b=125:8e,8e,8f,8g,8g,8f,8e,8d,8c,8c,8d,8e,8e.,8d,4d"
    //% group="RTTTL" weight=100
    export function playRtttl(tune: string): void {
        if (!tune) return;
        const len = tune.length;
        if (len < 4) return;

        // The header is "Name:defaults:", but the name is often left out, so
        // work out from the text itself which of the two we are looking at.
        let firstColon = 0;
        while (firstColon < len && tune.charCodeAt(firstColon) != 58 /* : */) firstColon++;
        if (firstColon >= len) return; // no header at all: not an RTTTL string

        let settingsStart = 0;
        let settingsEnd = 0;
        let notesStart = 0;
        let hasEquals = false;
        for (let i = 0; i < firstColon; i++) {
            if (tune.charCodeAt(i) == 61 /* = */) {
                hasEquals = true;
                break;
            }
        }
        if (hasEquals) {
            // "d=4,o=6,b=63:notes" - the name was left out
            settingsEnd = firstColon;
            notesStart = firstColon + 1;
        } else {
            // "Name:d=4,o=6,b=63:notes" - the usual form, two colons
            let secondColon = firstColon + 1;
            while (secondColon < len && tune.charCodeAt(secondColon) != 58) secondColon++;
            if (secondColon >= len) return; // a name but no defaults section
            settingsStart = firstColon + 1;
            settingsEnd = secondColon;
            notesStart = secondColon + 1;
        }
        readRtttlDefaults(tune, settingsStart, settingsEnd);

        // one whole note in milliseconds; lengths are fractions of it
        const wholeMs = 240000 / rtttlBpm;
        rtttlStopped = false;

        let p = notesStart;
        while (p < len) {
            if (rtttlStopped) break;

            let c = tune.charCodeAt(p);
            if (c == 44 || c == 32 || c == 9 || c == 10 || c == 13) {
                p++; // comma, space, tab or newline between notes
                continue;
            }

            let fraction = 0;
            while (p < len) {
                c = tune.charCodeAt(p);
                if (c < 48 || c > 57) break;
                fraction = fraction * 10 + (c - 48);
                p++;
            }
            if (fraction < 1) fraction = rtttlDefaultDuration;

            let letter = 0;
            if (p < len) {
                letter = lower(tune.charCodeAt(p));
                p++;
            }
            let sharp = false;
            if (p < len && tune.charCodeAt(p) == 35 /* # */) {
                sharp = true;
                p++;
            }
            let octave = rtttlDefaultOctave;
            if (p < len && tune.charCodeAt(p) >= 48 && tune.charCodeAt(p) <= 57) {
                octave = tune.charCodeAt(p) - 48;
                p++;
            }
            let dotted = false;
            if (p < len && tune.charCodeAt(p) == 46 /* . */) {
                dotted = true;
                p++;
            }

            let ms = Math.round(wholeMs / fraction);
            if (dotted) ms = Math.round(ms * 1.5);
            if (ms < RTTTL_MIN_NOTE_MS) ms = RTTTL_MIN_NOTE_MS;

            const note = rtttlNote(letter, sharp, octave);
            if (note <= 0) {
                basic.pause(ms); // a pause, or a character we cannot play
            } else {
                let hold = ms;
                let gap = 0;
                if (ms > 2 * RTTTL_GAP_MS) {
                    gap = RTTTL_GAP_MS;
                    hold = ms - gap;
                }
                ctrl().noteOn(note, padVelocity);
                basic.pause(hold);
                ctrl().noteOff(note, 0);
                if (gap > 0) basic.pause(gap);
            }
        }
    }

    /**
     * Stops the tune that "play RTTTL" is playing.
     */
    //% blockId=gbpad_rtttl_stop block="stop RTTTL"
    //% group="RTTTL" weight=90
    export function stopRtttl(): void {
        rtttlStopped = true;
    }

    // ---- expression --------------------------------------------------

    /**
     * Tilts the board left and right to bend the pitch while you play.
     * @param mode turn tilt pitch bend on or off
     */
    //% blockId=gbpad_tilt_bend block="tilt pitch bend %mode"
    //% group="Expression" weight=80
    export function tiltPitchBend(mode: OnOff): void {
        startEngine();
        bendOn = mode == OnOff.On;
        if (!bendOn) ctrl().pitchBend(BEND_CENTER);
    }

    /**
     * Tilts the board to add modulation (vibrato) while you play.
     * @param mode turn tilt modulation on or off
     */
    //% blockId=gbpad_tilt_modulation block="tilt modulation %mode"
    //% group="Expression" weight=78
    export function tiltModulation(mode: OnOff): void {
        startEngine();
        modulationOn = mode == OnOff.On;
        if (!modulationOn) ctrl().controlChange(1, 0);
    }

    // ---- utility -----------------------------------------------------

    /**
     * Presses or releases the sustain pedal (MIDI control change 64).
     * @param mode sustain on or off
     */
    //% blockId=gbpad_sustain block="sustain %mode"
    //% group="Utility" weight=80
    export function sustain(mode: OnOff): void {
        ctrl().controlChange(64, mode == OnOff.On ? 127 : 0);
    }

    /**
     * Stops every sounding note and clears the pad state.
     * A tune started with "play RTTTL" is stopped too.
     */
    //% blockId=gbpad_all_notes_off block="all notes off"
    //% group="Utility" weight=78
    export function allNotesOff(): void {
        ensureState();
        rtttlStopped = true;
        ctrl().channelMode(MidiChannelMode.AllNotesOff);
        ctrl().controlChange(64, 0);
        for (let i = 0; i < PAD_COUNT; i++) {
            padActive[i] = [];
            padDown[i] = readPad(i);
        }
    }

    // ---- classroom ---------------------------------------------------

    /**
     * The five letter device ID of this micro:bit, for example "zapuv".
     *
     * A micro:bit advertises itself over Bluetooth as "BBC micro:bit [zapuv]",
     * so this is exactly the part inside the brackets that GarageBand shows in
     * its Bluetooth MIDI device list. Use it to tell several micro:bits apart.
     *
     * The ID cannot be changed: it is derived from the chip's serial number.
     */
    //% blockId=gbpad_device_id block="device ID"
    //% shim=control::deviceName
    //% group="Classroom" weight=90
    export function deviceId(): string {
        // The simulator has no chip serial number, so it shows a placeholder.
        // On the micro:bit this body is replaced by control::deviceName(),
        // which returns the very same string the Bluetooth name uses.
        return "simul";
    }

    /**
     * Scrolls the device ID of this micro:bit across the LED display.
     *
     * Put this in "on start" so that every student can see at a glance which
     * micro:bit is theirs, and then find the matching "BBC micro:bit [.....]"
     * entry in the GarageBand device list.
     */
    //% blockId=gbpad_show_device_id block="show device ID"
    //% group="Classroom" weight=88
    export function showDeviceId(): void {
        basic.showString(deviceId());
    }
}
