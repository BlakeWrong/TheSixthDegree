import React from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Box,
	Typography,
} from '@mui/material';

const ResultsTable = ({ results }) => {
	if (!results || results.length === 0) {
		return <Typography variant="body1">No results found.</Typography>;
	}

	return (
		<TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>
							<Typography variant="h6">Path</Typography>
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{results.map((result, index) => (
						<TableRow key={index}>
							<TableCell>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 2,
										whiteSpace: 'nowrap',
										overflowX: 'auto',
										paddingBottom: 1,
										'&::-webkit-scrollbar': { height: 6 },
										'&::-webkit-scrollbar-thumb': {
											backgroundColor: '#ccc',
											borderRadius: 3,
										},
										'&::-webkit-scrollbar-track': {
											backgroundColor: '#f5f5f5',
										},
									}}
								>
									{result.path_details.map((node, nodeIndex) => (
										<React.Fragment key={nodeIndex}>
											<Box
												sx={{
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'center',
													textAlign: 'center',
													gap: 1,
												}}
											>
												<img
													src={
														node.type === 'Movie'
															? node.poster_url
																? `https://image.tmdb.org/t/p/w200${node.poster_url}`
																: '/noposter.png'
															: node.profile_url
															? `https://image.tmdb.org/t/p/w200${node.profile_url}`
															: '/comingsoon.png'
													}
													alt={node.type === 'Movie' ? node.title : node.name}
													style={{
														width: 50,
														height: 75,
														objectFit: 'cover',
														borderRadius: 4,
													}}
												/>
												<Typography variant="body2" component="div">
													{node.type === 'Movie' ? (
														<>
															<strong>{node.title}</strong>
															<br />({node.year || 'Unknown'})
														</>
													) : (
														<strong>{node.name}</strong>
													)}
												</Typography>
											</Box>
											{/* Add arrow and relationship text */}
											{nodeIndex < result.path_details.length - 1 && (
												<Box
													sx={{
														display: 'flex',
														flexDirection: 'column',
														alignItems: 'center',
														gap: 0.5,
														fontSize: 12,
														color: '#555',
													}}
												>
													<span style={{ fontSize: '1.5rem', color: '#888' }}>→</span>
													<Typography variant="caption">
														{result.relationships[nodeIndex]?.role || 'Related'}
													</Typography>
												</Box>
											)}
										</React.Fragment>
									))}
								</Box>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default ResultsTable;
