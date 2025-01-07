const express = require('express');
const router = express.Router();
const driver = require('../config/db');

router.get('/search', async (req, res) => {
	const query = req.query.query || '';
	const session = driver.session();

	try {
		const result = await session.run(
			`
            MATCH (p:Person) 
            WHERE toLower(p.name) CONTAINS toLower($query) 
            RETURN p 
            LIMIT 10
            `,
			{ query }
		);

		const people = result.records.map((record) => {
			const person = record.get('p').properties;
			return {
				id: person.id.low, // Flatten the ID
				name: person.name,
				popularity: person.popularity,
			};
		});

		res.json(people);
	} catch (error) {
		console.error('Error querying people:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	} finally {
		await session.close();
	}
});

module.exports = router;
