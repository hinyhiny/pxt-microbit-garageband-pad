# Expression and utility

These blocks add the things a keyboard has that a button does not — bending a
note, a sustain pedal — and one that stops everything at once.

## Tilt

The board knows which way up it is. Two of the six directions are used, and both
are read while you play, so you can bend a chord as it sounds.

```
   ROLL - tilt the board left or right        ->  pitch bend
       -90°            0°            +90°
    ─────┬─────────────┬─────────────┬─────
     bend down       no bend       bend up
    (in the middle of a note - the board keeps sounding while you tilt)

   PITCH - tilt the far edge away or towards you  ->  modulation (vibrato)
       -90°            0°            +90°
    ─────┬─────────────┬─────────────┬─────
      no vibrato                maximum vibrato
        (CC1 = 0)                (CC1 = 127)
```

The tilt is read every **25 ms**, which is smooth enough to hear as a bend
rather than as steps.

## tilt pitch bend

Bends the pitch of whatever is sounding by tilting the board left and right.

```sig
gbpad.tiltPitchBend(OnOff.On)
```

**Parameters**

* **mode**: `on` to follow the tilt, `off` to stop

```blocks
gbpad.tiltPitchBend(OnOff.On)
```

Tilting fully to one side bends about **two semitones**, which is the usual
range of a guitar's bend. Turning the block `off` puts the pitch back to centre,
so you never leave a note stuck flat.

## tilt modulation

Adds modulation (vibrato) by tilting the board, on MIDI control change 1.

```sig
gbpad.tiltModulation(OnOff.On)
```

**Parameters**

* **mode**: `on` to follow the tilt, `off` to stop

```blocks
gbpad.tiltModulation(OnOff.On)
```

Whether the tilt is heard as vibrato, tremolo or something else depends on the
instrument you picked in GarageBand.

## sustain

Presses or releases the sustain pedal (MIDI control change 64).

```sig
gbpad.sustain(OnOff.On)
```

**Parameters**

* **mode**: `on` to hold the pedal down, `off` to lift it

```blocks
gbpad.onPadPressed(MidiPad.Logo, () => {
    gbpad.sustain(OnOff.On)
})
gbpad.onPadReleased(MidiPad.Logo, () => {
    gbpad.sustain(OnOff.Off)
})
```

Like a real pedal: notes played while it is down keep sounding after you release
the pad.

## all notes off

Stops every sounding note, stops a tune started with `play RTTTL`, and clears
the pad state so the next press starts from a clean slate.

```sig
gbpad.allNotesOff()
```

**Parameters**

* none

```blocks
input.onButtonPressed(Button.A, () => {
    gbpad.allNotesOff()
})
```

Worth binding to a button in a classroom: it is the one-block cure for a note
that is stuck ringing. Notes are also stopped automatically when the iPad
disconnects.

## See also

* [Setup blocks](./setup)
* [Pad blocks](./pads)
* [RTTTL blocks](./rtttl)

```package
garageband-pad=github:hinyhiny/pxt-microbit-garageband-pad
```
