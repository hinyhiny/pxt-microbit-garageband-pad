// Example program for the GarageBand Pad extension (micro:bit V2).
// This is a test/example file: it is not compiled into projects that
// import the extension.

// MIDI channel 1, instrument 1 (Acoustic Grand Piano)
gbpad.start(1, 1)

// Show which micro:bit this is, so students can find their own
// "BBC micro:bit [xxxxx]" entry in GarageBand's device list.
gbpad.showDeviceId()

// Three chord pads: I - V - vi in C major, like a tiny song pad
gbpad.bindPadChord(MidiPad.A, gbpad.note(NoteName.C, 3), Chord.Major)
gbpad.bindPadChord(MidiPad.B, gbpad.note(NoteName.G, 3), Chord.Major)
gbpad.bindPadChord(MidiPad.AB, gbpad.note(NoteName.A, 3), Chord.Minor)

// Tilt left/right to bend the pitch while a chord is sounding
gbpad.tiltPitchBend(OnOff.On)

// Hold the logo to play the whole pad one octave higher
gbpad.onPadPressed(MidiPad.Logo, () => {
    gbpad.shiftOctave(1)
})
gbpad.onPadReleased(MidiPad.Logo, () => {
    gbpad.shiftOctave(-1)
})

// Show the Bluetooth state on the display
gbpad.onConnected(() => {
    basic.showIcon(IconNames.Happy)
})
gbpad.onDisconnected(() => {
    basic.showIcon(IconNames.Sad)
})
