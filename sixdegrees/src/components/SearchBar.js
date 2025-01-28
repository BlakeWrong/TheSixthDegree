import React, { useState } from 'react';
import { TextField, MenuItem, Box, CircularProgress } from '@mui/material';
import axios from 'axios';

function SearchBar({ placeholder, onSelect, type = 'movie' }) {
	const [query, setQuery] = useState('');
	const [options, setOptions] = useState([]);
	const [loading, setLoading] = useState(false);

	const handleChange = async (event) => {
		const value = event.target.value;
		setQuery(value);

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
	};

	const handleSelect = (option) => {
		setQuery(option.name);
		onSelect(option.id, option.name);
		setOptions([]);
	};

	return (
		<Box sx={{ position: 'relative', width: '100%' }}>
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
						right: 0,
						backgroundColor: 'white',
						boxShadow: 3,
						zIndex: 10,
						maxHeight: '200px',
						overflowY: 'auto',
						borderRadius: '4px',
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
