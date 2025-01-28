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

// Relationship text mapping
const RELATIONSHIP_MAP = {
	Director: {
		movieToPerson: 'Directed by',
		personToMovie: 'Directed',
	},
	Actor: {
		movieToPerson: 'Featured',
		personToMovie: 'Acted in',
	},
	Cinematographer: {
		movieToPerson: 'Shot by',
		personToMovie: 'Shot',
	},
	Composer: {
		movieToPerson: 'Composed by',
		personToMovie: 'Composed',
	},
	Writer: {
		movieToPerson: 'Written by',
		personToMovie: 'Wrote',
	},
};

// Function to convert Neo4j integers
const convertId = (id) => (id && typeof id === 'object' ? id.low : id);

const ResultsTable = ({ results }) => {
	if (!results || results.length === 0) {
		return <Typography variant="body1">No results found.</Typography>;
	}

	const getRelationshipText = (relationship, isMovieToPerson) => {
		const direction = isMovieToPerson ? 'movieToPerson' : 'personToMovie';
		return (
			RELATIONSHIP_MAP[relationship]?.[direction] || relationship || 'Related'
		);
	};

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
												component="a"
												href={
													node.type === 'Movie'
														? `https://www.themoviedb.org/movie/${convertId(node.id)}`
														: `https://www.themoviedb.org/person/${convertId(node.id)}`
												}
												target="_blank"
												rel="noopener noreferrer"
												sx={{
													textDecoration: 'none', // Remove underline
													color: 'inherit', // Use the default text color
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'center',
													textAlign: 'center',
													gap: 1,
													'&:hover img': {
														boxShadow: (theme) => `0 0 8px ${theme.palette.primary.main}`,
													},
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
												<Typography
													variant="body2"
													component="div"
													sx={{ color: 'inherit' }} // Ensure text color is not overridden
												>
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
														{getRelationshipText(
															result.relationships[nodeIndex]?.role,
															node.type === 'Movie'
														)}
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
