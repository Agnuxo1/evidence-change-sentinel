FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY app/ app/
COPY vendor/ vendor/
COPY web/ web/
COPY input_examples/ input_examples/
COPY run.mjs .
RUN mkdir -p logs && chown node:node logs
USER node
ENV HOST=0.0.0.0 PORT=8788 SAMPLE_MODE=true
EXPOSE 8788
CMD ["node", "--import", "tsx", "run.mjs", "serve"]
