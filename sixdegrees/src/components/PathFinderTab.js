import React, { useState } from 'react';
import axios from 'axios';
import { Button, Typography, Box } from '@mui/material';
import SearchBar from './SearchBar';
import ResultsTable from './ResultsTable';

function PathFinderTab({ title, searchBarConfig, fetchEndpoint }) {
	const [searchValues, setSearchValues] = useState({});
	const [excludedPersons, setExcludedPersons] = useState([]);
	const [currentExcludeValue, setCurrentExcludeValue] = useState('');
	const [results, setResults] = useState([]);

	const handleSearchValueChange = (key, id, name) => {
		setSearchValues({ ...searchValues, [key]: { id, name } });
	};

	const handleExcludePerson = (id, name) => {
		if (id && !excludedPersons.some((person) => person.id === id)) {
			setExcludedPersons([...excludedPersons, { id, name }]);
			setCurrentExcludeValue(''); // Clear input after adding
		}
	};

	const handleRemoveExcludedPerson = (id) => {
		setExcludedPersons(excludedPersons.filter((person) => person.id !== id));
	};

	const clearForm = () => {
		setSearchValues({});
		setExcludedPersons([]);
		setResults([]);
		setCurrentExcludeValue(''); // Clear input
	};

	const fetchPath = async () => {
		if (Object.values(searchValues).some((value) => !value.id)) {
			alert('Please fill out all required search fields.');
			return;
		}

		try {
			const response = await axios.get(fetchEndpoint, {
				params: {
					...Object.fromEntries(
						Object.entries(searchValues).map(([key, value]) => [key, value.id])
					),
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
			<Box
				sx={{
					display: 'flex',
					flexDirection: { xs: 'column', sm: 'row' },
					gap: 2,
					mb: 3,
				}}
			>
				{searchBarConfig.map(({ key, placeholder, type }) => (
					<SearchBar
						key={key}
						placeholder={placeholder}
						type={type}
						value={searchValues[key]?.name || ''}
						onSelect={(id, name) => handleSearchValueChange(key, id, name)}
					/>
				))}
				<SearchBar
					placeholder="Exclude Person"
					type="person"
					value={currentExcludeValue}
					onSelect={(id, name) => {
						handleExcludePerson(id, name);
						setCurrentExcludeValue(name || ''); // Update input value after selection
					}}
				/>
				<Button variant="contained" sx={{ bgcolor: '#002b80' }} onClick={fetchPath}>
					Search
				</Button>
				<Button variant="outlined" color="secondary" onClick={clearForm}>
					Clear
				</Button>
			</Box>
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
			<ResultsTable results={results} />
		</Box>
	);
}

export default PathFinderTab;
