import React from 'react';
import PathFinderTab from './PathFinderTab';

function MovieToPersonTab() {
	return (
		<PathFinderTab
			title="Find Connections Between Movies and People"
			fetchEndpoint="/api/movies/movie-to-person"
			searchBarConfig={[
				{ key: 'startId', placeholder: 'Movie', type: 'movie' },
				{ key: 'personId', placeholder: 'Person', type: 'person' },
			]}
		/>
	);
}

export default MovieToPersonTab;
