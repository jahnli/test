# Nginx deployment

This server block serves the built Feishu dashboard plugin from:

```text
/etc/nginx/html/fd-dashboard
```

Copy the config to the server:

```bash
sudo cp fd-dashboard.conf /etc/nginx/conf.d/fd-dashboard.conf
sudo nginx -t
sudo systemctl reload nginx
```

Copy the Vite build output to the web root:

```bash
sudo rm -rf /etc/nginx/html/fd-dashboard/*
sudo cp -r dist/* /etc/nginx/html/fd-dashboard/
```

Then open:

```text
http://<server-ip>:8080/
```

For Feishu production usage, use HTTPS and replace `server_name _;` with your domain.
