# GarageBand Pad — micro:bit V2 用 Bluetooth MIDI パッド

[English](README.md) | **日本語**

micro:bit **V2** のボタンを押すと、Bluetooth Low Energy (BLE) MIDI で **iPad の GarageBand** が鳴る MakeCode 拡張機能です。
Bluetooth で送るのは「この音を鳴らせ／止めろ」という MIDI メッセージだけで、音そのものは iPad 側で作られます。USB ケーブルもオーディオケーブルも要りません。

```
micro:bit V2 ──(BLE MIDI: note on / note off / pitch bend)──> iPad ──> GarageBand
```

## できること

| 機能 | 内容 |
| --- | --- |
| 4 パッド | A / B / A+B / ロゴ（タッチ）を押している間だけ音が鳴る（押す＝note on、離す＝note off） |
| コードパッド | 1 つのパッドにメジャー / マイナー / 7th / sus4 / パワー / オクターブ を割り当て |
| オクターブシフト | 割り当てた音をまとめて ±オクターブ移動（曲中で切り替えられる） |
| 傾きでピッチベンド | 本体を左右に傾けるとピッチが上下（±2 半音） |
| 傾きでモジュレーション | 傾きでビブラート（CC1） |
| RTTTL 再生 | 1 行の着メロ文字列（例: 喜びの歌）で曲を丸ごと演奏。テンポ（BPM）も指定可能 |
| 接続表示 | iPad がつながると LED にチェック、切れるとバツを表示 |
| ユーティリティ | サステイン、全音停止、音量、ベロシティ |

## 動作環境

- **micro:bit V2 必須**（ロゴタッチと V2 用 BLE スタックを使うため）
- Microsoft MakeCode for micro:bit（makecode.microbit.org）
- iPad / iPhone の GarageBand（Bluetooth MIDI デバイスに対応したバージョン）

MakeCode はダウンロード時に **「V2 のみ」** でよいか聞いてきます。これは想定どおりです → [V2 のみのダウンロード](#v2-のみのダウンロード)。

## インストール手順

### 1. 拡張機能をインポートする

1. [makecode.microbit.org](https://makecode.microbit.org) を開き、新しいプロジェクトを作る
2. **ボードが micro:bit V2 になっているか確認**（画面下のツールバー、または「プロジェクトの設定」）
   - V1 のままだと拡張機能がエラー 929 で弾かれます
3. 歯車アイコン（設定）→「拡張機能」→ **拡張機能をインポート** を開く
4. 次の URL を貼り付けて確定する

   ```
   https://github.com/hinyhiny/pxt-microbit-garageband-pad
   ```

5. ブロック一覧に **GarageBand Pad** カテゴリが出れば成功

### 2. Bluetooth を「ペアリング不要」にする（**必須**）

歯車（設定）→「プロジェクトの設定」→ **Bluetooth** を **「ペアリング不要: Bluetooth で誰でも接続できる」** にする。

**この設定は .hex に焼き込まれます。設定を変えただけでは何も変わりません。設定後に必ず「ダウンロード」して .hex を書き込み直してください。**

#### なぜ必須なのか

MakeCode の既定値は **「JustWorks pairing」** です。この状態では BLE MIDI の文字特性（characteristic）に「**読み取りに認証が必要**」というフラグが付きます。これは `bluetooth-midi` のネイティブ実装が次のように書いているためです。

```cpp
uint16_t props = microbit_propREAD | microbit_propWRITE | microbit_propWRITE_WITHOUT | microbit_propNOTIFY;
#if !CONFIG_ENABLED(MICROBIT_BLE_OPEN)   // ← ペアリング必須のとき
    props |= microbit_propREADAUTH;      // ← 読み取りに認証を要求する
#endif
```

iPad の CoreMIDI は接続直後にサービス探索 → この特性を読みます。認証が済んでいないので **ATT エラー（Insufficient Authentication）** が返り、**iOS は安全のため即座にリンクを切ります**。これが「つながった瞬間に切れる」の正体です。

「ペアリング不要」にするとマイコン側で `MICROBIT_BLE_OPEN` が有効になり、認証要求が外れます。同時に **PAIRING MODE 画面も出なくなる**ので、一石二鳥です。

#### この設定は Bluetooth の「名前」も決めています

micro:bit ランタイムは広告する名前を次のように組み立てます（`codal-microbit-v2` の `source/bluetooth/MicroBitBLEManager.cpp`）。

```cpp
gapName = MICROBIT_BLE_MODEL;                        // "BBC micro:bit"
if (enableBonding || !CONFIG_ENABLED(MICROBIT_BLE_WHITELIST)) {
    gapName = gapName + " [" + deviceName + "]";     // ← その個体だけの5文字が入る
}
```

`MICROBIT_BLE_OPEN` は `MICROBIT_BLE_WHITELIST` を `0` にし（`inc/MicroBitConfig.h`）、`deviceName` には `microbit_friendly_name()`（チップ固有の5文字）が渡されています。つまり：

| プロジェクトの設定 | 実際に広告される名前 |
| --- | --- |
| **ペアリング不要**（`MICROBIT_BLE_OPEN`） | `BBC micro:bit [zapuv]` — **個体ごとに違う** |
| JustWorks pairing（既定値） | `BBC micro:bit` — **全台まったく同じ** |

つまり上の「必須」設定は、**教室で複数台を見分けられるようにする設定でもあります**。詳しくは[複数台を同時に使う（教室で）](#複数台を同時に使う教室で)を参照してください。

### 3. iPad 側で接続する

1. micro:bit を**普通に起動**する（PAIRING MODE の画面のままにしない。ここで止まっていると MIDI の UUID が広告されず見つかりません）
2. GarageBand を開き、**ソフトウェア音源（Software Instrument）のトラック**を作る
3. 設定（歯車）→「詳細」→「Bluetooth MIDI デバイス」
4. `BBC micro:bit [xxxxx]` をタップ → Connect をオン（`xxxxx` は自分の micro:bit が LED に表示する5文字）
5. micro:bit 側に ✓ が出れば接続完了

つながらないときは、iPad 側で「編集」→「忘れる」してから、micro:bit をリセットしてやり直してください。

## ブロック

### Setup（準備）

| ブロック | 説明 |
| --- | --- |
| `start GarageBand Pad channel [1] instrument [1]` | チャンネルと音色を決めてパッドを開始。Bluetooth の接続状態も LED に出す |
| `set MIDI channel [1]` | 以後のブロックが使う MIDI チャンネル（1〜16） |
| `set instrument [1]` | 音色（General MIDI の 1〜128） |
| `set pad velocity [100]` | パッドが鳴らす音の強さ |
| `set channel volume [100]` | チャンネル音量（CC7） |
| `on Bluetooth connected` | つながったときの処理 |
| `on Bluetooth disconnected` | 切れたときの処理 |
| `Bluetooth connected` | 接続中かどうか（真偽値） |

### Pads（パッド）

| ブロック | 説明 |
| --- | --- |
| `bind pad [A] to note [60]` | 押している間その音を鳴らす。離すと止まる |
| `bind pad [A] to chord [60] [major]` | 押している間その和音を鳴らす |
| `on pad [A] pressed` / `on pad [A] released` | パッドの押下／解放で処理を実行（音とは独立に使える） |
| `pad [A] is pressed` | 今押されているか |
| `shift pad octave by [1]` / `reset pad octave` | 割り当てた音をまとめてオクターブ移動 |
| `unbind all pads` | 割り当てを全部消して全音停止 |

### Notes（音符）

| ブロック | 説明 |
| --- | --- |
| `note [C] octave [4]` | 音名＋オクターブから MIDI ノート番号を作る |
| `note on [60] velocity [100]` / `note off [60]` | 個別に鳴らす／止める |
| `play note [60] for [500] ms` | 一定時間鳴らして止める |
| `play chord [60] [major] for [500] ms` | 和音を一定時間鳴らして止める |

### RTTTL（着メロ）

RTTTL（Ring Tone Text Transfer Language）は昔の携帯電話の着メロ形式です。曲全体が 1 行のテキストで書かれていて、音符は Bluetooth MIDI で送られるので、「ガレージバンドをはじめる」で選んだチャンネルと音色で鳴ります。

| ブロック | 説明 |
| --- | --- |
| `play RTTTL [tune]` | 曲を再生し、終わるまで待つ |
| `set RTTTL tempo to [120] (bpm)` | 曲のテンポをまとめて指定する（`0` で曲ごとのテンポのまま） |
| `stop RTTTL` | 再生中の曲を途中で止める（鳴っている音もその場で消える） |

曲は次のように書かれています。

```
Ode:d=4,o=5,b=125:8e,8e,8f,8g,8g,8f,8e,8d,8c,8c,8d,8e,8e.,8d,4d
 |  |   |   |     |
 |  |   |   |     +-- 音符の並び（カンマ区切り）
 |  |   |   +-------- b = テンポ（1 分あたりの拍数。小さいほど遅い）
 |  |   +------------ o = 音符に指定が無いときのオクターブ
 |  +---------------- d = 音符に指定が無いときの音の長さ
 +------------------- 曲名（省略できます）
```

音符は「長さ＋音名＋シャープ＋オクターブ＋付点」の順に書きます。`8e` は 8 分音符のミ、`8c#5` は嬰ハ、`4a.` は付点 4 分音符のラ、`p` は休符です。長さは全音符の分数なので、`4` が 4 分音符、`8` が 8 分音符です。

曲のデータは Web にたくさんあります。「rtttl 曲名」で検索して、その 1 行をブロックに貼り付けてください。

Web で拾ってきた曲はテンポがばらばらなので、1 曲ずつ `b=` を書き換える代わりに `set RTTTL tempo` でテンポをまとめて指定できます。`120` ならどの曲も 120 BPM、`60` なら半分の速さ、`240` なら 2 倍の速さです。`0` にすると上書きをやめて、曲に書かれているテンポどおりに鳴ります（このブロックを置かなかったときと同じ動きです）。400 を超える値は切り詰められます。設定は変えるまで残るので、`はじめに` に `set RTTTL tempo to [90] (bpm)` を 1 つ置けば、教室で全部を少しゆっくりにできます。

曲が同時に鳴ることはありません。新しく再生を始めると、鳴っていた曲はそこで止まります。同じパッドを 2 回押すと**曲が最初から鳴り直す**ので、教室でパッドを連打されても 2 曲が重なって汚い音になることはありません。`stop RTTTL` は、鳴っている音を音の長さの最後まで残さず、その場で消します。

### Expression（表現）

| ブロック | 説明 |
| --- | --- |
| `tilt pitch bend [on]` | 左右の傾きでピッチベンド |
| `tilt modulation [on]` | 傾きでモジュレーション（ビブラート） |

### Utility

| ブロック | 説明 |
| --- | --- |
| `sustain [on]` | サステインペダル（CC64） |
| `all notes off` | 鳴っている音を全部止めてパッドの状態をリセット（再生中の曲も止まります） |

### Classroom（教室）

| ブロック | 説明 |
| --- | --- |
| `device ID` | この micro:bit が Bluetooth 名で使う5文字（上級者向けの `control → device name` ブロックと同じ値） |
| `show device ID` | その5文字を LED 表示に流す |

## サンプルプログラム

A / B / A+B を C メジャーの I–V–vi の 3 コードパッドにして、ロゴを押している間だけ 1 オクターブ上げる例です。

```typescript
// MIDI チャンネル 1、音色 1（アコースティックグランドピアノ）
gbpad.start(1, 1)

// 自分のデバイスID（例: zapuv）を流して、GarageBand の
// 「BBC micro:bit [zapuv]」をすぐ見つけられるようにする
gbpad.showDeviceId()

// 3 つのコードパッド（C メジャー / G メジャー / A マイナー）
gbpad.bindPadChord(MidiPad.A, gbpad.note(NoteName.C, 3), Chord.Major)
gbpad.bindPadChord(MidiPad.B, gbpad.note(NoteName.G, 3), Chord.Major)
gbpad.bindPadChord(MidiPad.AB, gbpad.note(NoteName.A, 3), Chord.Minor)

// 傾きでピッチベンド（±2 半音）
gbpad.tiltPitchBend(OnOff.On)

// ロゴを押している間は 1 オクターブ上
gbpad.onPadPressed(MidiPad.Logo, () => gbpad.shiftOctave(1))
gbpad.onPadReleased(MidiPad.Logo, () => gbpad.shiftOctave(-1))

// 接続状態を表示
gbpad.onConnected(() => basic.showIcon(IconNames.Happy))
gbpad.onDisconnected(() => basic.showIcon(IconNames.Sad))
```

### ドラムを叩く例

MIDI チャンネル 10 がドラム用です。MIDI カテゴリの `midi play drum` ブロックと組み合わせてください。

```typescript
gbpad.onPadPressed(MidiPad.A, () => midi.playDrum(DrumSound.AcousticBassDrum))
gbpad.onPadPressed(MidiPad.B, () => midi.playDrum(DrumSound.AcousticSnare))
gbpad.onPadPressed(MidiPad.AB, () => midi.playDrum(DrumSound.ClosedHiHat))
```

（`DrumSound` と `playDrum` は pxt-midi パッケージのものです。ドラムは MIDI チャンネル 10 固定で送られます。）

### 曲をまるごと鳴らす例

`play RTTTL` は曲が終わるまで待つので、`はじめに`（on start）や `ずっと`（forever）に置くのが自然です。**パッドから曲を始めたいとき**は、制御カテゴリの `背景で実行`（run in background）で包んでください。包まないと、曲が鳴っている間パッドの監視が止まり、他のパッドが反応しなくなります。

```typescript
const TUNE = "Ode:d=4,o=5,b=125:8e,8e,8f,8g,8g,8f,8e,8d,8c,8c,8d,8e,8e.,8d,4d"

// どの曲も 90 BPM で鳴らす。曲に書かれたテンポに戻すなら 0
gbpad.setRtttlTempo(90)

gbpad.onPadPressed(MidiPad.Logo, () => {
    control.inBackground(() => gbpad.playRtttl(TUNE))
})
gbpad.onPadPressed(MidiPad.A, () => gbpad.stopRtttl())
```

調整できるのは主に 3 つです。

- **テンポ**は曲の `b=` の数字。小さくすると遅くなるので、教室でみんなで追いかけるときは小さくすると楽です。`set RTTTL tempo` を使えば、曲を書き換えずに BPM で上書きできます。`0` にすると曲ごとのテンポに戻ります。
- **音の高さ**は `o=`（と各音符のオクターブ）。選んだ音色に対して高すぎるときは 1 オクターブ下げてください。
- **1 曲だけテンポを変える**には、`set RTTTL tempo` は全体設定なので、その `play RTTTL` の直前に `set RTTTL tempo` を置くか、その曲の `b=` を直接書き換えてください。

## 複数台を同時に使う（教室で）

micro:bit は **チップのシリアル番号から作った5文字の ID** を持っていて、その ID が Bluetooth 名の `[ ]` の中身になります。micro:bit の名前は変更できません（ランタイムに固定）が、この ID があれば同じ部屋にある複数台を見分けられます。

### 準備

1. **全台**を「**ペアリング不要**」のプロジェクト設定で書き込む（[手順2](#2-bluetooth-をペアリング不要にする必須)）。これが無いと全台が `BBC micro:bit` という同じ名前を広告してしまい、区別できません。
2. `show device ID` を「はじめに」に置くと、生徒が自分の ID を目で確認できます。

   ```typescript
   gbpad.start(1, 1)
   gbpad.showDeviceId()      // 例: "zapuv" と流れる
   ```

3. 生徒は起動して LED の5文字を読み、GarageBand の Bluetooth MIDI デバイス一覧で **`BBC micro:bit [zapuv]`** を選びます（歯車 →「詳細」→「Bluetooth MIDI デバイス」）。

### 知っておくとよいこと

- **ID は 5⁵ = 3125 通りしかありません。** 1 教室に 30 台あると、**約 13%** の確率で 2 台が同じ ID になります（15 台なら約 3%）。候補が 2 つ出たときは片方に接続し、**自分の micro:bit に ✓ が出れば正解**です。出なければ切断してもう片方を試してください。✓ / ✕ の表示がそのまま見分ける手段になります。
- ID はチップ由来なので**変わりません**。書き込み直しても同じです。
- LED には Bluetooth 名と同じ**小文字**で表示されます。
- **MakeCode のシミュレーターにはチップのシリアル番号が無い**ため、`device ID` は `simul` という仮の値を返します（`show device ID` は `simul` と流れます）。本物の ID は実機にしかありません。
- iOS はデバイスをアドレスで記憶します。Bluetooth の設定を変えたときや、別の生徒に micro:bit を渡したときは古い登録を消してください（GarageBand →「Bluetooth MIDI デバイス」→「編集」で削除、iPad の「設定 → Bluetooth」で micro:bit を「忘れる」）。

## ハードウェア上の注意

- **A+B パッドは物理的に独立していません。** A と B を同時に押すと、A、B、A+B の 3 パッドが同時に「押された」と判定されます。これは micro:bit のボタンが A と B しかないためで、意図的にキャンセル処理を入れていません。A+B をコードパッドとして使うときは、A と B 側の処理を工夫してください。
- **ロゴタッチは V2 専用**です。V1 では `MidiPad.Logo` は常に「押されていない」扱いになります（V1 でクラッシュしないようボード判定を入れています）。
- パッドの押下検出は 10 ms ごとのポーリングです。`input.onButtonPressed`（＝離した瞬間に発火するクリックイベント）ではなくポーリングにしているのは、「押している間だけ鳴らす」を正確に実現するためです。
- Bluetooth が切れている間は MIDI メッセージは送られません（送信側で接続チェック済み）。切れたときに音が残らないよう、切断時に自動で全音停止します。

## 実装のしくみと依存関係

このパッケージ自身は**パッド・接続・表現のロジックだけ**を持ち、BLE MIDI の送信そのものは実績のあるパッケージに任せています。

| 依存 | 役割 |
| --- | --- |
| `github:RBilsland/pxt-bluetooth-midi` | BLE MIDI の GATT サービス（`03B80E5A-EDE8-4B33-A751-6CE34EC4C700`）を広告し、MIDI メッセージを notify で送る。**micro:bit V2 (CODAL) 対応** |
| `github:microsoft/pxt-midi#v2.1.11` | MIDI メッセージの生成（note on/off、和音、CC、ピッチベンド） |

> **なぜフォークを使うのか**
> 公式の `microsoft/pxt-bluetooth-midi` v2.0.13 は nRF51（micro:bit V1）の mbed BLE API（`ble/BLE.h`、`GattService`、`ble.gattServer()`）で書かれています。micro:bit V2 は nRF52833 + CODAL で BLE API が別物なので、**V2 ではコンパイルできません**。MakeCode はこれを検出して error 929（このボードでは使えない拡張機能）を出し、拡張機能を無効化します。RBilsland フォークは v2.0.14 以降で CODAL の `MicroBitBLEService` ベースの実装を追加し、広告・GATT ハンドシェイク・ペアリング設定まで V2 向けに修正しています（v2.0.25 時点）。

## トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| MakeCode で **error 929** が出て拡張機能を追加できない | ボードが **V2** か確認。V1 のプロジェクトには追加できません |
| ダウンロード時に **「V2 のみ」** でよいか聞かれる | 想定どおりで、そのまま V2 のみを選んで正解です。V1 側に BLE スタックが収まりません → [V2 のみのダウンロード](#v2-のみのダウンロード) |
| 今までつながっていたのに、急に接続できなくなった（焼き直した直後によく起きる） | まず**電源を抜き差しする**。USB ケーブルを抜き、電池も外して数秒待ってから入れ直す。書き込み直後は Bluetooth スタックが古い状態のまま残ることがあり、リセットボタンより電源の抜き差しのほうが確実です。拡張機能側が原因になることはありません（MIDI サービスは電源投入時に自動で立ち上がります） |
| GarageBand の「Bluetooth MIDI デバイス」に micro:bit が出ない | micro:bit が **PAIRING MODE 画面のままになっていないか**確認（リセットを押す）。プロジェクト設定の「ペアリング不要」を ON にする。iPad 側で古い登録を「忘れる」 |
| 一覧が `BBC micro:bit` のままで **`[xxxxx]` が付かない** | そのボードで**「ペアリング不要」が効いていません**。これが一番手早い確認方法です（設定が効いていれば必ず5文字が付きます）。放っておくと教室で全台が同じ名前に見えるうえ、即切断の問題も残ったままです |
| **iPad から Bluetooth でプログラムを送れなくなった** | ボードに保存された Bluetooth の状態が壊れています。まずパソコンから USB で新しい .hex を焼き、それで足りなければ初期化プログラムを焼きます → [iPad から Bluetooth でプログラムを送れなくなった](#ipad-から-bluetooth-でプログラムを送れなくなった) |
| Connect を押すと **接続中 → 未接続** にすぐ戻る（micro:bit に ✓ が出てすぐ ✕ になる） | → 下の「[接続した瞬間に切れる](#接続した瞬間に切れる)」を実施 |
| 接続したあと LED に "S" が戻る／顔文字が出て止まる | マイコンが**リセットまたはクラッシュ**しています。ソフトウェアではなく電源・ファームウェア側の問題です（USB 給電で試す、新しい電池にする） |
| つながっているのに音が出ない | GarageBand で**ソフトウェア音源のトラックが選択されている**か確認。録音待機（赤いボタン）が必要な音源もあります。`midi channel` が 1 になっているか確認 |
| 音が途中で切れる／遅れる | 2.4 GHz の混雑（Wi-Fi ルーターの近く）を避ける。iPad と micro:bit を近づける |
| 音が鳴りっぱなしになる | `all notes off` ブロックを呼ぶ。切断時は自動で停止します |
| 拡張機能を更新したのに反映されない | 拡張機能を一度削除して同じ URL を再度インポートし、**新しい .hex を書き込み直す**（ファームウェアを焼き直さないと反映されません） |
| 拡張機能の一覧に画像が出ない | **現状は想定どおりです。** MakeCode が表示するのはリポジトリ直下の `icon.png` ですが、**承認済みの拡張機能に限られます**。`pxt.json` に設定項目はありません（そちらの `icon` は組み込みパッケージ専用）。ファイルは要件どおりの 300×200 で置いてあるので、承認申請が通ればそのまま表示されます |

### V2 のみのダウンロード

MakeCode は通常、**ユニバーサル .hex** を渡してきます。V1 用と V2 用のイメージを 1 つに入れたファイルで、どちらのボードにも書き込めるものです。つまり**両方に収まる**必要があり、V1 の空きは V2 よりずっと小さい:

| バリアント | 使えるフラッシュ |
| --- | --- |
| micro:bit V1（`mbdal`） | 242,688 バイト |
| micro:bit V2（`mbcodal`） | 471,040 バイト |

Bluetooth MIDI のスタックは 242,688 バイトには収まらないので、V1 側のイメージが作れません。MakeCode はそれをそのまま伝えて（*「your program is too large to fit on a micro:bit V1」*）**V2 のみでダウンロード**するか聞いてきます。そのまま選んで正解です。書き出される .hex は V2 用のイメージだけになり、ユニバーサル .hex より小さくなります。

- これは**エディタの仕様で、プログラムの不具合ではありません**。micro:bit の Bluetooth MIDI プロジェクトなら必ず出ます。V1 側に収める方法はありません。
- micro:bit V2 を USB でつないで普通の**ダウンロード**ボタン（WebUSB で直接書き込む方）を使えば、この確認は出ません。相手が V2 だと分かるので、MakeCode が黙って V2 専用で作り直します。
- V2 専用の .hex は **V1 では動きません**。しかも V1 に書き込むとエラーコードも出ずに黙って止まります。教室の全台が V2 なら問題ありませんが、V1 が混ざるなら覚えておいてください。

### 接続した瞬間に切れる

症状: GarageBand で **接続中** になる → micro:bit に ✓ が出る → 0.5 秒ほどで **未接続** に戻り micro:bit は ✕ になる。

**第一容疑者は「ペアリング設定」です。** 上記「[Bluetooth を「ペアリング不要」にする](#2-bluetooth-をペアリング不要にする必須)」のとおり、`JustWorks pairing` のままだと接続直後の特性読み取りが ATT 認証エラーになり、**iOS 側から切られます**。

次の順番で全部やってください（1 つでも飛ばすと再発します）。

1. **MakeCode**: プロジェクトの設定 → Bluetooth → **ペアリング不要** → **新しい .hex をダウンロードして書き込み直す**
2. **micro:bit**: A/B を押さずに**リセットボタン**を押す（PAIRING MODE 画面から抜ける）
3. **iPad の Bluetooth 設定**: 「BBC micro:bit」の ⓘ → **このデバイスを削除**（古いペアリング鍵が残っていると iOS はそれを使って失敗し、即切断します）
4. **GarageBand**: 設定（歯車）→ 詳細 → Bluetooth MIDI デバイス → **編集 → 該当デバイスを削除**（「オフライン」表示の残骸を消す）
5. iPad の Bluetooth を**オフ → オン**（または iPad を再起動）
6. micro:bit と iPad を**近づけて**（30 cm 以内）から、もう一度 Connect

#### それでも直らないとき

問題が「BLE トランスポート／設定」なのか「このパッケージ（gbpad）」なのかを切り分けます。
下のプログラムを、**`https://github.com/RBilsland/pxt-bluetooth-midi` だけをインポートした新規プロジェクト**に貼り付けて（gbpad は入れない）、「ペアリング不要」にして焼いてください。

```typescript
let linkUp = false

bluetooth.onBluetoothConnected(function () {
    linkUp = true
    basic.showIcon(IconNames.Yes)     // 消さずに残す
})

bluetooth.onBluetoothDisconnected(function () {
    linkUp = false
    basic.showIcon(IconNames.No)
})

input.onButtonPressed(Button.A, function () {
    basic.showIcon(linkUp ? IconNames.Yes : IconNames.No)
})

input.onButtonPressed(Button.B, function () {
    midi.channel(1).noteOn(60, 100)
    basic.pause(300)
    midi.channel(1).noteOff(60)
})

basic.showString("S")   // "S" = プログラムが動いている
```

- **それでも切れる** → 原因はトランスポート層（`RBilsland/pxt-bluetooth-midi` v2.0.25）かプロジェクト設定側。gbpad は無関係
- **切れない** → gbpad 側の問題。症状を報告してください

LED の見え方で次のことが分かります。

| 見るもの | わかること |
| --- | --- |
| 切断後、LED が "S"（起動マーク）に戻る | micro:bit がリセット／クラッシュしている |
| LED が ✕ のまま固まる | 正常。リンクだけが切れた（iPad 側の都合） |
| **macOS** の「Audio MIDI Setup → MIDI スタジオ → Bluetooth」から接続しても切れる | micro:bit 側の問題 |
| macOS では安定、iPad だけ切れる | iPad のキャッシュ／ペアリング鍵の問題（上記 3〜5 を徹底） |
| 拡張機能一覧の `bluetooth-midi` のバージョン | **v2.0.21 未満なら古い**。削除して再インポートし、.hex を焼き直す |

### iPad から Bluetooth でプログラムを送れなくなった

iPad には有線で送る手段がなく、プログラムは micro:bit アプリ経由で Bluetooth で送ります。送れなくなったときは、ボードに保存されている Bluetooth の状態が壊れているのが普通で、直すにはパソコンから上書きします。

1. **パソコンから USB で新しい .hex を焼く。** micro:bit 公式も、iPad で再挑戦する前にこれを勧めています。`MICROBIT` ドライブに .hex をドラッグ＆ドロップして書き込むと、**Bluetooth のペアリング／ボンディング情報と設定がすべて消えます**（microbit.org「Reset your micro:bit」）。そのあと、このプロジェクトの .hex を焼き直してください。設定は .hex と一緒に戻ります。
2. **それでも直らなければ初期化プログラムを焼く。** 同じ microbit.org のページにある **`meet the micro:bit`**（旧 Out of Box Experience）がそれです。`MICROBIT` ドライブにコピーすると「工場出荷状態に戻すのと同じ」働きをし、「micro:bit 上の Bluetooth ペアリング情報も消します」。Bluetooth に反応しなくなった個体はたいていこれで戻ります。
3. **「ペアリング不要」が消えていないか確認する。** この設定は .hex に焼き込まれるので、初期化プログラムを入れると消えます。このプロジェクトの .hex を焼き直して、一覧に出る名前の `[xxxxx]` が戻っているか確かめてください → [インストール手順 2](#2-bluetooth-をペアリング不要にする必須)。

micro:bit アプリで間違えやすい点が 2 つあります。

- 転送のたびに、**ボードを Bluetooth モードにする**必要があります。リセットを 3 回押すか、A と B を押しながらリセットを押して離し、全 LED が点灯するまで A と B を押し続けます。
- **電池が弱ると無線が壊れます。表示は元気に見えます。** この切り分けをしている間は USB 給電か新しい電池にしてください。

あと 1 つ。V2 は**リセットを約 4 秒押し続けて LED が消えると電源が切れます**。ケーブルを抜くより確実な電源の入れ直しで、Bluetooth がおかしいときの第一手です → [トラブルシューティング表](#トラブルシューティング)。

## ファイル構成

```
.
├── pxt.json                     # MakeCode パッケージ定義（依存関係・ファイル一覧）
├── garageband-pad.ts            # ブロック実装（このパッケージの本体）
├── tests.ts                     # サンプル／テスト用（インポート時はコンパイルされない）
├── icon.png                     # 拡張機能アイコン（300×200、一覧用）
├── tsconfig.json
├── _locales/ja/
│   ├── garageband-pad-strings.json       # ブロック表示の日本語
│   └── garageband-pad-jsdoc-strings.json # ツールチップの日本語
├── README.md                    # 英語版
└── README.ja.md                 # このファイル（日本語版）
```

## ライセンス

MIT。依存する [pxt-bluetooth-midi](https://github.com/RBilsland/pxt-bluetooth-midi)（元は [microsoft/pxt-bluetooth-midi](https://github.com/microsoft/pxt-bluetooth-midi)）と [pxt-midi](https://github.com/microsoft/pxt-midi) も MIT です。
"GarageBand" は Apple Inc. の商標です。本パッケージは Apple とは無関係の非公式なものです。
