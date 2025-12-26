# Setting up Nginx for api.myrightcar.com (HTTPS)

## 1. Configure Nginx with Domain
Edit your config file:
```bash
sudo nano /etc/nginx/sites-available/riderslog
```

Update it to look like this (change `server_name`):
```nginx
server {
    listen 80;
    server_name _;  # ex: api.yourdomin.com; 

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*Press `Ctrl+O`, `Enter` to save, and `Ctrl+X` to exit.*

## 2. Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 3. Set up SSL (HTTPS/443) with Certbot
Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

Run Certbot to automatically configure SSL:
```bash
sudo certbot --nginx -d api.yourdomain.com
```

*   Enter your email if asked.
*   Agree to terms (`A`).
*   It will ask if you want to redirect HTTP to HTTPS -> Choose **2** (Redirect).

## 4. Verification
Visit `https://api.yourdomain.com`.
It should show your backend securely! 🔒
