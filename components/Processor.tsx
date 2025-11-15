"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { buildArgs, getFFmpeg, readOutputFile, writeInputFile, type StyleKey } from "../lib/ffmpeg";

const STYLES: { key: StyleKey; name: string; desc: string }[] = [
  { key: "cinematic", name: "Cinematic Hero", desc: "Deep shadows, neon, slow-mo vibe" },
  { key: "action", name: "Action Style", desc: "Fast, punchy, sharpened, stabilized" },
  { key: "aesthetic", name: "Aesthetic Smooth", desc: "Pastel, creamy, dreamy glow" },
  { key: "realistic", name: "Realistic Upgrade", desc: "Clean, natural, 4K upscale" },
];

export default function Processor() {
  const [file, setFile] = useState<File | null>(null);
  const [inputUrl, setInputUrl] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progressText, setProgressText] = useState<string>("");
  const [style, setStyle] = useState<StyleKey>("cinematic");
  const [slowMo, setSlowMo] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const onPickFile = useCallback((f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setInputUrl(url);
    setOutputUrl(null);
  }, []);

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onPickFile(f);
  }, [onPickFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onPickFile(f);
  }, [onPickFile]);

  const onDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  const isReady = useMemo(() => !!file && !busy, [file, busy]);

  const process = useCallback(async () => {
    if (!file) return;
    setBusy(true);
    setProgressText("Loading ffmpeg...");
    try {
      const ffmpeg = await getFFmpeg((m) => {
        if (/frame=/.test(m)) setProgressText(m);
      });

      setProgressText("Preparing input...");
      await writeInputFile(ffmpeg, file, "input.mp4");

      setProgressText("Applying style...");
      const args = buildArgs(style, slowMo);
      try {
        await ffmpeg.exec(args);
      } catch (err) {
        // Retry without optional filters if a filter is missing in current core
        if (style === "action") {
          await ffmpeg.exec(["-i","input.mp4","-vf","format=yuv420p,eq=contrast=1.3:saturation=1.15:gamma=0.92,unsharp=5:5:1.1","-c:v","mpeg4","-q:v","5","-an","-movflags","+faststart","output.mp4"]);
        } else if (style === "aesthetic") {
          await ffmpeg.exec(["-i","input.mp4","-vf","format=yuv420p,hqdn3d=1.5:1.5:6:6,eq=contrast=1.05:brightness=0.03:saturation=0.96","-c:v","mpeg4","-q:v","5","-an","-movflags","+faststart","output.mp4"]);
        } else if (style === "realistic") {
          await ffmpeg.exec(["-i","input.mp4","-vf","format=yuv420p,hqdn3d=1.0:1.0:4:4,eq=contrast=1.06:saturation=1.02,unsharp=3:3:0.6,scale=3840:-2:flags=lanczos","-c:v","mpeg4","-q:v","5","-an","-movflags","+faststart","output.mp4"]);
        } else {
          await ffmpeg.exec(["-i","input.mp4","-vf","format=yuv420p,eq=contrast=1.2:brightness=-0.03:saturation=1.08:gamma=0.95,curves=preset=medium_contrast,vignette=PI/6:0.5","-c:v","mpeg4","-q:v","5","-an","-movflags","+faststart","output.mp4"]);
        }
      }

      setProgressText("Exporting...");
      const blob = await readOutputFile(ffmpeg, "output.mp4");
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setProgressText("Done");
    } catch (e: any) {
      console.error(e);
      setProgressText("Failed: " + (e?.message || "Unknown error"));
    } finally {
      setBusy(false);
    }
  }, [file, slowMo, style]);

  return (
    <section className="grid">
      <div className="section card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="row" style={{ gap: 8 }}>
            <span className="pill">1 ? Upload</span>
            <span className="pill">2 ? Choose Style</span>
            <span className="pill">3 ? Process</span>
          </div>
          <span className="badge">Client-side processing</span>
        </div>

        <div className="grid" style={{ marginTop: 12 }}>
          <div className="section">
            <div
              className="dropzone"
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <input id="file" type="file" accept="video/*" style={{ display: "none" }} onChange={onFileInput} />
              <p>Drop a video here or pick a file</p>
              <div className="actions">
                <label htmlFor="file" className="button">Choose File</label>
                {file && (
                  <span className="pill">{file.name}</span>
                )}
              </div>
            </div>
          </div>

          <div className="section" style={{ marginTop: 12 }}>
            <div className="styles">
              {STYLES.map((s) => (
                <label key={s.key} className="style">
                  <input
                    type="radio"
                    name="style"
                    value={s.key}
                    checked={style === s.key}
                    onChange={() => setStyle(s.key)}
                  />
                  <div>
                    <div className="style-name">{s.name}</div>
                    <div className="small">{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            {style === "cinematic" && (
              <div className="row" style={{ marginTop: 8 }}>
                <label className="style" style={{ gap: 8 }}>
                  <input type="checkbox" checked={slowMo} onChange={(e) => setSlowMo(e.target.checked)} />
                  <span className="small">Slow-motion feel</span>
                </label>
              </div>
            )}
          </div>

          <div className="section" style={{ marginTop: 12 }}>
            <div className="actions">
              <button className="button primary" disabled={!isReady} onClick={process}>
                {busy ? "Processing..." : "Process Video"}
              </button>
              {outputUrl && (
                <a className="button success" href={outputUrl} download={`styled-${style}.mp4`}>
                  Download Result
                </a>
              )}
              {inputUrl && (
                <button className="button" onClick={() => { setInputUrl(null); setFile(null); setOutputUrl(null); }}>Clear</button>
              )}
            </div>
            {busy && (
              <div style={{ marginTop: 12 }}>
                <div className="progress"><span style={{ width: "100%", transition: "width 1s" }} /></div>
                <div className="small" style={{ marginTop: 8 }}>{progressText}</div>
              </div>
            )}
          </div>

          <div className="section" style={{ marginTop: 16 }}>
            <div className="grid" style={{ gap: 16 }}>
              <div className="section">
                <div className="small">Input Preview</div>
                <video ref={videoRef} className="preview" src={inputUrl || undefined} controls />
              </div>
              <div className="section">
                <div className="small">Output Preview</div>
                <video className="preview" src={outputUrl || undefined} controls />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
