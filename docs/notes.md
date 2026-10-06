# Notes

These blocks play single notes and chords directly, without a pad. They are the
plainest way to make the iPad sound, and they are handy for testing that the
link works.

A MIDI note is just a number, and the number picks the pitch. `note [C] octave [4]`
does the arithmetic for you.

```
   ...  57   58   59 | 60   61   62   63   64   65   66   67 | 68  ...
        A3   A#3  B3 | C4   C#4  D4   D#4  E4   F4   F#4  G4 | G#4
                     └──────────┬──────────┘
                        middle C = 60 (octave 4)

   note [C] octave [4]  ->  (4 + 1) x 12 + 0  =  60
   note [A] octave [4]  ->  (4 + 1) x 12 + 9  =  69   (440 Hz)
   note [C] octave [5]  ->  (5 + 1) x 12 + 0  =  72   (one octave up)
```

## note

Builds a MIDI note number from a note name and an octave. Use it to keep the
numbers in your program readable, and to work out a tune's starting pitch.

```sig
let n = gbpad.note(NoteName.C, 4)
```

**Parameters**

* **name**: the note name — `C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B`
* **octave**: the octave, 0 to 8 (4 is the octave that contains middle C)

```blocks
gbpad.bindPad(MidiPad.A, gbpad.note(NoteName.C, 4))
```

## note on / note off

Starts a note that keeps sounding until it is stopped, and stops it again.
Nothing stops it for you: a `note on` with no matching `note off` rings until you
call `all notes off` or the iPad disconnects.

```sig
gbpad.noteOn(60, 100)
```

**Parameters**

* **note**: the MIDI note number, 0 to 127
* **velocity**: how hard the note is struck, 1 to 127

```sig
gbpad.noteOff(60)
```

**Parameters**

* **note**: the MIDI note number, 0 to 127

```blocks
gbpad.noteOn(gbpad.note(NoteName.C, 4), 100)
basic.pause(1000)
gbpad.noteOff(gbpad.note(NoteName.C, 4))
```

## play note

Plays a note for a while and then stops it, so you cannot leave it ringing by
accident. **This block waits** until the note is over.

```sig
gbpad.playNote(60, 500)
```

**Parameters**

* **note**: the MIDI note number, 0 to 127
* **duration**: how long to hold the note, in milliseconds

## play chord

Plays a chord for a while and then stops it. **This block waits** until the
chord is over.

```sig
gbpad.playChord(60, Chord.Major, 500)
```

**Parameters**

* **root**: the MIDI note number of the root of the chord, 0 to 127
* **chord**: `major`, `minor`, `7th`, `sus4`, `power` or `octave`
* **duration**: how long to hold the chord, in milliseconds

```blocks
gbpad.playChord(gbpad.note(NoteName.C, 3), Chord.Major, 500)
gbpad.playChord(gbpad.note(NoteName.G, 3), Chord.Major, 500)
gbpad.playChord(gbpad.note(NoteName.A, 3), Chord.Minor, 1000)
```

## See also

* [Pad blocks](./pads)
* [RTTTL blocks](./rtttl)
* [Expression and utility blocks](./expression)

```package
garageband-pad=github:hinyhiny/pxt-microbit-garageband-pad
```
