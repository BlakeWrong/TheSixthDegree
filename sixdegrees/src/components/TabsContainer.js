import React, { useState } from 'react';
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
		<div>
			<nav style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
				<button
					onClick={() => setActiveTab('movie-to-movie')}
					style={{
						padding: '0.5rem 1rem',
						backgroundColor: activeTab === 'movie-to-movie' ? '#007bff' : '#fff',
						color: activeTab === 'movie-to-movie' ? '#fff' : '#000',
						border: '1px solid #ccc',
					}}
				>
					Movie to Movie
				</button>
				<button
					onClick={() => setActiveTab('movie-to-person')}
					style={{
						padding: '0.5rem 1rem',
						backgroundColor: activeTab === 'movie-to-person' ? '#007bff' : '#fff',
						color: activeTab === 'movie-to-person' ? '#fff' : '#000',
						border: '1px solid #ccc',
					}}
				>
					Movie to Person
				</button>
				<button
					onClick={() => setActiveTab('person-to-person')}
					style={{
						padding: '0.5rem 1rem',
						backgroundColor: activeTab === 'person-to-person' ? '#007bff' : '#fff',
						color: activeTab === 'person-to-person' ? '#fff' : '#000',
						border: '1px solid #ccc',
					}}
				>
					Person to Person
				</button>
			</nav>
			<div>{renderActiveTab()}</div>
		</div>
	);
}

export default TabsContainer;
