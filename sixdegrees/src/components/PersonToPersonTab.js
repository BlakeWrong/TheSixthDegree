import React from 'react';
import PathFinderTab from './PathFinderTab';

function PersonToPersonTab() {
	return (
		<PathFinderTab
			title="Find Connections Between People"
			fetchEndpoint="/api/movies/person-to-person"
			searchBarConfig={[
				{ key: 'startId', placeholder: 'Start Person', type: 'person' },
				{ key: 'endIds', placeholder: 'Target Person', type: 'person', multiTarget: true },
			]}
		/>
	);
}

export default PersonToPersonTab;
