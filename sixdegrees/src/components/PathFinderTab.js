import React, { useState } from 'react';
import axios from 'axios';
import { Button, Typography, Box, Chip, Stack } from '@mui/material';
import SearchBar from './SearchBar';
import ResultsTable from './ResultsTable';

function PathFinderTab({ title, searchBarConfig, fetchEndpoint }) {
	const [searchValues, setSearchValues] = useState({});
	const [targetValues, setTargetValues] = useState({}); // For multi-target fields
	const [excludedPersons, setExcludedPersons] = useState([]);
	const [currentTargetValues, setCurrentTargetValues] = useState({}); // Current input values for multi-target
	const [currentExcludeValue, setCurrentExcludeValue] = useState('');
	const [results, setResults] = useState([]);
	const [clearSignal, setClearSignal] = useState(0); // Used to reset inputs

	const handleSearchValueChange = (key, id, name) => {
		setSearchValues({ ...searchValues, [key]: { id, name } });
	};

	const handleAddTarget = (key, id, name) => {
		if (id && !(targetValues[key] && targetValues[key].some((item) => item.id === id))) {
			const currentTargets = targetValues[key] || [];
			setTargetValues({
				...targetValues,
				[key]: [...currentTargets, { id, name }]
			});
			setCurrentTargetValues({ ...currentTargetValues, [key]: '' });
		}
	};

	const handleRemoveTarget = (key, id) => {
		if (targetValues[key]) {
			setTargetValues({
				...targetValues,
				[key]: targetValues[key].filter((item) => item.id !== id)
			});
		}
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
		setTargetValues({});
		setCurrentTargetValues({});
		setExcludedPersons([]);
		setResults([]);
		setCurrentExcludeValue('');
		setClearSignal((prev) => prev + 1); // Increment to trigger reset in SearchBar
	};

	const fetchPath = async () => {
		// Check if all single-target fields are filled
		const singleTargetFields = searchBarConfig.filter(config => !config.multiTarget);
		const multiTargetFields = searchBarConfig.filter(config => config.multiTarget);

		if (singleTargetFields.some(config => !searchValues[config.key]?.id)) {
			alert('Please fill out all required search fields.');
			return;
		}

		// Check if multi-target fields have at least one target (excluding optional fields)
		const requiredMultiTargetFields = multiTargetFields.filter(config => !config.optional);
		if (requiredMultiTargetFields.some(config => !(targetValues[config.key] && targetValues[config.key].length > 0))) {
			alert('Please add at least one target for required multi-target fields.');
			return;
		}

		// Special validation for bidirectional tabs: prevent both fields from being multi-selected
		if (multiTargetFields.length > 1) {
			const activeMultiFields = multiTargetFields.filter(config =>
				targetValues[config.key] && targetValues[config.key].length > 1
			);
			if (activeMultiFields.length > 1) {
				alert('Please select multiple items for only one field at a time to avoid complex queries.');
				return;
			}
		}

		try {
			const params = {
				// Single target fields
				...Object.fromEntries(
					Object.entries(searchValues).map(([key, value]) => [key, value.id])
				),
				excludedPersons: excludedPersons.map((person) => person.id).join(','),
			};

			// Multi-target fields
			Object.entries(targetValues).forEach(([key, targets]) => {
				if (targets && targets.length > 0) {
					if (targets.length === 1) {
						// Use single target parameter for backward compatibility
						const singleKey = key.replace('Ids', 'Id'); // startIds -> startId, endIds -> endId
						params[singleKey] = targets[0].id;
					} else {
						// Use multi-target parameter
						params[key] = targets.map(target => target.id).join(',');
					}
				}
			});

			const response = await axios.get(fetchEndpoint, { params });
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
				{searchBarConfig.map(({ key, placeholder, type, multiTarget }) => (
					<SearchBar
						key={key}
						placeholder={multiTarget ? `Add ${placeholder}` : placeholder}
						type={type}
						value={multiTarget
							? (currentTargetValues[key] || '')
							: (searchValues[key]?.name || '')
						}
						onSelect={(id, name) => {
							if (multiTarget) {
								handleAddTarget(key, id, name);
							} else {
								handleSearchValueChange(key, id, name);
							}
						}}
						clearSignal={clearSignal}
					/>
				))}
				<SearchBar
					placeholder="Exclude Person"
					type="person"
					value={currentExcludeValue}
					onSelect={(id, name) => {
						handleExcludePerson(id, name);
						setCurrentExcludeValue(name || '');
					}}
					clearSignal={clearSignal}
				/>
				<Button variant="contained" sx={{ bgcolor: '#002b80' }} onClick={fetchPath}>
					Search
				</Button>
				<Button variant="outlined" color="secondary" onClick={clearForm}>
					Clear
				</Button>
			</Box>

			{/* Multi-target chips display */}
			{searchBarConfig.filter(config => config.multiTarget).map(({ key, placeholder }) =>
				targetValues[key] && targetValues[key].length > 0 && (
					<Box key={key} sx={{ mb: 2 }}>
						<Typography variant="subtitle2" sx={{ mb: 1 }}>
							{placeholder}s:
						</Typography>
						<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
							{targetValues[key].map((item) => (
								<Chip
									key={item.id}
									label={item.name}
									onDelete={() => handleRemoveTarget(key, item.id)}
									color="primary"
									variant="outlined"
									sx={{ mb: 1 }}
								/>
							))}
						</Stack>
					</Box>
				)
			)}

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
