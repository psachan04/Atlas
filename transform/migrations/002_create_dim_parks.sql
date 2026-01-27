-- Dimension table for National Parks
-- Contains the official 63 National Park sites

CREATE TABLE IF NOT EXISTS dim_parks (
    park_code VARCHAR(10) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    state VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert the 63 National Parks (alphabetically by state)
INSERT INTO dim_parks (park_code, full_name, state, latitude, longitude) VALUES
-- Alaska
('GAAR', 'Gates Of The Arctic National Park & Preserve', 'AK', 67.7875, -153.4000),
('GLBA', 'Glacier Bay National Park & Preserve', 'AK', 58.6658, -136.9003),
('KATM', 'Katmai National Park & Preserve', 'AK', 58.5971, -155.0553),
('KEFJ', 'Kenai Fjords National Park', 'AK', 59.8156, -149.9003),
('KOVA', 'Kobuk Valley National Park', 'AK', 67.3500, -159.1417),
('LACL', 'Lake Clark National Park & Preserve', 'AK', 60.4127, -154.3233),
('WRST', 'Wrangell - St Elias National Park & Preserve', 'AK', 61.7104, -142.9857),
('DENA', 'Denali National Park & Preserve', 'AK', 63.1148, -151.1926),

-- American Samoa
('NPSA', 'National Park of American Samoa', 'AS', -14.2581, -170.6845),

-- Arizona
('GRCA', 'Grand Canyon National Park', 'AZ', 36.0544, -112.1401),
('PEFO', 'Petrified Forest National Park', 'AZ', 34.9094, -109.8067),
('SAGU', 'Saguaro National Park', 'AZ', 32.2500, -110.7500),

-- Arkansas
('HOSP', 'Hot Springs National Park', 'AR', 34.5217, -93.0424),

-- California
('CHIS', 'Channel Islands National Park', 'CA', 34.0069, -119.7785),
('JOTR', 'Joshua Tree National Park', 'CA', 33.8734, -115.9010),
('KICA', 'Kings Canyon National Park', 'CA', 36.8879, -118.5551),
('LAVO', 'Lassen Volcanic National Park', 'CA', 40.4977, -121.4207),
('PINN', 'Pinnacles National Park', 'CA', 36.4906, -121.1825),
('REDW', 'Redwood National and State Parks', 'CA', 41.2132, -124.0046),
('SEKI', 'Sequoia National Park', 'CA', 36.4864, -118.5658),
('YOSE', 'Yosemite National Park', 'CA', 37.8651, -119.5383),
('DEPO', 'Death Valley National Park', 'CA', 36.5323, -116.9325),

-- Colorado
('BLCA', 'Black Canyon Of The Gunnison National Park', 'CO', 38.5754, -107.7416),
('GRSA', 'Great Sand Dunes National Park & Preserve', 'CO', 37.7916, -105.5943),
('MEVE', 'Mesa Verde National Park', 'CO', 37.2309, -108.4618),
('ROMO', 'Rocky Mountain National Park', 'CO', 40.3428, -105.6836),

-- Florida
('BISC', 'Biscayne National Park', 'FL', 25.4900, -80.2100),
('DRTO', 'Dry Tortugas National Park', 'FL', 24.6285, -82.8732),
('EVER', 'Everglades National Park', 'FL', 25.2866, -80.8987),

-- Hawaii
('HALE', 'Haleakala National Park', 'HI', 20.7204, -156.1552),
('HAVO', 'Hawaii Volcanoes National Park', 'HI', 19.4194, -155.2885),

-- Kentucky
('MACA', 'Mammoth Cave National Park', 'KY', 37.1862, -86.1000),

-- Maine
('ACAD', 'Acadia National Park', 'ME', 44.3386, -68.2733),

-- Michigan
('ISRO', 'Isle Royale National Park', 'MI', 47.9959, -88.9092),

-- Minnesota
('VOYA', 'Voyageurs National Park', 'MN', 48.4839, -92.8382),

-- Missouri
('GWMP', 'Gateway Arch National Park', 'MO', 38.6247, -90.1848),

-- Montana
('GLAC', 'Glacier National Park', 'MT', 48.7596, -113.7870),

-- Nevada
('GRBA', 'Great Basin National Park', 'NV', 38.9833, -114.3000),

-- New Mexico
('CAVE', 'Carlsbad Caverns National Park', 'NM', 32.1479, -104.5567),
('WHSA', 'White Sands National Park', 'NM', 32.7872, -106.3257),

-- North Carolina/Tennessee
('GRSM', 'Great Smoky Mountains National Park', 'TN', 35.6118, -83.4895),

-- North Dakota
('THRO', 'Theodore Roosevelt National Park', 'ND', 46.9790, -103.4538),

-- Ohio
('CUVA', 'Cuyahoga Valley National Park', 'OH', 41.2808, -81.5678),

-- Oregon
('CRLA', 'Crater Lake National Park', 'OR', 42.8684, -122.1685),

-- South Carolina
('COSW', 'Congaree National Park', 'SC', 33.7948, -80.7821),

-- South Dakota
('BADL', 'Badlands National Park', 'SD', 43.8554, -102.3397),
('WICA', 'Wind Cave National Park', 'SD', 43.5571, -103.4257),

-- Texas
('BIBE', 'Big Bend National Park', 'TX', 29.1275, -103.2428),
('GUMO', 'Guadalupe Mountains National Park', 'TX', 31.9230, -104.8615),

-- Utah
('ARCH', 'Arches National Park', 'UT', 38.7331, -109.5925),
('BRCA', 'Bryce Canyon National Park', 'UT', 37.5930, -112.1871),
('CANY', 'Canyonlands National Park', 'UT', 38.2135, -109.8789),
('CARE', 'Capitol Reef National Park', 'UT', 38.0877, -111.1478),
('ZION', 'Zion National Park', 'UT', 37.2982, -113.0263),

-- Virginia
('SHEN', 'Shenandoah National Park', 'VA', 38.2928, -78.6795),

-- Virgin Islands
('VIIS', 'Virgin Islands National Park', 'VI', 18.3424, -64.7494),

-- Washington
('MORA', 'Mount Rainier National Park', 'WA', 46.8800, -121.7269),
('NOCA', 'North Cascades National Park', 'WA', 48.7718, -121.2985),
('OLYM', 'Olympic National Park', 'WA', 47.8021, -123.6044),

-- Wyoming
('GRTE', 'Grand Teton National Park', 'WY', 43.7904, -110.6818),
('YELL', 'Yellowstone National Park', 'WY', 44.4280, -110.5885);

-- Create index on state for faster filtering
CREATE INDEX idx_parks_state ON dim_parks(state);
CREATE INDEX idx_parks_active ON dim_parks(is_active);