#!/bin/bash
# Install Piper TTS + download JARVIS Marvel model

echo "=== Installing Piper TTS dependencies ==="
sudo apt update
sudo apt install -y python3 python3-pip espeak-ng libespeak-ng1

echo ""
echo "=== Installing piper-tts ==="
pip install piper-tts

echo ""
echo "=== Downloading JARVIS model (high quality) ==="
mkdir -p ~/piper-models

wget -q --show-progress -P ~/piper-models \
  "https://huggingface.co/jgkawell/jarvis/resolve/main/en/en_GB/jarvis/high/jarvis-high.onnx"

wget -q --show-progress -P ~/piper-models \
  "https://huggingface.co/jgkawell/jarvis/resolve/main/en/en_GB/jarvis/high/jarvis-high.onnx.json"

echo ""
echo "=== Testing Piper voice ==="
echo "Good day, Sir. J.A.R.V.I.S. is online and fully operational." | \
  python3 -m piper -m ~/piper-models/jarvis-high.onnx -f /tmp/jarvis-test.wav

if [ -f /tmp/jarvis-test.wav ]; then
  echo "SUCCESS! JARVIS voice model is working."
  echo ""
  echo "Now restart Jarvis:"
  echo "  cd ~/Master-Account84/jarvis && node server.js"
else
  echo "Something went wrong. Check the errors above."
fi
