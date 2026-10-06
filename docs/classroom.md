# Classroom

Thirty identical boards in one room are impossible to tell apart — unless you
use the five letters each one carries. These two blocks hand you those letters.

```
   What the iPad shows in GarageBand's Bluetooth MIDI device list:

        BBC micro:bit [zapuv]
                       └──┬──┘
                          └────── this is the "device ID"

   ...but only while the project setting is

        Bluetooth -> "No Pairing Required"

   Without that setting every board in the room advertises the same name:

        BBC micro:bit          <- yours, and everyone else's
```

The ID is made from the chip's serial number, so **it cannot be changed** and it
survives re-flashing.

## device ID

The five letters this micro:bit is known by, for example `zapuv`.

```sig
let id = gbpad.deviceId()
```

**Parameters**

* none

```blocks
basic.forever(() => {
    basic.showString(gbpad.deviceId())
})
```

This is the same value as the built-in `control → device name` block, and it is
given in lower case, exactly as it appears inside the brackets in the Bluetooth
name.

**In the simulator** there is no chip serial number, so this block returns the
placeholder `simul`. The real ID exists only on the board.

## show device ID

Scrolls those five letters across the LED display.

```sig
gbpad.showDeviceId()
```

**Parameters**

* none

```blocks
gbpad.start(1, 1)
gbpad.showDeviceId()
```

Put this in `on start`: each student reads their own letters off the LED, then
looks for the matching entry in GarageBand. It is the fastest way to get a whole
class connected.

## How to tell whose board is whose

```
   what the board shows        what GarageBand lists
   ┌────────────────┐
   │  z a p u v     │  --->    BBC micro:bit [zapuv]   <- pick this one
   └────────────────┘          BBC micro:bit [kofem]
                               BBC micro:bit [xebit]
```

There are only 5⁵ = **3125** possible IDs, so with 30 boards in one room there is
about a **13%** chance that two of them share one (with 15 boards, about 3%).

If two candidates appear, it does not matter which you try first: connect to one
of them and look at the board. The ✓ that shows on connection appears on **your**
board, so if it lights up on the wrong board, disconnect and try the other one.

## See also

* [Setup blocks](./setup)
* [Pad blocks](./pads)
* [Pad controller for micro:bit V2 (README)](https://github.com/hinyhiny/pxt-microbit-garageband-pad#readme)

```package
garageband-pad=github:hinyhiny/pxt-microbit-garageband-pad
```
