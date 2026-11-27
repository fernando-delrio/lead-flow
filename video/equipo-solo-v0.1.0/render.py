from __future__ import annotations

import argparse
import json
import math
import re
import shutil
import struct
import subprocess
import sys
import wave
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
BUILD = ROOT / "build"
ASSETS = ROOT / "assets"
WIDTH = 1920
HEIGHT = 1080
FPS = 30
SAMPLE_RATE = 48_000
CAPTION_TOP_MIN = 815
BACKGROUND = "#1E1F29"
SURFACE = "#282A36"
FOREGROUND = "#F8F8F2"
MUTED = "#9AA0B4"
CYAN = "#8BE9FD"
GREEN = "#50FA7B"
ORANGE = "#FFB86C"
PINK = "#FF79C6"
PURPLE = "#BD93F9"
RED = "#FF5555"
YELLOW = "#F1FA8C"
NODE_COLORS = [CYAN, GREEN, ORANGE, PINK, PURPLE, RED, YELLOW]


@dataclass(frozen=True)
class Cue:
    start: float
    end: float
    text: str


def load_font(size: int, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    fonts = Path("C:/Windows/Fonts")
    name = "consolab.ttf" if mono else "segoeuib.ttf" if bold else "segoeui.ttf"
    return ImageFont.truetype(str(fonts / name), size)


FONT_HERO = load_font(96, bold=True)
FONT_TITLE = load_font(64, bold=True)
FONT_LABEL = load_font(34, bold=True)
FONT_BODY = load_font(38)
FONT_CAPTION = load_font(46, bold=True)
FONT_MONO = load_font(34, bold=True, mono=True)


def find_ffmpeg(name: str) -> Path:
    command = shutil.which(name)
    if command:
        return Path(command)
    package_root = Path.home() / "AppData/Local/Microsoft/WinGet/Packages"
    matches = sorted(package_root.glob(f"Gyan.FFmpeg*/**/{name}.exe"))
    if matches:
        return matches[-1]
    raise FileNotFoundError(f"No se encontró {name}. Instala FFmpeg y vuelve a ejecutar.")


def run_ffmpeg(arguments: list[str]) -> None:
    command = [str(find_ffmpeg("ffmpeg")), "-nostdin", "-hide_banner", "-loglevel", "error", "-y", *arguments]
    subprocess.run(command, check=True)


def smoothstep(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def scene_progress(time: float, start: float, end: float) -> tuple[float, float]:
    entrance = smoothstep((time - start) / 0.35)
    exit_value = smoothstep((end - time) / 0.2)
    return entrance, exit_value


def color_with_alpha(color: str, alpha: int) -> tuple[int, int, int, int]:
    value = color.removeprefix("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4)) + (alpha,)


def draw_centered(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font: ImageFont.FreeTypeFont, fill: str) -> None:
    draw.text(xy, text, font=font, fill=fill, anchor="mm")


def draw_background(image: Image.Image) -> None:
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, WIDTH, HEIGHT), fill=BACKGROUND)
    for x in range(0, WIDTH, 120):
        draw.line((x, 0, x, HEIGHT), fill="#242632", width=1)
    for y in range(0, HEIGHT, 120):
        draw.line((0, y, WIDTH, y), fill="#242632", width=1)
    draw.rectangle((64, 54, 76, 1026), fill=CYAN)


def draw_node(draw: ImageDraw.ImageDraw, center: tuple[int, int], radius: int, color: str, label: str = "") -> None:
    x, y = center
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=SURFACE, outline=color, width=7)
    draw.ellipse((x - 10, y - 10, x + 10, y + 10), fill=color)
    if label:
        draw.text((x, y + radius + 24), label, font=FONT_LABEL, fill=FOREGROUND, anchor="ma")


def draw_hook(image: Image.Image, time: float) -> None:
    draw = ImageDraw.Draw(image)
    entrance, _ = scene_progress(time, 0.0, 9.8)
    draw.text((140, 118), "UNA IA PUEDE CAMBIAR CÓDIGO", font=FONT_TITLE, fill=FOREGROUND)
    center = (960, 455)
    radius = int(118 * entrance)
    draw.ellipse((center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius), fill=SURFACE, outline=CYAN, width=9)
    draw_centered(draw, center, "IA", FONT_HERO, CYAN)
    labels = [("PLANIFICA", PURPLE, -360), ("IMPLEMENTA", GREEN, 0), ("APRUEBA", PINK, 360)]
    for label, color, offset in labels:
        x = center[0] + int(offset * entrance)
        y = 620
        draw.rounded_rectangle((x - 160, y - 38, x + 160, y + 38), 18, fill=SURFACE, outline=color, width=4)
        draw_centered(draw, (x, y), label, FONT_LABEL, color)
    if time >= 7.7:
        draw_centered(draw, (960, 740), "¿QUIÉN COMPRUEBA DE VERDAD?", FONT_TITLE, ORANGE)


def draw_responsibilities(image: Image.Image, time: float) -> None:
    draw = ImageDraw.Draw(image)
    draw.text((140, 118), "RESPONSABILIDADES SEPARADAS", font=FONT_TITLE, fill=FOREGROUND)
    center = (960, 440)
    draw_node(draw, center, 88, CYAN, "PERSONA")
    labels = ["PLAN", "CÓDIGO", "SEGURIDAD", "RENDIMIENTO", "REVISIÓN", "DISEÑO", "CIERRE"]
    visible = max(1, min(7, int((time - 9.8) / 0.46) + 1))
    for index, (label, color) in enumerate(zip(labels, NODE_COLORS)):
        angle = -math.pi / 2 + index * math.tau / 7
        point = (int(center[0] + math.cos(angle) * 350), int(center[1] + math.sin(angle) * 230))
        draw.line((*center, *point), fill=color if index < visible else "#44475A", width=5)
        draw_node(draw, point, 48, color if index < visible else "#44475A", label if index < visible else "")


def draw_requirement(image: Image.Image, time: float) -> None:
    draw = ImageDraw.Draw(image)
    draw.text((140, 118), "UN REQUISITO COMPROBABLE", font=FONT_TITLE, fill=FOREGROUND)
    draw.rounded_rectangle((250, 310, 1670, 700), 40, fill=SURFACE, outline=CYAN, width=6)
    draw.text((330, 380), "CARRITO", font=FONT_LABEL, fill=MUTED)
    draw.text((330, 470), "ENVÍO GRATUITO DESDE", font=FONT_TITLE, fill=FOREGROUND)
    draw.text((1240, 450), "50 €", font=FONT_HERO, fill=GREEN)
    draw.line((330, 605, 1530, 605), fill="#44475A", width=10)
    marker_x = 330 + int(1200 * smoothstep((time - 15.0) / 4.0))
    marker_x = min(marker_x, 1530)
    draw.line((330, 605, marker_x, 605), fill=GREEN, width=10)
    draw.ellipse((marker_x - 18, 587, marker_x + 18, 623), fill=GREEN)
    draw_centered(draw, (960, 755), "INCLUIDO EL LÍMITE EXACTO", FONT_LABEL, ORANGE)


def draw_pipeline(image: Image.Image, time: float) -> None:
    draw = ImageDraw.Draw(image)
    draw.text((140, 118), "UNA TAREA · CINCO COMPROBACIONES", font=FONT_TITLE, fill=FOREGROUND)
    labels = ["PLAN", "PRUEBA + CÓDIGO", "PUERTAS", "REQUISITO", "CIERRE"]
    colors = [PURPLE, GREEN, ORANGE, PINK, CYAN]
    xs = [270, 610, 960, 1310, 1650]
    y = 500
    for index in range(len(labels) - 1):
        draw.line((xs[index] + 90, y, xs[index + 1] - 90, y), fill="#44475A", width=12)
    phase = max(0.0, min(1.0, (time - 20.4) / 20.2))
    token_x = int(xs[0] + (xs[-1] - xs[0]) * phase)
    for index, (x, label, color) in enumerate(zip(xs, labels, colors)):
        active = token_x >= x - 30
        draw_node(draw, (x, y), 72, color if active else "#44475A")
        wrapped = label.replace(" + ", " +\n")
        draw.multiline_text((x, 625), wrapped, font=FONT_LABEL, fill=color if active else MUTED, anchor="ma", align="center", spacing=8)
    draw.ellipse((token_x - 24, y - 24, token_x + 24, y + 24), fill=FOREGROUND, outline=CYAN, width=6)
    checks = ["TEST", "LINT", "BUILD", "DOC"]
    if time >= 35.8:
        for index, check in enumerate(checks):
            x = 645 + index * 210
            draw.rounded_rectangle((x, 710, x + 170, 778), 16, fill=SURFACE, outline=GREEN, width=4)
            draw_centered(draw, (x + 85, 744), f"OK · {check}", FONT_LABEL, GREEN)


def draw_comparison(image: Image.Image, time: float) -> None:
    draw = ImageDraw.Draw(image)
    draw.text((140, 118), "EL BORDE TAMBIÉN CUENTA", font=FONT_TITLE, fill=FOREGROUND)
    cards = [
        (210, "49,99 €", "+ 4,99 € ENVÍO", ORANGE),
        (1010, "50,00 €", "0,00 € ENVÍO", GREEN),
    ]
    for x, amount, shipping, color in cards:
        draw.rounded_rectangle((x, 250, x + 700, 650), 38, fill=SURFACE, outline=color, width=7)
        draw.text((x + 350, 365), amount, font=FONT_HERO, fill=FOREGROUND, anchor="mm")
        draw.text((x + 350, 520), shipping, font=FONT_TITLE, fill=color, anchor="mm")
    if time >= 49.2:
        draw_centered(draw, (960, 740), "EVIDENCIA CONCRETA ≠ «TERMINADO»", FONT_TITLE, CYAN)


def draw_control(image: Image.Image, time: float) -> None:
    draw = ImageDraw.Draw(image)
    draw.text((140, 118), "EL CONTROL NO SE DELEGA", font=FONT_TITLE, fill=FOREGROUND)
    center = (960, 480)
    for index, color in enumerate(NODE_COLORS):
        angle = -math.pi / 2 + index * math.tau / 7
        point = (int(center[0] + math.cos(angle) * 300), int(center[1] + math.sin(angle) * 230))
        draw.line((*point, *center), fill=color, width=5)
        draw_node(draw, point, 38, color)
    draw_node(draw, center, 112, CYAN)
    draw_centered(draw, center, "TÚ", FONT_HERO, FOREGROUND)
    draw_centered(draw, (960, 740), "LOS AGENTES PROPONEN · TÚ DECIDES", FONT_TITLE, GREEN)


def draw_cta(image: Image.Image, time: float) -> None:
    draw = ImageDraw.Draw(image)
    icon_path = ROOT.parent.parent / "plugin/.claude-plugin/icon.png"
    if icon_path.exists():
        icon = Image.open(icon_path).convert("RGBA").resize((360, 360), Image.Resampling.LANCZOS)
        image.alpha_composite(icon, (180, 270))
    draw.text((650, 270), "EQUIPO SOLO 0.1", font=FONT_HERO, fill=FOREGROUND)
    draw.text((655, 400), "Instalable desde GitHub", font=FONT_TITLE, fill=CYAN)
    commands = [
        "claude plugin marketplace add fernando-delrio/lead-flow",
        "claude plugin install equipo-solo@equipo-solo",
    ]
    for index, command in enumerate(commands):
        top = 500 + index * 112
        draw.rounded_rectangle((650, top, 1770, top + 88), 18, fill="#15161D", outline="#44475A", width=3)
        draw.text((690, top + 44), command, font=FONT_MONO, fill=GREEN, anchor="lm")


def parse_transcript(words: list[dict[str, float | str]]) -> list[str]:
    transcript = (ROOT / "transcript.txt").read_text(encoding="utf-8")
    tokens = re.findall(r"\S+", transcript)
    if len(tokens) != len(words):
        raise ValueError(f"El guion tiene {len(tokens)} palabras y HeyGen devolvió {len(words)}.")
    return tokens


def make_cues(words: list[dict[str, float | str]]) -> list[Cue]:
    tokens = parse_transcript(words)
    cues: list[Cue] = []
    start = 0
    for index, token in enumerate(tokens):
        count = index - start + 1
        terminal = token.endswith((".", "?", "!", ":", ";"))
        gap = 0.0
        if index + 1 < len(words):
            gap = float(words[index + 1]["start_time"]) - float(words[index]["end_time"])
        if count < 6 and not terminal and gap < 0.48:
            continue
        text = " ".join(tokens[start:index + 1])
        cue_start = max(0.0, float(words[start]["start_time"]) - 0.08)
        cue_end = float(words[index]["end_time"]) + 0.16
        if index + 1 < len(words):
            cue_end = min(cue_end, float(words[index + 1]["start_time"]) - 0.03)
        cues.append(Cue(cue_start, cue_end, text))
        start = index + 1
    return [
        Cue(cue.start, min(cue.end, cues[index + 1].start), cue.text)
        if index + 1 < len(cues)
        else cue
        for index, cue in enumerate(cues)
    ]


def write_srt(cues: list[Cue]) -> None:
    def stamp(value: float) -> str:
        milliseconds = round(value * 1000)
        hours, milliseconds = divmod(milliseconds, 3_600_000)
        minutes, milliseconds = divmod(milliseconds, 60_000)
        seconds, milliseconds = divmod(milliseconds, 1000)
        return f"{hours:02}:{minutes:02}:{seconds:02},{milliseconds:03}"

    blocks = [f"{index}\n{stamp(cue.start)} --> {stamp(cue.end)}\n{cue.text}" for index, cue in enumerate(cues, 1)]
    (ROOT / "subtitles.srt").write_text("\n\n".join(blocks) + "\n", encoding="utf-8")


def wrap_caption(draw: ImageDraw.ImageDraw, text: str, max_width: int = 1450) -> list[str]:
    words = text.split()
    lines = [""]
    for word in words:
        candidate = f"{lines[-1]} {word}".strip()
        if draw.textlength(candidate, font=FONT_CAPTION) <= max_width:
            lines[-1] = candidate
            continue
        lines.append(word)
    return lines[:2]


def draw_caption(image: Image.Image, time: float, cues: list[Cue]) -> None:
    cue = next((item for item in cues if item.start <= time < item.end), None)
    if cue is None:
        return
    draw = ImageDraw.Draw(image)
    lines = wrap_caption(draw, cue.text)
    boxes = [draw.textbbox((0, 0), line, font=FONT_CAPTION, stroke_width=2) for line in lines]
    width = max(box[2] - box[0] for box in boxes) + 70
    height = len(lines) * 60 + 30
    left = WIDTH // 2 - width // 2
    top = max(CAPTION_TOP_MIN, 890 - height // 2)
    draw.rounded_rectangle((left, top, left + width, top + height), 18, fill=color_with_alpha("#11131A", 238))
    for line_index, line in enumerate(lines):
        draw.text((WIDTH // 2, top + 22 + line_index * 60), line, font=FONT_CAPTION, fill=FOREGROUND, stroke_width=2, stroke_fill="#11131A", anchor="ma")


def render_frame(time: float, cues: list[Cue]) -> Image.Image:
    image = Image.new("RGBA", (WIDTH, HEIGHT), BACKGROUND)
    draw_background(image)
    if time < 9.8:
        draw_hook(image, time)
    elif time < 13.8:
        draw_responsibilities(image, time)
    elif time < 20.5:
        draw_requirement(image, time)
    elif time < 41.0:
        draw_pipeline(image, time)
    elif time < 54.4:
        draw_comparison(image, time)
    elif time < 59.7:
        draw_control(image, time)
    else:
        draw_cta(image, time)
    draw_caption(image, time, cues)
    return image.convert("RGB")


def render_picture(duration: float, cues: list[Cue]) -> Path:
    BUILD.mkdir(parents=True, exist_ok=True)
    destination = BUILD / "picture.mp4"
    command = [
        str(find_ffmpeg("ffmpeg")), "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", str(destination),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    frame_count = math.ceil(duration * FPS)
    if process.stdin is None:
        raise RuntimeError("FFmpeg no abrió la entrada de fotogramas.")
    try:
        for frame in range(frame_count):
            process.stdin.write(render_frame(frame / FPS, cues).tobytes())
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("FFmpeg no pudo codificar la imagen.")
    return destination


def render_music(duration: float) -> Path:
    BUILD.mkdir(parents=True, exist_ok=True)
    destination = BUILD / "music.wav"
    chords = [(110.0, 164.81, 220.0), (98.0, 146.83, 196.0), (130.81, 196.0, 261.63), (87.31, 130.81, 174.61)]
    total = math.ceil(duration * SAMPLE_RATE)
    with wave.open(str(destination), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        for sample_index in range(total):
            time = sample_index / SAMPLE_RATE
            chord = chords[int(time // 8) % len(chords)]
            attack = min(1.0, time / 1.5)
            release = min(1.0, max(0.0, duration - time) / 2.0)
            envelope = attack * release
            pad = sum(math.sin(math.tau * frequency * time) for frequency in chord) / len(chord)
            pulse = math.sin(math.tau * 0.25 * time) * 0.15
            value = int(max(-1.0, min(1.0, (pad * 0.055 + pulse * 0.02) * envelope)) * 32767)
            output.writeframesraw(struct.pack("<hh", value, value))
    return destination


def mux_preview(picture: Path, music: Path) -> Path:
    destination = BUILD / "preview.mp4"
    run_ffmpeg(["-i", str(picture), "-i", str(music), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", str(destination)])
    return destination


def mux_final(picture: Path, narration: Path, music: Path) -> Path:
    destination = BUILD / "equipo-solo-v0.1.0.mp4"
    graph = (
        "[1:a]aresample=48000,aformat=channel_layouts=stereo,asplit=2[voice][key];"
        "[2:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.16[bed];"
        "[bed][key]sidechaincompress=threshold=0.025:ratio=7:attack=20:release=350[duck];"
        "[voice][duck]amix=inputs=2:duration=first:normalize=0," 
        "loudnorm=I=-16:TP=-1.5:LRA=9[mix]"
    )
    run_ffmpeg(["-i", str(picture), "-i", str(narration), "-i", str(music), "-filter_complex", graph, "-map", "0:v:0", "-map", "[mix]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(destination)])
    return destination


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--final", action="store_true")
    options = parser.parse_args()
    if options.preview == options.final:
        parser.error("Elige exactamente --preview o --final.")
    timing_data = json.loads((ROOT / "timings.json").read_text(encoding="utf-8"))
    duration = float(timing_data["duration"])
    cues = make_cues(timing_data["words"])
    write_srt(cues)
    picture = render_picture(duration, cues)
    music = render_music(duration)
    if options.preview:
        print(mux_preview(picture, music))
        return 0
    narration = ASSETS / "narration-original.wav"
    if not narration.exists():
        raise FileNotFoundError(f"Falta la narración: {narration}")
    print(mux_final(picture, narration, music))
    return 0


if __name__ == "__main__":
    sys.exit(main())
