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
		// Normalize input query (removing punctuation and special characters)
		const normalizeString = (str) =>
			str
				.normalize('NFD') // Decompose accented characters
				.replace(/[\u0300-\u036f]/g, '') // Remove diacritics
				.replace(/[^\w\s]/g, '') // Remove punctuation
				.toLowerCase(); // Convert to lowercase

		const normalizedQuery = normalizeString(query);

		// Split the query into tokens
		const tokens = normalizedQuery.match(/\b\w+\b/g); // Matches words and numbers
		if (!tokens) {
			return res.json([]); // Return empty array if no tokens are present
		}

		// Separate tokens into title and year (handle numeric ambiguity better)
		let titleTokens = [];
		let yearToken = null;
		let partialYearToken = null;

		tokens.forEach((token, index) => {
			if (/^\d{4}$/.test(token) && index === tokens.length - 1) {
				// Treat the last 4-digit token as the year
				yearToken = token;
			} else if (/^\d{2,3}$/.test(token)) {
				// Treat 2-3 digit tokens as partial year candidates
				partialYearToken = token;
			} else {
				titleTokens.push(token); // Everything else is part of the title
			}
		});

		// If the query is entirely numeric, treat it as a title
		if (titleTokens.length === 0 && /^\d+$/.test(query)) {
			titleTokens = [query];
			yearToken = null;
			partialYearToken = null;
		}

		console.log(
			`[DEBUG] Searching for: Titles="${titleTokens.join(' ')}", Year="${
				yearToken || 'None'
			}", Partial="${partialYearToken || 'None'}"`
		);

		// Build the Cypher query
		let cypherQuery = `
            MATCH (m:Movie)
            WHERE (m.usable IS NULL OR m.usable <> false)
        `;
		const params = {};

		// Add title matching using APOC for normalization
		if (titleTokens.length > 0) {
			cypherQuery += ` AND ${titleTokens
				.map((_, i) => `apoc.text.clean(toLower(m.title)) CONTAINS $titleToken${i}`)
				.join(' AND ')}`;
			titleTokens.forEach((token, i) => {
				params[`titleToken${i}`] = normalizeString(token); // Normalize token
			});
		}

		// Add year matching
		if (yearToken) {
			cypherQuery += ` AND toString(m.year) = $yearToken`;
			params.yearToken = yearToken;
		} else if (partialYearToken) {
			cypherQuery += ` AND toString(m.year) STARTS WITH $partialYearToken`;
			params.partialYearToken = partialYearToken;
		}

		// Execute the query
		cypherQuery += `
            RETURN m
            ORDER BY m.popularity DESC
            LIMIT 10
        `;

		const result = await session.run(cypherQuery, params);

		// Map results to send back to the frontend
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
						profile_url: n.profile_url,
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
						profile_url: n.profile_url,
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
			personId: parseInt(personId),
			excludedIds,
		});

		const paths = result.records.map((record) => ({
			path_details: record.get('path_details'),
			relationships: record.get('relationships'),
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
						profile_url: n.profile_url,
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

		const paths = result.records.map((record) => ({
			path_details: record.get('path_details'),
			relationships: record.get('relationships'),
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
