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
            WHERE ${titleTokens
													.map(
														(_, i) => `toLower(m.title) CONTAINS toLower($titleToken${i})`
													)
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
            WHERE ${yearToken ? 'toString(m.year) = $yearToken' : ''}
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
	const { startId, endId } = req.query;
	console.log('startId => ', startId);
	console.log('endId => ', endId);

	if (!startId || !endId) {
		return res
			.status(400)
			.json({ error: 'Both start and end movie IDs are required' });
	}

	const cypherQuery = `
        MATCH path = allShortestPaths(
            (m1:Movie {id: $startId})-[:WORKED_WITH*]-(m2:Movie {id: $endId})
        )
        WHERE all(rel IN relationships(path) WHERE rel.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"])
        WITH path, 
            nodes(path) AS path_nodes, 
            relationships(path) AS path_rels,
            REDUCE(total_popularity = 0, n IN nodes(path) |
                CASE WHEN "Person" IN labels(n) THEN total_popularity + COALESCE(n.popularity, 0) ELSE total_popularity END
            ) AS total_path_popularity
        RETURN
            [i IN range(0, size(path_nodes)-1) |
                CASE 
                    WHEN i % 2 = 0 THEN path_nodes[i].title + ' (' + COALESCE(path_nodes[i].year, 'Unknown') + ')'  // Movie with release year
                    ELSE path_nodes[i].name + ' [' + head([r IN path_rels WHERE startNode(r) = path_nodes[i] OR endNode(r) = path_nodes[i] AND r.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"] | r.role]) + ']'  // Person with role
                END
            ] AS path_sequence,
            total_path_popularity
        ORDER BY total_path_popularity DESC
        LIMIT 5;
    `;

	try {
		const session = driver.session();
		const result = await session.run(cypherQuery, {
			startId: Number(startId),
			endId: Number(endId),
		});

		const paths = result.records.map((record) => ({
			path_sequence: record.get('path_sequence'),
			total_path_popularity: record.get('total_path_popularity'),
		}));

		res.json(paths);
	} catch (error) {
		console.error('Error finding movie-to-movie path:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

router.get('/movie-to-person', async (req, res) => {
	const { startId, personId } = req.query;

	if (!startId || !personId) {
		return res
			.status(400)
			.json({ error: 'Both movie and person IDs are required' });
	}

	const cypherQuery = `
        MATCH path = allShortestPaths(
            (m:Movie {id: $startId})-[:WORKED_WITH*]-(p:Person {id: $personId})
        )
        WHERE all(rel IN relationships(path) WHERE rel.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"])
        WITH path, 
            nodes(path) AS path_nodes, 
            relationships(path) AS path_rels,
            // Sum popularity of all crew nodes
            REDUCE(total_popularity = 0, n IN nodes(path) |
                CASE WHEN "Person" IN labels(n) THEN total_popularity + COALESCE(n.popularity, 0) ELSE total_popularity END
            ) AS total_path_popularity
        RETURN
            [i IN range(0, size(path_nodes)-1) |
                CASE 
                    WHEN i % 2 = 0 THEN path_nodes[i].title + ' (' + COALESCE(path_nodes[i].year, 'Unknown') + ')'  // Movie with release year
                    ELSE path_nodes[i].name + ' [' + head([r IN path_rels WHERE startNode(r) = path_nodes[i] OR endNode(r) = path_nodes[i] AND r.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"] | r.role]) + ']'  // Person with role
                END
            ] AS path_sequence,
            total_path_popularity
        ORDER BY total_path_popularity DESC
        LIMIT 5;
    `;

	try {
		const session = driver.session();
		const result = await session.run(cypherQuery, {
			startId: parseInt(startId),
			personId: parseInt(personId),
		});

		const paths = result.records.map((record) => ({
			path_sequence: record.get('path_sequence'),
			total_path_popularity: record.get('total_path_popularity'),
		}));

		res.json(paths);
	} catch (error) {
		console.error('Error finding movie-to-person path:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

router.get('/person-to-person', async (req, res) => {
	const { startId, endId } = req.query;

	if (!startId || !endId) {
		return res
			.status(400)
			.json({ error: 'Both start and end person IDs are required' });
	}

	const cypherQuery = `
        MATCH path = allShortestPaths(
            (p1:Person {id: $startId})-[:WORKED_WITH*]-(p2:Person {id: $endId})
        )
        WHERE all(rel IN relationships(path) WHERE rel.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"])
        WITH path, 
             nodes(path) AS path_nodes, 
             relationships(path) AS path_rels,
             REDUCE(total_popularity = 0, n IN nodes(path) |
                 CASE WHEN "Person" IN labels(n) THEN total_popularity + COALESCE(n.popularity, 0) ELSE total_popularity END
             ) AS total_path_popularity
        RETURN
            [i IN range(0, size(path_nodes)-1) |
                CASE 
                    WHEN i % 2 = 0 THEN path_nodes[i].name + ' [' + head([r IN path_rels WHERE (startNode(r) = path_nodes[i] OR endNode(r) = path_nodes[i]) AND r.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"] | r.role]) + ']'
                    ELSE path_nodes[i].title + ' (' + COALESCE(path_nodes[i].year, 'Unknown') + ')'  // Movie with release year
                END
            ] AS path_sequence,
            total_path_popularity
        ORDER BY total_path_popularity DESC
        LIMIT 5;
    `;

	try {
		const session = driver.session();
		const result = await session.run(cypherQuery, {
			startId: parseInt(startId),
			endId: parseInt(endId),
		});

		const paths = result.records.map((record) => ({
			path_sequence: record.get('path_sequence'),
			total_path_popularity: record.get('total_path_popularity'),
		}));

		res.json(paths);
	} catch (error) {
		console.error('Error finding person-to-person path:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router;

module.exports = router;
