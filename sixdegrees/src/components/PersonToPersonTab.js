import React, { useState } from 'react';
import axios from 'axios';
import SearchBar from './SearchBar';

function PersonToPersonTab() {
	const [startPersonId, setStartPersonId] = useState(null);
	const [endPersonId, setEndPersonId] = useState(null);
	const [results, setResults] = useState([]);

	const fetchPersonToPersonPath = async () => {
		if (!startPersonId || !endPersonId) {
			alert('Please select both persons.');
			return;
		}

		try {
			const response = await axios.get('/api/movies/person-to-person', {
				params: { startId: startPersonId, endId: endPersonId },
			});
			setResults(response.data);
		} catch (error) {
			console.error('Error fetching person-to-person path:', error);
		}
	};

	return (
		<div>
			<h2>Person to Person</h2>
			<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
				<SearchBar
					placeholder="Start Person"
					onSelect={(id) => setStartPersonId(id)}
					endpoint="/api/people/search" // Make sure your SearchBar uses the correct endpoint
					type="person"
				/>
				<SearchBar
					placeholder="End Person"
					onSelect={(id) => setEndPersonId(id)}
					endpoint="/api/people/search"
					type="person"
				/>
				<button
					onClick={fetchPersonToPersonPath}
					style={{ padding: '0.5rem 1rem' }}
				>
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
						{results.map((path, index) => (
							<tr key={index}>
								<td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
									{path.path_sequence.join(' -> ')}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}

export default PersonToPersonTab;
