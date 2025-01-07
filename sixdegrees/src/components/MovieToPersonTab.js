import React, { useState } from 'react';
import axios from 'axios';
import SearchBar from './SearchBar';

const VALID_ROLES = [
	'Actor',
	'Director',
	'Composer',
	'Cinematographer',
	'Writer',
];

function MovieToPersonTab() {
	const [movieId, setMovieId] = useState(null);
	const [personId, setPersonId] = useState(null);
	const [selectedRoles, setSelectedRoles] = useState(VALID_ROLES);
	const [results, setResults] = useState([]);

	const toggleRole = (role) => {
		setSelectedRoles(
			(prevRoles) =>
				prevRoles.includes(role)
					? prevRoles.filter((r) => r !== role) // Remove role if already selected
					: [...prevRoles, role] // Add role if not already selected
		);
	};

	const fetchMovieToPersonPath = async () => {
		console.log('Movie ID:', movieId);
		console.log('Person ID:', personId);
		console.log('Selected Roles:', selectedRoles);

		if (!movieId || !personId) {
			alert('Please select both a movie and a person.');
			return;
		}

		try {
			const response = await axios.get('/api/movies/movie-to-person', {
				params: { startId: movieId, endId: personId, validRoles: selectedRoles },
			});
			console.log('Results:', response.data);
			setResults(response.data);
		} catch (error) {
			console.error('Error fetching movie-to-person path:', error);
		}
	};

	return (
		<div>
			<h2>Movie to Person</h2>
			<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
				<SearchBar
					placeholder="Movie"
					onSelect={(id) => {
						console.log('Movie Selected:', id);
						setMovieId(id);
					}}
				/>
				<SearchBar
					placeholder="Person"
					onSelect={(id) => {
						console.log('Person Selected:', id);
						setPersonId(id);
					}}
					type="person"
				/>
				<button onClick={fetchMovieToPersonPath} style={{ padding: '0.5rem 1rem' }}>
					Search
				</button>
			</div>
			<div style={{ marginBottom: '1rem' }}>
				<h4>Filter by Role:</h4>
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					{VALID_ROLES.map((role) => (
						<label key={role} style={{ display: 'flex', alignItems: 'center' }}>
							<input
								type="checkbox"
								checked={selectedRoles.includes(role)}
								onChange={() => toggleRole(role)}
							/>
							{role}
						</label>
					))}
				</div>
			</div>
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
