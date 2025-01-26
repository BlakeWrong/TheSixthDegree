import React, { useState } from 'react';
import axios from 'axios';
import SearchBar from './SearchBar';

function MovieToMovieTab() {
	const [startMovieId, setStartMovieId] = useState(null);
	const [endMovieId, setEndMovieId] = useState(null);
	const [excludedPersons, setExcludedPersons] = useState([]); // Stores excluded persons {id, name}
	const [results, setResults] = useState([]);

	const fetchMovieToMoviePath = async () => {
		if (!startMovieId || !endMovieId) {
			alert('Please select both a start movie and an end movie.');
			return;
		}

		try {
			const response = await axios.get('/api/movies/movie-to-movie', {
				params: {
					startId: startMovieId,
					endId: endMovieId,
					excludedPersons: excludedPersons.map((person) => person.id).join(','),
				},
			});
			setResults(response.data);
		} catch (error) {
			console.error('[ERROR] Failed to fetch movie-to-movie path:', error);
		}
	};

	const handleExcludePerson = (id, name) => {
		// Prevent duplicates
		if (excludedPersons.some((person) => person.id === id)) {
			return;
		}

		setExcludedPersons([...excludedPersons, { id, name }]);
	};

	const handleRemoveExcludedPerson = (id) => {
		setExcludedPersons(excludedPersons.filter((person) => person.id !== id));
	};

	return (
		<div>
			<h2>Movie to Movie Path</h2>
			<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
				{/* Start Movie SearchBar */}
				<SearchBar
					placeholder="Start Movie"
					onSelect={(id) => setStartMovieId(id)}
				/>
				{/* End Movie SearchBar */}
				<SearchBar placeholder="End Movie" onSelect={(id) => setEndMovieId(id)} />
				{/* Exclude Person SearchBar */}
				<SearchBar
					placeholder="Exclude Person"
					onSelect={(id, name) => handleExcludePerson(id, name)}
					type="person"
				/>
				<button onClick={fetchMovieToMoviePath} style={{ padding: '0.5rem 1rem' }}>
					Search
				</button>
			</div>

			{/* Display Excluded Persons */}
			{excludedPersons.length > 0 && (
				<div style={{ marginBottom: '1rem' }}>
					<h4>Excluded Persons:</h4>
					<ul>
						{excludedPersons.map((person) => (
							<li key={person.id}>
								{person.name}{' '}
								<button
									onClick={() => handleRemoveExcludedPerson(person.id)}
									style={{
										marginLeft: '0.5rem',
										color: 'red',
										cursor: 'pointer',
									}}
								>
									Remove
								</button>
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Results Table */}
			{results.length > 0 && (
				<table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr>
							<th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
								Path
							</th>
							<th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
								Total Popularity
							</th>
						</tr>
					</thead>
					<tbody>
						{results.map((result, index) => (
							<tr key={index}>
								<td
									style={{
										padding: '0.5rem',
										borderBottom: '1px solid #eee',
									}}
								>
									{Array.isArray(result.path_sequence)
										? result.path_sequence.join(' -> ')
										: 'Invalid path format'}
								</td>
								<td
									style={{
										padding: '0.5rem',
										borderBottom: '1px solid #eee',
									}}
								>
									{result.total_path_popularity || 'N/A'}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}

export default MovieToMovieTab;
