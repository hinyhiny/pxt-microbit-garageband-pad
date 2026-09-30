# GarageBand Pad — micro:bit V2 用 Bluetooth MIDI パッド

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
| 接続表示 | iPad がつながると LED にチェック、切れるとバツを表示 |
| ユーティリティ | サステイン、全音停止、音量、ベロシティ |

## 動作環境

- **micro:bit V2 必須**（ロゴタッチと V2 用 BLE スタックを使うため）
- Microsoft MakeCode for micro:bit（makecode.microbit.org）
- iPad / iPhone の GarageBand（Bluetooth MIDI デバイスに対応したバージョン）

## インストール手順

### 1. 拡張機能をインポートする

1. [makecode.microbit.org](https://makecode.microbit.org) を開き、新しいプロジェクトを作る
2. **ボードが micro:bit V2 になっているか確認**（画面下のツールバー、または「プロジェクトの設定」）
   - V1 のままだと拡張機能がエラー 929 で弾かれます
3. 歯車アイコン（設定）→「拡張機能」→ **拡張機能をインポート** を開く
4. 次の URL を貼り付けて確定する

   ```
   https://github.com/<あなたのアカウント>/pxt-microbit-garageband-pad
   ```

5. ブロック一覧に **GarageBand Pad** カテゴリが出れば成功

### 2. ペアリング不要モードにする（強く推奨）

歯車（設定）→「ペアリング不要: Bluetooth で誰でも接続できる」を **オン** → 保存 → ダウンロード。

micro:bit V2 は「ペアリング必須」だと iPad の GarageBand から見つからないことがあります。個人で 1 台だけつなぐなら「ペアリング不要」が確実です。

### 3. iPad 側で接続する

1. micro:bit を**普通に起動**する（PAIRING MODE の画面のままにしない。ここで止まっていると MIDI の UUID が広告されず見つかりません）
2. GarageBand を開き、**ソフトウェア音源（Software Instrument）のトラック**を作る
3. 設定（歯車）→「詳細」→「Bluetooth MIDI デバイス」
4. `BBC micro:bit` をタップ → Connect をオン
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

### Expression（表現）

| ブロック | 説明 |
| --- | --- |
| `tilt pitch bend [on]` | 左右の傾きでピッチベンド |
| `tilt modulation [on]` | 傾きでモジュレーション（ビブラート） |

### Utility

| ブロック | 説明 |
| --- | --- |
| `sustain [on]` | サステインペダル（CC64） |
| `all notes off` | 鳴っている音を全部止めてパッドの状態をリセット |

## サンプルプログラム

A / B / A+B を C メジャーの I–V–vi の 3 コードパッドにして、ロゴを押している間だけ 1 オクターブ上げる例です。

```typescript
// MIDI チャンネル 1、音色 1（アコースティックグランドピアノ）
gbpad.start(1, 1)

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

## ハードウェア上の注意

- **A+B パッドは物理的に独立していません。** A と B を同時に押すと、A、B、A+B の 3 パッドが同時に「押された」と判定されます。これは micro:bit のボタンが A と B しかないためで、意図的にキャンセル処理を入れていません。A+B をコードパッドとして使うときは、A と B 側の処理を工夫してください。
- **ロゴタッチは V2 専用**です。V1 では `Pad.Logo` は常に「押されていない」扱いになります（V1 でクラッシュしないようボード判定を入れています）。
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
| GarageBand の「Bluetooth MIDI デバイス」に micro:bit が出ない | micro:bit が **PAIRING MODE 画面のままになっていないか**確認（リセットを押す）。プロジェクト設定の「ペアリング不要」を ON にする。iPad 側で古い登録を「忘れる」 |
| Connect を押してもすぐ Connect に戻る | 一度「忘れる」→ micro:bit をリセット → GarageBand を再起動。Bluetooth を入れ直す |
| つながっているのに音が出ない | GarageBand で**ソフトウェア音源のトラックが選択されている**か確認。録音待機（赤いボタン）が必要な音源もあります。`midi channel` が 1 になっているか確認 |
| 音が途中で切れる／遅れる | 2.4 GHz の混雑（Wi-Fi ルーターの近く）を避ける。iPad と micro:bit を近づける |
| 音が鳴りっぱなしになる | `all notes off` ブロックを呼ぶ。切断時は自動で停止します |
| 拡張機能を更新したのに反映されない | 拡張機能を一度削除して同じ URL を再度インポートし、**新しい .hex を書き込み直す**（ファームウェアを焼き直さないと反映されません） |

## ファイル構成

```
.
├── pxt.json                     # MakeCode パッケージ定義（依存関係・ファイル一覧）
├── garageband-pad.ts            # ブロック実装（このパッケージの本体）
├── tests.ts                     # サンプル／テスト用（インポート時はコンパイルされない）
├── icon.png                     # 拡張機能アイコン
├── tsconfig.json
├── _locales/ja/
│   ├── garageband-pad-strings.json       # ブロック表示の日本語
│   └── garageband-pad-jsdoc-strings.json # ツールチップの日本語
└── README.md
```

## ライセンス

MIT。依存する [pxt-bluetooth-midi](https://github.com/RBilsland/pxt-bluetooth-midi)（元は [microsoft/pxt-bluetooth-midi](https://github.com/microsoft/pxt-bluetooth-midi)）と [pxt-midi](https://github.com/microsoft/pxt-midi) も MIT です。
"GarageBand" は Apple Inc. の商標です。本パッケージは Apple とは無関係の非公式なものです。
