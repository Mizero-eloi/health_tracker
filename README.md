#  Global Health Tracker

A web application that displays live COVID-19 statistics by country using the [disease.sh](https://disease.sh) Open Disease Data API. Users can search, filter by continent, and sort by various metrics to explore global health data meaningfully.

---

## Table of Contents

- [Features](#features)
- [APIs Used](#apis-used)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [Docker Deployment](#docker-deployment)
- [Load Balancer Configuration](#load-balancer-configuration)
- [Testing the Deployment](#testing-the-deployment)
- [Security Notes](#security-notes)
- [Challenges & Solutions](#challenges--solutions)
- [Credits](#credits)

---

## Features

-  **Global Overview** — total cases, deaths, recovered, and active cases at a glance
-  **Search** — filter countries by name in real time
-  **Continent Filter** — narrow results to Africa, Asia, Europe, Americas, or Oceania
-  **Sort** — sort by cases, deaths, recovered, active cases, or population (ascending or descending)
-  **Country Flags** — visual flag for every country row
-  **Case Fatality Rate** — calculated automatically per country
-  **Error Handling** — clear user-facing messages for API downtime or invalid responses
-  **Health Check Endpoint** — `/health` route for load balancer checks

---

## APIs Used

| API | Purpose | Documentation |
|-----|---------|---------------|
| [disease.sh](https://disease.sh) | COVID-19 statistics by country, continent, and global | [https://disease.sh/docs](https://disease.sh/docs) |

> **No API key required.** disease.sh is a free, open-source API with no authentication needed.

---

## Project Structure

```
health-tracker/
├── public/
│   ├── index.html       # Main UI
│   ├── style.css        # Styling
│   └── app.js           # Frontend logic (fetch, filter, sort, render)
├── server.js            # Express backend — proxies disease.sh API
├── package.json
├── Dockerfile
├── .gitignore
└── README.md
```

---

## Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v12 or higher
- npm

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Mizero-eloi/health-tracker.git
cd health-tracker

# 2. Install dependencies
npm install express@4

# 3. Start the server
node server.js
```

The app will be available at: **http://localhost:8080**

### Available API Routes

| Route | Description |
|-------|-------------|
| `GET /api/global` | Global COVID-19 totals |
| `GET /api/countries` | Stats for all countries |
| `GET /api/continents` | Stats grouped by continent |
| `GET /api/country/:name` | Stats for a specific country |
| `GET /health` | Health check (used by load balancer) |

---

# Health Tracker - Deployment

## Servers & Load Balancer

Web01: http://18.207.188.40  
Web02: http://34.201.39.158  
Load Balancer: http://3.89.215.159  

Users should access the app through the load balancer to ensure traffic is distributed evenly.

---

## Web Server Setup (Both Servers)

```bash
sudo apt update
sudo apt install nodejs npm nginx git -y

git clone https://github.com/Mizero-eloi/health_tracker.git
cd health_tracker/health-tracker

npm install

sudo npm install -g pm2
pm2 start server.js
pm2 save
pm2 startup
Nginx (Web Server)
sudo nano /etc/nginx/sites-available/health_tracker
server {
    listen 80;
    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}
sudo systemctl restart nginx
Load Balancer Setup
sudo apt update
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/load_balancer
upstream backend {
    server 18.207.188.40;
    server 34.201.39.158;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
sudo ln -s /etc/nginx/sites-available/load_balancer /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
Final Access

http://3.89.215.159


## Load Balancer Configuration

The load balancer (Lb01) uses **HAProxy** with round-robin distribution.

### HAProxy Config (`/etc/haproxy/haproxy.cfg`)

```haproxy
global
    log /dev/log local0
    maxconn 2000

defaults
    log     global
    mode    http
    option  httplog
    timeout connect 5000ms
    timeout client  50000ms
    timeout server  50000ms

frontend http_front
    bind *:80
    default_backend webapps

backend webapps
    balance roundrobin
    option httpchk GET /health
    server web01 172.20.0.11:8080 check
    server web02 172.20.0.12:8080 check
```

### Reload HAProxy

```bash
docker exec -it lb-01 sh -c 'haproxy -sf $(pidof haproxy) -f /etc/haproxy/haproxy.cfg'
```

---

## Testing the Deployment

Run the following from your host machine multiple times to confirm round-robin balancing:

```bash
curl http://localhost/health
curl http://localhost/health
curl http://localhost/health
```

Expected output alternates between:

```json
{"status":"ok","server":"web01"}
{"status":"ok","server":"web02"}
{"status":"ok","server":"web01"}
```

You can also open **http://localhost** in your browser to use the full application through the load balancer.

---

## Security Notes

- **No API keys** are used in this project — disease.sh is fully open and free.
- The `.gitignore` excludes `node_modules/` and any `.env` files.
- If you extend this app with a paid API in future, pass keys via environment variables:

```bash
docker run -e API_KEY=your_key_here ...
```

And read in `server.js` with `process.env.API_KEY` — never hardcode keys in source files.

---

## Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| System Node.js (v4.2.6) too old for Express 5 | Used `nvm` to install Node 12; used Express 4 for compatibility |
| glibc too old for nvm's Node 18 binaries | Fell back to Node 12 which is compatible with the environment |
| `node` command not found after apt install | Created symlink: `ln -s /usr/bin/nodejs /usr/bin/node` |
| `node:events` module error with Express 5 | Downgraded to Express 4 which uses standard `events` module |

---

## Credits

- **[disease.sh](https://disease.sh)** — Open Disease Data API by [Elabor8](https://github.com/disease-sh/api). Free, open-source COVID-19 data API. No affiliation.
- **[Express.js](https://expressjs.com/)** — Web framework for Node.js
- **[HAProxy](https://www.haproxy.org/)** — Load balancer used on Lb01
- **[Docker](https://www.docker.com/)** — Containerization platform

---

## Author

**Eloi Mizero**  
GitHub: [https://github.com/Mizero-eloi](https://github.com/Mizero-eloi)
