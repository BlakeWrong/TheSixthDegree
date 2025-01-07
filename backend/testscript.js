const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
	'bolt://127.0.0.1:7687',
	neo4j.auth.basic('neo4j', 'testing123'),
	{ encrypted: 'ENCRYPTION_OFF' }
);

async function testConnection() {
	const session = driver.session();
	try {
		const result = await session.run('RETURN 1 AS number');
		console.log('Connection successful:', result.records[0].get('number'));
	} catch (error) {
		console.error('Failed to connect to Neo4j:', error);
	} finally {
		await session.close();
		await driver.close();
	}
}

testConnection();
