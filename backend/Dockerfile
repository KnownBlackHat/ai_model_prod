FROM imbios/bun-node
WORKDIR /app

COPY . /app
RUN apt update -y && apt -y install ffmpeg
RUN bun install
RUN bun run build
ENTRYPOINT ["bun", "run", "dev"]
