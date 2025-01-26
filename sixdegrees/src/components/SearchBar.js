import React, { useState } from 'react';
import axios from 'axios';

function SearchBar({ placeholder, onSelect, type = 'movie' }) {
	const [query, setQuery] = useState('');
	const [options, setOptions] = useState([]);

	const handleChange = async (event) => {
		const value = event.target.value;
		setQuery(value);

		if (value.length > 2) {
			try {
				const endpoint =
					type === 'person' ? '/api/persons/search' : '/api/movies/search';

				const response = await axios.get(endpoint, {
					params: { query: value },
				});

				setOptions(
					response.data.map((item) => ({
						id: item.id,
						name: type === 'person' ? item.name : `${item.title} (${item.year})`,
					}))
				);
			} catch (error) {
				console.error('Error fetching search results:', error);
				setOptions([]);
			}
		} else {
			setOptions([]);
		}
	};

	const handleSelect = (option) => {
		setQuery(option.name); // Update the input field with the name/display
		onSelect(option.id, option.name); // Pass both the ID and name to the parent component
		setOptions([]); // Clear the dropdown
	};

	return (
		<div style={{ position: 'relative' }}>
			<input
				type="text"
				placeholder={placeholder}
				value={query}
				onChange={handleChange}
				style={{
					width: '100%',
					padding: '0.5rem',
					borderRadius: '4px',
					border: '1px solid #ccc',
				}}
			/>
			{options.length > 0 && (
				<ul
					style={{
						position: 'absolute',
						top: '100%',
						left: 0,
						right: 0,
						backgroundColor: 'white',
						listStyle: 'none',
						padding: 0,
						margin: 0,
						border: '1px solid #ccc',
						borderRadius: '4px',
						zIndex: 10,
						maxHeight: '200px',
						overflowY: 'auto',
					}}
				>
					{options.map((option) => (
						<li
							key={option.id}
							onClick={() => handleSelect(option)}
							style={{
								padding: '0.5rem',
								cursor: 'pointer',
								borderBottom: '1px solid #eee',
							}}
						>
							{option.name}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export default SearchBar;
