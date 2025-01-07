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
							<TableCell>{result.path_sequence.join(' -> ')}</TableCell>
							<TableCell>{result.total_path_popularity}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default ResultsTable;
