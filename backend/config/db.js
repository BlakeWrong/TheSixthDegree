const neo4j = require('neo4j-driver');
require('dotenv').config();

// Get environment variables for Neo4j connection
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

// Validate environment variables
if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
	throw new Error(
		'Missing required Neo4j environment variables (NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD).'
	);
}

// Create a Neo4j driver instance
const driver = neo4j.driver(
	NEO4J_URI,
	neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

module.exports = driver;
