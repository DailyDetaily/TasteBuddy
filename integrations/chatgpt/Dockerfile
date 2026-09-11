FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY app.mjs server.mjs ./
USER node
ENV PORT=8788
EXPOSE 8788
CMD ["node", "server.mjs"]
