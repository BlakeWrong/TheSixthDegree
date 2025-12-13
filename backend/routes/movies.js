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
	const { startId, endId, endIds, excludedPersons } = req.query;

	// Check for valid start ID first
	if (!startId) {
		return res
			.status(400)
			.json({ error: 'Start movie ID is required' });
	}

	// Support both single target (endId) and multiple targets (endIds)
	let targetIds = [];
	if (endIds && endIds.trim() !== '') {
		// Multiple target mode
		targetIds = endIds.split(',').map(Number);
		if (targetIds.length === 0) {
			return res
				.status(400)
				.json({ error: 'At least one target movie ID is required' });
		}
	} else if (endId) {
		// Single target mode (backward compatibility)
		targetIds = [parseInt(endId)];
	} else {
		return res
			.status(400)
			.json({ error: 'Either endId or endIds parameter is required' });
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
			(m1:Movie {id: $startId})-[:WORKED_WITH*]-(m2:Movie)
		)
		WHERE m2.id IN $targetIds
		AND all(rel IN relationships(path) WHERE rel.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"])
		${personCondition}
		WITH path,
			nodes(path) AS path_nodes,
			relationships(path) AS path_rels,
			length(path) as path_length,
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
			path_length,
			total_path_popularity
		ORDER BY path_length ASC, total_path_popularity DESC
		LIMIT 15;

    `;

	try {
		const session = driver.session();
		const result = await session.run(cypherQuery, {
			startId: parseInt(startId),
			targetIds: targetIds,
			excludedIds,
		});

		// Map results to send to the frontend
		const paths = result.records.map((record) => ({
			path_details: record.get('path_details'),
			relationships: record.get('relationships'),
			path_length: record.get('path_length'),
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
	const { startId, startIds, personId, personIds, excludedPersons } = req.query;

	// Support both directions: single/multi movies to single/multi persons
	let movieIds = [];
	let personTargetIds = [];

	// Handle movie IDs (start parameter)
	if (startIds && startIds.trim() !== '') {
		// Multiple movies mode
		movieIds = startIds.split(',').map(Number);
		if (movieIds.length === 0) {
			return res
				.status(400)
				.json({ error: 'At least one start movie ID is required' });
		}
	} else if (startId) {
		// Single movie mode (backward compatibility)
		movieIds = [parseInt(startId)];
	} else {
		return res
			.status(400)
			.json({ error: 'Either startId or startIds parameter is required' });
	}

	// Handle person IDs (target parameter)
	if (personIds && personIds.trim() !== '') {
		// Multiple target mode
		personTargetIds = personIds.split(',').map(Number);
		if (personTargetIds.length === 0) {
			return res
				.status(400)
				.json({ error: 'At least one target person ID is required' });
		}
	} else if (personId) {
		// Single target mode (backward compatibility)
		personTargetIds = [parseInt(personId)];
	} else {
		return res
			.status(400)
			.json({ error: 'Either personId or personIds parameter is required' });
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
            (m:Movie)-[:WORKED_WITH*]-(p:Person)
        )
        WHERE m.id IN $movieIds AND p.id IN $personTargetIds
        AND all(rel IN relationships(path) WHERE rel.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"])
        ${personExclusionCondition}
        WITH path,
            nodes(path) AS path_nodes,
            relationships(path) AS path_rels,
            length(path) as path_length,
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
            path_length,
            total_path_popularity
        ORDER BY path_length ASC, total_path_popularity DESC
        LIMIT 15;
    `;

	try {
		const session = driver.session();
		const result = await session.run(cypherQuery, {
			movieIds: movieIds,
			personTargetIds: personTargetIds,
			excludedIds,
		});

		const paths = result.records.map((record) => ({
			path_details: record.get('path_details'),
			relationships: record.get('relationships'),
			path_length: record.get('path_length'),
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
	const { startId, endId, endIds, excludedPersons } = req.query;

	// Check for valid start ID first
	if (!startId) {
		return res
			.status(400)
			.json({ error: 'Start person ID is required' });
	}

	// Support both single target (endId) and multiple targets (endIds)
	let targetIds = [];
	if (endIds && endIds.trim() !== '') {
		// Multiple target mode
		targetIds = endIds.split(',').map(Number);
		if (targetIds.length === 0) {
			return res
				.status(400)
				.json({ error: 'At least one target person ID is required' });
		}
	} else if (endId) {
		// Single target mode (backward compatibility)
		targetIds = [parseInt(endId)];
	} else {
		return res
			.status(400)
			.json({ error: 'Either endId or endIds parameter is required' });
	}

	const excludedIds = excludedPersons
		? excludedPersons.split(',').map(Number)
		: [];

	const personExclusionCondition = excludedIds.length
		? `AND all(n IN nodes(path) WHERE NOT (n:Person AND n.id IN $excludedIds))`
		: '';

	const cypherQuery = `
        MATCH path = allShortestPaths(
            (p1:Person {id: $startId})-[:WORKED_WITH*]-(p2:Person)
        )
        WHERE p2.id IN $targetIds
        AND all(rel IN relationships(path) WHERE rel.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"])
        ${personExclusionCondition}
        WITH path,
            nodes(path) AS path_nodes,
            relationships(path) AS path_rels,
            length(path) as path_length,
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
            path_length,
            total_path_popularity
        ORDER BY path_length ASC, total_path_popularity DESC
        LIMIT 15;
    `;

	try {
		const session = driver.session();
		const result = await session.run(cypherQuery, {
			startId: parseInt(startId),
			targetIds: targetIds,
			excludedIds,
		});

		const paths = result.records.map((record) => ({
			path_details: record.get('path_details'),
			relationships: record.get('relationships'),
			path_length: record.get('path_length'),
			total_path_popularity: record.get('total_path_popularity'),
		}));

		res.json(paths);
	} catch (error) {
		console.error('[ERROR] Failed to fetch person-to-person path:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Movie-to-Genre
router.get('/movie-to-genre', async (req, res) => {
	const { startId, startIds, includeGenres, excludeGenres, excludedPersons } = req.query;

	// Support both single and multiple movies
	let movieIds = [];
	if (startIds && startIds.trim() !== '') {
		movieIds = startIds.split(',').map(Number);
		if (movieIds.length === 0) {
			return res.status(400).json({ error: 'At least one start movie ID is required' });
		}
	} else if (startId) {
		movieIds = [parseInt(startId)];
	} else {
		return res.status(400).json({ error: 'Either startId or startIds parameter is required' });
	}

	// Parse included and excluded genres
	const requiredGenres = includeGenres ? includeGenres.split(',') : [];
	const excludedGenresList = excludeGenres ? excludeGenres.split(',') : [];

	if (requiredGenres.length === 0) {
		return res.status(400).json({ error: 'At least one genre to include is required' });
	}

	const excludedIds = excludedPersons ? excludedPersons.split(',').map(Number) : [];

	const personExclusionCondition = excludedIds.length
		? `AND all(n IN nodes(path) WHERE NOT (n:Person AND n.id IN $excludedIds))`
		: '';

	// Build genre filter conditions
	const genreIncludeCondition = requiredGenres.map((_, i) => `$includeGenre${i} IN target.genres`).join(' AND ');
	const genreExcludeCondition = excludedGenresList.length > 0
		? ' AND ' + excludedGenresList.map((_, i) => `NOT ($excludeGenre${i} IN target.genres)`).join(' AND ')
		: '';

	const cypherQuery = `
		MATCH (start:Movie)
		WHERE start.id IN $movieIds

		// Find target movies with required genres (limited depth)
		MATCH (start)-[:WORKED_WITH*1..3]-(target:Movie)
		WHERE ${genreIncludeCondition}${genreExcludeCondition}
		AND start <> target

		// Get shortest path to each found target
		WITH DISTINCT start, target
		MATCH path = shortestPath((start)-[:WORKED_WITH*1..3]-(target))
		WHERE all(rel IN relationships(path) WHERE rel.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"])
		${personExclusionCondition}

		WITH DISTINCT target,
			path,
			nodes(path) AS path_nodes,
			relationships(path) AS path_rels,
			length(path) as path_length,
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
						poster_url: n.poster_url,
						genres: n.genres
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
			path_length,
			total_path_popularity
		ORDER BY path_length ASC, total_path_popularity DESC
		LIMIT 10;
	`;

	try {
		const session = driver.session();
		const params = {
			movieIds: movieIds,
			excludedIds,
		};

		// Add genre parameters
		requiredGenres.forEach((genre, i) => {
			params[`includeGenre${i}`] = genre;
		});
		excludedGenresList.forEach((genre, i) => {
			params[`excludeGenre${i}`] = genre;
		});

		const result = await session.run(cypherQuery, params);

		const paths = result.records.map((record) => ({
			path_details: record.get('path_details'),
			relationships: record.get('relationships'),
			path_length: record.get('path_length'),
			total_path_popularity: record.get('total_path_popularity'),
		}));

		res.json(paths);
	} catch (error) {
		console.error('[ERROR] Failed to fetch movie-to-genre path:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Person-to-Genre
router.get('/person-to-genre', async (req, res) => {
	const { startId, startIds, includeGenres, excludeGenres, excludedPersons } = req.query;

	// Support both single and multiple persons
	let personIds = [];
	if (startIds && startIds.trim() !== '') {
		personIds = startIds.split(',').map(Number);
		if (personIds.length === 0) {
			return res.status(400).json({ error: 'At least one start person ID is required' });
		}
	} else if (startId) {
		personIds = [parseInt(startId)];
	} else {
		return res.status(400).json({ error: 'Either startId or startIds parameter is required' });
	}

	// Parse included and excluded genres
	const requiredGenres = includeGenres ? includeGenres.split(',') : [];
	const excludedGenresList = excludeGenres ? excludeGenres.split(',') : [];

	if (requiredGenres.length === 0) {
		return res.status(400).json({ error: 'At least one genre to include is required' });
	}

	const excludedIds = excludedPersons ? excludedPersons.split(',').map(Number) : [];

	const personExclusionCondition = excludedIds.length
		? `AND all(n IN nodes(path) WHERE NOT (n:Person AND n.id IN $excludedIds))`
		: '';

	// Build genre filter conditions
	const genreIncludeCondition = requiredGenres.map((_, i) => `$includeGenre${i} IN target.genres`).join(' AND ');
	const genreExcludeCondition = excludedGenresList.length > 0
		? ' AND ' + excludedGenresList.map((_, i) => `NOT ($excludeGenre${i} IN target.genres)`).join(' AND ')
		: '';

	const cypherQuery = `
		MATCH (start:Person)
		WHERE start.id IN $personIds

		// Find target movies with required genres (limited depth)
		MATCH (start)-[:WORKED_WITH*1..3]-(target:Movie)
		WHERE ${genreIncludeCondition}${genreExcludeCondition}

		// Get shortest path to each found target
		WITH DISTINCT start, target
		MATCH path = shortestPath((start)-[:WORKED_WITH*1..3]-(target))
		WHERE all(rel IN relationships(path) WHERE rel.role IN ["Actor", "Director", "Composer", "Cinematographer", "Writer"])
		${personExclusionCondition}

		WITH path,
			nodes(path) AS path_nodes,
			relationships(path) AS path_rels,
			length(path) as path_length,
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
						poster_url: n.poster_url,
						genres: n.genres
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
			path_length,
			total_path_popularity
		ORDER BY path_length ASC, total_path_popularity DESC
		LIMIT 15;
	`;

	try {
		const session = driver.session();
		const params = {
			personIds: personIds,
			excludedIds,
		};

		// Add genre parameters
		requiredGenres.forEach((genre, i) => {
			params[`includeGenre${i}`] = genre;
		});
		excludedGenresList.forEach((genre, i) => {
			params[`excludeGenre${i}`] = genre;
		});

		const result = await session.run(cypherQuery, params);

		const paths = result.records.map((record) => ({
			path_details: record.get('path_details'),
			relationships: record.get('relationships'),
			path_length: record.get('path_length'),
			total_path_popularity: record.get('total_path_popularity'),
		}));

		res.json(paths);
	} catch (error) {
		console.error('[ERROR] Failed to fetch person-to-genre path:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Genre Search
router.get('/genres/search', async (req, res) => {
	const { query } = req.query;

	if (!query || query.trim().length < 1) {
		return res.json([]);
	}

	try {
		const session = driver.session();
		const cypherQuery = `
			MATCH (m:Movie)
			UNWIND m.genres as genre
			WITH DISTINCT genre
			WHERE toLower(genre) CONTAINS toLower($query)
			RETURN genre
			ORDER BY genre
			LIMIT 20;
		`;

		const result = await session.run(cypherQuery, { query: query.trim() });

		const genres = result.records.map(record => ({
			id: record.get('genre'),
			name: record.get('genre')
		}));

		res.json(genres);
	} catch (error) {
		console.error('[ERROR] Failed to search genres:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router;
