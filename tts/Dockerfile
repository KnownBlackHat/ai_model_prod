FROM ghcr.io/coqui-ai/tts-cpu:latest
EXPOSE 5002
RUN timeout 200 python3 TTS/server/server.py --model_name tts_models/en/vctk/vits; exit 0
ENTRYPOINT ["python3", "TTS/server/server.py", "--speakers_file_path", "/root/.local/share/tts/tts_models--en--vctk--vits/speaker_ids.json", "--model_path", "/root/.local/share/tts/tts_models--en--vctk--vits/model_file.pth", "--config_path", "/root/.local/share/tts/tts_models--en--vctk--vits/config.json" ]
