# Zelala Design Studio — static site on nginx
FROM nginx:1.27-alpine

# Copy site files
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY projects.js /usr/share/nginx/html/
COPY script.js   /usr/share/nginx/html/
COPY assets      /usr/share/nginx/html/assets/

# Custom nginx config (gzip + cache headers + fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Coolify health check hits / — nginx returns the static index.html
HEALTHCHECK --interval=30s --timeout=5s --start-period=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1
