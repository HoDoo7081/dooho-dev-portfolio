-- Minimal sample data
INSERT INTO sb.users(email, full_name, role, status) VALUES
  ('traveler1@example.com','Traveler One','TRAVELER','ACTIVE'),
  ('host1@example.com','Host One','HOST','ACTIVE'),
  ('admin1@example.com','Admin One','ADMIN','ACTIVE');

INSERT INTO sb.travelers(traveler_id, birth_year) 
  SELECT user_id, 1958 FROM sb.users WHERE email='traveler1@example.com';

INSERT INTO sb.hosts(host_id, verified, rating_avg)
  SELECT user_id, TRUE, 4.8 FROM sb.users WHERE email='host1@example.com';

INSERT INTO sb.locations(country_code, city, address_line) VALUES ('KR','Seoul','Gangnam-daero 123');

INSERT INTO sb.listings(host_id, type, title, description, location_id, base_price, currency, capacity, status)
VALUES (
  (SELECT host_id FROM sb.hosts LIMIT 1),
  'TOUR',
  'Han River walk & cafe tour',
  'Low-intensity walking course tailored for seniors',
  (SELECT location_id FROM sb.locations LIMIT 1),
  30000, 'KRW', 6, 'ACTIVE'
);
