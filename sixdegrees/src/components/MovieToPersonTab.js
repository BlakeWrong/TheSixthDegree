import React from 'react';
import PathFinderTab from './PathFinderTab';

function MovieToPersonTab() {
	return (
		<PathFinderTab
			title="Find Connections Between Movies and People"
			fetchEndpoint="/api/movies/movie-to-person"
			searchBarConfig={[
				{ key: 'startIds', placeholder: 'Movie', type: 'movie', multiTarget: true },
				{ key: 'personIds', placeholder: 'Person', type: 'person', multiTarget: true },
			]}
		/>
	);
}

export default MovieToPersonTab;
