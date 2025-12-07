## GAOF Weather Service

This FastAPI application provides weather information for GAOF zones using the OpenWeather API. It includes endpoints to fetch current weather data for a specific location, a rectangular zone, and to manage zones.

### Features

- **`/weather`**: Get current weather for a specific latitude and longitude.
- **`/weather_zone`**: Get weather data for all cities within a specified rectangular geographical area.
- **`/list_zones`**: List all defined zones.
- **`/near_zones`**: Find zones near a given location.
- **`/create_zone`**: Create a new zone.
- **`/create_auto_group_zone`**: Create a new auto-grouped zone.
- **`/edit_zone`**: Edit an existing zone.
- **`/refresh_zone`**: Refresh weather data for a zone.
- **`/delete_zone`**: Delete a zone.
- **`/local_situation`**: Create local situation zones.

---

### Requirements

- Python 3.12
- OpenWeather API Key
- MongoDB connection string

---

### Installation and Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/elanius/GAOF-weather-service.git
cd GAOF-weather-service
```

#### 2. Create a Virtual Environment

```bash
python3.12 -m venv .venv
source .venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

#### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 4. Set Environment Variables

Create a `.env` file in the project root:

```env
OPEN_WEATHER_API_KEY=your_api_key_here
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/
```

---

### Running the Application

#### 1. Run Backend Locally

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload --env-file .env
```

The backend will be available at [http://127.0.0.1:8001](http://127.0.0.1:8001).

#### 2. Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000).

---

### Access Endpoints

- **Get weather for specific location**:
  ```
  GET http://127.0.0.1:8001/weather?lat=<latitude>&lon=<longitude>
  ```

- **Get weather for a rectangular zone**:
  ```
  GET http://127.0.0.1:8001/weather_zone?lon_left=<value>&lat_bottom=<value>&lon_right=<value>&lat_top=<value>
  ```

- **List all zones**:
  ```
  GET http://127.0.0.1:8001/list_zones
  ```

- **Find near zones**:
  ```
  POST http://127.0.0.1:8001/near_zones
  ```

- **Create a zone**:
  ```
  POST http://127.0.0.1:8001/create_zone
  ```

- **Create an auto group zone**:
  ```
  POST http://127.0.0.1:8001/create_auto_group_zone
  ```

- **Edit a zone**:
  ```
  PUT http://127.0.0.1:8001/edit_zone
  ```

- **Refresh a zone**:
  ```
  PUT http://127.0.0.1:8001/refresh_zone
  ```

- **Delete a zone**:
  ```
  DELETE http://127.0.0.1:8001/delete_zone?zone_id=<zone_id>
  ```

- **Create local situation zones**:
  ```
  POST http://127.0.0.1:8001/local_situation
  ```

---

### Using Docker

#### 1. Build the Docker Image

```bash
docker build -t gaof-weather .
```

#### 2. Run the Docker Container

```bash
docker run -d -p 8001:8001 -e OPEN_WEATHER_API_KEY=your_api_key_here -e MONGODB_CONNECTION_STRING=mongodb://mongo:27017/ gaof-weather
```

The backend application will be accessible at [http://127.0.0.1:8001](http://127.0.0.1:8001).

---

### Using Docker Compose

#### 1. Start the Application

```bash
docker-compose up
```

---

### Example: Create and list zones

```bash
# Create a new wind zone
curl -X POST http://127.0.0.1:8001/create_zone \
  -H "Content-Type: application/json" \
  -d '{
    "zone_rect": [40.70, -74.02, 40.75, -73.95],
    "zone_name": "hudson_wind_zone",
    "zone_type": "wind"
  }'

# Retrieve all zones to confirm creation
curl http://127.0.0.1:8001/list_zones
```

---

### Running Backend Tests

```bash
cd backend
pytest
```

