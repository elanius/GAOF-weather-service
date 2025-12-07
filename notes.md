# changelog
## TODO
- [ ] Set proper error codes for failed http requests
- [ ] Represent zone as four corner polygon
- [ ] Rotations for zones
- [ ] Add geometry data (polygon, middle point, radius)

## demo - next
- [ ] add threshold as input parameter for `/near_zones` endpoint and evaluate near zones with it
  - threshold must contain array of conditions which are combined as OR statement
  - if just one condition is true the zone is considered as active and should be avoided by a drone

- [ ] local weather overview - api call which will create all required zones in curren position of a pilot/drone

- [ ] create auto zone with disabled auto refresh

## demo 14.3.2025
- [x] Check zone existence before weather refresh
- [x] Refresh zone weather data in background task
- [x] Check if zone is active by weather limit threshold
- [x] Use pydantic for all zone types
- [x] http client for API (For testing purposes)
- [x] Basic API tests for zone endpoints
- [x] refresh weather data on demand (/refresh_zone)

