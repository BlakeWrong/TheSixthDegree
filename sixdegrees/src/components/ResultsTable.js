import React from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
} from '@mui/material';

const ResultsTable = ({ results }) => {
	if (!results || results.length === 0) {
		return <div>No results found.</div>;
	}

	return (
		<TableContainer component={Paper}>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>Path</TableCell>
						<TableCell>Total Popularity</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{results.map((result, index) => (
						<TableRow key={index}>
							<TableCell>
								{result.path_sequence.map((node, idx) => (
									<span
										key={idx}
										style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
									>
										{/* Check if node is a movie with a poster */}
										{node.poster_url ? (
											<img
												src={`https://image.tmdb.org/t/p/w92${node.poster_url}`} // Example TMDb image base URL
												alt={node.title || 'Poster'}
												style={{
													width: '50px',
													height: '75px',
													objectFit: 'cover',
													borderRadius: '4px',
												}}
											/>
										) : null}
										<span>{node}</span>
									</span>
								))}
							</TableCell>
							<TableCell>{result.total_path_popularity}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default ResultsTable;
