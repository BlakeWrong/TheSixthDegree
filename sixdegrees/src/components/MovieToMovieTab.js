import React from 'react';
import PathFinderTab from './PathFinderTab';

function MovieToMovieTab() {
	return (
		<PathFinderTab
			title="Find Connections Between Movies"
			fetchEndpoint="/api/movies/movie-to-movie"
			searchBarConfig={[
				{ key: 'startId', placeholder: 'Start Movie', type: 'movie' },
				{ key: 'endIds', placeholder: 'Target Movie', type: 'movie', multiTarget: true },
			]}
		/>
	);
}

export default MovieToMovieTab;
