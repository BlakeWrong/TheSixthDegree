import React from 'react';
import {
	Typography,
	Box,
	Container,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const About = () => {
	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			{/* About the App */}
			<Typography variant="h4" gutterBottom>
				About The 6th Degree
			</Typography>
			<Typography variant="body1" paragraph>
				The 6th Degree is inspired by the classic concept of "six degrees of
				separation," often popularized by the "six degrees to Kevin Bacon" game.
				This idea suggests that any two people (or entities) in the world are
				connected through a chain of relationships spanning no more than six steps.
				Our app takes this concept into the world of movies and people, leveraging
				cutting-edge technologies to find connections between films, actors,
				directors, and more.
			</Typography>
			<Typography variant="body1" paragraph>
				The app utilizes the TMDB API to fetch movie data, including titles, release
				years, posters, and profile pictures of individuals. For the heavy lifting
				of understanding relationships and connections, we rely on Neo4j, a graph
				database designed to manage and analyze data relationships. Unlike
				traditional databases that store information in rows and tables, graph
				databases work by connecting nodes (representing entities like movies or
				people) through relationships (e.g., "directed by" or "acted in"). This
				makes it incredibly efficient at finding paths between entities.
			</Typography>

			{/* How It Works */}
			<Typography variant="h4" gutterBottom>
				How It Works
			</Typography>
			<Typography variant="body1" paragraph>
				The 6th Degree is a tool for discovering the shortest "path" between two
				"nodes." In the context of this app, a node is an entity like a movie or a
				person, and a path is the sequence of relationships that connect them. For
				example, you might start with a movie, follow an "acted in" relationship to
				an actor, and then find another "acted in" relationship to a second movie.
				Our app guarantees that the path it finds is the shortest possible
				connection between the two selected nodes.
			</Typography>

			{/* FAQs */}
			<Typography variant="h4" gutterBottom>
				Frequently Asked Questions
			</Typography>
			<Accordion>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography>Why are there multiple paths?</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Typography>
						While the app guarantees finding the shortest path between two nodes,
						there can be multiple paths of the same length. These alternate paths use
						different relationships or nodes but still adhere to the same minimum
						number of steps.
					</Typography>
				</AccordionDetails>
			</Accordion>

			<Accordion>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography>Why is this movie not in the database?</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Typography>
						The database is powered by TMDB, and the availability of movies depends on
						their data. If a movie is missing, it could be due to incomplete
						information in TMDB or because it hasn’t been indexed yet.
					</Typography>
				</AccordionDetails>
			</Accordion>

			<Accordion>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography>How do I report a bug?</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Typography>
						If you encounter a bug or have feedback, you can report it through the
						project’s GitHub page, linked in the footer of this site. We appreciate
						your input to make The 6th Degree better!
					</Typography>
				</AccordionDetails>
			</Accordion>

			<Accordion>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography>Can I suggest features or improvements?</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Typography>
						Absolutely! We welcome feature suggestions. Please visit the GitHub page
						and create a feature request. Let us know how we can improve the app to
						better serve your needs.
					</Typography>
				</AccordionDetails>
			</Accordion>
		</Container>
	);
};

export default About;
