import React from 'react';
import PathFinderTab from './PathFinderTab';

function MovieToMovieTab() {
	return (
		<PathFinderTab
			title="Find Connections Between Movies"
			fetchEndpoint="/api/movies/movie-to-movie"
			searchBarConfig={[
				{ key: 'startId', placeholder: 'Start Movie', type: 'movie' },
				{ key: 'endId', placeholder: 'End Movie', type: 'movie' },
			]}
		/>
	);
}

export default MovieToMovieTab;
