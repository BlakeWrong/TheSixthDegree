import React, { useState } from 'react';
import axios from 'axios';
import SearchBar from './SearchBar';

const validRoles = [
	'Actor',
	'Director',
	'Composer',
	'Cinematographer',
	'Writer',
];

function MovieToMovieTab() {
	const [startMovieId, setStartMovieId] = useState(null);
	const [endMovieId, setEndMovieId] = useState(null);
	const [selectedRole, setSelectedRole] = useState(null);
	const [results, setResults] = useState([]);

	const fetchMovieToMoviePath = async () => {
		console.log('Start Movie ID:', startMovieId);
		console.log('End Movie ID:', endMovieId);
		console.log('Selected Role:', selectedRole);

		if (!startMovieId || !endMovieId) {
			alert('Please select both movies.');
			return;
		}

		try {
			const response = await axios.get('/api/movies/movie-to-movie', {
				params: {
					startId: startMovieId,
					endId: endMovieId,
					role: selectedRole, // Include the selected role as a parameter
				},
			});
			console.log('Results:', response.data);
			setResults(response.data);
		} catch (error) {
			console.error('Error fetching movie-to-movie path:', error);
		}
	};

	return (
		<div>
			<h2>Movie to Movie</h2>
			<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
				<SearchBar
					placeholder="Start Movie"
					onSelect={(id) => {
						console.log('Start Movie Selected:', id);
						setStartMovieId(id);
					}}
				/>
				<SearchBar
					placeholder="End Movie"
					onSelect={(id) => {
						console.log('End Movie Selected:', id);
						setEndMovieId(id);
					}}
				/>
				<select
					value={selectedRole || ''}
					onChange={(e) => setSelectedRole(e.target.value)}
					style={{
						padding: '0.5rem',
						borderRadius: '4px',
						border: '1px solid #ccc',
					}}
				>
					<option value="">All Roles</option>
					{validRoles.map((role) => (
						<option key={role} value={role}>
							{role}
						</option>
					))}
				</select>
				<button onClick={fetchMovieToMoviePath} style={{ padding: '0.5rem 1rem' }}>
					Search
				</button>
			</div>
			{results.length > 0 && (
				<table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr>
							<th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
								Path
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

export default MovieToMovieTab;
