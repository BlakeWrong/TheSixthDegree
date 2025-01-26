import React, { useState } from 'react';
import axios from 'axios';
import SearchBar from './SearchBar';

function PersonToPersonTab() {
	const [startPersonId, setStartPersonId] = useState(null);
	const [endPersonId, setEndPersonId] = useState(null);
	const [excludedPersons, setExcludedPersons] = useState([]);
	const [excludedPersonsDetails, setExcludedPersonsDetails] = useState([]);
	const [results, setResults] = useState([]);

	const fetchPersonToPersonPath = async () => {
		if (!startPersonId || !endPersonId) {
			alert('Please select both persons.');
			return;
		}

		try {
			const response = await axios.get('/api/movies/person-to-person', {
				params: {
					startId: startPersonId,
					endId: endPersonId,
					excludedPersons: excludedPersons.join(','), // Send as comma-separated IDs
				},
			});
			setResults(response.data);
		} catch (error) {
			console.error('Error fetching person-to-person path:', error);
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
			<h2>Person to Person</h2>
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
					onSelect={(id, name) => addExcludedPerson(id, name)}
					type="person"
				/>
				<button
					onClick={fetchPersonToPersonPath}
					style={{ padding: '0.5rem 1rem' }}
				>
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
