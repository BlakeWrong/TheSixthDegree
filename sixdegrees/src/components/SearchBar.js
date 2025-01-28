import React, { useState, useCallback } from 'react';
import { TextField, MenuItem, Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import debounce from 'lodash.debounce';

function SearchBar({ placeholder, onSelect, type = 'movie' }) {
	const [query, setQuery] = useState('');
	const [options, setOptions] = useState([]);
	const [loading, setLoading] = useState(false);

	// Debounced API request
	const fetchOptions = useCallback(
		debounce(async (value) => {
			if (value.length > 2) {
				setLoading(true);
				try {
					const endpoint =
						type === 'person' ? '/api/persons/search' : '/api/movies/search';
					const response = await axios.get(endpoint, { params: { query: value } });

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
		}, 300), // 300ms delay
		[]
	);

	const handleChange = (event) => {
		const value = event.target.value;
		setQuery(value);
		fetchOptions(value); // Call the debounced function
	};

	const handleSelect = (option) => {
		setQuery(option.name); // Update the text field
		onSelect(option.id, option.name); // Pass ID and name to parent component
		setOptions([]); // Clear dropdown
	};

	return (
		<Box
			sx={{
				position: 'relative',
				width: '100%',
			}}
		>
			<TextField
				label={placeholder}
				variant="outlined"
				fullWidth
				value={query}
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
						maxHeight: '300px', // Allow vertical scrolling for long lists
						overflowY: 'auto',
						borderRadius: '4px',
						minWidth: '100%', // At least as wide as the search bar
						whiteSpace: 'nowrap', // Prevent text from wrapping
					}}
				>
					{options.map((option) => (
						<MenuItem
							key={option.id}
							onClick={() => handleSelect(option)}
							sx={{
								padding: '8px 16px',
								cursor: 'pointer',
							}}
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
