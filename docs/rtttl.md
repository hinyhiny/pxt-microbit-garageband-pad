# RTTTL (ringtones)

RTTTL stands for "Ring Tone Text Transfer Language" — the format old mobile
phones used for ringtones. A whole tune is **one line of text**, and this
package plays it through Bluetooth MIDI, so it comes out of GarageBand with
whatever instrument and channel you picked in [Setup](./setup).

Tunes are easy to find on the web: search for `rtttl` plus a song title.

## What a tune looks like

```
 Ode : d=4,o=5,b=125 : 8e,8e,8f,8g,8g,8f,8e,8d,8c,8c,8d,8e,8e.,8d,4d
 ─┬─   ────────────   ────────────────────────────────────────────────
  │          │                        │
  │          │                        └─ the notes, separated by commas
  │          └─ defaults for the whole tune:
  │               d = note length, o = octave, b = beats per minute
  │               (4, 6 and 63 when a tune does not say)
  └─ the name of the tune (may be left out completely)
```

Each note is `length + letter + sharp + octave + dot`, with everything except
the letter optional:

```
   8 c # 5 .
   │ │ │ │ └─ a dot adds half the length again (8. = 1.5 x an eighth)
   │ │ │ └─── the octave, when it is not the o= from the header
   │ │ └───── # means a sharp
   │ └─────── the note letter, a to g (c and C are the same note)
   └───────── the length as a fraction of a whole note:
              1 = whole, 4 = quarter, 8 = eighth, 16 = sixteenth
```

A lowercase `p` is a rest.

## How long a note lasts

```
   b=125   (or "set RTTTL tempo to 125")
        │
        └─ one whole note = 240000 / 125 = 1920 ms

             a quarter note     4  = 1920 / 4   =  480 ms
             an eighth note     8  = 1920 / 8   =  240 ms
             a dotted eighth    8. = 240 x 1.5  =  360 ms

   each note:  ├───────── sounding ─────────┤ ░ 15 ms ░├─ next note
                                                a short gap, so that two
                                                equal notes in a row are
                                                heard as two notes
```

Anything shorter than **15 ms** is stretched to 15 ms. Sending notes faster than
that swamps the Bluetooth link, so the board refuses to try.

## play RTTTL

Plays a tune. The block **waits until the tune has finished**.

```sig
let tune = "Ode:d=4,o=5,b=125:8e,8e,8f,8g,8g,8f,8e,8d,8c,8c,8d,8e,8e.,8d,4d"
gbpad.playRtttl(tune)
```

**Parameters**

* **tune**: the RTTTL string

```blocks
gbpad.playRtttl("Ode:d=4,o=5,b=125:8e,8e,8f,8g,8g,8f,8e,8d,8c,8c,8d,8e,8e.,8d,4d")
```

Because the block waits, it belongs in `on start` or in `forever`. To start a
tune **from a pad**, wrap it in the built-in `run in background` block — without
that the pad poller stops for as long as the tune lasts and the other pads go
dead:

```blocks
const TUNE = "Ode:d=4,o=5,b=125:8e,8e,8f,8g,8g,8f,8e,8d,8c,8c,8d,8e,8e.,8d,4d"
gbpad.onPadPressed(MidiPad.Logo, () => {
    control.inBackground(() => {
        gbpad.playRtttl(TUNE)
    })
})
```

## set RTTTL tempo to

Forces one tempo on every tune, in beats per minute.

```sig
gbpad.setRtttlTempo(120)
```

**Parameters**

* **bpm**: the tempo, 0 to 400. `0` means "no override" — each tune keeps the tempo written inside it

```blocks
gbpad.setRtttlTempo(90)
```

Tunes from the web rarely agree with each other about tempo, so this saves you
from editing the `b=` in every tune:

| Setting | What happens |
| --- | --- |
| `120` | Every tune plays at 120 beats per minute |
| `60` | Half that speed — easier to follow along with in a classroom |
| `240` | Twice the speed |
| `0` | No override. Each tune plays exactly as written, which is also what happens if you never use the block |

The setting is remembered until you change it, so one `set RTTTL tempo to [90] (bpm)`
in `on start` is enough for the whole program.

## stop RTTTL

Cuts the tune short. The note that is sounding stops at once, rather than being
left to ring on to the end of its length.

```sig
gbpad.stopRtttl()
```

**Parameters**

* none

```blocks
gbpad.onPadPressed(MidiPad.A, () => {
    gbpad.stopRtttl()
})
```

## Only one tune at a time

Two tunes can never overlap. Starting a tune cuts off whatever was playing, so
pressing the same pad twice **restarts** the tune instead of stacking two copies
on top of each other — which is exactly what you want when a class is taking
turns hammering the pad.

```
   tune A          ██ ██ ██ ██ ██
                             ╲
   pad pressed again ─────────╲──────────────────────────────>
                               ╲  A notices and gives up
                                ╲ the note A was holding is released at once
   tune B                        ██ ██ ██ ██ ██
```

`stop RTTTL` and `all notes off` take a ticket in the same way, so a tune stops
even in the middle of a long note.

## See also

* [Setup blocks](./setup)
* [Note blocks](./notes)
* [Expression and utility blocks](./expression)

```package
garageband-pad=github:hinyhiny/pxt-microbit-garageband-pad
```
