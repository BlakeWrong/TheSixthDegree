import React from 'react';
import PathFinderTab from './PathFinderTab';

function MovieToGenreTab() {
	return (
		<PathFinderTab
			title="Find Movies by Genre"
			fetchEndpoint="/api/movies/movie-to-genre"
			searchBarConfig={[
				{ key: 'startIds', placeholder: 'Movie', type: 'movie', multiTarget: true },
				{ key: 'includeGenres', placeholder: 'Include Genre (e.g., Romance)', type: 'genre', multiTarget: true },
				{ key: 'excludeGenres', placeholder: 'Exclude Genre (e.g., Comedy)', type: 'genre', multiTarget: true, optional: true },
			]}
		/>
	);
}

export default MovieToGenreTab;