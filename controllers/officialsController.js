const db = require('../config/db');
const redisClient = require('../config/redis');

const DEFAULT_EXPIRATION = 60;

// Get all officials with Redis caching
exports.getAllOfficials = async (req, res) => {
    // Construct a unique cache key for all officials
    const cacheKey = `officials:all`;

    try {
        // Step 1: Check if the data is cached
        const cachedResults = await redisClient.get(cacheKey);
        if (cachedResults) {
            console.log('🔁 Serving all officials from Redis cache');
            return res.status(200).json(JSON.parse(cachedResults));
        }

        // Step 2: If not cached, query the database
        const sql = 'SELECT * FROM officials';
        db.query(sql, async (err, results) => {
            if (err) {
                console.error("❌ Database error:", err.message);
                return res.status(500).json({ error: err.message });
            }

            // Step 3: Cache the results with a 5-minute expiration
            await redisClient.setEx(cacheKey, 300, JSON.stringify(results));
            console.log('💾 Cached all officials data');

            res.json(results);
        });
    } catch (error) {
        console.error('❌ Redis error:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create Official
exports.addOfficial = (req, res) => {
    const { estate_id,full_name,official_id, role, contact_number, estate_urn,uid } = req.body;

    const sql = `
        INSERT INTO officials ( estate_id,full_name,official_id, role, contact_number, estate_urn,uid)
        VALUES (?,?,?,?,?,?,?);
    `;
    const data = [ estate_id,full_name,official_id, role, contact_number, estate_urn, uid];

    db.query(sql, data, (err, result) => {
        if (err) {
            console.error("❌ Error adding official:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Official added successfully', officialId: result.insertId });
    });
};

// Get official by estateId with Redis caching
exports.getOfficialByEstateId = async (req, res) => {
    const estate_id = req.params.estate_id;
    const cacheKey = `official:estate:${estate_id}`;

    try {
        // Step 1: Check if data is in Redis
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('🔁 Serving official from Redis cache');
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Step 2: Query MySQL if not cached
        const sql = `SELECT * FROM officials WHERE estate_id = ?`;
        db.query(sql, [estate_id], async (err, results) => {
            if (err) {
                console.error("❌ MySQL error:", err.message);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'Official not found' });
            }

            // Step 3: Cache the result
            await redisClient.setEx(cacheKey, 300, JSON.stringify(results));
            console.log('💾 Official cached in Redis');

            res.status(200).json(results);
        });
    } catch (error) {
        console.error('❌ Redis error:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get official by contact_number with Redis caching
exports.getOfficialByContact = async (req, res) => {
    const contact_number = req.params.phone;
    const cacheKey = `official:contact:${contact_number}`;

    try {
        // Step 1: Check if data is in Redis
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('🔁 Serving official from Redis cache');
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Step 2: Query MySQL if not cached
        const sql = `SELECT * FROM officials WHERE contact_number = ?`;
        db.query(sql, [contact_number], async (err, results) => {
            if (err) {
                console.error("❌ MySQL error:", err.message);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'Official not found' });
            }

            // Step 3: Cache the result
            await redisClient.setEx(cacheKey, 300, JSON.stringify(results[0]));
            console.log('💾 Official cached in Redis');

            res.status(200).json(results[0]);
        });
    } catch (error) {
        console.error('❌ Redis error:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};




// Get official by contact number with Redis caching
exports.getOfficialById = async (req, res) => {
    const uid = req.params.uid;

    // Construct a unique cache key using the official's contact number
    const cacheKey = `getofficial/:${uid}`;

    try {
        // Step 1: Check if the data is cached
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
            console.log('🔁 Serving from Redis cache');
            return res.status(200).json(JSON.parse(cachedResult));
        }

        // Step 2: If not cached, query the database
        const sql = `SELECT * FROM officials WHERE uid = ?`;
        db.query(sql, [uid], async (err, results) => {
            if (err) {
                console.error("❌ Database Error:", err.message);
                return res.status(500).send("Error retrieving official");
            }

            if (results.length === 0) {
                return res.status(404).send("Official not found");
            }

            // Step 3: Cache the result with a 5-minute expiration
            await redisClient.setEx(cacheKey, 300, JSON.stringify(results[0]));
            console.log('💾 Cached official data by ID');

           return res.status(200).json(results[0]);
        });
    } catch (error) {
        console.error('❌ Redis error:', error.message);
        return  res.status(500).json({ error: 'Server error' });
    }
};

// Search officials with Redis caching
exports.searchOfficials = async (req, res) => {
    const { query } = req.query; // Retrieve the search query from the client

    if (!query) {
        return res.status(400).send("Search query is required");
    }

    // Construct a unique cache key using the search query
    const cacheKey = `search:officials:${query}`;

    try {
        // Step 1: Check if the search results are cached
        const cachedResults = await redisClient.get(cacheKey);
        if (cachedResults) {
            console.log('🔁 Serving search results from Redis cache');
            return res.status(200).json(JSON.parse(cachedResults));
        }

        // Step 2: If not cached, perform a full-text search in the database
        let sql = `
            SELECT full_name, role, contact_number
            FROM officials
            WHERE MATCH(full_name, role, contact_number) AGAINST(? IN NATURAL LANGUAGE MODE)
        `;
        db.query(sql, query, async (err, results) => {
            if (err) {
                console.error('❌ Error searching officials:', err);
                return res.status(500).send("Error searching officials");
            }

            // Step 3: Cache the results in Redis with a 5-minute expiration
            await redisClient.setEx(cacheKey, 300, JSON.stringify(results));
            console.log('💾 Search results cached');

            res.status(200).json(results);
        });
    } catch (error) {
        console.error('❌ Redis error:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};



///.......Update official......////
exports.updateOfficial = (req, res) => {
    const officialId = req.params.id;
    const fields = req.body;

    // Check if the ID is provided
    if (!officialId) {
        return res.status(400).json({ error: "official ID is required" });
    }
    // Check if there are fields to update
    if (Object.keys(fields).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
    }
    // Build dynamic SQL query and values array
    let sql = "UPDATE officials SET ";
    const values = [];

    for (const [key, value] of Object.entries(fields)) {
        sql += `${key} = ?, `;
        values.push(value);
    }
    // Remove the last comma and space
    sql = sql.slice(0, -2);

    // Add the WHERE clause
    sql += " WHERE official_id = ?";
    values.push(officialId);

    // Execute the query
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Database Error:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "official not found" });
        }

        res.json({ message: "official updated successfully" });
    });
};



////.......Delete official...../////
exports.deleteOfficial = (req, res) => {
    const contact_number = req.params.id;

    const sql = `DELETE FROM officials WHERE contact_number = ?`;

    db.query(sql, [contact_number], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'official not found' });
        }

        res.json({ message: 'official deleted successfully' });
    });
};

////.......Official official...../////
exports.existingOfficial = async (req, res) => {
  const phone = req.params.phone;
  const cacheKey = `official:exists:${phone}`;

  try {
    // Step 1: Check Redis cache
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      console.log('🔁 Serving official existence from Redis cache');
      return res.status(200).json(JSON.parse(cachedResult));
    }

    // Step 2: Query MySQL if not in cache
    const query = "SELECT 1 FROM officials WHERE contact_number = ?";
    db.query(query, [phone], async (err, results) => {
      if (err) {
        console.error("❌ Error executing query:", err);
        return res.status(500).send("Internal Server Error");
      }

      const response = results.length > 0
        ? { exists: true, message: `UID ${phone} exists.` }
        : { exists: false, message: `UID ${phone} does not exist.` };

      // Step 3: Cache the result
      await redisClient.setEx(cacheKey, 300, JSON.stringify(response)); // 5 minutes

      res.json(response);
    });
  } catch (error) {
    console.error("❌ Redis error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};





