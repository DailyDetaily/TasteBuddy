#!/usr/bin/env python3
"""Taste Buddy 브랜드 필름의 30초 오리지널 스코어를 합성합니다.

외부 음원·샘플·음성·패키지 없이 Python 표준 라이브러리만 사용합니다.
실행: python3 brand-launch/scripts/generate-score.py
"""

from __future__ import annotations

import argparse
from array import array
import hashlib
import json
import math
from pathlib import Path
import random
import sys
import wave


SAMPLE_RATE = 48_000
DURATION_SECONDS = 30
FRAME_COUNT = SAMPLE_RATE * DURATION_SECONDS
TAU = 2 * math.pi
SEED = 9_620_026
PEAK_DBFS = -3.2


def midi_frequency(note: int) -> float:
    return 440.0 * 2 ** ((note - 69) / 12)


def equal_power_pan(position: float) -> tuple[float, float]:
    angle = (max(-1.0, min(1.0, position)) + 1) * math.pi / 4
    return math.cos(angle), math.sin(angle)


def write_note(
    left: array,
    right: array,
    onset: float,
    note: int,
    gain: float,
    pan: float,
    duration: float = 4.5,
) -> None:
    """짧은 펠트 어택 뒤에 목재·유리의 잔향이 가볍게 남는 음색."""
    frequency = midi_frequency(note)
    start = round(onset * SAMPLE_RATE)
    count = min(round(duration * SAMPLE_RATE), FRAME_COUNT - start)
    pan_left, pan_right = equal_power_pan(pan)
    for index in range(count):
        time = index / SAMPLE_RATE
        attack = 1.0 - math.exp(-time / 0.008)
        release = min(1.0, (duration - time) / 0.35)
        tone = (
            0.80 * math.sin(TAU * frequency * time) * math.exp(-time / 1.20)
            + 0.14 * math.sin(TAU * frequency * 2.002 * time) * math.exp(-time / 0.62)
            + 0.045 * math.sin(TAU * frequency * 3.007 * time) * math.exp(-time / 0.31)
            + 0.015 * math.sin(TAU * frequency * 4.021 * time) * math.exp(-time / 0.11)
        )
        value = gain * attack * release * tone
        left[start + index] += value * pan_left
        right[start + index] += value * pan_right


def write_pad(
    left: array,
    right: array,
    onset: float,
    duration: float,
    notes: tuple[int, ...],
    gain: float,
) -> None:
    """느린 어택과 자연스러운 겹침을 가진 낮고 따뜻한 코드 패드."""
    start = round(onset * SAMPLE_RATE)
    count = min(round(duration * SAMPLE_RATE), FRAME_COUNT - start)
    for voice, note in enumerate(notes):
        frequency = midi_frequency(note)
        pan_left, pan_right = equal_power_pan((voice / max(1, len(notes) - 1) - 0.5) * 0.72)
        phase = voice * 0.73
        for index in range(count):
            time = index / SAMPLE_RATE
            attack = math.sin(min(1.0, time / 1.35) * math.pi / 2) ** 2
            release = math.sin(min(1.0, (duration - time) / 2.1) * math.pi / 2) ** 2
            drift = 1.0 + 0.08 * math.sin(TAU * 0.12 * time + phase)
            value = gain * attack * release * drift * (
                0.72 * math.sin(TAU * frequency * time + phase)
                + 0.21 * math.sin(TAU * frequency * 1.0022 * time + phase)
                + 0.07 * math.sin(TAU * frequency * 2.0 * time)
            )
            left[start + index] += value * pan_left
            right[start + index] += value * pan_right


def write_transition(left: array, right: array, hit: float, gain: float, rng: random.Random) -> None:
    """화면 전환을 받쳐 주는 짧은 공기 질감과 유리 음색. 충격음은 배제."""
    onset = max(0.0, hit - 0.48)
    duration = 1.25
    start = round(onset * SAMPLE_RATE)
    count = min(round(duration * SAMPLE_RATE), FRAME_COUNT - start)
    lowpass = 0.0
    low_band = 0.0
    for index in range(count):
        time = index / SAMPLE_RATE
        noise = rng.uniform(-1.0, 1.0)
        lowpass += 0.19 * (noise - lowpass)
        low_band += 0.018 * (lowpass - low_band)
        envelope = math.sin(math.pi * min(1.0, time / duration)) ** 3
        shimmer = math.sin(TAU * 1174.659 * time) * math.exp(-time / 0.48) * 0.075
        value = gain * envelope * (lowpass - low_band + shimmer)
        pan_left, pan_right = equal_power_pan(-0.20 + 0.40 * time / duration)
        left[start + index] += value * pan_left
        right[start + index] += value * pan_right


def add_room(left: array, right: array) -> None:
    """작은 스테레오 공간감. 원음 복사본으로 누적 피드백을 방지합니다."""
    dry_left = array("d", left)
    dry_right = array("d", right)
    for delay_seconds, gain, cross in (
        (0.071, 0.085, False),
        (0.113, 0.064, True),
        (0.191, 0.045, False),
        (0.317, 0.031, True),
        (0.509, 0.018, True),
    ):
        delay = round(delay_seconds * SAMPLE_RATE)
        source_left, source_right = (dry_right, dry_left) if cross else (dry_left, dry_right)
        for index in range(delay, FRAME_COUNT):
            left[index] += source_left[index - delay] * gain
            right[index] += source_right[index - delay] * gain


def synthesize() -> tuple[array, array]:
    left = array("d", [0.0]) * FRAME_COUNT
    right = array("d", [0.0]) * FRAME_COUNT
    rng = random.Random(SEED)

    # D major의 열린 화성. 낮은 음역에 공간을 두어 영상의 문구를 받쳐 줍니다.
    for onset, duration, notes in (
        (0.0, 7.0, (38, 57, 61, 64)),      # Dmaj9
        (5.0, 7.0, (35, 54, 57, 61)),     # Bm9
        (10.0, 8.0, (31, 50, 57, 61)),    # Gmaj9
        (16.0, 9.0, (33, 52, 57, 62)),    # Asus / D
        (23.0, 7.0, (38, 57, 61, 64)),    # Dmaj9, 마지막 로고로 해소
    ):
        write_pad(left, right, onset, duration, notes, 0.030)

    # D–F#–A–E, 반복할수록 익숙해지는 네 음의 브랜드 모티프.
    motif = (74, 78, 69, 76)
    phrases = (
        (0.75, (0.0, 0.75, 1.50, 2.75), 0.29),
        (5.75, (0.0, 0.75, 1.50, 2.75), 0.27),
        (10.75, (0.0, 0.875, 1.75, 3.00), 0.29),
        (16.75, (0.0, 0.75, 1.50, 2.75), 0.28),
        (23.20, (0.0, 0.70, 1.40, 2.50), 0.26),
    )
    for onset, offsets, gain in phrases:
        for index, (note, offset) in enumerate(zip(motif, offsets)):
            write_note(left, right, onset + offset, note, gain * (1.0, 0.81, 0.89, 0.76)[index], (-0.17, 0.12, -0.07, 0.20)[index])

    # 중간의 여백과 마지막 3초에 낮은 응답음으로 안정감을 더합니다.
    for onset, note, gain, pan in (
        (14.6, 66, 0.15, -0.10),
        (20.65, 69, 0.17, 0.10),
        (21.60, 73, 0.12, -0.12),
        (27.05, 62, 0.25, -0.04),
        (27.15, 69, 0.13, 0.12),
        (27.35, 74, 0.14, -0.12),
    ):
        write_note(left, right, onset, note, gain, pan)

    for hit, gain in ((0, 0.040), (5, 0.050), (10, 0.052), (16, 0.047), (23, 0.050), (27, 0.042)):
        write_transition(left, right, hit, gain, rng)

    add_room(left, right)

    # 렌더 경계의 클릭을 방지하고 정확히 마지막 2초 동안 전체 믹스를 페이드합니다.
    for index in range(FRAME_COUNT):
        time = index / SAMPLE_RATE
        fade_in = min(1.0, time / 0.025)
        fade_out = math.cos(max(0.0, min(1.0, (time - 28.0) / 2.0)) * math.pi / 2) ** 2
        left[index] *= fade_in * fade_out
        right[index] *= fade_in * fade_out
    left[-1] = right[-1] = 0.0
    return left, right


def save_wave(output: Path, left: array, right: array) -> dict[str, object]:
    peak = max(max(abs(value) for value in left), max(abs(value) for value in right))
    scale = 10 ** (PEAK_DBFS / 20) / peak
    samples = array("h")
    energy = 0.0
    clipped = 0
    actual_peak = 0
    for left_value, right_value in zip(left, right):
        for value in (left_value, right_value):
            sample = round(value * scale * 32767)
            clipped += int(abs(sample) >= 32767)
            actual_peak = max(actual_peak, abs(sample))
            energy += (sample / 32768) ** 2
            samples.append(sample)
    if sys.byteorder != "little":
        samples.byteswap()
    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output), "wb") as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(samples.tobytes())
    return {
        "output": str(output),
        "duration_seconds": FRAME_COUNT / SAMPLE_RATE,
        "sample_rate": SAMPLE_RATE,
        "channels": 2,
        "sample_format": "PCM 16-bit",
        "frames": FRAME_COUNT,
        "peak_dbfs": round(20 * math.log10(actual_peak / 32768), 3),
        "rms_dbfs": round(20 * math.log10(math.sqrt(energy / len(samples))), 3),
        "clipped_samples": clipped,
        "fade_out_seconds": 2,
        "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Taste Buddy 30초 브랜드 스코어 생성")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "public/audio/taste-buddy-score.wav")
    args = parser.parse_args()
    left, right = synthesize()
    result = save_wave(args.output.resolve(), left, right)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
