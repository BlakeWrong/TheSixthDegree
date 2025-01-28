import React, { useState, useMemo } from 'react';
import { TextField, MenuItem, Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import debounce from 'lodash.debounce';

function SearchBar({ placeholder, onSelect, value = '', type = 'movie' }) {
	const [options, setOptions] = useState([]);
	const [loading, setLoading] = useState(false);

	// Debounce API calls
	const debouncedFetchOptions = useMemo(
		() =>
			debounce(async (query) => {
				if (query.length > 2) {
					setLoading(true);
					try {
						const endpoint =
							type === 'person' ? '/api/persons/search' : '/api/movies/search';
						const response = await axios.get(endpoint, { params: { query } });

						setOptions(
							response.data.map((item) => ({
								id: item.id,
								name:
									type === 'person'
										? item.name
										: `${item.title} (${item.year || 'Unknown'})`,
							}))
						);
					} catch (error) {
						console.error('Error fetching search results:', error);
						setOptions([]);
					} finally {
						setLoading(false);
					}
				} else {
					setOptions([]);
				}
			}, 300),
		[type]
	);

	const handleChange = (event) => {
		const inputValue = event.target.value;
		onSelect(null, inputValue); // Update live input value to parent
		debouncedFetchOptions(inputValue);
	};

	const handleSelect = (option) => {
		onSelect(option.id, option.name); // Pass selected ID/name to parent
		setOptions([]); // Clear dropdown after selection
	};

	return (
		<Box sx={{ position: 'relative', width: '100%' }}>
			<TextField
				label={placeholder}
				variant="outlined"
				fullWidth
				value={value}
				onChange={handleChange}
				autoComplete="off"
				InputProps={{
					endAdornment: loading ? (
						<CircularProgress size={20} sx={{ color: 'gray' }} />
					) : null,
				}}
			/>
			{options.length > 0 && (
				<Box
					sx={{
						position: 'absolute',
						top: '100%',
						left: 0,
						backgroundColor: 'white',
						boxShadow: 3,
						zIndex: 10,
						maxHeight: '300px',
						overflowY: 'auto',
						borderRadius: '4px',
						minWidth: '100%', // Match the width of the input field
					}}
				>
					{options.map((option) => (
						<MenuItem
							key={option.id}
							onClick={() => handleSelect(option)}
							sx={{ padding: '8px 16px', cursor: 'pointer' }}
						>
							{option.name}
						</MenuItem>
					))}
				</Box>
			)}
		</Box>
	);
}

export default SearchBar;
