import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextField, MenuItem, Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import debounce from 'lodash.debounce';

function SearchBar({
	placeholder,
	onSelect,
	type = 'movie',
	value,
	clearSignal,
}) {
	const [query, setQuery] = useState('');
	const [options, setOptions] = useState([]);
	const [loading, setLoading] = useState(false);
	const dropdownRef = useRef(null);

	// Effect to clear input when clearSignal changes
	useEffect(() => {
		setQuery('');
		setOptions([]);
	}, [clearSignal]);

	// Debounced API request
	const debouncedFetch = useRef(
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
		}, 300)
	).current;

	// Handle input changes
	const handleChange = useCallback(
		(event) => {
			const value = event.target.value;
			setQuery(value);
			debouncedFetch(value);
		},
		[debouncedFetch]
	);

	// Clear dropdown when clicking outside
	useEffect(() => {
		const handleOutsideClick = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setOptions([]);
			}
		};

		document.addEventListener('mousedown', handleOutsideClick);
		return () => {
			document.removeEventListener('mousedown', handleOutsideClick);
		};
	}, []);

	// Handle selection
	const handleSelect = (option) => {
		setQuery(option.name);
		onSelect(option.id, option.name);
		setOptions([]);
	};

	return (
		<Box
			ref={dropdownRef}
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
						maxHeight: '300px',
						overflowY: 'auto',
						borderRadius: '4px',
						minWidth: '100%',
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
