#!/usr/bin/env python3
"""Pre-render every narrator line to MP3 with the open-source Kokoro-82M voice.

Usage:  python3 tools/make-voices.py --game melody [--voice af_heart] [--name Ava] [--speed 0.93]

Setup (once):  pip install kokoro-onnx lameenc numpy
The Kokoro model is taken from the `expo-kokoro` npm package (it bundles the Apache-2.0
weights), so no HuggingFace access is needed:  the script runs `npm pack expo-kokoro@1.1.9`
into a cache folder and extracts the model on first use.
Existing clips are kept, so re-running with --name only renders the new name lines.
"""
import argparse, json, os, re, subprocess, sys, tarfile, time, glob
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('--game', default='melody'); ap.add_argument('--voice', default='af_heart'); ap.add_argument('--name', default=''); ap.add_argument('--speed', type=float, default=0.93)
ap.add_argument('--out', default=''); ap.add_argument('--cache', default=os.path.join(ROOT, '.kokoro-cache'))
ap.add_argument('--model', default=''); ap.add_argument('--voices', default=''); ap.add_argument('--bitrate', type=int, default=48)
args = ap.parse_args()

def ensure_model():
    model = args.model or os.path.join(args.cache, 'kokoro-quantized.onnx'); voices = args.voices or os.path.join(args.cache, 'voices.npz')
    if os.path.exists(model) and os.path.exists(voices): return model, voices
    os.makedirs(args.cache, exist_ok=True)
    tgz = os.path.join(args.cache, 'expo-kokoro.tgz')
    if not os.path.exists(tgz):
        print('Downloading Kokoro model via npm (about 100 MB)...'); subprocess.check_call(['npm', 'pack', 'expo-kokoro@1.1.9', '--pack-destination', args.cache], stdout=subprocess.DEVNULL)
        os.rename(glob.glob(os.path.join(args.cache, 'expo-kokoro-*.tgz'))[0], tgz)
    with tarfile.open(tgz) as t:
        members = [m for m in t.getmembers() if m.name.endswith('kokoro-quantized.onnx') or '/voices/' in m.name]
        t.extractall(args.cache, members=members)
    os.replace(os.path.join(args.cache, 'package', 'build', 'kokoro-quantized.onnx'), model)
    vs = {}
    for f in glob.glob(os.path.join(args.cache, 'package', 'build', 'voices', '*.bin')):
        vs[os.path.basename(f)[:-4]] = np.fromfile(f, dtype=np.float32).reshape(-1, 1, 256)
    np.savez(voices, **vs); return model, voices

def normalize(text):
    s = text.lower().replace('’', "'").replace('‘', "'"); s = re.sub(r"[^a-z0-9' ]+", ' ', s); return re.sub(r'\s+', ' ', s).strip()
def line_id(text):
    h = 0x811c9dc5
    for ch in normalize(text): h ^= ord(ch); h = (h * 0x01000193) & 0xffffffff
    return f'{h:08x}'

def main():
    if not args.out: args.out = os.path.join(ROOT, 'games', args.game, 'voice')
    lines = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'tools', 'dump-lines.cjs'), args.game, args.name]))
    for l in lines: assert l['id'] == line_id(l['text']), ('id mismatch', l)
    os.makedirs(args.out, exist_ok=True)
    mpath = os.path.join(args.out, 'manifest.json')
    manifest = json.load(open(mpath)) if os.path.exists(mpath) else {'engine': 'Kokoro-82M (open source, Apache-2.0)', 'voice': args.voice, 'clips': {}}
    todo = [l for l in lines if not (l['id'] in manifest['clips'] and os.path.exists(os.path.join(args.out, l['id'] + '.mp3')))]
    print(f'{len(lines)} lines, {len(todo)} to render with voice {args.voice}')
    if not todo: return
    from kokoro_onnx import Kokoro; import lameenc
    model, voices = ensure_model(); k = Kokoro(model, voices)
    t0 = time.time()
    for i, l in enumerate(todo):
        samples, sr = k.create(l['speak'], voice=args.voice, speed=args.speed, lang='en-us')
        samples = np.asarray(samples, dtype=np.float32)
        # trim silence at both ends, keep a little air, and level-match every clip
        env = np.abs(samples); thr = max(0.004, env.max() * 0.02); idx = np.where(env > thr)[0]
        if len(idx): a = max(0, idx[0] - int(sr * 0.06)); b = min(len(samples), idx[-1] + int(sr * 0.18)); samples = samples[a:b]
        rms = float(np.sqrt(np.mean(samples ** 2)) or 1); samples = samples * min(0.16 / rms, 0.95 / (np.abs(samples).max() or 1))
        pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
        enc = lameenc.Encoder(); enc.set_bit_rate(args.bitrate); enc.set_in_sample_rate(sr); enc.set_channels(1); enc.set_quality(2)
        data = enc.encode(pcm.tobytes()) + enc.flush()
        with open(os.path.join(args.out, l['id'] + '.mp3'), 'wb') as f: f.write(data)
        manifest['clips'][l['id']] = {'text': l['text'], 'dur': round(len(samples) / sr, 2)}
        if i % 10 == 0 or i == len(todo) - 1:
            json.dump(manifest, open(mpath, 'w'), indent=0, ensure_ascii=False)
            el = time.time() - t0; print(f'  {i + 1}/{len(todo)}  {el / 60:.1f} min elapsed, ~{el / (i + 1) * (len(todo) - i - 1) / 60:.1f} min left', flush=True)
    json.dump(manifest, open(mpath, 'w'), indent=0, ensure_ascii=False)
    size = sum(os.path.getsize(os.path.join(args.out, f)) for f in os.listdir(args.out)) / 1e6
    print(f'done: {len(manifest["clips"])} clips, {size:.1f} MB in {args.out}')

if __name__ == '__main__': main()
