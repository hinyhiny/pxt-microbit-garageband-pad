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

// The logo pad plays a whole tune written in RTTTL (the ringtone format of
// old mobile phones), using the instrument picked above. It is wrapped in
// "run in background" so that the chord pads keep working while it plays.
const TUNE = "Ode:d=4,o=5,b=125:8e,8e,8f,8g,8g,8f,8e,8d,8c,8c,8d,8e,8e.,8d,4d"
gbpad.onPadPressed(MidiPad.Logo, () => {
    control.inBackground(() => {
        gbpad.playRtttl(TUNE)
    })
})

// Show the Bluetooth state on the display
gbpad.onConnected(() => {
    basic.showIcon(IconNames.Happy)
})
gbpad.onDisconnected(() => {
    basic.showIcon(IconNames.Sad)
})
