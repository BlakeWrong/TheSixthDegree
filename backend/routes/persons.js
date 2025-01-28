const express = require('express');
const router = express.Router();
const driver = require('../config/db');

router.get('/search', async (req, res) => {
	const query = req.query.query || '';
	const session = driver.session();

	try {
		// Helper function to normalize strings
		const normalizeString = (str) =>
			str
				.normalize('NFD') // Decompose accented characters
				.replace(/[\u0300-\u036f]/g, '') // Remove diacritics
				.replace(/[^\w\s]/g, '') // Remove punctuation
				.toLowerCase(); // Convert to lowercase

		// Normalize the search query
		const normalizedQuery = normalizeString(query);

		// Split the query into tokens
		const tokens = normalizedQuery.match(/\b\w+\b/g); // Matches words and numbers
		if (!tokens) {
			return res.json([]); // Return empty array if no tokens are present
		}

		// Build the Cypher query to match all tokens
		let cypherQuery = `
            MATCH (p:Person)
            WHERE ${tokens
													.map(
														(_, i) => `apoc.text.clean(toLower(p.name)) CONTAINS $token${i}`
													)
													.join(' AND ')}
            RETURN p
            ORDER BY p.popularity DESC
            LIMIT 10
        `;

		// Create query parameters for each token
		const params = {};
		tokens.forEach((token, i) => {
			params[`token${i}`] = token;
		});

		// Execute the query
		const result = await session.run(cypherQuery, params);

		// Map results to a consumable format
		const people = result.records.map((record) => {
			const person = record.get('p').properties;
			return {
				id: person.id.low || person.id, // Convert Neo4j integers if necessary
				name: person.name,
				popularity: person.popularity,
			};
		});

		res.json(people);
	} catch (error) {
		console.error('[ERROR] People search failed:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	} finally {
		await session.close();
	}
});

module.exports = router;
