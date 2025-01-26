const express = require('express');
const router = express.Router();
const driver = require('../config/db');

// Utility to convert Neo4j integer to JavaScript number
function convertId(neo4jInt) {
	return neo4jInt.low; // Assuming `high` is always 0 for your dataset
}

// Search movies by title (case-insensitive)
router.get('/search', async (req, res) => {
	const query = req.query.query || '';
	const session = driver.session();

	try {
		// Split the query into tokens
		const tokens = query.match(/\b\w+\b/g); // Matches words and numbers
		if (!tokens) {
			return res.json([]); // Return empty array if no tokens are present
		}

		// Identify potential year token (e.g., "19", "201", "2014")
		const potentialYear = tokens.find((token) =>
			/^\b(19|20)\d{0,2}\b$/.test(token)
		);
		const yearToken =
			potentialYear && potentialYear.length === 4 ? potentialYear : null;
		const partialYearToken =
			potentialYear && potentialYear.length < 4 ? potentialYear : null;
		const titleTokens = tokens.filter((token) => token !== potentialYear); // Exclude year token from title
		const titleQuery = titleTokens.join(' '); // Reconstruct title query

		console.log(
			`[DEBUG] Searching for: Title="${titleQuery}", YearToken="${
				yearToken || 'None'
			}", PartialYear="${partialYearToken || 'None'}"`
		);

		// Construct Cypher query
		let cypherQuery = '';
		const params = {};

		if (titleQuery) {
			// If title is present
			cypherQuery = `
            MATCH (m:Movie)
            WHERE (m.usable IS NULL OR m.usable <> false) 
			AND ${titleTokens
				.map((_, i) => `toLower(m.title) CONTAINS toLower($titleToken${i})`)
				.join(' AND ')}
            ${yearToken ? 'AND toString(m.year) = $yearToken' : ''}
            ${
													partialYearToken
														? 'AND toString(m.year) STARTS WITH $partialYearToken'
														: ''
												}
            RETURN m
            LIMIT 10
            `;
			titleTokens.forEach((token, i) => {
				params[`titleToken${i}`] = token;
			});
			if (yearToken) {
				params.yearToken = yearToken;
			}
			if (partialYearToken) {
				params.partialYearToken = partialYearToken;
			}
		} else if (yearToken || partialYearToken) {
			// If only a year or partial year is present
			cypherQuery = `
            MATCH (m:Movie)
            WHERE (m.usable IS NULL OR m.usable <> false) 
			AND ${yearToken ? 'toString(m.year) = $yearToken' : ''}
            ${
													partialYearToken
														? 'toString(m.year) STARTS WITH $partialYearToken'
														: ''
												}
            RETURN m
            LIMIT 10
            `;
			if (yearToken) {
				params.yearToken = yearToken;
			}
			if (partialYearToken) {
				params.partialYearToken = partialYearToken;
			}
		} else {
			return res.json([]); // If neither title nor year is specified, return empty array
		}

		const result = await session.run(cypherQuery, params);

		// Map results
		const movies = result.records.map((record) => {
			const movie = record.get('m').properties;
			return {
				id: convertId(movie.id), // Flatten the ID
				title: movie.title,
				year: movie.year,
				popularity: movie.popularity,
				poster_url: movie.poster_url,
				genres: movie.genres,
			};
		});

		res.json(movies);
	} catch (error) {
		console.error('Error querying movies:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	} finally {
		await session.close();
	}
});

router.get('/movie-to-movie', async (req, res) => {
	const { startId, endId, excludedPersons } = req.query;

	if (!startId || !endId) {
		return res
			.status(400)
			.json({ error: 'Both start and end movie IDs are required' });
	}

	// Parse excluded persons
	const excludedIds = excludedPersons
		? excludedPersons.split(',').map(Number)
		: [];

	const personCondition = excludedIds.length
		? `AND all(n IN nodes(path) WHERE NOT (n:Person AND n.id IN $excludedIds))`
		: '';

	const cypherQuery = `
        MATCH path = allShortestPaths(
            (m1:Movie {id: $startId})-[:WORKED_WITH*]-(m2:Movie {id: $endId})
        )
        WHERE all(rel IN relationships(path) WHERE rel.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"])
        ${personCondition}
        WITH path,
            nodes(path) AS path_nodes,
            relationships(path) AS path_rels,
            REDUCE(total_popularity = 0, n IN nodes(path) |
                CASE WHEN "Person" IN labels(n) THEN total_popularity + COALESCE(n.popularity, 0) ELSE total_popularity END
            ) AS total_path_popularity
        RETURN
            [
                n IN path_nodes |
                CASE 
                    WHEN "Movie" IN labels(n) THEN {
                        type: "Movie",
                        id: n.id,
                        title: n.title,
                        year: n.year,
                        poster_url: n.poster_url
                    }
                    WHEN "Person" IN labels(n) THEN {
                        type: "Person",
                        id: n.id,
                        name: n.name,
                        popularity: n.popularity
                    }
                END
            ] AS path_details,
            [
                r IN path_rels |
                {
                    start_node_id: startNode(r).id,
                    end_node_id: endNode(r).id,
                    role: r.role
                }
            ] AS relationships,
            total_path_popularity
        ORDER BY total_path_popularity DESC
        LIMIT 15;
    `;

	try {
		const session = driver.session();
		const result = await session.run(cypherQuery, {
			startId: parseInt(startId),
			endId: parseInt(endId),
			excludedIds,
		});

		// Map results to send to the frontend
		const paths = result.records.map((record) => ({
			path_details: record.get('path_details'),
			relationships: record.get('relationships'),
			total_path_popularity: record.get('total_path_popularity'),
		}));

		res.json(paths);
	} catch (error) {
		console.error('[ERROR] Failed to fetch movie-to-movie path:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Movie-to-Person
router.get('/movie-to-person', async (req, res) => {
	const { startId, personId, excludedPersons } = req.query;

	if (!startId || !personId) {
		return res
			.status(400)
			.json({ error: 'Both movie and person IDs are required' });
	}

	// Parse excludedPersons into an array if provided
	const excludedIds = excludedPersons
		? excludedPersons.split(',').map(Number)
		: [];

	const personExclusionCondition = excludedIds.length
		? `AND all(n IN nodes(path) WHERE NOT (n:Person AND n.id IN $excludedIds))`
		: '';

	const cypherQuery = `
        MATCH path = allShortestPaths(
            (m:Movie {id: $startId})-[:WORKED_WITH*]-(p:Person {id: $personId})
        )
        WHERE all(rel IN relationships(path) WHERE rel.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"])
        ${personExclusionCondition}
        WITH path,
            [node IN nodes(path) |
                CASE
                    WHEN node:Movie THEN {
                        type: "Movie",
                        id: node.id,
                        title: node.title,
                        year: node.year,
                        poster_url: node.poster_url
                    }
                    WHEN node:Person THEN {
                        type: "Person",
                        id: node.id,
                        name: node.name,
                        popularity: node.popularity
                    }
                END
            ] AS path_details,
            REDUCE(total_popularity = 0, n IN nodes(path) |
                CASE WHEN "Person" IN labels(n) THEN total_popularity + COALESCE(n.popularity, 0) ELSE total_popularity END
            ) AS total_path_popularity
        RETURN path_details, total_path_popularity
        ORDER BY total_path_popularity DESC
        LIMIT 15;
    `;

	try {
		const session = driver.session();
		const result = await session.run(cypherQuery, {
			startId: parseInt(startId),
			personId: parseInt(personId),
			excludedIds,
		});

		const paths = result.records.map((record) => ({
			path_details: record.get('path_details'),
			total_path_popularity: record.get('total_path_popularity'),
		}));

		res.json(paths);
	} catch (error) {
		console.error('[ERROR] Failed to fetch movie-to-person path:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Person-to-Person
router.get('/person-to-person', async (req, res) => {
	const { startId, endId, excludedPersons } = req.query;

	if (!startId || !endId) {
		return res
			.status(400)
			.json({ error: 'Both start and end person IDs are required' });
	}

	const excludedIds = excludedPersons
		? excludedPersons.split(',').map(Number)
		: [];

	const personExclusionCondition = excludedIds.length
		? `AND all(n IN nodes(path) WHERE NOT (n:Person AND n.id IN $excludedIds))`
		: '';

	const cypherQuery = `
        MATCH path = allShortestPaths(
            (p1:Person {id: $startId})-[:WORKED_WITH*]-(p2:Person {id: $endId})
        )
        WHERE all(rel IN relationships(path) WHERE rel.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"])
        ${personExclusionCondition}
        WITH path,
            [node IN nodes(path) |
                CASE
                    WHEN node:Movie THEN {
                        type: "Movie",
                        id: node.id,
                        title: node.title,
                        year: node.year,
                        poster_url: node.poster_url
                    }
                    WHEN node:Person THEN {
                        type: "Person",
                        id: node.id,
                        name: node.name,
                        popularity: node.popularity
                    }
                END
            ] AS path_details,
            REDUCE(total_popularity = 0, n IN nodes(path) |
                CASE WHEN "Person" IN labels(n) THEN total_popularity + COALESCE(n.popularity, 0) ELSE total_popularity END
            ) AS total_path_popularity
        RETURN path_details, total_path_popularity
        ORDER BY total_path_popularity DESC
        LIMIT 15;
    `;

	try {
		const session = driver.session();
		const result = await session.run(cypherQuery, {
			startId: parseInt(startId),
			endId: parseInt(endId),
			excludedIds,
		});

		const paths = result.records.map((record) => ({
			path_details: record.get('path_details'),
			total_path_popularity: record.get('total_path_popularity'),
		}));

		res.json(paths);
	} catch (error) {
		console.error('[ERROR] Failed to fetch person-to-person path:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router;

module.exports = router;
