FROM imbios/bun-node
WORKDIR /app

COPY . /app
RUN bun install
RUN bun run build
ENTRYPOINT ["bun", "run", "dev", "--host"]
