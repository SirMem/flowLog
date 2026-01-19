FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
# Use npm install to avoid failing builds when package-lock is not in sync.
RUN npm install --omit=dev

COPY . .

# WeChat Cloud Run requires port 80.
EXPOSE 80

ENV NODE_ENV=production
CMD ["node", "src/app.js"]
