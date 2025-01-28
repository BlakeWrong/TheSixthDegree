import React, { useState } from 'react';
import { Tabs, Tab, Box, Paper } from '@mui/material';
import MovieToMovieTab from './MovieToMovieTab';
import MovieToPersonTab from './MovieToPersonTab';
import PersonToPersonTab from './PersonToPersonTab';

function TabsContainer() {
	const [activeTab, setActiveTab] = useState('movie-to-movie');

	const renderActiveTab = () => {
		switch (activeTab) {
			case 'movie-to-movie':
				return <MovieToMovieTab />;
			case 'movie-to-person':
				return <MovieToPersonTab />;
			case 'person-to-person':
				return <PersonToPersonTab />;
			default:
				return null;
		}
	};

	return (
		<Paper elevation={3} sx={{ p: 3 }}>
			<Tabs
				value={activeTab}
				onChange={(e, newValue) => setActiveTab(newValue)}
				textColor="primary"
				indicatorColor="primary"
				centered
			>
				<Tab value="movie-to-movie" label="Movie to Movie" />
				<Tab value="movie-to-person" label="Movie to Person" />
				<Tab value="person-to-person" label="Person to Person" />
			</Tabs>
			<Box sx={{ mt: 3 }}>{renderActiveTab()}</Box>
		</Paper>
	);
}

export default TabsContainer;
