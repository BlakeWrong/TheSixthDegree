import React, { useState } from 'react';
import axios from 'axios';
import { Button, Typography, Box } from '@mui/material';
import SearchBar from './SearchBar';
import ResultsTable from './ResultsTable';

function PathFinderTab({ title, searchBarConfig, fetchEndpoint }) {
	const [searchValues, setSearchValues] = useState({});
	const [excludedPersons, setExcludedPersons] = useState([]);
	const [results, setResults] = useState([]);

	const handleSearchValueChange = (key, value) => {
		setSearchValues({ ...searchValues, [key]: value });
	};

	const handleExcludePerson = (id, name) => {
		if (excludedPersons.some((person) => person.id === id)) return;
		setExcludedPersons([...excludedPersons, { id, name }]);
	};

	const handleRemoveExcludedPerson = (id) => {
		setExcludedPersons(excludedPersons.filter((person) => person.id !== id));
	};

	const fetchPath = async () => {
		if (Object.values(searchValues).some((value) => !value)) {
			alert('Please fill out all required search fields.');
			return;
		}

		try {
			const response = await axios.get(fetchEndpoint, {
				params: {
					...searchValues,
					excludedPersons: excludedPersons.map((person) => person.id).join(','),
				},
			});
			setResults(response.data);
		} catch (error) {
			console.error(`[ERROR] Failed to fetch path from ${fetchEndpoint}:`, error);
		}
	};

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 3 }}>
				{title}
			</Typography>
			<Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
				{searchBarConfig.map(({ key, placeholder, type }) => (
					<SearchBar
						key={key}
						placeholder={placeholder}
						type={type}
						onSelect={(id, name) => handleSearchValueChange(key, id)}
					/>
				))}
				<SearchBar
					placeholder="Exclude Person"
					type="person"
					onSelect={(id, name) => handleExcludePerson(id, name)}
				/>
				<Button variant="contained" sx={{ bgcolor: '#002b80' }} onClick={fetchPath}>
					Search
				</Button>
			</Box>
			{/* Display excluded persons */}
			{excludedPersons.length > 0 && (
				<Box sx={{ mb: 3 }}>
					<Typography variant="subtitle1">Excluded Persons:</Typography>
					<ul>
						{excludedPersons.map((person) => (
							<li key={person.id}>
								{person.name}{' '}
								<Button
									variant="text"
									color="error"
									onClick={() => handleRemoveExcludedPerson(person.id)}
								>
									Remove
								</Button>
							</li>
						))}
					</ul>
				</Box>
			)}
			{/* Results Table */}
			<ResultsTable results={results} />
		</Box>
	);
}

export default PathFinderTab;
