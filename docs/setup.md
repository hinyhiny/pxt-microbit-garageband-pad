# Setup

Turns the micro:bit into a Bluetooth MIDI pad controller, and decides how the
notes sound on the iPad. Everything else you play uses the channel picked here,
so these blocks go first.

```
       micro:bit V2                       iPad
    ┌───────────────┐                 ┌──────────────┐
    │  A  B  logo   │                 │  GarageBand  │
    └───────┬───────┘                 └──────▲───────┘
            │                                │
            │   BLE MIDI                     │  Software
            └───── note on / note off ───────┘  Instrument
                  pitch bend / CC1                track
                  ────────────────────────>
            channel 1-16   -> which track it lands on
            instrument 1-128 -> which sound comes out
            velocity / volume -> how loud
```

`start GarageBand Pad` is what selects the sound, so nothing plays until it has
run. Put it in `on start`. The Bluetooth MIDI service itself starts on its own —
there is no switch to turn on.

## start GarageBand Pad

Starts the pads, selects the MIDI channel and the instrument, and shows the
Bluetooth state on the LED display.

```sig
gbpad.start(1, 1)
```

**Parameters**

* **channel**: the MIDI channel, 1 to 16
* **instrument**: the General MIDI instrument number, 1 to 128 (1 = Acoustic Grand Piano)

```blocks
gbpad.start(1, 1)
```

## set MIDI channel

Selects the channel every other block in this package sends on.

```sig
gbpad.setChannel(1)
```

**Parameters**

* **channel**: the MIDI channel, 1 to 16

Channel 10 is the drum channel in General MIDI, so the notes you play there
become percussion sounds.

## set instrument

Selects the sound played on the current channel.

```sig
gbpad.setInstrument(1)
```

**Parameters**

* **instrument**: the General MIDI instrument number, 1 to 128

The iPad changes sound as soon as the number arrives, so you can switch
instruments in the middle of a performance.

## set pad velocity

Sets how loud the pads are. Applies to the pad blocks and to `play RTTTL`, and
is remembered until you change it.

```sig
gbpad.setVelocity(100)
```

**Parameters**

* **velocity**: how hard each note is struck, 1 to 127

## set channel volume

Sets the volume of the whole channel (MIDI control change 7).

```sig
gbpad.setVolume(100)
```

**Parameters**

* **volume**: the channel volume, 0 to 127

Velocity is per note and volume is per channel: lower the volume when the
instrument is too loud overall, and the velocity when a pad should be softer
than the others.

## on Bluetooth connected

Runs code when the iPad connects.

```sig
gbpad.onConnected(() => {
})
```

**Parameters**

* **handler**: the code to run when a device connects

```blocks
gbpad.onConnected(() => {
    basic.showIcon(IconNames.Happy)
})
```

The LED already shows a check mark for 400 ms on connection. This block is for
what you want to say on top of that.

## on Bluetooth disconnected

Runs code when the iPad goes away.

```sig
gbpad.onDisconnected(() => {
})
```

**Parameters**

* **handler**: the code to run when the device disconnects

```blocks
gbpad.onDisconnected(() => {
    basic.showIcon(IconNames.Sad)
})
```

Every sounding note is stopped automatically on disconnect, so nothing is left
ringing on the iPad.

## Bluetooth connected

Tells whether an iPad is connected right now.

```sig
let up = gbpad.isConnected()
```

**Parameters**

* none

```blocks
basic.forever(() => {
    basic.showIcon(gbpad.isConnected() ? IconNames.Yes : IconNames.No)
})
```

### What the display shows

```
✓  connected     shown for 400 ms after the iPad connects
✕  disconnected  shown for 400 ms after the iPad goes away
                 otherwise the display is free for your own program
```

## See also

* [Pad blocks](./pads)
* [Note blocks](./notes)
* [RTTTL blocks](./rtttl)
* [Expression and utility blocks](./expression)

```package
garageband-pad=github:hinyhiny/pxt-microbit-garageband-pad
```
