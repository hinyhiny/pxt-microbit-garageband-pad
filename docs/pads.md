# Pads

The pads are the four things you can hold down on the board. A pad is not a
click: it sounds for exactly as long as you hold it, which is what makes the
board play like an instrument rather than a button box.

```
    micro:bit V2 (front)

 ┌──────────────────────────────┐
 │  ┌───┐                ┌───┐  │
 │  │ A │                │ B │  │
 │  └───┘                └───┘  │
 │             ◆                │   ◆ = the logo touch symbol
 └──────────────────────────────┘        (gold, micro:bit V2 only)

   A+B = hold A and B down together
```

```
    held down                            let go
        │                                   │
  ──────┼───────────────────────────────────┼──────>  time
        │                                   │
   note on (velocity from "set pad velocity")   note off
        │                                   │
        └──────── the note sounds throughout ┘
```

The board is checked every **10 ms**, so a pad reacts within a hundredth of a
second — fast enough that it feels immediate.

Bind a pad to a note or to a chord with the blocks below; until you do, pressing
it sends nothing.

## bind pad to note

Makes a pad play one note for as long as it is held down, and stop it on release.

```sig
gbpad.bindPad(MidiPad.A, 60)
```

**Parameters**

* **pad**: the pad to bind — `A`, `B`, `A+B` or `logo`
* **note**: the MIDI note number, 0 to 127 (60 = middle C)

```blocks
gbpad.bindPad(MidiPad.A, gbpad.note(NoteName.C, 4))
gbpad.bindPad(MidiPad.B, gbpad.note(NoteName.E, 4))
gbpad.bindPad(MidiPad.AB, gbpad.note(NoteName.G, 4))
```

## bind pad to chord

Makes a pad play a whole chord for as long as it is held down.

```sig
gbpad.bindPadChord(MidiPad.A, 60, Chord.Major)
```

**Parameters**

* **pad**: the pad to bind
* **root**: the MIDI note number of the root of the chord, 0 to 127
* **chord**: the chord shape — `major`, `minor`, `7th`, `sus4`, `power` or `octave`

| Chord | Notes above the root |
| --- | --- |
| `major` | 0, 4, 7 |
| `minor` | 0, 3, 7 |
| `7th` | 0, 4, 7, 10 |
| `sus4` | 0, 5, 7 |
| `power` | 0, 7 |
| `octave` | 0, 12 |

```blocks
gbpad.bindPadChord(MidiPad.A, gbpad.note(NoteName.C, 3), Chord.Major)
gbpad.bindPadChord(MidiPad.B, gbpad.note(NoteName.G, 3), Chord.Major)
gbpad.bindPadChord(MidiPad.AB, gbpad.note(NoteName.A, 3), Chord.Minor)
```

Three pads set up like this are a I–V–vi progression in C major: the three
chords that carry an enormous number of songs.

## on pad pressed / on pad released

Runs code when a pad goes down or comes back up. This is separate from the note
binding, so a pad can play a note **and** switch something on.

```sig
gbpad.onPadPressed(MidiPad.A, () => {
})
```

**Parameters**

* **pad**: the pad to watch
* **handler**: the code to run when the pad is pressed or released

```blocks
gbpad.onPadPressed(MidiPad.Logo, () => {
    gbpad.shiftOctave(1)
})
gbpad.onPadReleased(MidiPad.Logo, () => {
    gbpad.shiftOctave(-1)
})
```

## pad is pressed

Tells whether a pad is held down right now.

```sig
let down = gbpad.padIsPressed(MidiPad.A)
```

**Parameters**

* **pad**: the pad to check

## shift pad octave by

Moves every assigned note up or down by whole octaves. The binding itself does
not change, so `shift pad octave by -1` and then `shift pad octave by 1` puts
everything back.

```sig
gbpad.shiftOctave(1)
```

**Parameters**

* **octaves**: how many octaves to move, -4 to 4

The shift is applied when the pad is pressed, so it is safe to change it
mid-performance.

## reset pad octave

Puts the octave shift back to where it started.

```sig
gbpad.resetOctave()
```

**Parameters**

* none

## unbind all pads

Removes every note and chord from every pad, and stops anything sounding.

```sig
gbpad.clearPads()
```

**Parameters**

* none

## See also

* [Setup blocks](./setup)
* [Note blocks](./notes)
* [Using many micro:bits at once](./classroom)

```package
garageband-pad=github:hinyhiny/pxt-microbit-garageband-pad
```
