import React, { useState } from 'react';
import axios from 'axios';
import SearchBar from './SearchBar';

function MovieToPersonTab() {
	const [movieId, setMovieId] = useState(null);
	const [personId, setPersonId] = useState(null);
	const [results, setResults] = useState([]);

	const fetchMovieToPersonPath = async () => {
		console.log('Movie ID:', movieId);
		console.log('Person ID:', personId);

		if (!movieId || !personId) {
			alert('Please select both a movie and a person.');
			return;
		}

		try {
			const response = await axios.get('/api/movies/movie-to-person', {
				params: { startId: movieId, personId },
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
