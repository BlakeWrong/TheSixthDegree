import React, { useState } from 'react';
import axios from 'axios';
import SearchBar from './SearchBar';

function MovieToPersonTab() {
	const [movieId, setMovieId] = useState(null);
	const [personId, setPersonId] = useState(null);
	const [excludedPersons, setExcludedPersons] = useState([]);
	const [excludedPersonsDetails, setExcludedPersonsDetails] = useState([]);
	const [results, setResults] = useState([]);

	const fetchMovieToPersonPath = async () => {
		if (!movieId || !personId) {
			alert('Please select both a movie and a person.');
			return;
		}

		try {
			const response = await axios.get('/api/movies/movie-to-person', {
				params: {
					startId: movieId,
					personId,
					excludedPersons: excludedPersons.join(','), // Send as comma-separated IDs
				},
			});
			setResults(response.data);
		} catch (error) {
			console.error('Error fetching movie-to-person path:', error);
		}
	};

	const addExcludedPerson = (id, name) => {
		if (id && !excludedPersons.includes(id)) {
			setExcludedPersons((prev) => [...prev, parseInt(id)]);
			setExcludedPersonsDetails((prev) => [...prev, { id: parseInt(id), name }]);
		}
	};

	const removeExcludedPerson = (id) => {
		setExcludedPersons((prev) => prev.filter((pid) => pid !== id));
		setExcludedPersonsDetails((prev) =>
			prev.filter((person) => person.id !== id)
		);
	};

	return (
		<div>
			<h2>Movie to Person</h2>
			<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
				<SearchBar placeholder="Movie" onSelect={(id) => setMovieId(id)} />
				<SearchBar
					placeholder="Person"
					onSelect={(id) => setPersonId(id)}
					type="person"
				/>
				<SearchBar
					placeholder="Exclude Person"
					onSelect={(id, name) => addExcludedPerson(id, name)}
					type="person"
				/>
				<button onClick={fetchMovieToPersonPath} style={{ padding: '0.5rem 1rem' }}>
					Search
				</button>
			</div>

			{/* Excluded Persons List */}
			{excludedPersonsDetails.length > 0 && (
				<div>
					<h4>Excluded Persons:</h4>
					<ul>
						{excludedPersonsDetails.map((person) => (
							<li key={person.id} style={{ marginBottom: '0.5rem' }}>
								{person.name}{' '}
								<button
									onClick={() => removeExcludedPerson(person.id)}
									style={{
										marginLeft: '1rem',
										color: 'red',
										border: 'none',
										background: 'none',
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
								<td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
									{Array.isArray(result.path_sequence)
										? result.path_sequence.join(' -> ')
										: 'Invalid path format'}
								</td>
								<td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
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

export default MovieToPersonTab;
