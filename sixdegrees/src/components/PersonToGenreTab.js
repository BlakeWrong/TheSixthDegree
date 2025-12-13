import React from 'react';
import PathFinderTab from './PathFinderTab';

function PersonToGenreTab() {
	return (
		<PathFinderTab
			title="Find Movies by Genre from Person"
			fetchEndpoint="/api/movies/person-to-genre"
			searchBarConfig={[
				{ key: 'startIds', placeholder: 'Person', type: 'person', multiTarget: true },
				{ key: 'includeGenres', placeholder: 'Include Genre (e.g., Romance)', type: 'genre', multiTarget: true },
				{ key: 'excludeGenres', placeholder: 'Exclude Genre (e.g., Comedy)', type: 'genre', multiTarget: true, optional: true },
			]}
		/>
	);
}

export default PersonToGenreTab;