# Vídeo de lanzamiento de Equipo Solo 0.1

Pieza horizontal 16:9 narrada en español de España. La locución original de HeyGen es el reloj maestro: `68.5265306122449` segundos, sin aceleración ni estiramiento.

## Archivos

- `render.py`: genera gráficos, subtítulos, música y exportaciones.
- `timings.json`: marcas reales de las 181 palabras devueltas por HeyGen.
- `transcript.txt`: guion exacto aprobado.
- `style.json`: dirección visual compartida.
- `asset-manifest.json`: procedencia y función de cada recurso.
- `subtitles.srt`: se regenera desde las marcas reales.
- `build/preview.mp4`: revisión visual con música, sin locución.
- `build/equipo-solo-v0.1.0.mp4`: entrega final con voz, música y subtítulos incrustados.
- `../../assets/releases/equipo-solo-v0.1.0.mp4`: copia final preparada para publicar.

## Render

El script localiza FFmpeg en `PATH` o en la instalación de WinGet.

```powershell
python video/equipo-solo-v0.1.0/render.py --preview
python video/equipo-solo-v0.1.0/render.py --final
```

`--final` requiere `assets/narration-original.wav`. La pista de voz se conserva a velocidad `1.0×`; FFmpeg mezcla una cama musical discreta y finaliza el audio a un nivel web prudente.

La voz y los intermedios son locales y están ignorados por Git. `asset-manifest.json` conserva sus huellas para comprobar que una reproducción usa los mismos recursos.

## Revisión

Comprobar el vídeo codificado completo, la pronunciación de `Claude Code`, `lint`, `build` y `GitHub`, la comparación `49,99 € / 50,00 €`, la legibilidad móvil y el cierre sin corte de voz. No publicar sin autorización de Fernando.
