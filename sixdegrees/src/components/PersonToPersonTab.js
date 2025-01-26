import React, { useState } from 'react';
import axios from 'axios';
import SearchBar from './SearchBar';

function PersonToPersonTab() {
	const [startPersonId, setStartPersonId] = useState(null);
	const [endPersonId, setEndPersonId] = useState(null);
	const [excludedPersons, setExcludedPersons] = useState([]); // Stores excluded persons {id, name}
	const [results, setResults] = useState([]);

	const fetchPersonToPersonPath = async () => {
		if (!startPersonId || !endPersonId) {
			alert('Please select both start and end persons.');
			return;
		}

		try {
			const response = await axios.get('/api/movies/person-to-person', {
				params: {
					startId: startPersonId,
					endId: endPersonId,
					excludedPersons: excludedPersons.map((person) => person.id).join(','),
				},
			});
			setResults(response.data);
		} catch (error) {
			console.error('[ERROR] Failed to fetch person-to-person path:', error);
		}
	};

	const handleExcludePerson = (id, name) => {
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
			<h2>Person to Person Path</h2>
			<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
				<SearchBar
					placeholder="Start Person"
					onSelect={(id) => setStartPersonId(id)}
					type="person"
				/>
				<SearchBar
					placeholder="End Person"
					onSelect={(id) => setEndPersonId(id)}
					type="person"
				/>
				<SearchBar
					placeholder="Exclude Person"
					onSelect={(id, name) => handleExcludePerson(id, name)}
					type="person"
				/>
				<button
					onClick={fetchPersonToPersonPath}
					style={{ padding: '0.5rem 1rem' }}
				>
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
									style={{ marginLeft: '0.5rem', color: 'red', cursor: 'pointer' }}
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
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '1rem',
											whiteSpace: 'nowrap',
											overflowX: 'auto',
										}}
									>
										{result.path_details.map((node, nodeIndex) => (
											<React.Fragment key={nodeIndex}>
												<div
													style={{
														display: 'flex',
														flexDirection: 'column',
														alignItems: 'center',
														gap: '0.5rem',
														textAlign: 'center',
													}}
												>
													{node.type === 'Movie' && (
														<img
															src={
																node.poster_url
																	? `https://image.tmdb.org/t/p/w200${node.poster_url}`
																	: '/noposter.png'
															}
															alt={node.title}
															style={{
																width: '50px',
																height: '75px',
																objectFit: 'cover',
																borderRadius: '4px',
															}}
														/>
													)}
													{node.type === 'Movie' ? (
														<div>
															<strong>{node.title}</strong>
															<br />({node.year || 'Unknown'})
														</div>
													) : (
														<div>
															<strong>{node.name}</strong>
															<br />
															{node.popularity && `(Popularity: ${node.popularity})`}
														</div>
													)}
												</div>
												{nodeIndex < result.path_details.length - 1 && (
													<span style={{ fontSize: '1.5rem', color: '#888' }}>→</span>
												)}
											</React.Fragment>
										))}
									</div>
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

export default PersonToPersonTab;
