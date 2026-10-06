# 準備

micro:bit を Bluetooth MIDI のパッドコントローラーにして、iPad から出る音を
決めるブロックです。他のブロックはここで選んだチャンネルで音を出すので、
最初に置きます。

```
       micro:bit V2                       iPad
    ┌───────────────┐                 ┌──────────────┐
    │  A  B  ロゴ   │                 │  GarageBand  │
    └───────┬───────┘                 └──────▲───────┘
            │                                │
            │   BLE MIDI                     │  ソフトウェア
            └── 音符を鳴らす / 止める ───────┘  音源トラック
                ピッチベンド / CC1
                  ────────────────────────>
            チャンネル 1〜16    -> どのトラックに届くか
            音色 1〜128         -> どんな音が出るか
            ベロシティ / 音量   -> どのくらいの大きさで鳴るか
```

音色を選ぶのは「ガレージバンドをはじめる」なので、これが動くまで音は出ません。
「はじめに」に置いてください。Bluetooth MIDI のサービス自体は自動で始まるので、
入り切りのスイッチはありません。

## ガレージバンドをはじめる

パッドを開始します。MIDI チャンネルと音色を選び、Bluetooth の接続状態を LED に
表示します。

```sig
gbpad.start(1, 1)
```

**パラメータ**

* **channel**: MIDI チャンネル（1〜16）
* **instrument**: General MIDI の音色番号（1〜128。1 がアコースティックグランドピアノ）

```blocks
gbpad.start(1, 1)
```

## MIDI チャンネルを決める

このパッケージの他のブロックが送るチャンネルを選びます。

```sig
gbpad.setChannel(1)
```

**パラメータ**

* **channel**: MIDI チャンネル（1〜16）

General MIDI ではチャンネル 10 がドラム用なので、そこに送ると音符が打楽器の音に
なります。

## 音色を決める

今のチャンネルで鳴る音色を選びます。

```sig
gbpad.setInstrument(1)
```

**パラメータ**

* **instrument**: General MIDI の音色番号（1〜128）

番号が届いた瞬間に iPad の音が変わるので、演奏の途中で楽器を切り替えることもできます。

## パッドの音の強さを決める

パッドが鳴らす音の強さ（ベロシティ）を決めます。パッドのブロックと「RTTTL を再生」の
両方に効き、変えるまで残ります。

```sig
gbpad.setVelocity(100)
```

**パラメータ**

* **velocity**: 音の強さ（1〜127）

## チャンネルの音量を決める

チャンネル全体の音量を決めます（MIDI コントロールチェンジ 7）。

```sig
gbpad.setVolume(100)
```

**パラメータ**

* **volume**: 音量（0〜127）

ベロシティは音ごと、音量はチャンネル全体です。全体が大きすぎるときは音量を、
1 つのパッドだけ弱くしたいときはベロシティを下げます。

## Bluetooth が接続されたときに実行する

iPad が接続されたときに実行する処理を登録します。

```sig
gbpad.onConnected(() => {
})
```

**パラメータ**

* **handler**: 接続されたときに実行する処理

```blocks
gbpad.onConnected(() => {
    basic.showIcon(IconNames.Happy)
})
```

接続すると LED には自動で 400 ミリ秒だけ ✓ が出ます。このブロックは、その上で
何か伝えたいときに使います。

## Bluetooth が切断されたときに実行する

iPad が離れたときに実行する処理を登録します。

```sig
gbpad.onDisconnected(() => {
})
```

**パラメータ**

* **handler**: 切断されたときに実行する処理

```blocks
gbpad.onDisconnected(() => {
    basic.showIcon(IconNames.Sad)
})
```

切断されたときは鳴っている音を全部自動で止めるので、iPad 側に音が残りません。

## 接続されているか調べる

iPad が今つながっているかどうかを返します。

```sig
let up = gbpad.isConnected()
```

**パラメータ**

* なし

```blocks
basic.forever(() => {
    basic.showIcon(gbpad.isConnected() ? IconNames.Yes : IconNames.No)
})
```

### LED 表示

```
✓  接続された       iPad がつながったあと 400 ミリ秒だけ表示
✕  切断された       iPad が離れたあと 400 ミリ秒だけ表示
                    それ以外のときは自分のプログラムで自由に使えます
```

## 関連項目

* [パッドのブロック](./pads)
* [音符のブロック](./notes)
* [RTTTL のブロック](./rtttl)
* [表現とその他のブロック](./expression)

```package
garageband-pad=github:hinyhiny/pxt-microbit-garageband-pad
```
